import { describe, expect, it } from "vitest";
import { approveAllFindings, createFixtureExport, createReviewPacket, redactDemoText } from "./redaction";

describe("redaction workflow", () => {
  it("detects common sensitive fields deterministically with reviewer metadata", () => {
    const report = redactDemoText("Customer: Priya Shah\nEmail: priya@example.com\nPhone: 416-555-0198\nAccount: ACCT-123456");

    expect(report.findings.map((finding) => finding.kind)).toEqual([
      "person-name",
      "email",
      "phone",
      "account-id"
    ]);
    expect(report.findings[0]).toMatchObject({
      category: "identity",
      severity: "high",
      confidence: "medium",
      recommendedAction: "Replace with a named-person placeholder before publishing."
    });
  });

  it("exports an approved public fixture without original values", () => {
    const report = redactDemoText("Card: 4242 4242 4242 4242 for priya@example.com");
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(fixture.redactedText).toContain("[CARD_REDACTED]");
    expect(fixture.redactedText).toContain("[EMAIL_REDACTED]");
    expect(fixture.redactedText).not.toContain("priya@example.com");
    expect(fixture.sourceRiskCount).toBe(2);
    expect(fixture.riskSummary.high).toBe(2);
    expect(fixture.rulesApplied).toContain("Card-like number");
    expect(fixture.replacements[0]).toHaveProperty("decisionStatus", "approved");
  });

  it("does not create replacements that are re-detected as sensitive fields", () => {
    const report = redactDemoText(
      "Customer: Priya Shah\nEmail: priya@example.com\nPhone: 416-555-0198\nAccount: ACCT-123456\nCard: 4242 4242 4242 4242"
    );
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(redactDemoText(fixture.redactedText).findings).toHaveLength(0);
  });

  it("keeps unresolved findings out of ready exports without leaking source values", () => {
    const report = redactDemoText("Applicant: Jordan Lee\nEmail: jordan@example.com");
    const approvals = approveAllFindings(report.findings);
    const nameFinding = report.findings.find((finding) => finding.kind === "person-name");

    if (!nameFinding) throw new Error("Expected person-name finding");
    delete approvals[nameFinding.id];

    const fixture = createFixtureExport(report, approvals);

    expect(fixture.redactedText).not.toContain("Jordan Lee");
    expect(fixture.riskSummary.unresolvedReviewCount).toBe(1);
    expect(fixture.replacements.find((replacement) => replacement.kind === "person-name")).toMatchObject({
      decisionStatus: "needs-review",
      approved: false
    });
  });

  it("preserves field labels when redacting named people", () => {
    const report = redactDemoText("Owner: Priya Shah\nApplicant: Arjun Patel");
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(fixture.redactedText).toContain("Owner: [PERSON_NAME_REDACTED]");
    expect(fixture.redactedText).toContain("Applicant: [PERSON_NAME_REDACTED]");
    expect(fixture.redactedText).not.toContain("$1: Demo Person");
  });

  it("preserves account identifier namespaces in suggested replacements", () => {
    const report = redactDemoText("Case: CASE-739204\nCustomer: CUST-928374\nAccount: ACCT-48392017");
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(fixture.redactedText).toContain("CASE-[ID_REDACTED]");
    expect(fixture.redactedText).toContain("CUST-[ID_REDACTED]");
    expect(fixture.redactedText).toContain("ACCT-[ID_REDACTED]");
    expect(fixture.redactedText).not.toContain("CASE-739204");
    expect(fixture.redactedText).not.toContain("CUST-928374");
  });

  it("creates a reviewer packet with scenario metadata and unresolved risk", () => {
    const report = redactDemoText("Customer: Priya Shah\nEmail: priya@example.com\nAccount: ACCT-123456");
    const approvals = approveAllFindings(report.findings);
    delete approvals[report.findings[1].id];

    const packet = createReviewPacket(report, approvals, {
      reviewer: "Portfolio reviewer",
      reviewedAt: "2026-05-11T11:15:00.000Z",
      scenarioName: "Customer support export"
    });

    expect(packet.scenarioName).toBe("Customer support export");
    expect(packet.reviewedAt).toBe("2026-05-11T11:15:00.000Z");
    expect(packet.approvedCount).toBe(2);
    expect(packet.unresolvedRisks).toEqual(["Email address"]);
    expect(packet.riskSummary.unresolvedReviewCount).toBe(1);
    expect(packet.reviewedFindings[0]).toHaveProperty("recommendedAction");
    expect(JSON.stringify(packet)).not.toContain("priya@example.com");
  });
});
