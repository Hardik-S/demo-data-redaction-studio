# Fixture Provenance

This repository is public, so every value in the demo fixture must be synthetic, reserved for examples, or visibly replaced before export. The app does not accept uploads, persist input, send data, or call an external service in this slice.

## Active Scenario

The first rendered scenario is `Customer support note`.

| Value | Type | Provenance decision |
| --- | --- | --- |
| `Priya Shah` | Person name | Synthetic placeholder name used to exercise the labeled-name detector. |
| `priya.shah@example.com` | Email | Uses the reserved `example.com` domain. |
| `416-555-0198` | Phone | Uses a `555-01xx` fictional number pattern. |
| `ACCT-48392017` | Account identifier | Synthetic account shape for testing deterministic account replacement. |
| `4242 4242 4242 4242` | Card-like number | Stripe/Visa-style test card pattern, used only as a detector fixture. |
| `Northstar Demo Labs` | Organization | Fictional demo organization; no real customer or employer data is represented. |

## Additional Scenario Presets

- `Health intake note` uses synthetic names, reserved `example.com` mail, fictional phone numbers, and `CASE-*` identifiers.
- `Sales CRM export` uses synthetic owner names, reserved `example.com` mail, fictional phone numbers, and `CUST-*` identifiers.

## Detector Coverage

| Detector | Catches | Expected misses | False-positive risk |
| --- | --- | --- | --- |
| Email address | Standard email strings on reserved or real-looking domains. | Obfuscated emails such as `name at domain dot com`. | Low. |
| Phone number | North American phone-like strings. | International formats outside the current regex. | Medium for numeric IDs shaped like phone numbers. |
| Card-like number | 13-16 digit payment-like strings with spaces or hyphens. | Tokenized, masked, or nonstandard payment identifiers. | Medium; long numeric IDs may need manual rejection. |
| Account identifier | `ACCT-*`, `CUST-*`, and `CASE-*` IDs with six or more digits. | Internal IDs with different prefixes. | Low to medium depending on source system naming. |
| Named person | Labeled `Customer`, `Owner`, `Patient`, or `Applicant` names. | Unlabeled names, organizations, addresses, dates, and project names. | Medium; human review remains required. |

## Non-Goals

- No guarantee that arbitrary pasted data is public-safe.
- No OCR/PDF/screenshot redaction.
- No replacement of organization names unless they match a future explicit detector.
- No storage, telemetry, or outbound workflow.
