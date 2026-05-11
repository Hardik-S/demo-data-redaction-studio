export type FindingKind = "email" | "phone" | "credit-card" | "account-id" | "person-name";

export type RedactionFinding = {
  id: string;
  kind: FindingKind;
  label: string;
  reason: string;
  original: string;
  start: number;
  end: number;
  defaultReplacement: string;
};

export type RedactionReport = {
  originalText: string;
  findings: RedactionFinding[];
};

const rules: Array<{
  kind: FindingKind;
  label: string;
  reason: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    kind: "email",
    label: "Email address",
    reason: "Direct contact detail should not be included in a public fixture.",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "person@example.test"
  },
  {
    kind: "phone",
    label: "Phone number",
    reason: "Phone numbers are personal contact details and need explicit replacement.",
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    replacement: "555-0100"
  },
  {
    kind: "credit-card",
    label: "Card-like number",
    reason: "Payment identifiers must be replaced even in synthetic-looking snippets.",
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: "4111 1111 1111 1111"
  },
  {
    kind: "account-id",
    label: "Account identifier",
    reason: "Operational account IDs can reveal customer or internal system references.",
    pattern: /\b(?:ACCT|CUST|CASE)-\d{6,}\b/g,
    replacement: "ACCT-000000"
  },
  {
    kind: "person-name",
    label: "Named person",
    reason: "Names in source artifacts require human approval before demo publication.",
    pattern: /\b(Customer|Owner|Patient|Applicant):\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g,
    replacement: "$1: Demo Person"
  }
];

export function redactDemoText(text: string): RedactionReport {
  const findings = rules.flatMap((rule) =>
    Array.from(text.matchAll(rule.pattern)).map((match, index) => {
      const start = match.index ?? 0;
      return {
        id: `${rule.kind}-${start}-${index}`,
        kind: rule.kind,
        label: rule.label,
        reason: rule.reason,
        original: match[0],
        start,
        end: start + match[0].length,
        defaultReplacement: rule.replacement
      };
    })
  );

  findings.sort((a, b) => a.start - b.start || b.end - a.end);
  return { originalText: text, findings: removeContainedFindings(findings) };
}

export function approveAllFindings(findings: RedactionFinding[]): Record<string, string> {
  return Object.fromEntries(findings.map((finding) => [finding.id, finding.defaultReplacement]));
}

export function createFixtureExport(report: RedactionReport, approvals: Record<string, string>) {
  let cursor = 0;
  let redactedText = "";

  for (const finding of report.findings) {
    redactedText += report.originalText.slice(cursor, finding.start);
    redactedText += approvals[finding.id] ?? finding.defaultReplacement;
    cursor = finding.end;
  }

  redactedText += report.originalText.slice(cursor);

  return {
    redactedText,
    sourceRiskCount: report.findings.length,
    replacements: report.findings.map((finding) => ({
      kind: finding.kind,
      originalLength: finding.original.length,
      replacement: approvals[finding.id] ?? finding.defaultReplacement,
      approved: Boolean(approvals[finding.id])
    })),
    limitations: [
      "Rules are deterministic and intentionally conservative.",
      "Human approval is required before treating exported fixtures as public-safe.",
      "This first slice does not upload, store, or send source data."
    ]
  };
}

function removeContainedFindings(findings: RedactionFinding[]) {
  return findings.filter((candidate, index) => {
    return !findings.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      return other.start <= candidate.start && other.end >= candidate.end && other.kind !== candidate.kind;
    });
  });
}
