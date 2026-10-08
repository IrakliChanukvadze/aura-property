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
