#!/usr/bin/env bash
# Restores into a fresh disposable database only. Never overwrites production.
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
archive="${1:?Usage: backup-restore-check.sh /path/to/aura.dump}"
[ -s "$archive" ] || { echo "Backup is missing or empty" >&2; exit 1; }
target="aura_restore_check_$(date -u +%Y%m%d%H%M%S)_$$"
cleanup() { "${compose[@]}" exec -T postgres dropdb -U aura --if-exists "$target" >/dev/null; }
"${compose[@]}" exec -T postgres createdb -U aura "$target"
trap cleanup EXIT
"${compose[@]}" exec -T postgres pg_restore -U aura -d "$target" --no-owner --no-privileges --exit-on-error < "$archive"
"${compose[@]}" exec -T postgres psql -U aura -d "$target" -v ON_ERROR_STOP=1 -c "SELECT count(*) AS public_tables_restored FROM information_schema.tables WHERE table_schema = 'public';"
echo "Backup restored successfully into $target; the disposable database will now be removed."
