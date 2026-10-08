# AURA-025 — Backend endpoint audit and fixes

## Brief
Owner reports multiple failing endpoints while testing the admin. Check every registered route, separate expected validation/permission/provider responses from backend defects, fix concrete failures and preserve all existing business data.

## Plan
- Correlate live request logs, enumerate registered routes and inspect admin request contracts.
- Reproduce browser CORS and FX failures; review CRM/content/auth/provider paths in parallel with bounded file ownership.
- Add route-wide anonymous/role/invalid-input checks plus targeted successful workflows and regressions.
- Run tests in separate local aura_endpoint_audit PostgreSQL database; existing Aura records and external providers remain untouched.
- Verify live preflight and role-specific read endpoints, browser admin request, API typecheck/build, record coverage limits and commit.

## Initial evidence
Live API process is healthy. Server log records two POST sale500 exceptions due to missing signing-date FX. Several browser PATCH requests show successful OPTIONS without a following actual request; @fastify/cors default methods omit PATCH and DELETE. Existing401 afterlogout/session expiry are expected.

## Results
Implemented and verified locally on 2026-10-08; not deployed.

### Fixes
- Explicit credentialed CORS methods now allow browser PATCH and DELETE from configured trusted origins. CORS and CSRF share one trimmed allowlist, including the local public site at port 3100 by default.
- USD sale without a verified signing-date FX rate returns `409 FX_RATE_REQUIRED` with a Settings instruction. Configured FX outages return `503 FX_UNAVAILABLE`; no rate is guessed. Verified rate and commission snapshots remain immutable.
- Invalid phones, malformed/repeated filters, invalid date periods, malformed Excel files and invalid explorer structures return validation errors. Empty optional filters sent by the admin remain supported.
- Missing database records/files and relationship conflicts return appropriate 404/409 errors instead of generic 500. Invalid commission configuration prevents a sale transaction from changing inventory.
- New editor invitations default to a per-user content grant; explicit denial and other roles' permissions remain intact. Existing users are not changed.
- Email, SMS, translation and storage failures have typed responses and bounded requests. Interrupted media response bodies return a JSON `502 STORAGE_FAILED`.

### Verification
- 81 declared routes found and verified as registered, with anonymous requests checked for authentication and unexpected server errors.
- All four roles exercised against the route inventory using invalid or missing-resource requests, with selected permission assertions and session invalidation checks. Open authentication flows have dedicated tests.
- 43 API tests passed, 0 failed, 0 skipped: both the serial audit run and the normal `npm run test -w @aura/api` command passed against the separate local `aura_endpoint_audit` database. Targeted success flows cover invitations, content, imports, leads, sales, reservations, schedules and leave approval.
- A final change replaced an incomplete mock response with a real interrupted Response stream. All 8 affected content/media tests passed again; API TypeScript check and build passed after that correction.
- Live localhost API: health and six public reads returned 200; 20 reads per role returned expected 200/403 statuses. The exact admin empty-filter request returned 200 for sales roles and 403 for the editor. PATCH/DELETE preflights returned 204 with the correct allow-methods/origin.
- Real browser: signed in to the local owner demo, opened the Active leads board with all optional filters empty, confirmed records rendered, then signed out successfully. Existing business data was not mutated.
- Independent CRM review covered shared error mapping, CORS, permission defaults and content/import changes. Its media response-body finding was fixed and regression-tested. Integration review caught and fixed the empty-filter compatibility issue before final verification.
- Sanitized per-route/per-role status evidence: [AURA-025-api-audit.json](AURA-025-api-audit.json). No credentials, cookies, customer content or raw database dumps are included.

### Remaining configuration and limits
Production email/SMS/translation/storage/FX credentials and provider delivery have not been verified by this local audit. Provider failures were simulated without external calls. A missing verified USD/GEL rate still intentionally blocks a USD sale until SuperAdmin enters the correct date/rate in Settings or a working provider supplies it.

The route matrix covers authentication, selected permissions, malformed input and missing records; it does not claim exhaustive success coverage for every possible business state. Keep separate targeted workflow tests when adding or changing endpoints.

To repeat, point `DATABASE_URL` at a dedicated local test database, apply Prisma migrations, remove provider webhook/R2 settings, set `NODE_ENV=test DEV_INTEGRATIONS=true`, then run `npm run test -w @aura/api`, `npm run typecheck -w @aura/api` and `npm run build -w @aura/api`.
