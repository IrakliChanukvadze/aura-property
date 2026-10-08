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


## DNS preparation — awaiting owner confirmation
Following the owner’s request to use the open Domenebi session, created Aura’s Cloudflare Free zone and staged Resend’s DKIM TXT plus both CNAMEs (`rsend`, `send`). All four records, including imported apex A `217.147.225.186`, are DNS-only while the website remains parked. Cloudflare’s robots preference injection was disabled in onboarding so Aura’s application retains its SEO rules. No paid plan selected.

Cloudflare assigned `elisa.ns.cloudflare.com` and `jakub.ns.cloudflare.com`. These are filled into Domenebi’s custom nameserver form but **Save has not been clicked**. The original parking delegation remains active. Browser confirmation is pending because saving delegates authoritative DNS and activates email sender authorization. No DNSSEC setting changed; registrar shows DNSSEC unavailable under the current parking setup. No MX, root TXT or DMARC records were returned by public DNS checks; receiving email remains a separate mailbox setup.

Evidence: `/tmp/aura-cloudflare-dns-prepared.png`, `/tmp/aura-nameservers-ready.png`. Remaining steps: owner confirmation; save nameservers; verify authoritative DNS propagation and Resend status; owner supplies compatible Resend key in private env; separately authorize a real-recipient delivery test.


## Owner-saved nameservers — 2026-10-08
The owner saved the two Cloudflare nameservers in Domenebi. The registrar shows custom nameservers `elisa.ns.cloudflare.com` and `jakub.ns.cloudflare.com` with no pending Save controls. Requested Cloudflare's activation check and Resend's DNS verification. Cloudflare reports waiting for registrar propagation; Resend reports Pending / Looking for DNS records. Both recursive DNS and a direct query to a `.ge` registry nameserver still returned the old parking delegation at this check. Direct queries to `elisa.ns.cloudflare.com` returned the exact DKIM TXT and both expected CNAMEs, plus the preserved parking A record. No DNSSEC change was made.

The owner explicitly authorized one test email to the address supplied in chat. The test is not sent: sender verification is pending and `RESEND_API_KEY` remains empty in `.env.production.local`. Opened the empty key at line 56 in VS Code for private entry. Do not copy the test recipient into repository docs or logs, do not send to any inferred account address, and do not send through Pini's sender instead. Only send the approved test once both prerequisites are ready.

Evidence: `/tmp/aura-cloudflare-awaiting-registry.png`, `/tmp/aura-resend-verification-running.png`. This status supersedes the earlier pending-owner-confirmation status; registry propagation is now the DNS blocker. No production website has been deployed and no live email delivery is claimed.


## Live email verification completed - 2026-10-08
The owner filled the shared Resend key in private `.env.production.local`. The file remains Git-ignored and mode 600; its value was not printed. The Resend domain API returned HTTP 200 with the correct Aura domain and verified status. The dashboard shows DKIM and both email CNAME records Verified. The .ge registry and public DNS now return elisa.ns.cloudflare.com / jakub.ns.cloudflare.com; Cloudflare overview confirms activation. Website deployment, origin TLS and production runtime wiring remain separate work.

Sent one synthetic bilingual test to the initially authorized address through the built sendEmail adapter using the Aura sender. Resend accepted it, then reported Recipient not found. Did not retry that invalid recipient or alter suppression settings. The owner explicitly supplied a corrected address in chat. Sent one test to that corrected address with the same adapter and sender. Resend API and dashboard both report Delivered. This confirms provider delivery, not inbox placement or opening. No customer data, invitations or password-reset tokens were sent.

Private result artifacts: /tmp/aura-resend-test-result.json and /tmp/aura-resend-test-corrected-result.json. Browser evidence: /tmp/aura-resend-test-delivered.png. Recipient addresses and keys are omitted from repository notes. The local API still uses .env; this one-off check does not switch it to production secrets. The email provider setup and approved delivery test are complete.
