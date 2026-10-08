# AURA-026 — Website content editing and production launch plan

## Brief
Prepare Aura for an incremental production launch at the owner-purchased auraproperty.ge. The owner requests a comparison and complete launch plan for DigitalOcean versus Railway, aiming near the existing Pini hosting budget of $18/month. Implement easier editing of website About, hero and related copy now; preserve the approved public design. AI translations remain reviewable drafts until explicitly saved.

## Plan and ownership
- Root: inspect existing code/configuration, verify current official provider information, write costed launch plan and release prerequisites, wire About image/metadata to CMS, integrate and independently review agents, verify browser behavior and commit this ticket.
- Site editor UI agent: SiteContent component and scoped CSS/localized labels; section navigation, retained drafts, section saves, contextual preview, translation review, responsive/RTL support.
- Site editor API agent: partial atomic site-content updates, optional About image, server-only OpenAI translation adapter/status, targeted tests and setup notes.
- Launch review agent: read-only independent release audit and recommendations. No production access or changes.

## Acceptance
1. About, hero, services and contact content have focused labeled editing sections; changing sections/languages retains drafts.
2. Saving one section/language preserves other content; empty fields reset a default; errors cannot appear as successful publication.
3. Translation credentials remain server-only. AI results can be reviewed/edited and explicitly applied before an explicit section save; missing provider is understandable.
4. About image and page metadata respect saved CMS content without changing the current default public visual.
5. Production plan covers cost, service topology, domain/DNS/TLS, required accounts/secrets, durable inventory/media, email/OTP/FX, migrations/owner setup, monitoring/backups/restore, staging/release/rollback and ongoing updates. Separate Pini boundaries preserved.
6. No hosting purchase, DNS change, live-provider charge, production data migration or deployment occurs in this preparation ticket.

## Evidence
Implemented and locally verified; not deployed.

- Replaced the long website form with four sections, localized editor labels, per-section/current-language saves, retained drafts across section/language changes, live text preview and links to the rendered pages. About image is editable; About metadata now uses CMS text. Contact page heading and privacy-page copy are correctly identified.
- Server deep-merges patches inside a locked transaction and audit write; empty strings remove overrides. OpenAI Responses integration is server-only, has safe failure responses, explicit timeouts and rate limiting; the existing webhook remains compatible. UI requires translation review and a separate Save action.
- Root independently inspected the UI/save/translation code. The launch-review agent independently reviewed the API merge, authorization and provider integration and found no actionable issue in this change.
- All 50 API tests passed (0 failures/skips) against the dedicated local `aura_endpoint_audit` database, including seven new merge/concurrency/authorization/provider/rate-limit cases. Real external provider credentials were cleared and provider calls mocked. Output: `/tmp/aura-026-api-tests.log`.
- API, admin and web type checks passed. API and admin builds passed. `git diff --check` passed. Next production build was not repeated against the running development output; the plan requires a clean production image build before release.
- Live browser: draft text survived About → Hero and EN → HE → EN; Hebrew field had `dir=rtl`; keyboard Tab advanced between labeled fields; missing-provider message and disabled translation action were correct. Desktop 1440px and mobile 390px layouts inspected, mobile page width equaled viewport width, dark mode inspected. Fixed the discovered global `aside` CSS collision by using a scoped complementary region. Returned temporary draft to its original empty value without publishing, restored the original theme and reset viewport override. Preview: `/tmp/aura-026-editor-desktop.png`.
- Full Georgian launch plan covers domain topology, DigitalOcean/Railway costs, secrets/providers, production build/proxy prerequisites, isolated inventory transfer, content review, staging, backup restore, cutover, monitoring and rollback. No infrastructure, DNS, Pini data or production content was changed.

## Remaining limits
- Real AI quality, billing and provider reachability have not been tested. No OpenAI/SMS/email charge or outbound message was made.
- Drafts are retained while this editor is mounted, not persisted across sidebar navigation/reload. A before-unload warning and visible save-before-leaving note are included; there is no claim of server-side autosave.
- Email/SMS provider adapters, production Compose/proxy/CI, backup automation and actual staged deployment remain next release work, as detailed in the launch plan.
- Existing Boulevard Hebrew translation and incomplete available-unit facts/geometry require review before release. The import snapshot's sold-unit omissions are not treated as blockers.
