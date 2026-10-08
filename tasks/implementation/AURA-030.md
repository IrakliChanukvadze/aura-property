# AURA-030 — First production release

## Request and acceptance
The owner authorized pushing Aura to github.com/IrakliChanukvadze/aura-property and publishing on DigitalOcean. Prepare isolated Aura hosting, production images, migrations, content-only transfer, TLS/domain routing, owner initialization and smoke checks. Confirm an exact recurring hosting price before purchasing. Keep Pini unchanged. Analytics follows after launch.

Acceptance: no development credentials or CRM fixtures in production; only approved public content migrates; API and database remain on private container networks; trusted proxy handling preserves per-client abuse limits; secrets excluded from Git/images; backups and restore verified; exact deployed revision and live checks recorded. Do not claim deployment before live verification.

## Work plan
- Root: GitHub/release integration, trusted proxy handling, runtime and cloud setup.
- Infra specialist: production compose, reverse proxy, immutable build/release and backup scripts.
- Content specialist: guarded initial public content export/import and evidence.
- Independent preflight: tracked/history secret scan and production blockers; price-redaction regression fix.

## Current findings
GitHub repository is empty and public; authenticated CLI access works. DigitalOcean login renewed by owner. Cloudflare/Resend/R2/OpenRouter are configured in ignored private env. SMS is not configured; duplicate phone inquiries requiring OTP cannot complete yet. Existing demo accounts/leads must be excluded. Current catalog has incomplete optional prices/geometries and Hebrew fallback, which must not be misrepresented as completed translations.

## Evidence and decisions
- Initial history pushed successfully to origin/main at d24cd3b; remote repository was empty. Historical credential scan found no live keys; private production env remains ignored.
- Owner approved sending the production account invitation to the privately recorded corrected email and publishing with SMS deferred. New inquiries save; duplicate OTP remains mandatory, unavailable verification now has localized feedback.
- 81/81 API tests pass on isolated aura_endpoint_audit; all workspace typechecks pass. Three proxy tests cover per-client limits, spoof rejection and read-only internal SSR allowance. Hidden nested source prices are omitted from public catalog responses.
- Content snapshot: one project, four buildings, 27 floors, 382 units, three public profiles; zero users/customers/leads/posts/uploads. 34 static image hashes verified. Migration specialist rehearsed actual empty PostgreSQL import, atomic rollback and repeat refusal; root reran eight non-DB checks (DB case skipped without disposable URL).
- Infrastructure review verified Caddy forwarding against untrusted and simulated Cloudflare peers and rehearsed real PostgreSQL backup/restore in a disposable database.
- R2 live synthetic check: encrypted upload, stored ciphertext read-back and decrypted byte comparison passed. No customer data uploaded by this check.
- Native Linux release build moved to GitHub Actions after Mac amd64 emulation failed in esbuild Go runtime. First historical CI run hit test-database name guards; workflow now uses aura_endpoint_audit.
- DigitalOcean order prepared: Frankfurt Ubuntu24.04, regular2vCPU/4GB/80GB, weekly backups, $28.80/month before tax. SSH key registration and paid resource creation still await owner approval. No Aura server created or DNS cutover performed yet.
- Production release build and real HTTPS/application checks remain pending. Do not describe the site as deployed.


Owner subsequently chose the cheaper2vCPU/2GB/60GB regular Frankfurt server and confirmed $21.60/month including weekly backups plus existing laptop SSH key access. Purchase/deployment now authorized; not yet completed.


## Production outcome — supersedes pending statements above

Published on 2026-10-08. Application release `5f7b77002c3745934a74f2323edca7ef50e9e5ca` is running. The owner explicitly confirmed the cheaper server, weekly backups and existing laptop SSH key at action time. Separate Droplet `aura-production`, Frankfurt, Ubuntu24.04, 2 vCPU/2GB/60GB. Cost $18 + $3.60 weekly backups = $21.60/month before tax. Pini was not changed.

