# AURA-018 — Real complex explorer support

Adds clickable/keyboard complex overview block polygons, mapped to imported internal building IDs. Existing building/floor/apartment selection remains. Unit details use copied unit-specific plans/photos when supplied, falling back to floor image. Missing floor images display a notice; units without polygons remain selectable from their list. Sold/reserved remain inert. Removes public fake-project fallback paths.

Real browser opened Tbilisi Boulevard, verified complex/block/floor controls and reserved polygon accessibility without click behavior, and opened A106 through its polygon. Apartment plan loaded from an Aura-local /images/tbilisi-boulevard path; missing price reads Request information. Normalized mapping and all local media references validated. All workspace type checks, 27 regression tests and production builds pass.
