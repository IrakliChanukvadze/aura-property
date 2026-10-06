# Pini reuse assessment
Last updated: 2026-10-06
Read-only source inspection; runtime behavior not independently tested in this review.

Reference root: /Users/iraklismac/code/pini

## Authorized scope
Copy/adapt complex upload/annotation tools, image-based explorer, and complex/apartment inquiry logic. Do not copy unrelated platform functionality or connect to Pini inventory/authentication.

## Source anchors
- pini-web/components/building/BuildingPanel.tsx
- pini-web/components/building/BuildingOverlay.tsx
- pini-web/components/building/BuildingPolygonView.tsx
- pini-web/components/building/FloorPlanView.tsx
- pini-web/components/building/FloorPageInteractive.tsx
- pini-web/components/building/UnitDetailDrawer.tsx
- pini-web/components/building/MobileFloorSelect.tsx
- pini-web/components/building/LeadForm.tsx
- pini-web/components/building/LeadDrawer.tsx
- pini-web/hooks/useLeadSubmit.ts
- pini-web/hooks/useProjectInquiryOptions.ts
- pini-web/actions/leads.ts
- pini-admin/src/components/projects/FloorAnnotator.tsx
- pini-admin/src/components/units/FloorPlanAnnotator.tsx
- pini-backend/server/services/buildingPlans.ts
- pini-shared/types/index.ts

## Observed contract
Images plus SVG polygons in normalized 0-100 coordinates; preserve natural aspect ratio. Admin annotation connects building images to floors and plan images to apartments. Changing annotated image/crop requires maintaining alignment. Preserve shareable project/floor/unit selections while adapting Aura routing. Current components depend on Pini translations, routes, API, and tokens; they are not a drop-in portable package.

## Inquiry behavior
Name, phone, email required; consent required; optional message. Name length 2-120, phone uses a basic format/digit check, email uses a basic pattern. Project inquiries expose optional sizes and floor range; unit inquiries attach exact unit context. The submission hook prevents repeated in-flight submissions, trims input and shows errors. It maps locales to ka/en/ru; add he deliberately. Server-side validation and retry/idempotency require a separate implementation audit.

Pini closes the success drawer after approximately 2.5 seconds. Aura optional OTP requires a durable post-submission verification surface; do not copy that auto-close behavior if it interrupts verification. Preserve successful lead creation even when OTP is skipped or fails.

## Adaptation boundaries
Use Aura-owned API/data/media/contact configuration. Replace Pini domain/cookie/auth/tenant assumptions. Improve keyboard targets, touch affordances, focus management and RTL. No copy of production .env, personal lead data, assets without confirmed usage rights, or unrelated APIs.

## Architecture state
Framework/database/deployment not chosen. Explore an isolated selector module with typed inputs and callbacks after business agreement. Shared type generation/package preferable to manual cross-repository copying. Use Cloudflare-compatible choices after validating actual upload, database, SSR, email and OTP requirements.

## Agreement upload adaptation (D-140)
Inspected `pini-admin/src/components/projects/CoverUploadField.tsx`, `pini-backend/server/services/r2.ts`, `pini-backend/server/routes/uploads.ts`, and `pini-backend/server/routes/buildingPlans.ts`. Image flow authorizes a presigned R2 PUT (300-second expiry), then browser uploads; image selectors accept JPEG/PNG/WebP. Building-plan PDF flow accepts PDF via backend, 30 MiB cap. Public URLs used for Pini marketing assets must be replaced with private object references and lead-authorized downloads for Aura agreements. Do not apply plan parsing to contracts or claim agreement functionality already exists. No runtime upload verification performed.
