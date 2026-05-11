# Demo Data Redaction Studio

Demo Data Redaction Studio is a fixture-first portfolio product for converting risky raw snippets into shareable public demo data. It is intentionally deterministic in this first slice: the value is a reviewable privacy workflow, not an opaque claim that sensitive data is magically safe.

## Portfolio Signal

This project shows product judgment around privacy-aware demo preparation. It turns the common "I need a realistic demo but cannot publish real artifacts" problem into a concrete workflow with detection, approval, replacement, export, and visible limitations.

## Stack Rationale

- Next.js App Router keeps the demo deployable on Vercel and easy to extend with server-side export routes later.
- TypeScript makes the redaction finding and fixture export contract explicit.
- Vitest covers the deterministic rules because that logic is the behavior reviewers should be able to trust.
- Fixture-first data keeps the repository public and avoids personal or customer data.

## Local Setup

```powershell
npm ci
npm run verify
npm run dev
```

## Reviewer Path

1. Confirm the first viewport shows the selected synthetic scenario, approved count, and review-needed count.
2. Compare the raw synthetic source with the approved fixture preview.
3. Inspect the review queue: approved rows are replacement decisions, while held rows remain `Needs review`.
4. Inspect the fixture export packet for `scenarioName`, `ruleVersion`, `reviewedAt`, `approvedCount`, and `unresolvedRisks`.
5. Read `docs/fixture-provenance.md` before trusting the public-demo boundary.

## Decisions

- The first slice uses synthetic pasted text only. There is no file upload, persistence, email sending, or connection to real user data.
- Rules are deterministic and conservative: email, phone, card-like numbers, account identifiers, and labeled person names.
- The UI separates raw private input, approved public output, and review queue so the human approval boundary is visible.
- Replacement export stores original value length and replacement type, not the original value, because public fixtures should prove the action without leaking source text.
- The rendered scenario intentionally leaves one finding in `Needs review` so reviewers can see that suggested replacements are not the same as final public approval.
- Replacement placeholders such as `[EMAIL_REDACTED]`, `[CARD_REDACTED]`, `CASE-[ID_REDACTED]`, and `[PERSON_NAME_REDACTED]` are deliberately not re-detected by the same deterministic rules. That prevents exported fixtures from creating recursive redaction loops while preserving useful account/case/customer namespaces.

## Redaction Limitations

- Regex rules can miss context-specific secrets, unusual identifiers, screenshots, PDFs, or proprietary field names.
- Card-like number detection is intentionally broad and should be reviewed before export.
- Public-safe status is a workflow decision after human review, not an automatic guarantee.
- Organization names, addresses, dates, unlabeled names, and unusual internal IDs remain expected misses in this slice.

## Verification

| Command | Purpose |
| --- | --- |
| `npm run test -- --run` | Validates sensitive-field detection, risk metadata, named-person label preservation, fixture export, non-recursive replacements, unresolved-review state, and review-packet metadata. |
| `npm run typecheck` | Validates TypeScript contracts without incremental build residue. |
| `npm run build` | Validates the production Next.js bundle with webpack. |
| `npm run verify` | Runs the full local verification gate. |

## Deployment

Production URL: https://demo-data-redaction-studio.vercel.app

Quality-pass deploy evidence:

- App commit: `6fd69b433ac6e03b1b615702ad1321fa6bc9d16c`.
- Production deployment: https://demo-data-redaction-studio-jbabb6zrk-batb4016-9101s-projects.vercel.app
- Inspect URL: https://vercel.com/batb4016-9101s-projects/demo-data-redaction-studio/4nZYGcgRqyD7fnA2WqecmWUgZGan
- Production alias: https://demo-data-redaction-studio.vercel.app
- Verified at: 2026-05-11 03:38 America/Toronto.
- Smoke evidence: HTTP `200`, found `Selected scenario: Customer support note`, `Needs review`, `Publication Decision`, and `deterministic-v1`; confirmed `$1: Demo Person` was absent.

Deployment evidence should be updated after each Vercel production deploy with the deployed commit, deployment URL, inspect URL, and smoke strings.

## Handoff Files

- `docs/fixture-provenance.md`: synthetic-value inventory and detector coverage.
- `docs/HANDOFF.md`: reviewer path, verification contract, deploy expectations, and next improvements.
