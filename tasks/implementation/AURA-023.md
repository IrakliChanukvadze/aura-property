# AURA-023 — Select either tower directly on the image

## Brief
Owner requests removal of the misaligned A/B filter tabs and simultaneous hover/click access to both buildings shown in the block image. Keep the rest of the approved explorer layout.

## Plan and acceptance
- Remove the A/B toolbar and duplicate header building label; give filters the recovered space.
- Overlay every sibling building's existing floor polygons when they share the displayed cover image. Hover identifies building/floor; click, tap, Enter and Space select the correct building and floor together.
- Keep a compact selected-building label with numbered floor controls; retain a select fallback only for distinct cover images or missing building annotations.
- Preserve IDs in deep links, filters, floor/image aspect ratios, available-only apartment interactions and truthful missing-plan states.
- Typecheck, independent review, browser verify both towers, keyboard, mobile/RTL and filter alignment. Commit this ticket separately.

## Evidence
Implemented and locally verified 2026-10-07.

- Removed toolbar A/B tabs and duplicate header label. Both same-cover buildings retain all floor regions simultaneously (13 for Block E); selection remains unique.
- Hover/focus label identifies the tower and floor. Click/tap and Enter/Space set both selection indices, clear apartment state and update the existing shareable query parameters. Floor footer retains selected-building context.
- Source-image guard and a conditional select preserve access for future distinct-image or unannotated buildings; no coordinates/data were changed.
- Independent read-only review: no blocking findings.
- `npm run typecheck -w @aura/web` and `git diff --check` passed.
- Browser: clicked E/B floor 4; refreshed its deep link and confirmed the same selection; Enter selected E/A floor 4; Available only and A401 apartment dialog remained functional; Space selected E/B floor 4 in Hebrew. No browser console errors.
- Desktop 1440×900, light/dark and mobile Hebrew RTL 390×844 inspected; document width equals viewport. Screenshots: docs/design/qa/towers-desktop.jpg and towers-mobile-he.jpg.
- Existing source limitation: E/B has floor outlines but no published floor-plan images or units. Its honest unavailable-plan state was verified; E/A data is never displayed as E/B.
- No backend/data change or deployment. Build was not repeated for this scoped client/CSS change; TypeScript and live Next compilation/browser checks passed.
