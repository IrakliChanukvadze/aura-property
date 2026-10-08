# AURA-031 — Apartment modal and invitation clarity

## Request and acceptance
Remove the browser selection circle from apartment polygons and center the apartment modal. Investigate the reported short invitation expiry. Preserve polygon hover/click and keyboard access, sold/reserved restrictions, responsive layout and existing invitation security. Commit, verify and deploy the reviewed fixes to Aura.

## Plan and ownership
Root owns public CSS, browser verification, release and this record. Auth specialist owns API token error clarity, admin sign-in navigation and focused isolated regression checks. Independent review before release.

## Findings
Live apartment dialog measured x0/y0 with margin0; Tailwind reset removed native dialog auto margins. Focused apartment polygon rendered the browser auto5px outline even without focus-visible. Use explicit dialog inset0/margin auto, remove polygon outline and retain keyboard focus through the polygon stroke.

Invitations last172800seconds (48hours), password recovery3600seconds (1hour), sessions86400seconds (24hours). Authorized production metadata shows the owner invitation was successfully consumed before expiry. No early-expiry defect found. Existing UI conflates used, expired and invalid tokens and hides sign-in navigation on token pages. Keep lifetimes and one-use validation; clarify errors and offer Back to sign in. No new email or password changes requested.

## Verification
- Public web typecheck passed. Auth specialist:12/12 focused API tests (auth token/content) against isolated local aura_endpoint_audit, API/admin typechecks passed. Three new auth tests cover failure immutability, valid single-use lifecycle and concurrent acceptance.
- Local real browser:1280x720 dialog center error under0.01px;390x844 dialog fully within viewport and centered, longer inquiry scrollable; Escape closes. Mouse selection outline is none; Tab focus remains visible with0.9px polygon stroke and Enter opens details. Hebrew RTL centered with zero center error. Invitation setup -> localized Back to sign in removes token -> Forgot password reaches recovery. No live password or email changes were made for testing.
- Independent reviewer found no material or deployment-blocking issue in CSS, auth transaction or admin changes.
- Deployed application revision `35bc0f4bf2ec6c815c6159fae6ec9ec29f4fe69e`. GitHub Verify Aura run37772469311 passed (84 API tests, all workspace typechecks/builds); native release run37772468922 passed. Artifact checksum verified before loading. Pre-deploy backup: `/var/backups/aura/aura-20261008T120025Z-40081.dump`. Containers healthy and all HTTPS smoke checks passed. Live browser confirms centered modal and no polygon outline. Owner subsequently tested and approved the web changes.
