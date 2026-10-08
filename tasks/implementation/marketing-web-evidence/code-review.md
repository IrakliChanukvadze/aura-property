# Independent marketing frontend review

Read-only review, 8 October 2026. No file edits in either repository, commits or server launches performed.

## Aura — stable three-file diff

Reviewed `apps/web/src/components/CinematicHome.tsx`, `CinematicHome.module.css` and `apps/web/src/lib/cinematic-copy.ts`, including surrounding component/styles, locale layout, homepage data wiring and confirmed decision D-231. The implementing agent was completed when the diff was inspected.

No concrete blocking defect found in this change. Localized contact/project links use the active locale. Empty collections do not render the new collection guide/browse CTA. The long cinematic sections and configurable hero remain present. New copy states agency/project exploration rather than unverified inventory, investment, sales or staff outcomes. New primary links include visible keyboard focus rules; process arrows mirror in Hebrew. Mobile hero sizing now permits content growth instead of the former fixed maximum.

Verification limits: source review only. I did not run a server, browser, typecheck or native translation review. Responsive fit, contrast over actual CMS hero imagery and full keyboard/RTL behavior remain browser acceptance requirements, not established by this report. The implementation agent's checks are not treated as independent verification.

## Pini — frontend diff

Reviewed the eleven tracked modified frontend files plus new `components/map/MapEmptyState.tsx`, with supporting URL-filter/map/list data hooks and store cleanup. Included the later `ProjectPinsLayer.tsx` hover-price correction, observed after the first diff snapshot.

No concrete blocking regression found in the specified scope. `MapPageClient.tsx` toggles view with component state without rewriting search parameters; existing list pagination/filter parameters stay in the URL. Existing map persistence restores a saved viewport on remount. `MapEmptyState.tsx` removes price/area/rooms/delivery only and preserves category/location/region. Feed items remain aggregated developer projects plus houses/land, with project detail links through `inventoryHref`; no standalone flat feed is introduced.

Project prices without a feed currency are now suppressed both in cards (`listingItems.ts`) and hover metadata (`ProjectPinsLayer.tsx`); house/land currency is a constrained GEL/USD/EUR type. `ListingCard.tsx` replaces a failed cover URL with a labeled icon fallback and does not invent a cover. Active locale translations are used for new control labels and project categories.

Browser acceptance case, not a confirmed defect: at 320/375px with Russian/Georgian category labels and several active chips, check filter wrapping against the absolute cadastral control (`MapView.tsx:62`, fixed mobile top 288px; filter stack at `MapView.tsx:69`). Source review alone cannot establish overlap. Also check real map loading, toggle/back navigation, keyboard focus and empty recovery in a browser. I did not run tests or a server; the implementing agent's claimed 49 passing tests are not independently verified here.
