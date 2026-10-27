/* Fictional policy bands applied to the game's provisional monthly rate bills. */
const RATE_BANDS=Object.freeze({low:0.8,standard:1,high:1.2});
function ratesBandFactor(band){return RATE_BANDS[band]??RATE_BANDS.standard;}
function calculateMonthlyBusinessRates(premise,band='standard'){
 if(!premise.occupied||!premise.finance)return 0;
 const estimate=premise.finance.monthlyBusinessRates;
 if(!Number.isFinite(estimate)||estimate<0)throw Error('Invalid provisional rates for premise '+premise.id);
 return Math.round(estimate*ratesBandFactor(band));
}
