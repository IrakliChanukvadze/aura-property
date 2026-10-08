#!/usr/bin/env bash
# Sourced by server operations only. Never source the secret dotenv file as shell.
set -euo pipefail
AURA_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AURA_ENV_FILE="${AURA_ENV_FILE:-$AURA_REPO_ROOT/.env.production.local}"
if [ ! -f "$AURA_ENV_FILE" ]; then
  echo "Set AURA_ENV_FILE to the private production env file." >&2
  exit 1
fi
# Refuse an env file readable by other users; do not silently chmod someone else's file.
python3 - "$AURA_ENV_FILE" <<'PYCHECK'
import os, stat, sys
mode = stat.S_IMODE(os.stat(sys.argv[1]).st_mode)
if mode & 0o077:
    raise SystemExit('Production env permissions must be 0600 (chmod 600 FILE).')
PYCHECK
compose=(docker compose --env-file "$AURA_ENV_FILE" -f "$AURA_REPO_ROOT/infra/compose.production.yaml")
"${compose[@]}" config --quiet
