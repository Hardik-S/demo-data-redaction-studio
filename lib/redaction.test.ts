import { describe, expect, it } from "vitest";
import { approveAllFindings, createFixtureExport, redactDemoText } from "./redaction";

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
});
