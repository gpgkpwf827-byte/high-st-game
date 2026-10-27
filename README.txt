High Street — Milestone 1E Stage 1: Council rates income

PATCH: Replace these five repository-root files:
  index.html
  rates.js
  simulation.js
  challenge.js
  app.js

KEEP these existing files unchanged:
  styles.css
  data.js
  grants.js

1. Download and unzip this archive on your iPhone.
2. Upload the five replacement files to the GitHub repository root (overwriting same names).
3. Do not remove the three unchanged files.
4. Open your GitHub Pages game in Safari after deployment.

ADDED:
- Low/Standard/High business rates policy (80%/100%/120%).
- Chosen policy applies on the next Advance Month; remains until changed.
- Business rates are shop expenses and matching council income.
- Council fund increases with rates receipts after trading.
- Monthly report identifies council rates receipts and selected band.
- Existing saved 1D game is imported into a separate Stage 1 save key; old save left intact.

PRESERVED:
- 10 shops, 7 occupied, 3 vacant; 1D challenge and goal.
- £5k grants, £12k fit-outs, Month 4/8 events, cash-based closures, turn control.
- The 2.5 percentage-point monthly demand decline for now.
- Existing CSS, premise data and grants source files.

NOT YET ADDED: 12-premise economy, pub/restaurant applicants, town metrics,
cleaning/lighting operating costs, balancing, council management hub.

VERIFIED WITH NODE TESTS:
Standard: first month £3,380 rates receipts, council fund £253,380.
Low: £2,704 receipts, fund £252,704.
High: £4,056 receipts, fund £254,056.
Business profits respond to changes in shop rates. Month and history advance.

TEST ON IPHONE:
- Shop taps/details, rates policy selections, and all three first-month totals.
- Grants reduce the council fund by £5,000.
- Fit-outs reduce it by £12,000, and newly opened shops trade next month.
- Events at Months 4/8, closure rules, save/refresh and Month 12 end screen.
- Check old 1D progress loads on first access.

Known limitation: rates are fictional amounts and presumed collected in full for the
month from businesses that traded, even when they close at month's end.
Browser UI/iPhone testing is still pending.
