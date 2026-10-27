Stage 6D — Balanced Recovery (built on Stage 6C.1)
Replace just these FOUR files in GitHub repository root:
  challenge.js, app.js, index.html, stage2.css
Leave all other files untouched.

The Month 12 win condition now requires ALL THREE:
 - Occupancy at least 10/12
 - Month 12 recorded footfall at least 10,000 visits
 - At least 70% of occupied businesses marked Stable (round required stable count UP)
The final modal shows individual PASS/FAIL results, number of goals met, and the council fund.
Existing saved games are retained, including completed runs, and final results are recalculated from recorded Month 12 information.

Automated scenario testing: 200 seeds per strategy (1600 complete simulations).
BEFORE any further difficulty adjustment, approximate win percentages at the 10k target:
No intervention 0%; Grants only 0%; Occupancy-first 16.5%; Infrastructure-first 0%; Balanced 95.5%; Aggressive spending 97.5%; Conservative 0%; Marketing-focused 0%.
Those are deterministic policy heuristics, not optimisation or estimates of human success; seed differences only exercise implemented randomness.
BALANCING FINDING: balanced and aggressive strategies still win too easily. Raising the footfall threshold to 10,500 in a sensitivity test reduced both to ~64%, but was NOT adopted (10,000 remains the agreed provisional goal). Further tuning needed.

Test on iPhone:
1. Challenge pop-up explains all three goals.
2. Monthly gameplay still works, including event notifications and council capacity.
3. Finish Month 12 and see separate pass/fail for occupancy, footfall and Stable businesses.
4. Performance dashboard, Current Issues, and save/refresh still work.
5. Restart still works.
6. No additional cash transfers, grant, shop-opening, or economic rules are changed.
UI still needs iPhone QA before marking Stage 6D complete.
