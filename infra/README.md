# Production operations — Aura only

This directory describes a separate DigitalOcean Ubuntu Docker host. It does not configure, deploy to, or share data with Pini. Purchase the approved server size first; these files do not purchase anything. The owner chose an initial 2 GB RAM / 2 vCPU regular Droplet ($18/month) with weekly backups ($3.60/month): $21.60/month before tax. Images build on native Linux CI. API, web and PostgreSQL are each capped at512 MB; configure2 GB swap as emergency headroom, monitor memory and resize when needed. Swap does not replace adequate RAM.

## Release preparation

1. Review and commit the tested release. `scripts/deploy-build.sh` refuses a dirty checkout and tags all four application images with the full commit SHA. It builds API, web, admin and a migrations/operations image, then writes an image archive and checksum into ignored `.local/releases/SHA/`. The manually dispatched `Build Aura release images` GitHub Actions workflow builds on native amd64 and retains the deployment archive/checksum for 7 days; no registry push or server deployment happens automatically. Use a commit whose Verify Aura checks passed. Only the four public URL build arguments reach the frontend build; provider keys are runtime API environment values.
2. Provision Docker Engine with the Compose plugin and Python 3 on the dedicated host. Install current security updates and enable SSH key authentication. Restrict SSH to an approved operator address using a DigitalOcean firewall; allow TCP 80/443 and optionally UDP 443. Do not expose ports 3000, 4000 or 5432. Docker publishes only Caddy, so do not rely on UFW alone to hide a published Docker port.
3. Transfer the release archive, matching committed `infra/` and `scripts/` directories. Verify `sha256sum -c images.tar.gz.sha256`, then `docker image load -i images.tar.gz`. No registry credentials are required for this path. Keep the previous release archive/images available.
4. Put the production env in `/opt/aura/.env.production.local` (or an explicit `AURA_ENV_FILE` path), owned by the deployment operator with mode `0600`. Use the production template, a unique **32+ character URL-safe random `POSTGRES_PASSWORD`**, `IMAGE_PREFIX=aura-property`, and full `RELEASE_TAG`. Never copy the local development `.env`. Never run `docker compose config` without `--quiet` in a shared log: its rendered output contains secrets.
5. Record/pin the `POSTGRES_IMAGE` and `CADDY_IMAGE` repository digests in the private release env after validating the chosen images. Defaults are `postgres:17-alpine` and `caddy:2-alpine`; the deployment script only pulls them when missing and does not silently update the database/proxy image on each app deployment. Review upgrades separately. Do not change `POSTGRES_PASSWORD` for an existing volume without an explicit database password rotation; the official image does not rotate existing passwords from that variable.
6. Run `AURA_ENV_FILE=/opt/aura/.env.production.local scripts/deploy-check.sh`. It validates required settings without printing values. Missing SMS is reported as an unresolved feature dependency: duplicate inquiries still require real OTP and must not be described as working until the provider is configured.

The Docker context excludes env files, local uploads, dumps, archives and secret key extensions, and uses an explicit source-copy allowlist. The web service uses `INTERNAL_API_URL=http://api:4000/api` for server rendering while browser API/media links keep the public HTTPS URL. API/web use a non-root Node runtime; admin is a static nginx image. No source code or secret bundle is mounted into the running application services.

## First launch and subsequent release

Run `scripts/deploy-release.sh` on the server, with `AURA_ENV_FILE` set if not using the root default. The script validates config, checks application images already exist locally, starts private PostgreSQL, takes a database backup, runs Prisma migrations, and starts services with health checks. It never runs `db:seed`. A failed migration stops deployment; do not assume a partially applied migration can be reversed automatically. Docker health state diagnoses a failure but does not itself restart an unhealthy running process; monitor and investigate it.

On first launch, use `scripts/deploy-release.sh --prepare-only` to stop after migrations without starting the API. Then import the approved public-content snapshot into the freshly migrated, empty database **before creating the owner**. The inventory-only import is maintained in `scripts/public-content.mjs`; use its explicit dry run and empty-database guards. The operations image contains that script and the static image assets. Mount the snapshot and an access-restricted env file read-only, giving its database URL the internal host `postgres`. A root-owned mode-0600 env mount is not readable by the operations image's default `node` user: run this one-off import with `--user 0:0` and read-only mounts, or arrange ownership explicitly. Run the normal deployment command after importing. Imported uploads require verified matching R2 objects; do not fall back to development filesystem uploads.

Owner initialization runs the compiled entry point in the API container:

```sh
# Read-only eligibility check.
docker compose --env-file .env.production.local -f infra/compose.production.yaml exec -T api node apps/api/dist/bootstrap.js --dry-run
# After the owner explicitly confirms invitation recipient/name, pass OWNER_EMAIL
# and OWNER_NAME through environment (-e NAME), not as secret text in shell history.
docker compose --env-file .env.production.local -f infra/compose.production.yaml exec -T -e OWNER_EMAIL -e OWNER_NAME api node apps/api/dist/bootstrap.js
```

The owner sets their own password through the single-use invitation. Never migrate demo accounts, password hashes, sessions, leads or test sales.

