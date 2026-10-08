#!/usr/bin/env bash
# Read-only release checks after DNS/TLS are ready. Does not create leads/emails.
set -euo pipefail
for path in /en /ka /ru /he /robots.txt /sitemap.xml; do
  curl --fail --silent --show-error --max-time 30 "https://auraproperty.ge$path" >/dev/null
  printf 'OK public %s\n' "$path"
done
curl --fail --silent --show-error --max-time 15 https://api.auraproperty.ge/api/health | python3 -c 'import json,sys; assert json.load(sys.stdin)["data"]["status"] == "ok"'
curl --fail --silent --show-error --max-time 15 https://admin.auraproperty.ge/ >/dev/null
headers="$(curl --silent --show-error --max-time 15 --head https://www.auraproperty.ge/en)"
printf '%s\n' "$headers" | grep -qi '^location: https://auraproperty.ge/en' || { echo "www canonical redirect failed" >&2; exit 1; }
echo "Basic HTTPS/public-route checks passed. This does not replace a real inquiry, login, upload, SMS and backup restore rehearsal."
