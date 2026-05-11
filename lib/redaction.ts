export type FindingKind = "email" | "phone" | "credit-card" | "account-id" | "person-name";
export type RiskCategory = "identity" | "contact" | "payment" | "operational";
export type RiskSeverity = "low" | "medium" | "high";
export type FindingConfidence = "medium" | "high";

export type RedactionFinding = {
  id: string;
  kind: FindingKind;
  label: string;
  reason: string;
  category: RiskCategory;
  severity: RiskSeverity;
  confidence: FindingConfidence;
  recommendedAction: string;
  original: string;
  start: number;
  end: number;
  defaultReplacement: string;
};

export type RedactionReport = {
  originalText: string;
  findings: RedactionFinding[];
};

export type FixtureExport = {
  redactedText: string;
  sourceRiskCount: number;
  riskSummary: {
    high: number;
    medium: number;
    low: number;
    unresolvedReviewCount: number;
  };
  rulesApplied: string[];
  replacements: Array<{
    kind: FindingKind;
    label: string;
    severity: RiskSeverity;
    confidence: FindingConfidence;
    originalLength: number;
    replacement: string;
    approved: boolean;
    decisionStatus: "approved" | "needs-review";
  }>;
  limitations: string[];
};

export type ReviewPacketOptions = {
  reviewer: string;
  reviewedAt: string;
  scenarioName: string;
};

export type ReviewPacket = FixtureExport & {
  scenarioName: string;
  reviewer: string;
  reviewedAt: string;
  ruleVersion: "deterministic-v1";
  approvedCount: number;
  unresolvedRisks: string[];
  reviewedFindings: Array<{
    id: string;
    kind: FindingKind;
    label: string;
    severity: RiskSeverity;
    confidence: FindingConfidence;
    recommendedAction: string;
    approved: boolean;
    replacement: string;
    originalLength: number;
  }>;
};

const rules: Array<{
  kind: FindingKind;
  label: string;
  reason: string;
  category: RiskCategory;
  severity: RiskSeverity;
  confidence: FindingConfidence;
  recommendedAction: string;
  pattern: RegExp;
  replacement: string | ((match: RegExpMatchArray) => string);
}> = [
  {
    kind: "email",
    label: "Email address",
    reason: "Direct contact detail should not be included in a public fixture.",
    category: "contact",
    severity: "high",
    confidence: "high",
    recommendedAction: "Replace with a neutral placeholder before publishing.",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[EMAIL_REDACTED]"
  },
  {
    kind: "phone",
    label: "Phone number",
    reason: "Phone numbers are personal contact details and need explicit replacement.",
    category: "contact",
    severity: "high",
    confidence: "high",
    recommendedAction: "Replace with a neutral phone placeholder before publishing.",
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[PHONE_REDACTED]"
  },
  {
    kind: "credit-card",
    label: "Card-like number",
    reason: "Payment identifiers must be replaced even in synthetic-looking snippets.",
    category: "payment",
    severity: "high",
    confidence: "high",
    recommendedAction: "Replace with a non-numeric placeholder and keep the source value out of exports.",
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: "[CARD_REDACTED]"
  },
  {
    kind: "account-id",
    label: "Account identifier",
    reason: "Operational account IDs can reveal customer or internal system references.",
    pattern: /\b(ACCT|CUST|CASE)-\d{6,}\b/g,
    category: "operational",
    severity: "medium",
    confidence: "high",
    recommendedAction: "Replace with a neutral account placeholder that cannot be re-detected as an ID.",
    // Keep the namespace visible without producing another ACCT/CUST/CASE numeric identifier.
    replacement: (match) => `${match[1]}-[ID_REDACTED]`
  },
  {
    kind: "person-name",
    label: "Named person",
    reason: "Names in source artifacts require human approval before demo publication.",
    category: "identity",
    severity: "high",
    confidence: "medium",
    recommendedAction: "Replace with a named-person placeholder before publishing.",
    pattern: /\b(Customer|Owner|Patient|Applicant):[ \t]*([A-Z][a-z]+(?:[ \t][A-Z][a-z]+)+)\b/g,
    replacement: (match) => `${match[1]}: [PERSON_NAME_REDACTED]`
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
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        recommendedAction: rule.recommendedAction,
        original: match[0],
        start,
        end: start + match[0].length,
        defaultReplacement: typeof rule.replacement === "function" ? rule.replacement(match) : rule.replacement
      };
    })
  );

  findings.sort((a, b) => a.start - b.start || b.end - a.end);
  return { originalText: text, findings: removeContainedFindings(findings) };
}

