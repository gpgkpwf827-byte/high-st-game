HIGH STREET — STAGE 7D MOBILE UI PATCH
=====================================
Install on the working Stage 7C.2 repository. Replace exactly:
  index.html
  app.js
  stage2.css
Leave all other files unchanged, in particular the Stage 7C.2 strategic-opportunities.js and the Stage 7C.1b challenge.js.

CHANGES
- Fixed Advance button, labelled “Advance →”, with same game event gating and button ID; disappears while a modal is open.
- Shared horizontal scrolling street viewport; storefronts stay readable on narrow portrait phones, with synchronized north and south rows.
- ↔ Scroll hint on road when overflow is detected; no hint if street fits.
- Header, footer and title updated to Stage 7D.
- No economy or save schema changes.

IPHONE TESTS
1. In portrait, swipe the high street horizontally; shops on both sides move together, and each remains tappable.
2. The ↔ Scroll hint appears only when the street can scroll; rotate landscape and check it disappears if street fits.
3. Advance → stays accessible on scrolling and is hidden when a modal is open.
4. Mandatory Month 4 / Month 8 council decisions still block advancement. Optional offers never block advancement.
5. Complete Month 12; final results and archived notification can be reopened. Refresh mid-game and check saves.
6. Check policy sliders, grants, shop charts, economy and strategic offer pop-ups.

VERIFY
- Node JS syntax check passed.
- HTML structural and ZIP integrity checks passed.
- Actual iPhone/Safari portrait/landscape appearance requires user QA.
