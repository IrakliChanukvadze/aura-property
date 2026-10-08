# Aura Property

Standalone residential-complex agency website and admin CRM. TypeScript monorepo: Next.js public website, React/Vite admin, Fastify API and PostgreSQL/Prisma.

## Run locally

Requires Node22+ and Docker Desktop running.

```sh
npm install
npm run setup
npm run dev
```

Public website: http://localhost:3100/en (keeps existing port3000 applications untouched). Admin: http://localhost:5173. API: http://localhost:4000/api/health.

Setup copies `.env.example` to ignored `.env` only if absent, starts isolated PostgreSQL on5434, applies versioned migrations and seeds clearly illustrative data. It never imports Pini data. Demo staff: `owner@aura.local`, `lead@aura.local`, `agent@aura.local`, `editor@aura.local`; local password `AuraLocalDemo2026!`. These are development fixtures, never production credentials. Existing passwords are not reset by seeding.

```sh
npm run typecheck

# See apps/api/README.md: tests need an isolated local aura_*test/audit database.
DATABASE_URL='postgresql://USER:PASSWORD@localhost:5434/aura_test' npm test
npm run build
```

Do not build Next.js while its development server is using the same output directory; stop the web preview before a full build. The test suite uses a dedicated local test database with migrations applied; clear real webhook/R2/OpenAI credentials before running it. Tests clean up their fixtures, but some temporarily change shared agency settings. Sources and migrations are committed in ticket-sized slices.

## Product and review

Start with `AGENTS.md`, `docs/product/mvp-spec.md` and `docs/product/acceptance.md`. The decision ledger retains superseded history; current spec resolves it. Ticket evidence lives in `tasks/implementation`. Hero cityscape is default; set `NEXT_PUBLIC_HERO_VARIANT=collage` for the alternative.

## Verification

AURA-028 (2026-10-08): Pini-compatible OpenRouter translation with batched editor requests and Hebrew support; 65 API tests pass against the isolated local database, all workspace typechecks and API/admin builds pass. Browser error-path check confirms unsaved source text is preserved. Real-provider translation quality remains pending the key; the shared OpenRouter $10/month cap has been applied and verified. See `tasks/implementation/AURA-028.md`.

AURA-026 (2026-10-08): 50 API tests pass against an isolated local database; API/admin/web type checks and API/admin builds pass. The website editor was checked at desktop/mobile widths, in dark mode, and with Hebrew content direction. Real translation-provider quality remains unverified until credentials are connected. See `tasks/implementation/AURA-026.md` for evidence and limits.

The earlier full production builds, dependency audit and Linux API container smoke test are recorded in `tasks/implementation/AURA-010.md`; clean production-image builds and release smoke tests must be repeated for the actual deployment configuration.

## Release boundary

Local implementation is separate from production deployment. Actual inventory/photos/plans and reviewed translations, agency contact/privacy copy, domain/Cloudflare access and email/SMS/translation/FX/storage providers must be supplied/validated before launch. Development OTP/email responses are explicitly local; production fails closed without providers. No live messages, hosting purchases or deployments have been performed. See `apps/api/README.md` and `docs/architecture/stack.md`.

The costed `auraproperty.ge` launch plan is in [docs/architecture/auraproperty-ge-launch-plan.md](docs/architecture/auraproperty-ge-launch-plan.md), with a secret-free configuration template at [infra/production.env.example](infra/production.env.example).
