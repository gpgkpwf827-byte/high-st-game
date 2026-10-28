High Street — Stage 7C.2 controlled cinema balancing patch

GitHub: replace ONLY index.html and strategic-opportunities.js.
Build this patch on your working Stage 7C.1b release. Keep the Stage 7C.1b app.js and challenge.js fixes. Do not replace other files.

Changes:
- Cinema investment cost reduced from £70,000 to £55,000.
- Cinema offer window moved from Month 8/9 (depending on saved schedule seed) to Month 6/7 for NEW games. The exact offer month is still pseudorandom and availability remains probabilistic.
- Cinema probability remains 45%, investment Action Point cost remains 2, outcome delay remains 2 months, and its successful effect remains +8% footfall and +4 attractiveness for the rest of the challenge.
- Employer and festival unchanged.
- Header, footer and title updated to Stage 7C.2.

SAVE NOTE:
Existing saves keep their generated strategicOpportunities schedule, so an existing game's cinema offer may still arrive in Month 8/9. If not yet funded, its current quote uses the new £55,000 price. Already-funded projects keep their original stored cost, result and outcome. Start a fresh game to test the new Month 6/7 offer.

TEST ON IPHONE:
1. Header/footer Stage 7C.2 and no standalone Strategic Offers button.
2. On a new run, cinema if offered arrives Month 6 or 7, not Month 8 or 9.
3. Cinema price £55,000, chance 45%, 2 Action Points, delay 2 months.
4. Ignore/decline does not block advancement; investment outcome stays fixed after refresh.
5. Mandatory council decisions still block advancement until answered.
6. Employer, festival, shops, council programmes, saves, notifications and final result still work.

Testing: 150 paired seeds per strategy x 3 strategies x 5 offer choices x 2 variants = 4,500 seeded 12-month runs. Two active regeneration rules were tested plus a no-regeneration control. These are synthetic strategy heuristics, not predictions of human win rates. Change is provisional and subject to user acceptance.
