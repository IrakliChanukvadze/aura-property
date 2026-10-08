# Production deployment

Aura launched on 2026-10-08. Application revision: `980e695a8f2c7e06a0d0a1b99827ca055d14ffa4`. [Launch evidence and outstanding work](../../tasks/implementation/AURA-030.md). Proxy configuration additionally includes `c3eb5d3d2f2a6e8f19d6d425cf8e18dbd24b30cb` (verified no-referrer on admin/API). Later documentation commits do not change the deployed images.

## Live services and cost

- Public: https://auraproperty.ge (four languages); www redirects to apex.
- Admin: https://admin.auraproperty.ge (noindex, no-store).
- API health: https://api.auraproperty.ge/api/health (noindex, no-store).
- Separate DigitalOcean Frankfurt Droplet, Ubuntu24.04,2vCPU/2GB/60GB: $18/month plus$3.60 weekly backups, before tax. Pini is independent.
- Cloudflare Free DNS/proxy and Full (strict). Caddy obtains valid origin certificates. Only22/80/443 are exposed; PostgreSQL has no published host port. Key-only SSH,2GB swap and container log rotation enabled.

Docker Compose runs Next.js web, Vite/admin nginx, Fastify API/jobs, PostgreSQL17 and Caddy. API/web/database each have512MB memory limits; admin/proxy128MB. One API process runs the scheduled jobs. Caddy trusts only Cloudflare address ranges; the API trusts only Caddy's fixed internal address. SSR has narrowly scoped internal access to read-only public content routes. Production development adapters are disabled.

## Private configuration and bootstrap

Server checkout is `/opt/aura`; private config `.env.production.local` is0600. Do not print, commit or source that dotenv file as shell code. `infra/production.env.example` documents variable names. Provider and database credentials are runtime-only; frontend build arguments contain public URLs only.

The initial owner invitation was delivered and the account was activated. Users choose their own passwords; production has no demo logins. Never run development seed scripts here. `owner:init` refuses another bootstrap once a SuperAdmin exists. Normal staff invitations follow team setup.

Only approved public content was imported with `scripts/public-content.mjs`: Tbilisi Boulevard and three public team profiles, no CRM fixtures. First inquiries are verified. SMS remains deferred by explicit owner approval; repeat inquiries requiring OTP fail closed. No production FX rate is configured. See AURA-030 for catalog and operational follow-ups.

## Release procedure

1. Commit/review a ticket and pass Verify Aura in GitHub Actions.
2. Manually run Build Aura release images for the reviewed revision. It creates native linux/amd64 API/web/admin/migrate images tagged with the exact Git SHA. Artifacts expire after seven days; the server retains the loaded release.
3. Transfer the release archive and checksum securely, verify checksum, then load the images. Update server checkout/infra to that revision and privately set RELEASE_TAG to the same SHA. Preserve the previous release and env recovery copy.
4. Run `bash scripts/deploy-release.sh` on the server. It validates config, backs up PostgreSQL, applies migrations and starts services with health checks. It never builds application images on the Droplet.
5. Run `bash scripts/deploy-smoke.sh` and verify critical behavior. Record the deployed revision separately from GitHub HEAD. Git pushes do not deploy automatically.

For initial empty databases only, `--prepare-only` applies migrations before guarded public-content import and owner initialization. Do not re-import the launch snapshot into an active CRM.

Rollback may restore the previous application image tag if database compatibility permits. Database restoration is a separate incident decision because it can discard records received after the backup; never automatically roll back the live database.

## Backup and recovery

DigitalOcean weekly backups are enabled (Wednesday04:00–08:00UTC); the first snapshot is still upcoming. Separate database backups use `aura-backup-offsite.timer`: daily00:30UTC, up to five minutes jitter, with a weekly copy on Sundays. `backup-offsite-run.sh` creates a PostgreSQL custom dump, encrypts it with AES256GCM and uploads/read-verifies ciphertext in private R2 backup prefixes. The encryption key is provided only to the operations process, not API/web. A private laptop recovery copy exists; protect it independently from the server.

The first real offsite backup was downloaded and authenticated/decrypted, then restored into a disposable database:24 public tables recovered. `scripts/backup-restore-check.sh /private/path/file.dump` always creates and removes a new test database; it does not overwrite production. Follow the decrypt/download instructions in `infra/README.md` before restoring an encrypted object.

All backups are currently retained; pruning is not automated. Minimum policy target is14daily/4weekly. Daily backups allow up to24hours of data loss; PITR is not configured. Review disk/object usage and backup service status. An external alert channel for failures and independent uptime monitoring remain follow-ups.

## Verification scope

Latest release:92/92 API tests, all workspace typechecks/builds, zero dependency vulnerabilities and native release build passed. Content/backup script checks:15 passed,1 skipped. Cloudflare HTTPS smoke and live centered apartment modal passed. The invitation/deactivation UI was checked locally with a disposable pending account and no real mail delivery; live unauthenticated resend returns401. Earlier launch evidence covers synthetic live inquiry/duplicate behavior, owner email delivery and encrypted offsite restore. See AURA-031 and AURA-032 for exact release evidence. Small idle memory use is not a load test; measure memory/swap/latency and resize before sustained pressure. Analytics/Search Console are separate post-launch work.
