# CRM product roadmap — Aura first

## Confirmed direction, 2026-10-08

The owner wants to develop Aura into a premium, practical CRM product, using the agency as its first operating customer. Build useful capabilities, guided setup and usage instructions now. Multi-company isolation, external product branding and subscriptions are explicitly deferred. This does not authorize onboarding another company before isolation exists. Routine technical and UI decisions may proceed; unresolved financial formulas, provider purchases and business access changes remain decisions rather than assumptions.

The owner explicitly authorizes orchestrated product/UX planning, coding and independent feature/security/UI review. Complete bounded tickets with evidence and separate commits. A GitHub push and a deployed release are distinct states.

## Primary usability acceptance

A first-time customer must understand how to activate a feature, complete its setup and use it in daily work without needing the product author to explain the steps. Measure successful task completion, not visual appearance alone. Every integration guide must explain prerequisites, activation/configuration steps, the honest meaning of its check result, the next corrective step and where/how the connected capability is used afterward.

AURA-033 is only the operator-managed foundation: it names server settings and explains how to obtain them, but does not let an independent customer connect services through the product. Do not claim self-service onboarding complete. The next integration-management ticket must introduce protected credential replacement/OAuth, provider-specific genuine checks, actionable failures and post-setup usage tips. This is a release gate before calling the CRM sellable. OAuth/service choices remain provider-specific rather than a generic one-key promise.

## Product principles

- Put the agent's next action beside the customer's conversation: reply, call, record outcome, schedule follow-up.
- Retain the existing role/team/acting-lead boundaries. Content editing is a per-user grant and does not grant credential administration.
- Automate repeated work without inventing customer identity, consent or completed actions. AI drafts are reviewable; a suggested note or lead is not automatically a verified sale.
- Explain setup in ordinary words at the point of use. Prefer provider authorization where available; keys are entered only in protected owner controls.
- Show genuine operational state. Configured credentials are not proof that an integration works. AURA-033 checks configuration presence only, without external requests. Planned channels cannot claim Connected.
- Preserve source attribution, delivery history and customer context. Retries must not create duplicate messages, leads or sales.

## Sequence and release gates

| Slice | Outcome | Gate before claiming complete |
| --- | --- | --- |
| AURA-033 Integrations workspace | SuperAdmin sees environment-backed service configuration and setup instructions; local configuration checks distinguish missing fields; future channels are clearly planned | Server permissions, secret-free responses, configuration-only checks, desktop/mobile/keyboard/RTL review |
| Protected self-service setup | Owner can safely connect supported accounts, complete checks and find daily usage guidance without server access | Encrypted credential/OAuth design, least privilege, genuine provider checks, first-time setup success/error tasks and secret/rotation review |
| AURA-034 Communication ingestion foundation | Durable incoming-event ledger, deterministic processing and bounded retries; no live provider or automatic lead/reply | Idempotent source identifiers, lease/retry recovery, no unsigned public ingestion or fake live channel |
| First real channel | One working receive/reply adapter plus provider-specific setup and troubleshooting | Owner selects channel/accounts; required approvals/credentials configured; real end-to-end test explicitly authorized |
| Inbox expansion | Add WhatsApp, Gmail, Facebook/Instagram and Telegram individually | Each provider's actual authorization/webhook requirements verified; no assumption that a single key connects everything |
| Calling | Dial inside CRM, record call outcomes and provider events; consider number masking only once calling is available | Provider choice, geographic availability, cost, recording policy and access agreed; no staff workflow breakage |
| AI assistant | Transcripts, proposed summaries, notes and reminders; later message-to-lead proposals | Appropriate provider/account, review flow, privacy/retention rules, cost controls and failure behavior verified |
| Sales intelligence | Response times, overdue follow-ups, conversion/source/project and loss reasons | Metrics have documented definitions; scope follows lead permissions; existing leaderboards retain agreed sold-count rankings |
| Finance and progression | Extend earnings to received revenue, commissions and payouts; later performance progression | Owner defines recognition/payment rules and progression formula; historical snapshots and corrective audit retained |
| Product commercialization | Branding, company isolation, onboarding and commercial plans | Separate agreed architecture and isolation verification before a second company is onboarded |

Exact channel order is not settled. Build the common contract now; do not buy provider accounts or pick a live channel on the owner's behalf. The illustrative two sales/month → 1.1% progression is not an agreed formula. Extra approval roles remain future decisions.

## Integrations UX

One SuperAdmin sidebar entry, Integrations. The landing screen has a short purpose statement, a compact Needs attention summary only when applicable, and service cards. Available now: transactional email, translation, media storage, SMS setup and exchange-rate configuration. Planned: inbox channels and calling. Existing server-managed configuration should say Managed on server when editing is not yet supported, rather than presenting a non-working key form.

Each card displays name, one-sentence purpose, honest state, last check when known, and one primary action: Review setup, Check configuration or Review issue. Open a focused detail panel with three small steps:

