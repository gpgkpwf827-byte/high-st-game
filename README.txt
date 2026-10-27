High Street Stage 6A — Performance dashboard (builds on tested Stage 5)
Replace index.html, app.js, challenge.js, stage2.css.
Add performance.js. Keep all other Stage 5 files unchanged.

Includes selectable town metrics, council financial metrics and individual shop trading charts.
Saves use the existing key. New fields are recorded only for newly played months;
older records with missing fields display Not recorded, rather than invented values.
Charts use SVG generated locally (no dependencies).

TEST: Open Performance; cycle all metric choices, including shop measures.
Advance a month and verify Month 1 values, save/refresh, subsequent month values.
Check Stage 5 event notifications, rates, council decisions, grants and applicant flows.

This is Stage 6A only. Three-action monthly capacity, difficulty changes and events
are the NEXT internal stages, not included in this patch.
