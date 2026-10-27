High Street Stage 6C.1 — Visibility update
Built against the Stage 6C release. Replace exactly THREE files in the GitHub repository root:
- index.html
- app.js
- stage2.css
Leave all other Stage 6C files unchanged (including property.js, developments.js, challenge.js, and existing data modules).

What is new:
- Every shop has a Stable / Struggling / Critical / Vacant status label and consistent status-coloured roof/trim.
- Each vacant shop shows condition and vacancy age directly on the street and in its details; details show deterioration surcharge.
- Current Issues opens a panel displaying active council service, transport and marketing effects, current town estimate, and the LATEST completed month's development with its recorded footfall/spending-power modifier.
- Developments are one-month effects. Past roadworks are NOT represented as still active.

QA to run on iPhone:
1. 12 shops are arranged in two rows of six, with status labels and green/amber/red roofs as appropriate.
2. Tap a vacant unit: age, condition, deterioration surcharge and three applicant choices are present.
3. Advance several months: the vacancy age/condition/surcharge increases.
4. Open Current Issues: inspect services and their effects; choose lighting and/or transport; reopen Current Issues and verify figures.
5. Advance until a development occurs; open Issues and see last completed month's development effect. It must not claim to still be active.
6. Grants, tenant openings, event notifications, monthly reporting, the Performance dashboard, council action points and saved progress still work.

No game-economy rules or save keys were changed.
Technical: JS syntax checked and existing 6C simulation test passed. Browser smoke test unavailable in this environment due to browser network administration; actual Safari testing pending.