export function approveAllFindings(findings: RedactionFinding[]): Record<string, string> {
  return Object.fromEntries(findings.map((finding) => [finding.id, finding.defaultReplacement]));
}

export function createFixtureExport(report: RedactionReport, approvals: Record<string, string>): FixtureExport {
  let cursor = 0;
  let redactedText = "";

  for (const finding of report.findings) {
    redactedText += report.originalText.slice(cursor, finding.start);
    redactedText += approvals[finding.id] ?? finding.defaultReplacement;
    cursor = finding.end;
  }

  redactedText += report.originalText.slice(cursor);

  const replacements = report.findings.map((finding) => ({
    kind: finding.kind,
    label: finding.label,
    severity: finding.severity,
    confidence: finding.confidence,
    originalLength: finding.original.length,
    replacement: approvals[finding.id] ?? finding.defaultReplacement,
    approved: Boolean(approvals[finding.id]),
    decisionStatus: Boolean(approvals[finding.id]) ? ("approved" as const) : ("needs-review" as const)
  }));
  const unresolvedReviewCount = replacements.filter((replacement) => replacement.decisionStatus === "needs-review").length;

  return {
    redactedText,
    sourceRiskCount: report.findings.length,
    riskSummary: {
      high: report.findings.filter((finding) => finding.severity === "high").length,
      medium: report.findings.filter((finding) => finding.severity === "medium").length,
      low: report.findings.filter((finding) => finding.severity === "low").length,
      unresolvedReviewCount
    },
    rulesApplied: [...new Set(report.findings.map((finding) => finding.label))],
    replacements,
    limitations: [
      "Rules are deterministic and intentionally conservative.",
      "Human approval is required before treating exported fixtures as public-safe.",
      "This first slice does not upload, store, or send source data.",
      "Replacement placeholders are intentionally non-detectable by the same rules to avoid recursive redaction loops."
    ]
  };
}

export function createReviewPacket(
  report: RedactionReport,
  approvals: Record<string, string>,
  options: ReviewPacketOptions
): ReviewPacket {
  const fixture = createFixtureExport(report, approvals);
  const approvedFindings = report.findings.filter((finding) => Boolean(approvals[finding.id]));
  const unresolvedFindings = report.findings.filter((finding) => !approvals[finding.id]);

  return {
    scenarioName: options.scenarioName,
    reviewer: options.reviewer,
    reviewedAt: options.reviewedAt,
    ruleVersion: "deterministic-v1",
    approvedCount: approvedFindings.length,
    unresolvedRisks: unresolvedFindings.map((finding) => finding.label),
    redactedText: fixture.redactedText,
    sourceRiskCount: fixture.sourceRiskCount,
    riskSummary: fixture.riskSummary,
    rulesApplied: fixture.rulesApplied,
    replacements: fixture.replacements,
    reviewedFindings: report.findings.map((finding) => ({
      id: finding.id,
      kind: finding.kind,
      label: finding.label,
      severity: finding.severity,
      confidence: finding.confidence,
      recommendedAction: finding.recommendedAction,
      approved: Boolean(approvals[finding.id]),
      replacement: approvals[finding.id] ?? finding.defaultReplacement,
      originalLength: finding.original.length
    })),
    limitations: fixture.limitations
  };
}

function removeContainedFindings(findings: RedactionFinding[]) {
  return findings.filter((candidate, index) => {
    return !findings.some((other, otherIndex) => {
      if (index === otherIndex) return false;
      const strictlyContains =
        (other.start < candidate.start && other.end >= candidate.end) ||
        (other.start <= candidate.start && other.end > candidate.end);
      return strictlyContains && other.kind !== candidate.kind;
    });
  });
}
