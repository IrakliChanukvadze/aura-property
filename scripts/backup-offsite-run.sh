#!/usr/bin/env bash
# Host wrapper: use the existing operations image, so no Node installation is needed.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
archive="$("$AURA_REPO_ROOT/scripts/backup-db.sh" "${AURA_BACKUP_DIR:-/var/backups/aura}")"
# Only the encrypted upload process receives the backup key. API/web do not.
"${compose[@]}" --profile operations run --rm --no-deps --user 0:0 \
  --volume "$AURA_REPO_ROOT/scripts/backup-offsite.mjs:/app/scripts/backup-offsite.mjs:ro" \
  --volume "$AURA_ENV_FILE:/run/aura-backup.env:ro" \
  --volume "$archive:/run/aura-backup.dump:ro" \
  migrate node /app/scripts/backup-offsite.mjs upload \
  --env /run/aura-backup.env --archive /run/aura-backup.dump \
  --work-dir /tmp/aura-offsite-backup
