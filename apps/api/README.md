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

Background jobs run every 15 seconds with database locking: exact due timestamps persist; delivery may be up to one polling interval later. They deliver header reminders, reservation 24-hour reviews/48-hour owner escalation, and optional vacation start-date lead reassignment. Reassignment keeps pending due times. Production should run a separately monitored worker before operating at scale.

## Provider boundaries

Actual provider credentials are not embedded. Cloudflare R2 has a direct S3-compatible SDK adapter: configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET. Keep the bucket private; the API only serves marketing files when referenced by published content and authorizes agreement downloads by lead scope. Email/SMS/translation/FX/storage integrations use configured server-side webhook adapters with bearer secrets. Providers must be provisioned and their contracts validated before production. `DEV_INTEGRATIONS=true` only works outside production; local invitation/OTP responses explicitly identify development values. Optional document storage uses a local filesystem in this mode only. Production fails closed if mandatory email, OTP, translation, FX or storage provider is unavailable. This is not a deployment or a claim that Cloudflare R2/SMS/email accounts have been connected.

Tests use disposable records in the configured local database and clean their fixtures. Run `DATABASE_URL=... npm run test --workspace @aura/api`. Auth/permissions, concurrent call attempts and sale/reservation consistency require the real database, not mocks.
