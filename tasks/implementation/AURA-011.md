# AURA-011 — Browser review fixes

Native public dropdowns now explicitly follow the active light/dark color scheme, with matching option backgrounds and text. The building preview spans its column width and centers vertically beside the floor plan while retaining its aspect ratio; SVG floor hit targets stay attached to the same image box.

Verification: public TypeScript check passes; browser computed styles confirm dark option background rgb(24,29,25), light text rgb(238,238,227), dark control scheme, and centered building alignment. Light controls retain the light palette. Image and overlay share their full-width positioning box. Native popup rendering is OS-dependent and is not captured by the in-app screenshot surface.
