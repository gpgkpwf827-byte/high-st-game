HIGH STREET — STAGE 7A: DYNAMIC LOCAL ECONOMY

Starting point: Your working Stage 6E build WITH Stage 6D.1 slider update.

REPLACE these files in the ROOT of the GitHub repository:
  index.html
  app.js
  challenge.js
  economy.js
  performance.js
  stage2.css

ADD this NEW file in the same root:
  local-economy.js

Do not delete or change any other files (especially styles.css, simulation.js, data.js, grants.js, developments.js).

WHAT'S NEW
- Persistent Employment, Earnings, and Living-cost pressure indicators.
- Underlying Spending Power is derived from factors: 40% Employment + 30% Earnings + 30% (100 minus Living-cost pressure).
- Initial factors 40, 42, 70 produce 37.6 (~38) Spending Power.
- Monthly gradual changes persist. Existing one-month town developments remain temporary modifiers for that month's trading.
- New Local economy button and panel; metric history in Performance; movement explanation in monthly report.
- Current release labels synchronized to Stage 7A.

SAVES
- Uses the SAME browser localStorage key and same save version as Stage 6E.
- Old saves without economy factors initialise them to the Stage 7A starting conditions; existing months and shop history are preserved.
- Only NEW completed months have separate historical component data. Past months are not invented.
- Existing month-12 saves remain finished and can inspect the new panel, but will not generate new economic history until a fresh challenge starts.

MANUAL SAFARI TEST
1. Check Stage 7A in header/footer and new Local economy button.
2. Open Local economy: index ~38, employment 40, earnings 42, living-cost pressure 70.
3. Advance months: values move gradually, are explained in reports, and do not reset.
4. Compare Performance > Spending Power and new three underlying factors.
5. Save/refresh/reopen: new factor values and past shop data remain unchanged.
6. Verify council sliders, grants, vacancies, events, business finances, and Month 12 outcome still work.

KNOWN SCOPE LIMITS
- No new council interventions yet; agreed for 7B.
- Strategic Opportunities are planned for later Stage 7.
- Final challenge results are not yet archived under Notifications (planned 7D).
- Stage 6E economic balance is still provisional; scripted strategy rates may change with the new model.
