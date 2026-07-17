# MPBP440 V12.0.2 — MPBP TV visual polish

## Scope

- Branch: `v12.0.2-mpbptv-visual-polish`
- Page: `/mpbp-tv/index.html`
- No MP4 asset was added, copied, renamed, or deleted.
- The ambient audio controller was inspected and left unchanged: no defect was found in its controls.

## Delivered

- Rebuilt MPBP TV hero hierarchy: green `EXCLUSIVITÉ MPBP TV`, gold `MPBP440`, white `LA SCÈNE VIDÉO OFFICIELLE`, existing description and existing badges.
- Replaced the four text-only playlist controls with complete clickable poster cards.
- Kept the one central local video player, `preload="none"`, existing poster-before-play behavior, and the existing four public hash anchors.
- Added the selected-card state through `aria-pressed` and `aria-current`, a gold visual state, keyboard focus, and a non-selected card state.
- Kept the six historical YouTube archive videos in their lazy-loaded embeds. Artist and duration values are not present in the versioned data and were not invented.
- Bumped MPBP TV asset cache queries and the production service-worker cache key to V12.0.2.

## Asset mapping

| Clip | Artist | Existing poster |
| --- | --- | --- |
| L’Argent | Sparetdee Simon | `/assets/covers/largent-officiel.webp` |
| Je sais que tu sais | Juste Une Plume | `/assets/covers/je-sais-juste-une-plume.webp` |
| J’existe | Makéda Muse | `/assets/clips/makeda-muse/j-existe-cover.png` |
| Dois-je me taire ? | Sparetdee Simon | `/assets/clips/sparetdee-simon/dois-je-me-taire-cover.png` |

## Validation performed locally

- JavaScript syntax: `node --check assets/js/v12-mpbp-tv.js` passed.
- Git whitespace check: passed.
- Public anchors tested: `#l-argent`, `#clip-je-sais-que-tu-sais`, `#clip-j-existe`, and `#clip-dois-je-me-taire` each select the correct central-player source and active card.
- Playlist interaction: card selection updates hash, player metadata, source, `aria-pressed`, and `aria-current`.
- Console: no errors.
- Responsive: 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 1024×768, 430×932, 414×896, 402×874, 393×852, 390×844, and 375×812. No horizontal overflow was detected.

## Release checks

Preview and production deployment evidence, commit IDs, tag and GitHub Pages run IDs are added to the delivery record after their respective pushes complete.
