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

Actual provider credentials are not embedded. Cloudflare R2 has a direct S3-compatible SDK adapter: configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET. Keep the bucket private; the API only serves marketing files when referenced by published content and authorizes agreement downloads by lead scope. Email supports direct Resend with a verified sender; compatible email/SMS/translation/FX/storage webhook adapters remain available. Providers must be provisioned and their contracts validated before production. `DEV_INTEGRATIONS=true` only works outside production; local invitation/OTP responses explicitly identify development values. Optional document storage uses a local filesystem in this mode only. Production fails closed if mandatory email, OTP, translation, FX or storage provider is unavailable. This is not a deployment or a claim that Cloudflare R2/SMS/email accounts have been connected.

Tests use disposable records in the configured local database and clean their fixtures. Run `DATABASE_URL=... npm run test --workspace @aura/api`. Auth/permissions, concurrent call attempts and sale/reservation consistency require the real database, not mocks.

## Endpoint audit and actionable errors

The 2026-10-08 endpoint audit and role status matrix are recorded in `tasks/implementation/AURA-025.md` and `AURA-025-api-audit.json`. Run the API tests against a dedicated local test database with migrations applied; disable real webhook/R2 providers so integration tests cannot contact external services.

Trusted browser origins support GET, HEAD, POST, PUT, PATCH, DELETE and OPTIONS. A 401 means no active session; 403 means the role/user grant or CSRF check denies access. Invalid input returns 400, missing records/files 404, and duplicate/relationship/business-state conflicts 409. A USD sale missing its verified signing-date rate returns `409 FX_RATE_REQUIRED`; SuperAdmin can add the verified rate through Settings. Provider outages use actionable 502/503 responses. These errors do not indicate that the process has stopped.

## Website editing and AI translation

`PATCH /api/site` merges only supplied section fields and locale keys into the saved overrides. Other sections, languages and existing unknown keys survive. An explicit empty string removes that field's override, restoring the website default. Both `heroImage` and `aboutImage` accept an image URL. Saves and their audit entries commit together, with an advisory lock preventing simultaneous section saves from losing each other's updates. `GET /api/site` and `/api/public/site` return plain overrides in `{data}`.

Set `OPENROUTER_API_KEY` in the API server’s secret environment to use the same provider as Pini. `CHAT_MODEL` defaults to `google/gemini-2.5-flash`, matching the inspected Pini source/local configuration. Requests use `https://openrouter.ai/api/v1/chat/completions`, temperature 0, max_tokens 12000, a forced structured translation function, a 60-second timeout and no automatic retries. The source text is treated as data and preserved exactly; output must contain all four languages, including Hebrew, and match requested field IDs. Truncated, refused, incomplete and malformed output fails without changing content. Never put keys in `VITE_` or `NEXT_PUBLIC_` variables.

Provider selection is explicit by configuration precedence: `TRANSLATION_WEBHOOK_URL` → `OPENROUTER_API_KEY` → `OPENAI_API_KEY`. A provider failure never silently switches providers or retries. Existing webhook `{text,source,target}` / `{text}` or `{translation}` and OpenAI Responses (`OPENAI_TRANSLATION_MODEL`, default `gpt-4.1-mini`) support remain available.

Content editors can inspect `GET /api/translation/status`, returning only `{data:{configured,provider}}`, with provider `openrouter`, `openai`, `webhook`, or `null`. Configuration presence does not prove provider reachability or funded billing. The existing `POST /api/translate` single-target contract remains available. The admin uses `POST /api/translate/batch`: `{sourceLanguage,fields:[{id,text,kind?}]}` → `{data:{fields:[{id,translations:{en,ka,ru,he}}]}}`. At most 20 uniquely identified fields, 5000 characters per source field and 10000 total are permitted. OpenRouter translates a batch in one call; alternative adapters use bounded sequential requests. OpenRouter permits one in-flight translation and 20 provider requests per authenticated user per hour, matching Pini’s process-local usage guard; this is not a monetary cap and resets on process restart. Both routes retain server-side content permissions and the existing IP request limit. Translations remain drafts for review before publication.

