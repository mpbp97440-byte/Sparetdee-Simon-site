# MPBP440 V12.0.4 — intro and homepage hero correction

## Cause and correction

- **Makéda Muse:** the intro had no dedicated treble-clef element. The Makéda card used a profile image while the crutches and feather were absolute assets tied to the central crest, so the clef could only be seen incidentally inside the logo.
- **Correction:** the intro now has three independent artist emblems in one row: crutches for Sparetdee Simon, a gold treble clef for Makéda Muse, and a gold feather for Juste Une Plume. The official MPBP440 Corp logo is retained as an independent central crest above the emblem row.
- **Homepage logo:** V12.0.3 placed the official logo in a broad right grid column, directly over the hero artwork.
- **Correction:** the right column and official logo were reduced; the logo now sits at the lower right edge and no longer covers the hero’s focal character.
- **MPBP440 title:** the oversized V12.0.3 title had an overly tight letter spacing / width interaction in the hero area, which made the final zero appear clipped.
- **Correction:** desktop title styling has an explicit non-wrapping, overflow-visible inline box with end padding, coherent letter spacing and a reduced responsive clamp.

## Scope

- Modified only the homepage intro and hero CSS/markup plus cache query documentation.
- MPBP TV, artist pages, data, video files, public anchors, URLs, manifest, `CNAME` and PWA behavior are unchanged.

## Local validation

- JavaScript syntax: `script.js`, `assets/js/v12-homepage.js`, and `sw.js` passed `node --check`.
- Manifest JSON parsed successfully and `git diff --check` passed.
- Desktop intro visual audit at 1280×720: all three emblems, the official crest, text, sound choices and skip button were visible; no overlap or horizontal overflow.
- Desktop hero visual audit: complete `MPBP440` wordmark, clear hero artwork, logo restricted to the right edge, all CTA controls visible.
- Responsive CSS coverage retained for 1920, 1600, 1440, 1366, 1280, 1024, 768, 430, 414, 402, 393, 390 and 375.

## Release evidence

Branch, preview, production commit IDs, tag and GitHub Pages run URLs are supplied in the final delivery after deployment succeeds.
