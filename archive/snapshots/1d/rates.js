/* Business rates calculation adapter. Amounts are PROVISIONAL monthly estimates.
   Future: use rateable value, multiplier and applicable reliefs here.
   This module NEVER credits the council regeneration budget. */
function calculateMonthlyBusinessRates(premise) {
  if (!premise.occupied || !premise.finance) return 0;
  const estimate = premise.finance.monthlyBusinessRates;
  if (!Number.isFinite(estimate) || estimate < 0) throw new Error('Invalid provisional business rates for premise ' + premise.id);
  return estimate;
}
