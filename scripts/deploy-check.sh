#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/deploy-common.sh"
# Config remains inside the pipeline; secret values are never written to the terminal.
"${compose[@]}" --profile operations config --format json | python3 -c '
import json, re, sys
c = json.load(sys.stdin)
s = c["services"]
e = s["api"]["environment"]
errors = []
password = s["postgres"]["environment"]["POSTGRES_PASSWORD"]
if not re.fullmatch(r"[A-Za-z0-9_-]{32,}", password):
    errors.append("POSTGRES_PASSWORD must be at least 32 URL-safe random characters")
if e.get("DEV_INTEGRATIONS") != "false" or e.get("NODE_ENV") != "production":
    errors.append("Development integrations must be disabled")
if e.get("TRUST_PROXY") != "172.30.80.2":
    errors.append("API proxy trust must match Caddy only")
if e.get("INTERNAL_CONTENT_READER") != "172.30.80.3":
    errors.append("Internal public-content reader must match the web container only")
for name, address in (("caddy", "172.30.80.2"), ("web", "172.30.80.3"), ("api", "172.30.80.4"), ("admin", "172.30.80.5")):
    if s[name]["networks"]["edge"].get("ipv4_address") != address:
        errors.append(name + " must keep its designated edge-network address")
for name in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"):
    if not e.get(name): errors.append(name + " is required")
if not (e.get("EMAIL_WEBHOOK_URL") or (e.get("RESEND_API_KEY") and e.get("EMAIL_FROM"))):
    errors.append("Configure email delivery")
if not (e.get("OPENROUTER_API_KEY") or e.get("OPENAI_API_KEY") or e.get("TRANSLATION_WEBHOOK_URL")):
    errors.append("Configure translation delivery")
for name in ("api", "web", "admin", "migrate"):
    tag = s[name]["image"].rsplit(":", 1)[-1]
    if not re.fullmatch(r"[0-9a-f]{40}", tag): errors.append(name + " must use the full commit SHA image tag")
for name in ("postgres", "api", "web", "admin"):
    if s[name].get("ports"): errors.append(name + " must not publish host ports")
if errors:
    print("Production configuration errors:\n- " + "\n- ".join(errors), file=sys.stderr)
    raise SystemExit(1)
print("Production configuration checks passed; no secret values printed.")
if not e.get("SMS_WEBHOOK_URL"):
    print("OPEN ITEM: SMS delivery is unconfigured; duplicate inquiry OTP cannot complete.")
'
