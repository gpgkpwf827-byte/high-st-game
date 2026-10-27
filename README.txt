High Street — Milestone 1E Stage 5 — Council Management and Notifications

BASELINE: Tested Stage 4 COMPLETE ZIP + no-duplicates fix. This update retains that code.

Replace FIVE files in your GitHub repository root:
  index.html
  app.js
  challenge.js
  economy.js
  stage2.css
ADD ONE NEW FILE:
  council.js

NOTE: This is FIVE replacements, plus ONE new file.
Keep all other working GitHub files unchanged: data.js, rates.js, grants.js,
simulation.js, businesses.js, styles.css.

NEW FEATURES:
- Notification bell identifies pending Month 4 / Month 8 events.
- Event sheet can be dismissed, reopened using bell or amber pending banner.
- Advance Month changes to Review pending decision when a decision is due.
- On refresh, pending decisions reopen from saved game state.
- Council Management: top overview shows metrics and projected council operating
  cash flow; rates policy, street cleaning, street lighting, transport choice,
  and local marketing actions.
- Three cleaning levels and three lighting levels, each with a monthly operating cost.
- Bus (£65k, +22% footfall, +1 attractiveness) OR parking (£45k, +17% footfall).
- Marketing (£5k for two months, +8% footfall) and existing 1D events/grants.
- Preview service/transport metric changes before confirming.
- Monthly report now includes council service costs.
- Current save key is retained and new policy fields default safely on old saves.

ILLUSTRATIVE BALANCING VALUES: Cleaning basic £0 / standard £1,100 and +2
attractiveness / enhanced £2,500 and +5 attractiveness per month.
Lighting basic £0 / improved £850 +2 attractiveness, +2% footfall /
extended £2,100 +4 attractiveness, +5% footfall per month.
Business rates stay 80/100/120% of earlier per-shop estimates.

SIMULATION ASSUMPTIONS:
- Services' selected costs start at the next Advance Month and repeat monthly.
- Service benefits apply to immediately previewed town conditions.
- Transport is a one-time choice and permanent for this short prototype.
- Marketing begins with the next trading calculation and lasts two months.
- Rates receipts still add to council fund; services deduct from that same fund.
- No artificial floor on the fund: an operating deficit may make it negative.
- Business rates are simplified fictional policies, not literal UK council powers.

IPHONE TESTS:
1. At Month 4, dismiss event, reopen using bell and amber banner.
2. Advance button should say Review pending decision and reopen event.
3. Fund or decline event and then continue month progression.
4. Reload Safari while event pending: notification and event still available.
5. Council Management opens and shows metric/finance overview at top.
6. Set enhanced cleaning and confirm: attractiveness rises, monthly service
   costs are charged after Advance Month.
7. Set lighting; verify changes to footfall and recurring costs.
8. Pick buses OR parking: pay once, other option becomes unavailable.
9. Marketing costs £5k and boosts footfall for two months.
10. Rates, grants, applicants (unique categories), closure risk, reports,
    saves and restart still work.
11. Month 8 notification and Month 12 end report work.

Automated Node simulation passed. iPhone/Safari UI testing is not yet verified.
