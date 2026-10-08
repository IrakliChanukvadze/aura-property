#!/usr/bin/env bash
# Run on the Aura server after loading the immutable release images.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--prepare-only" ]; }; then
  echo "Usage: deploy-release.sh [--prepare-only]" >&2
  exit 1
fi
"$AURA_REPO_ROOT/scripts/deploy-check.sh"
# No image builds and no automatic application tag pulls on the production host.
while IFS= read -r image; do
  case "$image" in *-api:*|*-web:*|*-admin:*|*-migrate:*) docker image inspect "$image" >/dev/null;; esac
done < <("${compose[@]}" --profile operations config --images)
"${compose[@]}" pull --policy missing postgres caddy
"${compose[@]}" up -d --no-build --wait --wait-timeout 120 postgres
"$AURA_REPO_ROOT/scripts/backup-db.sh" "${AURA_BACKUP_DIR:-/var/backups/aura}"
"${compose[@]}" --profile operations run --rm --no-deps migrate
if [ "${1:-}" = "--prepare-only" ]; then
  echo "Database prepared. Import approved public content before starting the API/owner initialization. No web service has been started."
  exit 0
fi
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180 api web admin caddy
"${compose[@]}" ps
echo "Containers passed health checks. Verify content, HTTPS, client IPs, jobs and provider delivery before announcing launch."
