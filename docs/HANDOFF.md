# Demo Data Redaction Studio Handoff

## Scope

This quality pass hardens `PPQ-2026-05-10-008` by fixing the named-person replacement bug, making the reviewer hold visible, adding review-packet metadata, adding CI/security headers, and documenting fixture provenance. It preserves the worker's deterministic public-demo shape and does not add file upload, persistence, live AI, or real data handling.

## Reviewer Path

1. Open the app and verify the first viewport shows `Customer support note`, approved count, and `1 needs review`.
2. Inspect the review queue and confirm the card-like number is marked `Needs review` while the preview text still uses a suggested replacement.
3. Inspect the export packet and confirm it includes `scenarioName`, `reviewedAt`, `ruleVersion`, `approvedCount`, `unresolvedRisks`, and no original email/person/account/card values.
4. Read `docs/fixture-provenance.md` to confirm every displayed fixture value is synthetic or reserved.

## Verification Contract

Run:

```powershell
npm ci
npm run verify
```

Known caveat: `npm audit --omit=dev --audit-level=moderate` currently reports a moderate transitive PostCSS advisory through Next 16.2.6. The forced npm fix path downgrades Next to an incompatible old major version, so do not apply it blindly.

## Deployment Handoff

- Production alias: https://demo-data-redaction-studio.vercel.app
- Vercel project: `demo-data-redaction-studio`
- Quality-pass app commit: `6fd69b433ac6e03b1b615702ad1321fa6bc9d16c`
- Production deployment: https://demo-data-redaction-studio-jbabb6zrk-batb4016-9101s-projects.vercel.app
- Inspect URL: https://vercel.com/batb4016-9101s-projects/demo-data-redaction-studio/4nZYGcgRqyD7fnA2WqecmWUgZGan
- Verified smoke strings: `Demo Data Redaction Studio`, `Selected scenario: Customer support note`, `Needs review`, `Publication Decision`, and `deterministic-v1`.
- Stale-artifact check: `$1: Demo Person` was absent from production after the deploy.

## Next Improvements

- Add real client-side sample switching only if it remains local-only and no persistence is introduced.
- Add an organization-name detector with explicit false-positive tests.
- Add rendered accessibility checks once Playwright or an equivalent browser test runner is intentionally installed.
