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
npm test
npm run build
```

Do not build Next.js while its development server is using the same output directory; stop the web preview before a full build. Test suite uses disposable records in the local database and cleans them up. Sources and migrations are committed in ticket-sized slices on `codex/aura-mvp`.

## Product and review

Start with `AGENTS.md`, `docs/product/mvp-spec.md` and `docs/product/acceptance.md`. The decision ledger retains superseded history; current spec resolves it. Ticket evidence lives in `tasks/implementation`. Hero cityscape is default; set `NEXT_PUBLIC_HERO_VARIANT=collage` for the alternative.

## Verification

All workspace type checks and production builds pass. The 23 regression tests cover critical permissions, workflow and concurrency boundaries. Production dependency audit is clean; the Linux API container builds and passes a database health smoke test. See `tasks/implementation/AURA-010.md` for browser evidence and limits.

## Release boundary

Local implementation is separate from production deployment. Actual inventory/photos/plans and reviewed translations, agency contact/privacy copy, domain/Cloudflare access and email/SMS/translation/FX/storage providers must be supplied/validated before launch. Development OTP/email responses are explicitly local; production fails closed without providers. No live messages, hosting purchases or deployments have been performed. See `apps/api/README.md` and `docs/architecture/stack.md`.
