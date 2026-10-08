# AURA-027 — Aura public team preview

## Brief
The owner requests three public team profiles, with temporary mock images until real portraits are supplied: ლაშა კრიალაშვილი (co-founder, head of sales, 15 years in real-estate sales and extensive international-market experience), ლუკა ჯორჯიაშვილი (sales agent with many years of experience), ალექსანდრე კინკრიაშვილი (co-founder, head of analytics, 10+ years in analytics). Use only these factual claims. Keep existing public design and allow later photo replacement in admin.

## Plan
- Root: curated multilingual copy, clearly illustrative local avatar assets, responsive public team section, local content application, integrated checks and per-ticket commit.
- API agent: validated owner-only marketing team records in site settings, public projection preserving existing CRM profile support, targeted permission/persistence tests.
- UI agent: owner-only public-team panel in Website with profile/photo editing; no change to CRM permissions.
- Review: root review agent implementations; independent read-only integration review after implementation.

## Acceptance
- All three named people and supplied roles/experience appear in About / our team with replaceable temporary avatars; the previous demonstration profile is hidden.
- Editing marketing profiles does not create staff accounts, invitations, team leadership, commission entitlements or CRM access.
- SuperAdmin controls publication/edits on both client and server. Ordinary content editing rights do not grant team curation.
- Other site content survives profile saves. Mobile/desktop and dark mode remain usable; Hebrew content direction is retained.
- Only the local Aura content is updated, no production/Pini changes or outgoing messages.

## Follow-up
The owner requested smaller portraits after viewing the initial preview. Final public images are capped at 260px wide on desktop and 220px on mobile, retaining their portrait ratio and alignment with each profile.

## Evidence
- Added all three supplied people to local Aura site settings via authenticated owner API, preserving other site content. Hid only the previous `Luka Demo` public card; no account was deactivated and no new CRM accounts, teams or invitations were created. Content source is `content/team-preview.json`; temporary vector avatars live in `apps/web/public/images/team/`.
- Added owner-only Website → Our team editor for names, titles, bios, four locales, photo upload/replacement and visibility. Existing CRM public profiles remain supported. Team writes are owner-only on the server; public site settings omit the draft list and public team/media only expose visible entries.
- All 54 API tests passed against isolated `aura_endpoint_audit` (0 failures/skips), including four new schema/permission/projection/media regressions. Real providers disabled; log `/tmp/aura-027-api-tests.log`.
- API/admin/web type checks and API/admin builds passed. Root reviewed agent changes; independent read-only review found no blocking defect and caught a Hebrew name transliteration, corrected in the fixture and through the actual admin Save flow.
- Live browser confirmed exactly three Georgian profiles with all photos loaded, supplied titles/bios and temporary-image labels. Admin save success verified; corrected Hebrew name appeared on the public Hebrew page with `dir=rtl`.
- Inspected public desktop, dark mode and mobile. At 390px the page scroll width was 390px and the card layout was one column; photos were 220 × 257px. Desktop photos measured 260 × 303px after the owner's size correction. Temporary viewport and theme preferences restored. Screenshot: `/tmp/aura-027-team-desktop.png`.
- No production/Pini data changes or outgoing messages. The fixture is initial preview content; subsequent admin edits live in the database and must be exported during the planned production content transfer. Real portraits will replace the temporary images later.
