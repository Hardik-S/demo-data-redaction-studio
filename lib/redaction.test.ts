import { describe, expect, it } from "vitest";
import { approveAllFindings, createFixtureExport, createReviewPacket, redactDemoText } from "./redaction";

describe("redaction workflow", () => {
  it("detects common sensitive fields deterministically", () => {
    const report = redactDemoText("Customer: Priya Shah\nEmail: priya@example.com\nPhone: 416-555-0198\nAccount: ACCT-123456");

    expect(report.findings.map((finding) => finding.kind)).toEqual([
      "person-name",
      "email",
      "phone",
      "account-id"
    ]);
  });

  it("exports an approved public fixture without original values", () => {
    const report = redactDemoText("Card: 4242 4242 4242 4242 for priya@example.com");
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(fixture.redactedText).toContain("4111 1111 1111 1111");
    expect(fixture.redactedText).toContain("person@example.test");
    expect(fixture.redactedText).not.toContain("priya@example.com");
    expect(fixture.sourceRiskCount).toBe(2);
  });

  it("preserves field labels when redacting named people", () => {
    const report = redactDemoText("Owner: Priya Shah\nApplicant: Arjun Patel");
    const fixture = createFixtureExport(report, approveAllFindings(report.findings));

    expect(fixture.redactedText).toContain("Owner: Demo Person");
    expect(fixture.redactedText).toContain("Applicant: Demo Person");
    expect(fixture.redactedText).not.toContain("$1: Demo Person");
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
    expect(JSON.stringify(packet)).not.toContain("priya@example.com");
  });
});
