# AURA-029 — Pini-compatible transactional email

## Brief
On 2026-10-08 the owner requested inspecting Pini’s email setup and reusing it for Aura. Pini uses Resend, RESEND_API_KEY and a hardcoded notifications@pini.ge sender in server/lib/email.ts. That adapter accepts success only with a provider message ID, reports provider/network failures safely, and supports idempotency keys. Its lead delivery records/webhooks are Pini-specific and outside this slice.

## Plan
- Backend specialist owns adapters.ts, a direct email module if useful, email provider tests and test environment cleanup. Add direct POST https://api.resend.com/emails support using RESEND_API_KEY and explicit EMAIL_FROM, while retaining EMAIL_WEBHOOK_URL precedence and local development stub behavior. Never fall back to development on a configured provider failure.
- Use Aura branding/sender configuration, never copy Pini credentials, sender, lead routes or DB state. Protect invitation/recovery token bodies and keys from error logs. Bounded 10s calls, no automatic retries, require nonempty provider message ID and reject error/malformed response. Derive a stable Aura-namespaced idempotency key from the complete payload to prevent repeat acceptance without exposing raw tokens.
- Root updates env placeholders/deployment notes, opens Resend for owner sign-in and checks domain/key setup. No real recipient email will be sent without explicit authorization of recipient/purpose.
- Independent reviewer checks failure semantics, secrets, headers, provider precedence and test isolation.

## Acceptance
- Existing invitation/recovery/owner-initialization callers use Resend when configured without changing their public contracts.
- Safe success/failure behavior and development guard tested with no live sends. Existing isolated API suite and typecheck/build pass.
- Private production env remains ignored/mode 600 and existing R2/OpenRouter keys preserved.
- Sending requires verified Aura domain DNS and compatible key scope. Provider acceptance alone never described as delivered to inbox.

## Setup status
The owner signed into Pini’s Resend account. Existing `pini.ge` is verified. Added `auraproperty.ge` as a pending sending domain in Ireland (`eu-west-1`); Resend returned the required DNS records. Receiving stays disabled. Aura’s registrar still points to `parking1.domenebi.ge` / `parking2.domenebi.ge`; no nameserver or DNS changes were made. Proposed sender: Aura Property <notifications@auraproperty.ge>. The existing `pini-backend` key is listed as Full access and can cover Aura once its domain is verified; the secret is not yet configured for Aura. Production deployment and live email test not performed.

Pending DNS from Resend (apply only through the authoritative DNS provider, after approval of sender authorization):
- TXT `resend._domainkey`: copy the exact public DKIM value from the Resend domain setup.
- CNAME `rsend`: `rsend-euw1.forge.rmta.net` (DNS only).
- CNAME `send`: `send.forge.rmta.net` (DNS only).
- Resend additionally suggests optional TXT `_dmarc` = `v=DMARC1; p=none;`; inspect existing DMARC before adding, never overwrite stronger policy.

## Verification — 2026-10-08
- API suite: 74/74 pass against isolated `aura_endpoint_audit`; all external-provider credentials removed. Includes nine fetch-mocked email cases. No live recipient email sent.
- API typecheck and build: pass. `git diff --check`: pass.
- Independent read-only specialist review: no actionable findings across provider precedence, headers, secrets, failure semantics, timeout/idempotency, callers and test isolation.
- Private `.env.production.local` remains Git-ignored and mode 600. Added empty `RESEND_API_KEY` and explicit Aura sender without changing existing R2/OpenRouter credentials.
- Browser evidence: `/tmp/aura-resend-domain-pending.png`. Domain is configured in the provider but not DNS-verified. Local API still uses local development configuration; live delivery is not claimed.
