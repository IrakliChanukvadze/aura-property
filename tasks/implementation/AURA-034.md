# AURA-034 — Durable internal communication-event foundation

## Request and dependency

The owner authorizes continued post-MVP CRM implementation with planners, coders and independent feature/UI review. After AURA-033's guided integration catalog, establish reliable provider-neutral ingestion infrastructure before a real messaging channel. Commercial branding/company isolation are deferred. AURA-033 does not claim real connected channels; neither does this ticket.

## Bounded outcome

A durable incoming-event ledger and internal processing interface can accept normalized events from a future authenticated provider adapter, deduplicate stable external identifiers, claim work safely, recover from worker interruption and record bounded retry/failure outcomes. No public unsigned webhook, inbox with fabricated messages, automatic lead creation, outgoing reply, AI request or paid provider connection is included.

## Data/interface recommendations

- Identify an event by provider + account identifier + external event identifier with a database uniqueness constraint. Provider identifiers are validated, stable and bounded; do not allow callers to bypass deduplication with ambiguous normalization.
- Store received time, allowlisted event type/metadata, state, attempts, next attempt time, processing lease/token and a safe failure code. Do not store credentials, arbitrary raw headers/bodies or customer text in general audit logs. If a future message body is needed, define its scoped storage and retention in that channel's ticket.
- Internal receipt records once, returning the existing record for an exact redelivery. A conflicting payload with the same event key must never overwrite the original or silently create a second event; handle conflict deterministically.
- Claim due events with database coordination. An expiring lease and unique claim token prevent an old worker from acknowledging or failing a newly reclaimed attempt.
- Record completion atomically with processing side effects where applicable. For this foundational slice handlers must remain internal and side-effect-free with respect to customer leads/messages; do not claim generic exactly-once external delivery.
- Transient failures schedule bounded backoff. Exhausted/permanent/unsupported events reach explicit inspectable terminal states. No tight retry loop or unbounded processing batch.
- Keep this separate from existing reminder/reservation/leave jobs so event failures cannot prevent established CRM notifications. Reuse PostgreSQL infrastructure; an external paid broker is unnecessary for the first slice.

Names, schema details and exact helper contract may be reconciled with the backend implementation. Record the implemented contract below rather than presenting proposed names as existing API behavior.

## Acceptance

1. Two concurrent deliveries with one stable provider/account/event key create exactly one durable event. A subsequent receipt preserves the original normalized content and outcome.
2. Concurrent processors cannot claim the same unexpired event lease. After a crash/expired lease, a new claim can recover it; stale acknowledgements cannot finish or overwrite that new attempt.
3. Retry delays and exhaustion are bounded and deterministic. Unsupported/invalid events fail safely without creating a lead, sending a message or invoking AI.
4. Any completion side effects implemented in this slice are transactionally idempotent. Tests explicitly identify what is and is not guaranteed.
5. Event validation rejects oversized/malformed identifiers and unallowlisted metadata; operational errors and logs do not leak tokens/customer data.
6. No public ingestion route accepts unverified events. The existing API and reminder job behavior remain functional. If an operational API/view is added, it is SuperAdmin-only and shows safe aggregates/metadata; ordinary staff cannot inspect unassigned event content.
7. A versioned additive migration applies to a disposable database; relevant isolated regression tests, typechecks/build and independent static review pass. Tests do not use production data/providers or share a mutable audit database concurrently.
8. No live channel is claimed, no keys changed and no external call performed during this ticket. Production release is a separate orchestrator decision following review.

## Future channel gate

Owner selection of the first channel; provider account/business verification; required scopes and webhook authenticity material; explicitly authorized test sender/recipient; conversation/customer matching and unassigned access policy; retention rules; delivery/reply permissions. WhatsApp is a proposed direction, not an approved live connection. Automatic AI lead creation and replies are not introduced by this internal ledger.

## Ownership and evidence

Backend specialist owns additive schema/migration, internal helper/worker contract and isolated tests. Planner owns this brief and independent static review. Root coordinates integration, verification, commit and any release. No UI is required unless a safe, useful operational screen is deliberately included; in that case independent UI review and mobile/keyboard/RTL checks apply.

- Planning completed on 2026-10-08.
- Independent static review inspected communication-events.ts, its six regression tests, additive Prisma model and SQL migration. No material blocker found: composite uniqueness preserves first receipt, SKIP LOCKED coordinates claims, unique lease tokens reject stale processing, database handler effects and terminal update share a transaction, failure rolls effects back and records safe fixed codes, final crashed attempts become FAILED, diagnostics select only safe fields. Tests address concurrent duplicates/claims/processing, expired-lease recovery, rollback/backoff/exhaustion, poison payload and role/redaction boundaries.
- Server route wiring and removal of temporary explicit route registration in the test remain root integration steps. This review did not execute tests or contact providers. There is no scheduled processing worker or live adapter in this slice; diagnostics explicitly report enabled:false and workerEnabled:false. Exactly-once external effects are not promised, and future callbacks must obey the supplied transaction/no-network contract.
- Root will record executed verification, exact final implementation, revision and deployment status.


### Implemented and verified

CommunicationEvent has a strict normalized payload (16KB UTF8 maximum), provider/account/external-event unique key and processing lease/token. First receipt is authoritative; duplicate content never overwrites it. Claims use PostgreSQL FOR UPDATE SKIP LOCKED. DB-only callback effects and completion are atomic; failed callbacks roll back, safe error codes and bounded backoff persist. At most5 attempts; expired final leases and poisoned payloads become terminal. No scheduler/provider adapter is enabled.

Root wired SuperAdmin-only GET /api/communication-events, and removed duplicate manual registration from its test. Diagnostics select only safe metadata; account/external/customer identifiers and text are excluded. No public intake route exists. Six new tests cover concurrency, transactional once-only effects, lease recovery/stale tokens, rollback/retries/exhaustion, poison data and role/redaction boundaries. Final complete suite102/102 passed against isolated local aura_endpoint_audit; all workspace typechecks and API build passed. Independent feature/security review found no material blockers. Versioned additive migration applied only to audit database; no production or local business data modified. Not deployed; no live messaging connection or processing worker claimed.
