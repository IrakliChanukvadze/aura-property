# Aura API

Fastify + TypeScript, PostgreSQL/Prisma. HTTP JSON uses `{data}` or `{error:{code,message}}`. Auth uses an HTTP-only SameSite Strict cookie and verifies account activity every request. Cookie mutations require an allowed Origin. Admin/private APIs never use public website registration.

## Local execution

Copy `.env.example` settings into the process environment. From repository root, run database generate/migrate/seed, then `npm run dev --workspace @aura/api`. PostgreSQL development connection is `postgresql://aura:aura_local_only@localhost:5434/aura?schema=public`.

Demo seed is explicitly forbidden in production. It creates illustrative projects and local accounts `owner@aura.local`, `lead@aura.local`, `agent@aura.local`, `editor@aura.local`; `SEED_PASSWORD` sets their initial password, with local default `AuraLocalDemo2026!`. Existing seeded passwords are not overwritten. No data comes from Pini or production.

## Endpoint groups

- `/api/auth`: login, me, logout, self password, recovery and invitation acceptance. Owner/team lead cannot change another password.
- `/api/users`, `/teams`: invitations, profile preference, scoped staff, owner user permissions/deactivation and team administration.
- `/api/public/projects`, `/posts`, `/team`, `/exchange-rate`: published content only. Projects nest building → floor → apartment data; hidden prices/private minima are omitted. Draft media is private until publication.
- `/api/public/inquiries`: new accepted inquiry; repeated number requires OTP before routing. `/inquiries/:id/verify-request` and `/inquiries/verify` support optional first-inquiry verification after saving.
- `/api/projects`, `/units`, `/posts`, `/translate`: per-user editing permission, four reviewed translations before publish; inventory minimum edits owner-only.
- `/api/leads`: scoped active/Lost/Won; contact edits with duplicate checks, single creation, linked `/purchases`, calls, comments/version edits, stages, Lost reviews, assignments, viewings, reminders and reservations.
- `/api/leads/:id/sales`: confirmed Won action requires apartment, signed price/currency/date and positive received deposit/currency/date. Apartment becomes Sold; signing-date FX and commission rates snapshot. Staff Won is terminal.
- `/api/sales/:id/reverse`: owner-only reasoned correction; original values retained, inventory and active earnings/ranking credit changed per apartment.
- `/api/leads/import/template`, `/preview`, `/confirm`: fixed XLSX template, preview `{file:base64}`, valid-row confirmation `{previewId,autoAssign}`. Preview expires in 15 minutes and is bound to session user; process restart requires new preview. ExcelJS parses supported XLSX, no macros executed.
- `/api/leads/export`: owner only. Delete requires owner, Lost stage and `{confirmed:true}`.
- `/api/dashboard`, `/leaderboards`, `/commissions`, `/calendar`, `/notifications`: server-scoped operational data. Global leaderboard exposes ranking counts/totals, not customer records. Own financial shares are projected for agents/acting leaders.
- `/api/schedules`, `/leave`: five-day flexible weekly schedules, owner approval for permanent-lead schedule/leave, calendar workday snapshots, two completed-month days accrued, indefinite carryover and −2 floor, cancellation/early return approval.
- `/api/uploads`: base64 JPEG/PNG/WebP or PDF signatures checked, 10 MB maximum. Optional agreements are linked to a lead and accessed with its permissions. Public covers publish only when actually referenced by public content.

Background jobs recover new tasks at most every15seconds and wake after mutations. Known reminder/reservation deadlines wake the worker at their persisted due timestamp. Delivery depends on process health; the header refresh can lag by its client polling interval. They deliver header reminders, reservation 24-hour reviews/48-hour owner escalation, and optional vacation start-date lead reassignment. Reassignment keeps pending due times. Production should run a separately monitored worker before operating at scale.

## Provider boundaries

Actual provider credentials are not embedded. Cloudflare R2 has a direct S3-compatible SDK adapter: configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET. Keep the bucket private; the API only serves marketing files when referenced by published content and authorizes agreement downloads by lead scope. Email/SMS/translation/FX/storage integrations use configured server-side webhook adapters with bearer secrets. Providers must be provisioned and their contracts validated before production. `DEV_INTEGRATIONS=true` only works outside production; local invitation/OTP responses explicitly identify development values. Optional document storage uses a local filesystem in this mode only. Production fails closed if mandatory email, OTP, translation, FX or storage provider is unavailable. This is not a deployment or a claim that Cloudflare R2/SMS/email accounts have been connected.

Tests use disposable records in the configured local database and clean their fixtures. Run `DATABASE_URL=... npm run test --workspace @aura/api`. Auth/permissions, concurrent call attempts and sale/reservation consistency require the real database, not mocks.

## Endpoint audit and actionable errors

The 2026-10-08 endpoint audit and role status matrix are recorded in `tasks/implementation/AURA-025.md` and `AURA-025-api-audit.json`. Run the API tests against a dedicated local test database with migrations applied; disable real webhook/R2 providers so integration tests cannot contact external services.

Trusted browser origins support GET, HEAD, POST, PUT, PATCH, DELETE and OPTIONS. A 401 means no active session; 403 means the role/user grant or CSRF check denies access. Invalid input returns 400, missing records/files 404, and duplicate/relationship/business-state conflicts 409. A USD sale missing its verified signing-date rate returns `409 FX_RATE_REQUIRED`; SuperAdmin can add the verified rate through Settings. Provider outages use actionable 502/503 responses. These errors do not indicate that the process has stopped.

## Website editing and AI translation

`PATCH /api/site` merges only supplied section fields and locale keys into the saved overrides. Other sections, languages and existing unknown keys survive. An explicit empty string removes that field's override, restoring the website default. Both `heroImage` and `aboutImage` accept an image URL. Saves and their audit entries commit together, with an advisory lock preventing simultaneous section saves from losing each other's updates. `GET /api/site` and `/api/public/site` return plain overrides in `{data}`.

Set `OPENAI_API_KEY` in the API server's secret environment to enable direct OpenAI translation. `OPENAI_TRANSLATION_MODEL` is optional and defaults to `gpt-4.1-mini`. Requests use the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) with `store: false` and a 30-second timeout. Never put the key in `VITE_` or `NEXT_PUBLIC_` variables or commit it. An existing `TRANSLATION_WEBHOOK_URL` takes precedence and retains its `{text,source,target}` request / `{text}` or `{translation}` response contract and optional `TRANSLATION_WEBHOOK_TOKEN` bearer secret.

Authorized content editors can inspect `GET /api/translation/status`, which returns only `{data:{configured,provider}}`; `provider` is `openai`, `webhook`, or `null`. This reports configuration presence, not provider reachability or billing validity. `POST /api/translate` keeps `{text,source,target}` → `{data:{text}}`, is limited to 20 requests per minute per IP, and returns 503 when no provider is configured or 502 when a provider fails or returns incomplete/refused/empty output. Translation produces an editable draft; review it before saving or publishing. Automated tests stub provider requests and must run against an isolated test database, with real provider credentials disabled.

API database tests run serially because several cases temporarily update shared agency settings. The site-editor suite refuses a business database: use a dedicated local database named `aura_endpoint_audit` (or `aura_*test`) and apply migrations before testing. Clear real provider webhook/R2/OpenAI environment variables for these tests.
