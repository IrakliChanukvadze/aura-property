# Aura Property

Standalone residential-complex agency website and admin CRM. TypeScript monorepo: Next.js public website, React/Vite admin, Fastify API and PostgreSQL/Prisma.

## Production

Published 2026-10-08: [website](https://auraproperty.ge), [admin](https://admin.auraproperty.ge). Deployed application revision: `35bc0f4bf2ec6c815c6159fae6ec9ec29f4fe69e`. GitHub main may contain newer documentation; a push does not automatically deploy.

Aura has its own Frankfurt DigitalOcean server and database, behind Cloudflare Full (strict). Approved hosting: $18/month plus $3.60 weekly backups, before tax. Daily encrypted database backups to R2 and recovery into a disposable database are verified. See [deployment runbook](docs/architecture/deployment.md) and [launch evidence](tasks/implementation/AURA-030.md).

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

AURA-028 (2026-10-08): Pini-compatible OpenRouter translation with batched editor requests and Hebrew support; 65 API tests pass against the isolated local database, all workspace typechecks and API/admin builds pass. Browser error-path check confirms unsaved source text is preserved. The supplied OpenRouter key and $10/month shared cap are verified; one live four-language adapter check passed. Editorial translation review remains required. See `tasks/implementation/AURA-028.md`.

AURA-026 (2026-10-08): 50 API tests pass against an isolated local database; API/admin/web type checks and API/admin builds pass. The website editor was checked at desktop/mobile widths, in dark mode, and with Hebrew content direction. Real translation-provider quality remains unverified until credentials are connected. See `tasks/implementation/AURA-026.md` for evidence and limits.

The earlier full production builds, dependency audit and Linux API container smoke test are recorded in `tasks/implementation/AURA-010.md`; clean production-image builds and release smoke tests must be repeated for the actual deployment configuration.

## Release boundary

Production contains the approved Tbilisi Boulevard catalog and three public team profiles, without local CRM fixtures or demo accounts. The owner invitation was delivered; staff setup and owner password selection remain user actions. New website inquiries are verified. The owner explicitly approved launch with SMS deferred: repeat inquiries still require OTP and fail closed until SMS is configured. No production FX rate is configured, so GEL conversion remains unavailable. Review outstanding content and operational follow-ups in AURA-030. Development providers are disabled in production.

The costed `auraproperty.ge` launch plan is in [docs/architecture/auraproperty-ge-launch-plan.md](docs/architecture/auraproperty-ge-launch-plan.md), with a secret-free configuration template at [infra/production.env.example](infra/production.env.example).
