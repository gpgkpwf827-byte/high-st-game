HIGH STREET — STAGE 7C.1b HOTFIX

Apply on top of Stage 7C.1a (Notifications UX).

Replace exactly these two files in your GitHub repository:
  app.js
  challenge.js
Leave every other file unchanged.

Fixes:
- Initialise saved seenStrategicOffers list when loading older saves.
- Defensively handle the list when an available offer opens, preventing the undefined includes error.
- Initialise the list after restarting a new challenge.
- Existing mandatory council decisions remain blocking; optional strategic offers do not.
- Economic costs, probabilities, effects and action point rules unchanged.

Check on iPhone:
1. Open existing save and advance to an offer month (typically Month 2/3): offer opens automatically once.
2. Close without investing, advance again: optional offer does not block month progression.
3. Reopen available offer via Notifications; fund/decline as desired.
4. Refresh: already-shown offer doesn't auto-open again, still retrievable from Notifications.
5. Restart (only if you're happy to discard the current run): new offers still work.
6. Month 4 or 8 council decision DOES block progress until resolved.

Node checks: JS syntax, 12-month engine regression, first-open/refresh/expiry logic passed.
UI still requires Safari test.
