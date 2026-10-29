High Street — Milestone 1E Stage 6E: sales-linked costs (first balance pass)

Requires: Stage 6D.1 with the slider UI already installed.
REPLACE ONLY: simulation.js and app.js (in GitHub repo root).
All other files remain unchanged. Existing saved games remain readable, but new month calculations will use the updated cost rule.

New rule: other operating costs respond to changes from each shop's ORIGINAL baseline sales. For every £1 above baseline monthly sales, £0.55 of extra costs; lower-than-baseline sales reduce variable costs, but cannot make total other costs negative. Existing rent, wages, rates, cash, grants, footfall formula, and victory targets unchanged. This is a provisional balancing rule, not a verified industry-specific cost ratio. The financial debug view now explains the adjustment.

Automation: 200 repeatable seeds per strategy, 8 strategies; based on unchanged Stage 6D strategy scripts.
Strategy          Previous win rate   Stage 6E win rate
No action         0%                  0%
Grants            0%                  0%
Occupancy         16.5%               0%
Infrastructure    0%                  0%
Balanced          95.5%               49.5%
Aggressive        97.5%               79%
Conservative      0%                  0%
Marketing         0%                  0%

Important: AGGRESSIVE PLAY STILL WINS OFTEN. Future balancing may involve limits on early investment impact or operating risk. Do not present current model as fully balanced.

IPHONE TESTS:
1. New game/old save still opens; financial panels and debug work.
2. After a marketing or grant-driven sales increase, other costs rise with sales.
3. At baseline finances, the added adjustment is zero; total other costs have £0 minimum.
4. Save/refresh, policies, council funds, shop applicants, performance, events and final goals work as before.
5. On a few turns with declining sales, variable costs fall, but never below zero.

SPENDING POWER: currently affects average sale through the category sensitivities; developments can shift it temporarily. A persistent economy trend and player interventions targeted at Spending Power are a NEXT design/development area; not added by this patch.
