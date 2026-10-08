# AURA-033 — Guided integrations workspace

## Request and agreed boundary

The owner authorizes overnight orchestration of planners, coders, feature reviewers and UI/UX reviewers to develop Aura's CRM beyond MVP. Start with an easy-to-use Integrations workspace, setup/usage annotations, honest connection status and troubleshooting. Company isolation, commercial branding and subscriptions are explicitly deferred. See docs/product/crm-roadmap.md for roadmap and official competitor references.

## Planned slice

Expose existing transactional email, translation, media storage, SMS and exchange-rate configuration to SuperAdmin through a read-only environment-backed service catalog, prerequisite/setup guides and configuration-only checks. Future messaging/calling channels appear only as Planned, without fabricated functionality. Preserve environment-based production configuration. There are no editable secret settings, credential storage, PATCH or disconnect actions in this release. Server-managed values receive clear instructions rather than a false working editor. Encrypted credential management and genuine provider checks are separate subsequent tickets.

## Agreed API contract

GET /api/integrations returns safe provider metadata, setup instructions, configuration state and credential-presence flags. POST /api/integrations/:provider/check checks local configuration only, without provider HTTP requests or message/AI side effects. The response/UI explicitly labels the scope configuration-only; presence never implies valid credentials, connectivity, delivery or funds. Unsupported providers are rejected; no mock Connected result.

## Roles and ownership

Root integrates and owns final evidence/commit/release decisions. Product planner owns roadmap and this brief. Backend specialist owns integration routes/adapter checks and isolated regression tests. UI specialist owns navigation, cards, focused setup flow and localized copy. Independent reviewer checks feature behavior, permission enforcement, leakage, provider checks and UX evidence. Coordinate shared files and dependent work sequentially.

## Primary usability criterion

The owner clarified that ease of use and independent first-time customer activation/use are the primary product goal. Review the guide from successful task completion: what the feature does, what is required, where to get it, how to activate, what the result means, what to do if it fails and how to use the capability afterward. AURA-033 is explicitly operator-managed: it explains server configuration but does not complete customer self-service. That limitation must be clear in the UI. Protected credential/OAuth setup and genuine checks are the next integration-management release gate, not a hidden customer dependency.

## Acceptance scenarios

1. SuperAdmin can navigate to Integrations; every other role lacks navigation/page access and direct API access returns403. Unauthenticated requests return401.
2. Existing environment-configured services are displayed as configured, not inferred verified. Missing/partial configuration has clear instructions. Development/no-delivery adapters never show real-provider Verified.
3. Check configuration tests required local server values only and states this limit in its result. It makes no external request, sends no mail/SMS and incurs no paid AI completion. Missing infrastructure is actionable and never shows Verified.
4. Secrets, ciphertext, tokens, private configured URLs and private provider account values never appear in responses, UI, audit logs or committed fixtures. No client-selected network destination is accepted.
5. Planned WhatsApp/Gmail/Meta/Telegram/calling guides state what is pending and have no misleading live Connect control.
6. Guide flow is concise and usable with keyboard, narrow screens and Hebrew RTL; loading, empty/error/success states are clear; focus is retained/returned appropriately.
7. Ordinary CRM intake, staff invitations, translation, media upload and existing role visibility retain behavior. No Pini settings or production credentials are changed by development tests.
8. Relevant isolated API tests, workspace typechecks/builds and independent feature/UI review pass. Record actual browser dimensions and tested states; do not claim unperformed tests.

## Non-goals

No paid account creation, provider purchases, inferred business verification/consent, live external message sends, public registration, new commission formulas, new staff visibility, full inbox integration, phone-number hiding before calling exists, multi-company support or commercial plans.

## Evidence and release state

- Planning completed on 2026-10-08 with official HubSpot, Pipedrive and Zoho references in the CRM roadmap.
- Independent backend static review of integrations.ts, integrations-api.test.ts and server wiring found no material authorization, redaction or external-side-effect issues: both routes authenticate then require SuperAdmin; identifiers/body are fixed and validated; response values contain configuration presence only; no outbound requests occur. Tests include ordinary-role denial despite contentEdit, credential redaction, adapter precedence, malformed configuration and no outbound request assertions. Local development-stub presentation needs actual browser evidence because isDevelopment is fixed when its module loads.
- Independent UI static review inspected Integrations.tsx/css/copy, App navigation/page mounting and permissions.tsx. SuperAdmin/active guard matches server scope; configured state remains explicitly unverified; planned channels lack fake Connect actions; no secret value editor exists. Requested usability fixes were applied: four-language prerequisites and concrete After setup usage instructions, readable scoped muted colors, friendly setting labels with technical names in a native disclosure, and a focusable busy check button guarded against repeated requests. No material static review finding remains. Actual browser task completion, narrow viewport, keyboard and Hebrew RTL evidence remains the orchestrator's responsibility.
- Execution results, commit and deployment evidence to be recorded by the orchestrator after actual checks. A push does not automatically deploy.


### Root verification

- Four focused integrations API regressions passed against isolated local aura_endpoint_audit, no provider credentials loaded. All workspace typechecks, admin production build and diff checks passed. Independent API and UI reviewer found no remaining material findings.
- Real browser1280x720: SuperAdmin navigation, five genuine configuration states, development no-delivery labels, email guide, check result, keyboard Enter and Escape/focus return. A busy-button focus issue found and fixed before completion. Technical keys moved to an optional disclosure; friendly field names and concrete After setup usage added in all four locales. Light/dark screenshots reviewed.
- Real browser390x844: Hebrew RTL guide fits viewport with no horizontal overflow; keyboard check preserves focus; Escape closes. Temporary viewport restored. Team lead login confirms Integrations sidebar absent. Direct API role denial covers team lead/agent/editor even with content grants.
- First full combined-suite run:101/102 passed; the audit correctly identified the upcoming unregistered communication diagnostics route while AURA-034 files were still in progress. Its wiring and final complete-suite check belong to AURA-034; no failing033 test was found.
- Screenshots: /tmp/aura033-integrations-light.png, /tmp/aura033-integrations-dark.png, /tmp/aura033-guide-he-mobile-checked.png. No secrets or real customer messages used.
- Implemented locally; no production deployment in this ticket. Operator-managed credentials and configuration-only checks are interim limitations, not commercial self-service readiness.
