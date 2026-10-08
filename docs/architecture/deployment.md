# Deployment preparation

Current costed domain-specific plan: [auraproperty.ge launch plan](auraproperty-ge-launch-plan.md), with the proposed production variable template at [infra/production.env.example](../../infra/production.env.example).

No live deployment has been made. Cloudflare remains the DNS/security/CDN and R2 direction. First deployment can use Node containers behind Cloudflare; database must be persistent and independently backed up. Do not infer Workers compatibility from a successful Node build.

## Build targets

Root Dockerfile has `api`, `web`, `admin` targets. API needs DATABASE_URL and provider secrets at runtime. Public web needs its production API/site URL and contact configuration available at build time; Vite needs VITE_API_URL/VITE_PUBLIC_URL at build time. The supplied Dockerfile must receive these via build arguments/environment (see next release configuration), never commit production secrets. Build verification has not yet been performed on a remote host. Admin nginx denies indexing and provides SPA route fallback.

Run migrations with `npm run deploy -w @aura/database` before starting the new API version. Run one monitored API worker initially; due jobs are serialized with PostgreSQL locks. It must remain running for notifications. Known deadlines wake the worker at their persisted due timestamps; periodic checks recover new tasks. Delivery depends on a healthy process and header refresh uses polling. Keep production DEV_INTEGRATIONS unset/false.

## Launch inputs

- Domain/Cloudflare account and host/database choices.
- Actual complexes, plans/polygons/prices and all four reviewed languages; curated team profiles.
- Agency contact channels and final privacy copy.
- Email invitation/recovery provider; SMS OTP provider; translation provider; historical/current FX data.
- R2 bucket/account credentials and private-file delivery configuration. Direct S3-compatible R2 adapter is implemented; credentialed upload/download verification remains a launch requirement.
- Monitoring, backup/restore rehearsal and deployment health checks.

Provider contracts are documented in apps/api/README.md. Local development adapters never send real email/SMS and cannot be enabled in production. Test data must not be used as real listings.

## First owner account
Never seed the production database. Once database/email/ADMIN_URL are configured, set OWNER_EMAIL/OWNER_NAME and run `npm run owner:init`; it refuses if any SuperAdmin already exists and sends a single-use setup invitation instead of setting someone else's password. `npm run owner:init -- --dry-run` reports eligibility without creating an account or sending email. Staff then use normal invitations.
