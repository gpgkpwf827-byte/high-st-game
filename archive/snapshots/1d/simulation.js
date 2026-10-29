/* Pure financial logic: no DOM, UI, or council fund changes. */
function calculateMonthlyTrading(premise, openingCash, tradingMonth, grants=[],interventions=[]) {
  const f=premise.finance;
  const activeGrant=isGrantActive(grants,premise.id,tradingMonth);
  const baseTransactions=f.transactions;
  // Gradual demand pressure is a scenario assumption, not UK economic data.
  const demandFactor=Math.max(0.5,1-CHALLENGE.monthlyDemandDecline*(tradingMonth-1));
  const eventUplift=interventions.filter(x=>tradingMonth>=x.startMonth&&tradingMonth<x.startMonth+x.duration).reduce((s,x)=>s+x.uplift,0);
  const grantUplift=activeGrant?IMPROVEMENT_GRANT.transactionUplift:0;
  const transactions=Math.max(0,Math.round(baseTransactions*demandFactor*(1+grantUplift+eventUplift)));
  const revenue=transactions*f.averageSale;
  const businessRates=calculateMonthlyBusinessRates(premise);
  const totalExpenses=f.rent+f.wages+f.otherCosts+businessRates;
  const profit=revenue-totalExpenses;
  return {premiseId:premise.id,tradingMonth,baseTransactions,transactions,activeGrant,demandFactor,eventUplift,grantUplift,
   averageSale:f.averageSale,revenue,rent:f.rent,wages:f.wages,otherCosts:f.otherCosts,
   businessRates,totalExpenses,profit,openingCash,closingCash:openingCash+profit};
}
function advanceTradingMonth(state,premises){
  const results=premises.filter(p=>p.occupied).map(p=>calculateMonthlyTrading(p,state.cashByPremise[p.id],state.month,state.grants));
  const cashByPremise={...state.cashByPremise};
  results.forEach(r=>{cashByPremise[r.premiseId]=r.closingCash;});
  return {...state,month:state.month+1,cashByPremise,latestResults:results};
}
