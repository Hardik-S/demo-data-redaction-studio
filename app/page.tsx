import { approveAllFindings, createReviewPacket, redactDemoText } from "../lib/redaction";

const scenarios = [
  {
    name: "Customer support note",
    reviewer: "Portfolio reviewer",
    releaseGoal: "Turn a messy support note into a public demo fixture for an escalation workflow.",
    provenance: "Synthetic note manually authored for this portfolio demo; no copied customer artifact.",
    text: `Customer: Priya Shah
Email: priya.shah@example.com
Phone: 416-555-0198
Account: ACCT-48392017
Card: 4242 4242 4242 4242
Notes: Follow up with Northstar Demo Labs before Friday about the dashboard export.`,
    holdBackKind: "credit-card"
  },
  {
    name: "Health intake note",
    reviewer: "Demo privacy lead",
    releaseGoal: "Show how regulated-looking intake data can become a safe public workflow sample.",
    provenance: "Synthetic intake note; it is not medical, legal, clinical, or customer data.",
    text: `Patient: Arjun Patel
Email: arjun.patel@example.com
Phone: 647-555-0124
Account: CASE-739204
Notes: Replace the clinic reference with a neutral sample before recording the walkthrough.`,
    holdBackKind: "person-name"
  },
  {
    name: "Sales CRM export",
    reviewer: "Revenue ops reviewer",
    releaseGoal: "Prepare a realistic renewal-demo record without leaking prospect contact details.",
    provenance: "Synthetic CRM row with fake contact and account formats.",
    text: `Owner: Maya Chen
Email: maya.chen@example.com
Phone: 905-555-0183
Account: CUST-928374
Notes: Demo-ready only after account identifiers and owner details are replaced.`,
    holdBackKind: "account-id"
  }
] as const;

const selectedScenario = scenarios[0];
const report = redactDemoText(selectedScenario.text);
const approvals = approveAllFindings(report.findings);
const heldFinding = report.findings.find((finding) => finding.kind === selectedScenario.holdBackKind);

if (heldFinding) {
  delete approvals[heldFinding.id];
}

const packet = createReviewPacket(report, approvals, {
  reviewer: selectedScenario.reviewer,
  reviewedAt: "2026-05-11T07:15:00-04:00",
  scenarioName: selectedScenario.name
});

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Synthetic fixture workflow</p>
          <h1>Demo Data Redaction Studio</h1>
          <p className="lede">
            Convert risky raw snippets into shareable demo fixtures with deterministic findings,
            visible review holds, and an export packet reviewers can inspect.
          </p>
          <div className="heroActions" aria-label="Reviewer workflow status">
            <span>Paste source</span>
            <span>Detect risk</span>
            <span>Review decisions</span>
            <span>Export packet</span>
          </div>
          <div className="heroActions" aria-label="Selected scenario status">
            <span>Selected scenario: {selectedScenario.name}</span>
            <span>{packet.approvedCount} approved</span>
            <span>{packet.unresolvedRisks.length} needs review</span>
          </div>
        </div>
        <div className="scorecard" aria-label="Redaction summary">
          <span>{report.findings.length}</span>
          <p>sensitive fields detected before public demo use</p>
          <strong>{packet.unresolvedRisks.length === 0 ? "Public-ready" : "Review needed"}</strong>
        </div>
      </section>

      <section className="scenarioRail" aria-label="Synthetic scenario presets">
        {scenarios.map((scenario) => {
          const scenarioReport = redactDemoText(scenario.text);
          const highRiskCount = scenarioReport.findings.filter((finding) => finding.severity === "high").length;

          return (
            <article className={scenario.name === selectedScenario.name ? "scenario active" : "scenario"} key={scenario.name}>
              <span>{scenario.name}</span>
              <strong>{scenarioReport.findings.length} findings</strong>
              <p>
                {highRiskCount} high risk; {scenario.holdBackKind} is intentionally held for manual review.
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panelHeader">
            <h2>Raw Demo Source</h2>
            <span>private input</span>
          </div>
          <div className="context">
            <strong>{selectedScenario.releaseGoal}</strong>
            <p>{selectedScenario.provenance}</p>
          </div>
          <pre>{selectedScenario.text}</pre>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>Approved Fixture</h2>
            <span>public output</span>
          </div>
          <pre>{packet.redactedText}</pre>
        </article>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>Review Queue</h2>
          <span>human approval boundary</span>
        </div>
        <div className="findings">
          {report.findings.map((finding) => (
            <div className="finding" key={`${finding.kind}-${finding.start}`}>
              <div>
                <strong>{finding.label}</strong>
                <p>{finding.reason}</p>
                <small>
                  {finding.severity} severity / {finding.confidence} confidence / {finding.recommendedAction}
                </small>
              </div>
              <div className="decision">
                <span className={approvals[finding.id] ? "status approved" : "status review"}>
                  {approvals[finding.id] ? "Approved" : "Needs review"}
                </span>
                <code>{approvals[finding.id] ?? finding.defaultReplacement}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel reviewPacket">
        <div className="packetIntro">
          <p className="eyebrow">Reviewer packet</p>
          <h2>Publication Decision</h2>
          <p>
            The output is still marked review-needed when any detector is unresolved, even though
            the draft fixture uses suggested replacements for public preview text.
          </p>
        </div>
        <div className="packetStats">
          <div>
            <span>Status</span>
            <strong>{packet.unresolvedRisks.length === 0 ? "Public-ready" : "Review needed"}</strong>
          </div>
          <div>
            <span>High-risk findings</span>
            <strong>{packet.riskSummary.high}</strong>
          </div>
          <div>
            <span>Unresolved reviews</span>
            <strong>{packet.riskSummary.unresolvedReviewCount}</strong>
          </div>
          <div>
            <span>Rule version</span>
            <strong>{packet.ruleVersion}</strong>
          </div>
          <div>
            <span>Reviewer</span>
            <strong>{packet.reviewer}</strong>
          </div>
        </div>
      </section>

      <section className="panel export">
        <div>
          <h2>Fixture Export</h2>
          <p>
            The exported packet keeps suggested replacements, source risk counts, and limitations
            together so public demos do not silently imply real data was published.
          </p>
        </div>
        <pre>{JSON.stringify(packet, null, 2)}</pre>
      </section>
    </main>
  );
}
