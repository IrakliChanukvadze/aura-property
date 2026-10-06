# MVP implementation

Authorized 2026-10-06. Stack: TypeScript, Next.js public web, React/Vite admin, Fastify API, PostgreSQL/Prisma, npm workspaces. Cloudflare DNS/security/R2 direction; actual hosting/provider connections pending verification.

1. Consolidate current spec and acceptance scenarios.
2. Build database/API and public site in parallel with bounded ownership.
3. Build admin against API contracts; integrate reusable Pini authoring/explorer logic.
4. Run database migrations/seed, meaningful domain/auth tests, builds/typechecks.
5. Browser verify key journeys/mobile/RTL; independent review and repair.
6. Document runnable setup, provider requirements and verified limitations; no claim of production deployment without evidence.

Approved hero: cityscape default, project collage retained alternative; project showcase rejected.

## Local completion evidence

Implementation and integration slices AURA-001 through AURA-010 are complete locally. Type checks, 23 regressions, all production builds and production dependency audit pass. Browser evidence and release prerequisites are recorded in AURA-010.md and docs/architecture/deployment.md. Production launch is pending owner-supplied assets and service access.
