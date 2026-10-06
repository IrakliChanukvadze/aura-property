# AURA-010 — Integrated operational verification

Completes opportunity-specific languages, permanent-team authority checks, transfer-aware repeat inquiry routing, owner account protection and invitation bootstrap. Adds readable comment history with deleted content redaction, scoped commission earnings, correct monthly/yearly dashboard behavior, explicit import assignment and shareable explorer selections. Reminder execution wakes at persisted deadlines and rechecks ownership/state under transaction locks before delivery; transfer retains the original due time. Public metadata follows localized website copy.

Verification on 2026-10-06:

- All workspace TypeScript checks pass.
- 23 domain/database/API regression tests pass, including permissions, duplicate OTP concurrency, reservation races, leave approval/advance limits, hidden prices, comment redaction, reminder delivery and owner/language isolation.
- Admin, API and public production builds pass. Production dependency audit reports zero vulnerabilities.
- Linux production API container builds successfully; the running container returns database health `ok`. Temporary smoke-test container removed afterward.
- Seven versioned database migrations applied locally. Owner initialization dry run refuses an existing owner without delivery.
- Real browser checks cover public desktop/mobile, Hebrew RTL, project/floor/apartment selection, inquiry creation, admin login, manual lead creation, call logging, sale confirmation fields, dashboard and website configuration. Latest explorer selection writes building/floor/unit URL parameters and opens the matching apartment.

This is a local implementation with illustrative inventory. Production launch still needs actual content/assets, reviewed translations/privacy text, domain/Cloudflare/hosting access and connected delivery/FX/storage providers. R2/email/SMS/translation adapters have no credentialed live verification. No production deployment or real customer communication occurred.
