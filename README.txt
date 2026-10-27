High Street — 1E Stage 3 Business Behaviour
Based on the Stage 2 COMPACT UI patch. Apply ONLY after that patch.

REPLACE in your GitHub repository root:
- index.html
- app.js
- challenge.js
- stage2.css
ADD new:
- businesses.js

KEEP UNCHANGED: data.js, economy.js, simulation.js, rates.js, grants.js, styles.css

NEW:
- Financial outlook (Stable, Struggling, Critical) in each shop pop-up.
- Health score from existing finance model; reserve coverage in months of costs.
- Monthly report summarises struggling/critical shops and closures with reasons.
- Three consecutive loss-making months plus under 1 month of costs in cash: 8% monthly chance of voluntary financial distress exit.
- Rare unexpected owner departure: 0.1% per shop each month.
- At zero or negative closing cash: immediate closure (preserved existing rule).
- Random events use deterministic seeded game rolls for repeatable testing.
- Existing Stage 2 save is loaded and upgraded in place. No reset needed.

NO CHANGE: 12-premise configuration, shop finance assumptions, grants, rates, £12,000 immediate fit-outs, council events, win target, town metrics or popup style.

IPHONE QA:
1. Shop popup shows outlook, score, and cash cost cover for occupied shops.
2. Vacant unit popup remains functional.
3. Advance month: monthly report shows counts of Struggling/Critical and any closures.
4. Check rates receipt adds to fund; grants and fit-outs deduct as before.
5. Save/refresh and Month 4/8 events remain functional.
6. Continue to Month 12; end screen works. Initial closure mix can vary with game choices.

NOT YET IMPLEMENTED: applicant choice, Council Management services, major policy choices, balanced recovery goal.
WARNINGS: Outlook values and probabilities are provisional gameplay assumptions; not predictions of actual closures. Code tested with Node syntax and a 12-turn headless simulation; physical iPhone QA pending.
