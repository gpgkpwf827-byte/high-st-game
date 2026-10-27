High Street Milestone 1E Stage 2 — compact mobile interface patch
Requires the Stage 2 project already in GitHub.
Replace ONLY four files in the repository root:
  index.html
  app.js
  stage2.css
  data.js
Keep styles.css, economy.js, simulation.js, rates.js, grants.js, challenge.js unchanged.
Includes previous display fix: six shops north / six south, rounded attractiveness and vitality.

NEW UI
- Compact header, 4 town metric tiles, six shops per street side.
- Tap any shop: mobile bottom-sheet pop-up for finances, grants and vacant units.
- Council & rates and Monthly Report open in pop-ups.
- Challenge rules / Restart challenge are in a pop-up.
- After advancing, monthly report opens automatically. If an event is due, its decision opens.
- Close by X, backdrop or Escape; pop-ups scroll internally.
- Game's economic model, rates, grants, fitouts, save key and 12-month goal unchanged.

TEST IN SAFARI
1. Six shops above and below the road, no wrapped third shop row.
2. Tap shop -> pop-up; scroll finance/debug; close X or outside.
3. Grant purchase and vacant opening still work; cash fund changes correctly.
4. Open Council & rates; change band; advance; monthly report pops up.
5. At Month 4/8 the required event decision pops up; fund or decline works.
6. Refresh Safari; prior Stage 2 save restored.
7. Restart through Challenge; check confirms and returns to Month 1.
8. Complete 12 months; end result appears.
This UI patch passed JS syntax checks, but requires actual iPhone interaction QA.