The API has one persistent background worker and must not scale to zero. All services restart unless stopped, have log rotation, and bounded memory. PostgreSQL data and Caddy certificates have named persistent volumes. Do not run `docker compose down --volumes` on this host.

## DNS, certificates and Cloudflare

- Point the apex, `www`, `admin` and `api` records to this host. Preserve all Resend/other email records. Start with DNS-only while Caddy obtains certificates over port 80 or 443; no Cloudflare API token is needed for this HTTP/TLS challenge route. Caddy obtains and renews origin certificates automatically. Do not bypass certificate failures.
- Validate origin HTTPS, then use Cloudflare **Full (strict)**. Proxying can then be enabled. Do not use Flexible. Keep API/admin and dynamic HTML out of Cloudflare cache rules; static hashed assets can be cached. The API and admin send `no-store`, and nginx also denies indexing. `www` redirects permanently to the apex.
- Caddy trusts forwarding headers only from the current official Cloudflare IP ranges, checked on 2026-10-08. For direct connections it uses the TCP peer address. It replaces `X-Forwarded-For` with one resolved client address, strips `CF-Connecting-IP` before the API, and the API trusts **only** Caddy's fixed Docker address `172.30.80.2`. Keep this in sync with `TRUST_PROXY`; never trust all proxies. Web is fixed at `172.30.80.3` for the API's narrowly scoped internal public-content read allowance, API at `.4`, and admin at `.5`, preventing dynamic allocation from claiming the proxy/reader addresses. Recheck Cloudflare ranges during maintenance. Do not enable Cloudflare Pseudo IPv4 overwrite mode or Workers that rewrite visitor identity without testing rate limits.
- The `172.30.80.0/24` and `172.30.81.0/24` subnets must not overlap other server/VPC networks. The database network is internal; only API/operations join it. If changed, update both the Caddy address and API proxy trust.
- Reverse-proxy access logs are disabled so invitation query tokens do not enter them. API logging must separately redact sensitive headers/query strings; proxy logging configuration alone is not sufficient.

After DNS and TLS are ready, run `scripts/deploy-smoke.sh`. Then verify real navigation, all four languages, project polygons/media, content editing, sign-in/out, the authorized owner invitation, inquiry persistence/routing and SMS. HTTP health only proves the process can query PostgreSQL; it does not prove reminders, providers or all business flows work. Configure external uptime checks for the homepage and API health and alert on disk, memory, failed jobs and backup age.

## Backup and recovery

`scripts/backup-db.sh /var/backups/aura` creates a mode-0600 PostgreSQL custom-format dump and checks its archive structure. `scripts/backup-offsite-run.sh` then runs the existing operations image to encrypt the dump with AES-256-GCM, upload only ciphertext to the private Aura R2 bucket under `backups/daily/`, and verify the complete stored bytes with a GET/checksum comparison. Sunday runs also retain a `backups/weekly/` copy. The backup encryption key is read from an explicitly selected private env file; it is never added to API/web/admin service environments. Preserve an independent recovery copy of that key away from the Droplet.

The initial encrypted backups share Aura's existing private R2 bucket under an isolated prefix. This provides off-host recovery from server loss; a dedicated backup bucket/account with separate credentials is a future isolation improvement. Do not create Media records or public access rules for backup objects. No plaintext backup is uploaded, and media files keep their existing paths. Marketing media and Caddy certificates need their own recovery plan.

Daily service/timer templates are provided as `scripts/backup-offsite.service` and `scripts/backup-offsite.timer`; they must be installed and verified on the server. The retention target is at least **14 daily / 4 weekly** recovery points. Initial scripts intentionally delete no local or remote objects, so extra copies accumulate until a reviewed cleanup policy is enabled. Monitor storage growth and configure external alerts for failed backups and backup age.

Setup, key custody, timer installation, encrypted recovery and test evidence are documented in [production backups](../tasks/implementation/production-backups.md). The implementation does not itself prove the timer is installed or that a real backup has been uploaded; record those deployment results separately.

For a restore rehearsal, recover an encrypted object using `backup-offsite.mjs download`, then run `scripts/backup-restore-check.sh /path/to/recovered.dump`. It creates a unique disposable database, restores with errors treated as failures, counts restored public tables, and drops only that temporary database. It never writes to `aura`. Reconcile expected project/unit/team counts and business invariants, and separately verify media restoration. A successful object upload alone does not establish recoverability.

For app rollback, set `RELEASE_TAG` to the retained previous immutable SHA and start API/web/admin with `--no-build --pull never`. Do **not** rerun deployment migrations as a rollback or restore a dump automatically. Determine schema compatibility and potential loss of post-backup data before choosing an incident-specific database restore.

## References

- [Caddy trusted proxies and client IP headers](https://caddyserver.com/docs/caddyfile/options#trusted-proxies)
- [Caddy reverse proxy header behavior](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#headers)
- [Cloudflare IPv4](https://www.cloudflare.com/ips-v4/) and [IPv6](https://www.cloudflare.com/ips-v6/) ranges
- [Docker Compose environment settings](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/)
