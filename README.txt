High Street — Milestone 1E Stage 2: Struggling Town and Metrics

IMPORTANT: Wait until Stage 1 has been installed and tested. Stage 2 builds on Stage 1.

REPLACE these 5 files in your GitHub repository root:
index.html, app.js, challenge.js, data.js, simulation.js

ADD these 2 NEW files to your repository root:
economy.js, stage2.css

KEEP these 3 files UNCHANGED:
styles.css, grants.js, rates.js

Stage 2 uses a new save key to avoid mixing old 10-premise states with the new
12-premise structure. Old Stage 1 save remains in Safari but is not imported;
Stage 2 starts a new challenge at Month 1. The old save can still be accessed
if Stage 1 is restored from GitHub history.

IMPLEMENTED:
- 12 illustrated premises, seven occupied, five vacant.
- 7 recalibrated starting businesses: 2 profitable and 5 loss-making.
- 7500 starting monthly visits, spending power 38, attractiveness 32.
- Commercial vitality weighted occupancy 40%, diversity 25%, health 35%.
- New business category sensitivity drives transactions from town footfall and
  attractiveness, and average transaction value from spending power.
- Vitality affects next month's footfall (+8% / 10 points) and attractiveness
  (+2 points / 10 points) against calibrated scenario starting conditions.
- Replaces previous 2.5 percentage-point monthly demand decline with a modest
  underlying 1% footfall headwind per month.
- Retains grant, business rates receipts/bands, monthly event cards, instant
  £12k tenant fit-outs, closures, saving and 12-month challenge. 12-month target
  temporarily changes to 10/12 occupancy pending multi-metric Stage 6 win rules.

NOT YET IMPLEMENTED:
- Applicant selection, pub/restaurant opening profiles, council management
  investments/cleaning/lighting, flexible spending power policies, fully balanced
  win conditions and random closure events. These are subsequent 1E stages.
- Town metrics are visible, but until council actions arrive most movement comes
  from occupancy, business health and the underlying economic headwind.

TEST:
1) Twelve shops visible: seven occupied, five vacant.
2) Month 1: 7,500 visits, Spending Power 38, Attractiveness 32,
   Commercial Vitality approximately 47.5.
3) Standard rates, after first month: council balance £253,380 (without extra
   spending). Low/High first-month receipts £2,704/£4,056.
4) Bakery initial forecast shows 1,400 transactions, £9,800 sales, £650 loss.
5) Select Unit 11: £12k fit-out, new tenant opens immediately.
6) Existing £5k grants and Month 4/8 events still work.
7) Refresh game and confirm Stage 2 save resumes. Stage 1 save is not imported.
8) Finish 12 months; game ends and shows challenge result.

TECHNICAL CHECKS: all JavaScript passes node --check. Headless simulation
assertions passed; Safari UI testing remains pending. No GitHub files were
modified directly.
