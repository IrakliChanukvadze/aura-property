# Explorer design QA

- Source visual truth: docs/design/references/explorer-selected.png (selected Higgsfield mockup, 1344×752 pixels).
- Implementation: docs/design/qa/explorer-desktop.jpg (1344×752 pixels; CSS viewport1344×752, density1). No density normalization needed for final full-view comparison.
- State: English, dark, Block E/A, Floor4, default filters; source also dark/Floor4 but uses fictional Evergreen/Riverside inventory.
- Full-view comparison: docs/design/qa/explorer-comparison.png (source left / implementation right).
- Focused control comparison: docs/design/qa/explorer-controls-comparison.png (source above / implementation below); required because labels/controls are small in full view.
- Mobile: 390×844 CSS, docs/design/qa/explorer-mobile-he.jpg and explorer-mobile-light.jpg; horizontal document width equals viewport.

## Findings and comparison history

1. Initial capture found P1 outer content at viewport edges rather than source30px margins, and P2 availability toggle inheriting a44px input minimum. Fixed scoped margins/padding and explicit19px toggle height. Compared revised capture with source at the same viewport.
2. Revised capture found P2 compact label legibility/active fill contrast and sidebar title repeating the main heading. Raised filter/sidebar text, added localized Apartments title, darker active label text and visible toggle keyboard focus. Final full and focused comparisons opened together after changes.
3. No remaining actionable P0/P1/P2 layout findings in the selected scope. Real building/plan proportions differ intentionally: authoritative Boulevard images and normalized polygons were preserved instead of substituting fictitious reference inventory. Actual floor plans retain their white backgrounds and source aspect ratios; no crop/stretch/reannotation was applied.

## Required fidelity surfaces

- Fonts/typography: compact28px Georgia serif title, restrained sans-serif controls/sidebar, localized fallback fonts; removed oversized display heading. Aura wordmark retained intentionally instead of Evergreen.
- Spacing/layout rhythm:64px header,30px content gutters, compact breadcrumb/title, single framed toolbar,36/64 main split and side-by-side plan/inventory. Building floors stay under the image; cards share top/bottom framing.
- Colors/tokens: dark evergreen/sage/ivory, fine raster textured backdrop generated from selected source, muted borders,6px corners. Light theme uses existing accessible light palette. Small active labels use dark text for contrast.
- Image quality: generated empty backdrop supplied as raster asset; real local Boulevard photos/plans preserved. SVG is existing functional annotation geometry, not decorative image replacement. Image and polygon bounds remain aligned.
- Copy/content: actual project/block/unit/status/price data and four-language labels replace reference sample data. Missing area/room values use dash in list rather than false zero.

## Interactions and console

- Floor4 selection updates shared URL; available apartment polygon opens A401 details; Available only removes disabled sold rows; inquiry modal remains functional.
- Sold/reserved polygons and rows remain non-interactive.
- Mobile layout stacks toolbar/cards without horizontal overflow; Hebrew route mirrors RTL. Light/dark toggle checked.
- Final browser error log empty. Language-control navigation was not independently accepted as verified; direct locale routes were used for RTL evidence.

## Implementation checklist

- [x] Match selected layout and background direction.
- [x] Preserve functional inventory and routes.
- [x] Fix alignment, toggle and text contrast findings.
- [x] Capture/compare final same-size source/render and focused controls.
- [x] Check mobile/RTL/light and core interactions.

## Follow-up polish

P3: reference uses a tall square fictional plan and nine floors; actual wide plan and six floors produce different internal image density. Browser development indicator appears only in dev preview. Native range inputs remain numeric rather than reference dropdowns to retain arbitrary price/area entry.

final result: passed
