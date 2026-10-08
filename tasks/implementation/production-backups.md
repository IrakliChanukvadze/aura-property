# Production backups — encrypted off-host copies

## Scope and current state

This slice adds `scripts/backup-offsite.mjs`, a Docker operations wrapper, synthetic tests, and systemd service/timer templates. It uses the existing **private Aura R2 media bucket**, exclusively under `backups/daily/` and `backups/weekly/`. The application has no public-media record for these objects. The database archive is additionally encrypted before any upload; bucket access alone cannot decrypt it.

No real backup has been uploaded and no server timer installed by this implementation. The orchestrator has generated the encryption key in the ignored, mode-0600 local server env; its value is never included here. The deployment orchestrator must validate a synthetic R2 roundtrip, preserve the recovery key, install the timer, and verify a real backup/restore rehearsal before marking the setup operational.

## Encryption and secret handling

`BACKUP_ENCRYPTION_KEY` must be exactly 32 cryptographically random bytes encoded as canonical base64. Generate it once explicitly during deployment and save the same value in both the server's private env and the owner's local private recovery copy. Do not generate a new value automatically each run. Both copies must be mode 0600 and excluded from Git; do not print the key, send it in chat, or include it in shell command arguments. Keep another recoverable copy under the owner's control away from the Droplet. Losing every copy makes the encrypted archives unrecoverable. Preserve old keys if rotation is introduced later.

The CLI reads the explicit env file with Node `parseEnv`; it never executes the file as shell code. Required values are `BACKUP_ENCRYPTION_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET`. It does not inherit provider credentials from the calling shell. The full production env is mounted read-only into a short-lived operations container; the encryption key is not added to API/web/admin service environments.

AES-256-GCM uses a fresh random 96-bit IV for each encrypted archive and a 128-bit authentication tag. A versioned header and IV are authenticated as additional data. Ciphertext is streamed to a private temporary file; only that encrypted file is uploaded. PUT is followed by a GET and full SHA-256 comparison of encrypted bytes. Restoration verifies GCM authentication before publishing a mode 0600 plaintext output, refuses overwriting existing files, and removes incomplete plaintext on failure. Neither upload nor download executes a database restore.

The source archive must be a mode 0600 regular file with PostgreSQL's `PGDMP` custom-format signature. The normal wrapper obtains it from `backup-db.sh`, which validates the dump structure. Original local backups are preserved. Temporary encrypted files are removed after the operation, including on failure; an already uploaded object is preserved if a subsequent verification fails. Provider errors are reported without credential/response-body details.

## Daily schedule and retention

The timer runs daily at 00:30 UTC (04:30 in Georgia), with up to five minutes of jitter. `Persistent=true` catches a missed timer after the host returns. Every successful run writes a uniquely named daily object; Sunday runs also write a weekly object under that week's Monday date. Retries cannot overwrite older recovery points.

The retention target is **at least 14 daily and 4 weekly recovery points**. This initial implementation performs **no local or remote deletion**. It preserves extra copies until a separately reviewed pruning policy is enabled after successful recovery rehearsals. Check storage growth; without that pruning step, retention is unbounded. No bucket-wide lifecycle rule should touch marketing media. If automated expiration is subsequently approved, scope it only to `backups/daily/` and `backups/weekly/` and preserve the target recovery counts even after missed runs.

## Installation on the dedicated Aura server

Prerequisites: approved release images loaded; production Compose/database running; the backup key safely copied; successful synthetic upload/download; `AURA_ENV_FILE` and PostgreSQL password configured; matching deployment scripts under `/opt/aura`. Docker/Compose, Bash and Python 3 are sufficient on the host—the wrapper runs Node and the AWS SDK inside the existing operations image.

```sh
sudo install -d -m0700 /var/backups/aura
sudo install -m0644 scripts/backup-offsite.service /etc/systemd/system/aura-backup-offsite.service
sudo install -m0644 scripts/backup-offsite.timer /etc/systemd/system/aura-backup-offsite.timer
sudo systemctl daemon-reload
# First manual service run creates and uploads a REAL database backup.
# Run after the authorized production setup is ready.
sudo systemctl start aura-backup-offsite.service
sudo systemctl status aura-backup-offsite.service --no-pager
sudo systemctl enable --now aura-backup-offsite.timer
sudo systemctl list-timers aura-backup-offsite.timer --no-pager
```

The templates assume `/opt/aura/.env.production.local`, `/opt/aura/scripts`, and `/var/backups/aura`. Adjust those paths in the template if the actual server layout differs. Do not paste credentials into a unit file. A failure appears as a failed systemd service and exit status; external alerts on failed backup/backup age still need to be configured. The timer alone does not send email alerts.

The service uses the `migrate` image with read-only mounts for the backup script, source dump and env. The backup key is available only during that one-off upload. Root is used because the deployment env is root-owned and mode 0600. No host Node installation or extra publicly exposed service is required.

## Manual encrypted recovery

With Node 24 and repository dependencies available on a trusted recovery machine:

```sh
mkdir -m0700 /secure/aura-recovery
node scripts/backup-offsite.mjs download \
  --env /secure/aura-recovery.env \
  --object backups/daily/YYYY-MM-DD/EXACT-OBJECT-NAME.aura.enc \
  --out /secure/aura-recovery/restored.dump \
  --work-dir /secure/aura-recovery/work
```

Use an actual object key recorded by a successful upload; the CLI accepts only the backup prefixes. The env must contain the original recovery key and valid R2 access. A wrong key, corrupted ciphertext or truncated download produces no completed plaintext output. Run the existing `backup-restore-check.sh` against the recovered archive to restore into a **fresh disposable database** and verify expected content/business counts. A production database replacement requires a separate incident decision because it can discard data received after the backup.

If only Docker is available, run the same CLI in the retained `migrate` image with the script/env mounted read-only and a private recovery output directory mounted read-write. Use `--user 0:0` for a root-owned mode 0600 env. Keep that plaintext recovery directory off public paths.

## Verification evidence

`node --test scripts/backup-offsite.test.mjs` passes 7 synthetic tests covering required key shape, AES-GCM roundtrip/fresh IVs/private permissions, wrong keys/tampering/truncation, overwrite refusal, encrypted-only mocked uploads, read-back checksum verification, download authentication, source preservation, no remote deletion, PGDMP signature refusal, and daily/weekly object naming. Tests perform no network requests and upload no real data.

Remaining operational evidence: synthetic R2 roundtrip through the configured bucket, actual timer installation, first real encrypted backup, recovery using the separately saved key, disposable PostgreSQL restore, external failure/age alerting, and reviewed retention cleanup.
