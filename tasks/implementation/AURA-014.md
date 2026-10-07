# AURA-014 — Stepped project authoring and annotations

Inspected Pini ProjectWizard/StepIndicator read-only. Replaces the narrow all-in-one drawer with seven focused steps: details, translations, buildings, floors, apartments, annotations, review/publish. Wide dialog, direct step selection and Back/Next. Correct canonical building.coverImage/floor.image fields eliminate broken annotation canvases. Existing outlines render; floor and apartment annotation modes are separate; draft apartments can be drawn visually.

Real browser verification opened an existing project at 1168x853, switched directly to Annotations, and confirmed the building image and stored floor outlines render. Type check and production admin build pass. Steps use explicit saves; publishing remains in review. Pini apartment spreadsheet import is not included in this UI revision; existing manual apartment creation remains.
