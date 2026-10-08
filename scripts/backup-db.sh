#!/usr/bin/env bash
# Produces a private, compressed PostgreSQL custom archive. Off-host encryption
# and retention are separate required operational steps (see infra/README.md).
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
umask 077
directory="${1:-/var/backups/aura}"
mkdir -p "$directory"
file="$directory/aura-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
trap 'rm -f "$file.partial"' EXIT
"${compose[@]}" exec -T postgres sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' > "$file.partial"
# Validate archive structure before presenting it as a successful backup.
"${compose[@]}" exec -T postgres pg_restore --list < "$file.partial" >/dev/null
mv "$file.partial" "$file"
printf '%s\n' "$file"
