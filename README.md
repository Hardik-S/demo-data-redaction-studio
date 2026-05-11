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
npm install
npm run test
npm run build
npm run dev
```

## Decisions

- The first slice uses synthetic pasted text only. There is no file upload, persistence, email sending, or connection to real user data.
- Rules are deterministic and conservative: email, phone, card-like numbers, account identifiers, and labeled person names.
- The UI separates raw private input, approved public output, and review queue so the human approval boundary is visible.
- Replacement export stores original value length and replacement type, not the original value, because public fixtures should prove the action without leaking source text.

## Redaction Limitations

- Regex rules can miss context-specific secrets, unusual identifiers, screenshots, PDFs, or proprietary field names.
- Card-like number detection is intentionally broad and should be reviewed before export.
- Public-safe status is a workflow decision after human review, not an automatic guarantee.

## Verification

- `npm run test` validates sensitive-field detection and approved fixture export.
- `npm run build` validates the production Next.js bundle.

## Deployment

Expected production URL: https://demo-data-redaction-studio.vercel.app
