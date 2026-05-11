import { approveAllFindings, createFixtureExport, redactDemoText } from "../lib/redaction";

const sample = `Customer: Priya Shah
Email: priya.shah@example.com
Phone: 416-555-0198
Account: ACCT-48392017
Card: 4242 4242 4242 4242
Notes: Follow up with Maple BioScript before Friday about the dashboard export.`;

export default function Home() {
  const report = redactDemoText(sample);
  const approvals = approveAllFindings(report.findings);
  const fixture = createFixtureExport(report, approvals);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Synthetic fixture workflow</p>
          <h1>Demo Data Redaction Studio</h1>
          <p className="lede">
            Convert risky raw snippets into shareable demo fixtures with deterministic findings,
            visible approval choices, and an export packet reviewers can inspect.
          </p>
        </div>
        <div className="scorecard" aria-label="Redaction summary">
          <span>{report.findings.length}</span>
          <p>sensitive fields detected before public demo use</p>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panelHeader">
            <h2>Raw Demo Source</h2>
            <span>private input</span>
          </div>
          <pre>{sample}</pre>
        </article>

        <article className="panel">
          <div className="panelHeader">
            <h2>Approved Fixture</h2>
            <span>public output</span>
          </div>
          <pre>{fixture.redactedText}</pre>
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
              </div>
              <code>{approvals[finding.id]}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="panel export">
        <div>
          <h2>Fixture Export</h2>
          <p>
            The exported packet keeps replacements, source risk counts, and limitations together so
            public demos do not silently imply real data was published.
          </p>
        </div>
        <pre>{JSON.stringify(fixture, null, 2)}</pre>
      </section>
    </main>
  );
}