- GitHub main holds the full history. Verify workflow run `37763515269` and native amd64 release run `37763587231` succeeded. Release artifact checksum verified on the server; all four images have the same immutable release SHA. Builds run in CI, not on the 2GB host.
- All nine migrations applied. Empty-database backup and pre-application catalog backup saved. Imported one published project, four buildings, 27 floors, 382 apartments (188 available / 14 reserved / 180 sold), three public profiles and 34 verified static image files. No development staff, customers, leads, sales, credentials or demo posts imported.
- Website https://auraproperty.ge; admin https://admin.auraproperty.ge; API https://api.auraproperty.ge/api/health. All four DNS records (including www) point to Aura and are Cloudflare-proxied. Origin certificates obtained for all four hostnames; Cloudflare Full (strict); www redirects to apex. Existing email DNS records preserved.
- Container health checks pass. Public HTTPS smoke covers en/ka/ru/he, robots, sitemap, admin, API and www redirect. An actual synthetic inquiry through Cloudflare returned200, persisted as NEW with project context, and returned correct CORS. Duplicate returned503 SMS_UNAVAILABLE without a second lead or pending OTP. Only that exact synthetic fixture was removed after verification.
- Owner invitation delivered (provider delivery metadata verified). The owner chooses the password through the 48-hour invitation; no password was set or printed. Production roles/login have not been exercised with a user-selected password yet.
- DigitalOcean weekly backups are enabled, Wednesday04:00–08:00UTC; first scheduled snapshot is upcoming. Separate PostgreSQL backup timer runs daily00:30UTC (04:30Georgia) with at most five minutes jitter. First encrypted R2 upload was read back and verified; downloaded ciphertext was authenticated/decrypted, then pg_restore restored all24 public tables into a fresh disposable database, which was removed. Encryption key recovery copy remains in the private local launch env, never Git or API/web runtime.
- At verification, application containers used about245MiB combined; host used687MiB of1967MiB, had1280MiB available and used no swap. Disk12GB/58GB. These are idle observations, not load-test capacity guarantees.2GB swap, firewall, key-only SSH, private database networking and log rotation are enabled.

## Independent live review and proxy follow-up

Independent read-only review passed8public HTML routes,36sitemap URLs across four locales, canonical/hreflang, Hebrew RTL,34/34media URLs, six protected API reads returning401, and absence of private price/account fields. It found a Caddy common-header ordering issue overriding no-referrer on sensitive hosts. Proxy-only commit `c3eb5d3d2f2a6e8f19d6d425cf8e18dbd24b30cb` moved the general referrer policy to public hosts only and added exact security-header regression checks. Caddy config validated, proxy recreated with retained certificates, and live smoke confirmed no-referrer/no-store/noindex on admin/invitation and API. Application images remain5f7b770; server infra checkout isc3eb5d3.

## Remaining follow-ups and practical limits

- Owner must accept invitation, create teams and invite staff. New inquiries currently stay unassigned and are visible to the SuperAdmin until routing teams exist.
- SMS explicitly deferred by owner. First inquiries work; duplicate verification cannot finish. No OTP bypass was introduced.
- Production has no FxRate row/provider: USD display works; GEL conversion and transactions needing a recorded rate require a verified rate in Settings/provider setup. Do not import the demo rate.
- Existing catalog gaps preserved:97 available units lack price,14 available units lack polygon; Hebrew project text has an unreviewed English fallback. Team portraits are approved temporary illustrations. These are content follow-ups.
- Analytics/Search Console submission, external uptime/backup-failure alerts and mailbox receiving/DMARC review are not configured by this release. No claim of those being enabled.
- Backup retention currently keeps all copies; no automatic deletion.14daily/4weekly is the minimum retention target, not an implemented pruning policy. Daily backup target RPO is up to24hours; no PITR.
- The laptop/local network DNS resolver temporarily retained the old parking address while Cloudflare public DNS and server-side HTTPS succeeded. Certificate validation stayed enabled; no browser warning was bypassed. User was given macOS DNS flush instructions. Local browser verification must be repeated once that cache expires.
