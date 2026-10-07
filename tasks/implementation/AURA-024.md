# AURA-024 — Refresh Tbilisi Boulevard from Pini production

## Authorized scope
Owner updated Pini production and requests the same project refreshed in Aura. Read only the named complex's project/building/floor/unit/media rows. No Pini mutation, unrelated data, CRM/contact import or ongoing connection.

## Plan
- Export a consistent PostgreSQL read-only snapshot through the verified SSH connection; compare to prior copy.
- Back up source/mapped snapshot and Aura target inventory. Refresh images even when source URLs are unchanged; use new asset paths for changed bytes.
- Scope repeat import to Tbilisi Boulevard, validate mappings and protect Aura sale/reservation/inquiry references and private minimum prices. Keep unrelated inventory intact.
- Verify all floors/plans/polygons/unit counts, public API output, browser selection in newly completed E/B, independent review; commit this ticket.

## Source delta
Fresh export on 2026-10-07: 382 apartments (+96), 90 existing apartment rows changed, seven floor rows changed and now all27 floors have plans. Published building IDs unchanged. Source status totals188 Available/14 Reserved/180 Sold.

## Evidence
Completed locally on 2026-10-07. Pini read-only export timestamp:2026-10-07T11:26:35.91036+00:00.

- Imported382 apartments:96 added,286 existing updated,0 removed. Aura totals188 Available/14 Reserved/180 Sold;4 buildings and27 floor plans. E/B now has96 apartments across7 published floor plans.
- Refreshed all31 media URLs; reused identical local images and added8 assets. Every local asset passes image-header verification. Changed bytes receive a new URL so stale browser caches cannot retain replaced source images.
- Original source and mapped JSON snapshots backed up under ignored .local/imports. DB inventory backup: .local/imports/aura-boulevard-before-1791372662063.json, written before transaction mutations.
- Pre-import Aura target had286 apartments and no sales, reservations, apartment inquiries or private minimum prices. No unrelated projects or Pini records were changed.
- Importer now scopes refresh to this project, validates source/building/floor/unit IDs and percentages, leaves private minimums/local settings untouched, preserves active sale/reservation status, and refuses to remove apartments with CRM references. No users/customer/contact data imported. Source database is not needed at runtime.
- Independent specialist implemented safeguards; primary agent reviewed them.10 focused node:test regressions pass, including foreign-project isolation, stale-reference guards, private field/status preservation and local-floor protection. Tests use an in-memory transaction adapter; concurrency was reviewed, not stress-tested.
- `node scripts/import-boulevard.mjs --validate-only`:4buildings/27floors/382units valid. `git diff --check` passed.
- Read-back public API matches every imported apartment ID, area, room count, price currency/mode, visibility, availability and polygon. Hidden prices correctly remain null publicly.
- Browser selected E/B floor4 directly on the tower, loaded its new local plan with14 apartment regions, then opened B402 (111.7m²,USD185,288) through its polygon. No console errors. Screenshot:docs/design/qa/boulevard-refresh-eb.jpg.
- Existing source gaps remain:14 apartment polygons absent,291 source prices null,183 areas null,146 room counts null. These are not invented; existing unknown/hidden handling remains.
- No UI code change or deployment. This is an owner-requested snapshot refresh, not an automatic live sync.