The owner confirmed the same OpenRouter account and exact key as Pini for combined billing. Sharing that key combines usage and its monthly USD cap across both apps. Configure monetary limits in OpenRouter, not the process-local request counter. The owner approved $10/month combined for Pini and Aura; the shared OpenRouter key’s $10 monthly cap was applied and verified on 2026-10-08. No Pini key is copied automatically. See [OpenRouter key limits](https://openrouter.ai/docs/api/api-reference/api-keys/create-a-new-api-key).

API database tests run serially because several cases temporarily update shared agency settings. The site-editor suite refuses a business database: use a dedicated local database named `aura_endpoint_audit` (or `aura_*test`) and apply migrations before testing. Clear real provider webhook/R2/OpenAI/OpenRouter environment variables for these tests.

## Transactional email (Resend)

Aura reuses Pini’s Resend delivery approach for staff invitations, password recovery and owner initialization. Set server-only `RESEND_API_KEY` and `EMAIL_FROM="Aura Property <notifications@auraproperty.ge>"`. Verify `auraproperty.ge` in the same Resend account using the supplied DNS records before sending. A shared key works only if its permissions/domain scope include Aura; a Pini-only key cannot send from Aura’s domain. Existing Pini sender/domain settings stay unchanged. On 2026-10-08, auraproperty.ge was verified in Resend (Ireland), the owner supplied the shared key in the private production env, and an explicitly authorized test through this adapter reached Delivered status. Production runtime wiring remains separate; local development still uses its own .env.

`sendEmail(to,subject,text)` sends `POST https://api.resend.com/emails` with a 10-second deadline, explicit sender, plain-text body and an Aura-namespaced deterministic idempotency key. It makes no automatic retry and reports acceptance only for a successful provider response with a nonempty message ID. HTTP errors, provider errors, malformed responses and timeouts return a safe `503 EMAIL_UNAVAILABLE` without logging the recipient, token-bearing message or API key. Acceptance does not prove inbox delivery. `EMAIL_WEBHOOK_URL` retains precedence and its existing payload contract; local development uses a stub only when no provider is configured. Production never falls back to the development stub.

Pini’s lead-email tracking/webhook tables are not copied; the current Aura notification scope remains header notifications plus transactional staff email. Resend’s sending domain is not a human inbox: a mailbox such as `hello@auraproperty.ge` is a separate setup. Live email tests require an explicitly authorized recipient/purpose; no real recipient emails were sent during implementation. References: [sending API](https://resend.com/docs/api-reference/emails/send-email), [domain verification](https://resend.com/docs/dashboard/domains/introduction), [API key scopes](https://resend.com/docs/dashboard/api-keys/introduction), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).


## Integrations workspace (AURA-033)

SuperAdmin alone can inspect `GET /api/integrations` and run `POST /api/integrations/:id/check` for `email`, `translation`, `storage`, `sms` and `fx`. Results contain provider identifiers, public documentation links and environment-field presence booleans, never credential values, sender addresses or configured webhook URLs. The check is configuration-only: it makes no network call, sends no message/file and consumes no paid AI request. It does not prove that credentials, provider connectivity, billing or delivery work. Runtime credentials remain managed through the private API server environment; no editable key form or disconnect endpoint exists in this slice.

The guided admin setup explains each service, its required fields and the next operational verification. Future messaging/calling channels are labelled Planned and do not connect or accept unusable credentials. See `docs/product/crm-roadmap.md` for the phased communication, calling, AI and finance plan.


## Internal communication events (AURA-034)

`GET /api/communication-events` provides SuperAdmin-only safe processing counts and20 recent metadata entries; it excludes customer text/contact data, account IDs and external event identifiers. `enabled:false` and `workerEnabled:false` are explicit: no live provider adapter or scheduled processing worker is enabled. There is no public POST/webhook intake endpoint.

Future adapters must authenticate provider events before calling `receiveVerifiedCommunicationEvent`. Its strict bounded normalized schema rejects raw provider headers/bodies. Stable provider/account/external-event IDs deduplicate; the first receipt remains authoritative. `claimCommunicationEvent` uses expiring token leases and database concurrency control. `processCommunicationEvent` invokes a database-only handler inside the supplied transaction; handler effects and completion commit together. Never perform network calls or use another database client in this callback. This is not exactly-once external delivery. Retry backoff begins at30seconds, with at most5claims; final crashed attempts and invalid normalized payloads become terminal failures. Error messages are never persisted, only bounded codes. The additive migration is required before the diagnostic route can be used.