1. **Instructions:** required account, direct official setup links, which values to obtain, and what Aura uses the connection for.
2. **Configuration:** first-release checklist of required environment variable names and whether each is present; actual values never appear. Explain that deployment configuration is managed on the server. Later credential-editing work may introduce masked replacement fields and an explicit Save separate from Check.
3. **Check:** AURA-033 checks required server configuration only. Say explicitly that provider credentials, connectivity, billing and delivery are not validated. Show the missing-field result and next corrective action. No network call or external message is made. A later ticket may add separately scoped real provider checks.

Use a compact mobile stack, descriptive labels, native keyboard controls, visible focus, modal focus return, and Hebrew RTL. Avoid a long everything-on-one-form drawer. Announce success/failure accessibly and retain unsaved inputs on failed requests. Planned service guides may be read, but do not accept unusable credentials or display nonfunctional Connect buttons.

First-release states: Not configured, Incomplete configuration, Configured (not provider-verified), Managed on server, and Planned. Later real checks may add Verified with a checked time and exact check scope. A successful provider identity probe does not guarantee email delivery, billing funds, all bucket operations or future uptime. State that limit beside the result without technical clutter.

## AURA-034 recommended next slice

Implement a provider-neutral incoming-event ledger and worker contract before exposing an inbox. This is internal infrastructure, not a working WhatsApp connection. Reuse the existing PostgreSQL-based job approach where sensible; do not introduce an unnecessary paid queue service.

- Deduplicate by stable provider, account and external event identifier; insert/claim/process atomically so duplicate delivery and concurrent workers do not create duplicate business records.
- Preserve received time, processing state, attempt count, next attempt, bounded safe failure reason and normalized event type. Store only allowlisted metadata needed for processing; raw bodies, tokens and customer message text must not enter generic audit/error logs.
- Use an expiring processing lease so a crashed worker's events can be reclaimed. Retry transient errors with bounded backoff; terminal/unsupported events finish explicitly without infinite retry.
- Define an adapter boundary for provider authenticity verification and normalization. Until an actual adapter is implemented, expose no unsigned public webhook ingestion. Internal/test fixtures cannot masquerade as a live customer channel.
- Do not automatically create leads, send replies, run paid AI or change assignment. These need the real-channel processing policy and owner decisions. Unmatched future conversations must be restricted to SuperAdmin until deliberately assigned; linkage to a lead must enforce existing scopes.

Acceptance: simultaneous duplicate receipts yield one event; worker restart recovers an expired lease; malformed/unsupported payloads fail safely; retry exhaustion is inspectable; processing retry cannot duplicate side effects; no existing reminder jobs regress; customer/event payloads never leak through operational status. A simple SuperAdmin operational summary is optional if useful, but a fabricated inbox with demo messages is not.

Live-channel blockers remain external: owner selects the first channel; provider business/account verification, required scopes, webhook signing material and test recipient authorization must exist. WhatsApp is a proposal based on likely agency use, not a settled provider choice or claim of availability.

## Operational and permission requirements

SuperAdmin alone can access integration inventory/configuration/probes/activity. Team leads, acting leads, agents and editors cannot read credentials, provider account identifiers or connection management through direct requests. Public endpoints never expose integration details. Future inbox readers continue to use the existing lead/team scopes.

AURA-033 has no editable secret fields, PATCH or disconnect actions; credentials remain deployment-managed. If database credential storage is introduced later, encrypt before persistence with a dedicated server-only key; ciphertext and sensitive provider responses must not enter API results, logs, audit payloads or test snapshots. Document key rotation/recovery operationally. Existing deployment environment credentials must continue working. Do not silently replace production values or change shared Pini accounts. Missing infrastructure is shown as not configured. AURA-033 uses configuration-only checks. Later real read-only probes must be bounded and rate-limited; arbitrary client-provided destinations must not be allowed.

Record safe actor/time/action/provider events. Distinguish test history from customer-message delivery history. Do not report guessed spending: the shared OpenRouter $10/month cap covers Pini and Aura; actual account-level usage cannot be attributed wholly to Aura without separate tracking.

## Competitor research and application

Research checked on 2026-10-08 from official sources. These are borrowed interaction principles, not assertions that Aura implements their products.

- HubSpot centralizes connection state, attention items, activity, permission details and reconnect actions. Apply clear operational state and a next action in Aura; defer broad analytics panels until useful. [HubSpot: Manage your connected apps](https://knowledge.hubspot.com/integrations/manage-your-connected-apps)
- Pipedrive presents an integration's information, granted permissions and support details before installation. Apply concise purpose/requirements/permission explanations in the setup panel. [Pipedrive: Marketplace apps and integrations](https://support.pipedrive.com/en/article/pipedrive-marketplace-apps-integrations)
- Zoho Voice setup distinguishes administrator configuration and which users receive calling access. Apply the same separation between owner-controlled connection and scoped staff use when calling is built. [Zoho: CRM telephony integration](https://www.zoho.com/voice/help/zoho-crm-telephony-integration.html)

## Deferred choices

First channel; provider-specific costs and geographic support; AI recording/retention and external data transfer policies; financial recognition and payouts; configurable stage migration; additional administrative roles. Resolve a consequential choice before its implementation. Existing website SEO, lead intake, invitation/password rules and historical sales must remain functional throughout these releases.
