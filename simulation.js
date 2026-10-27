/* Pure financial logic: no DOM, UI, or council fund changes. */
function calculateMonthlyTrading(premise, openingCash, tradingMonth, grants=[]) {
  const f=premise.finance;
  const activeGrant=isGrantActive(grants,premise.id,tradingMonth);
  const baseTransactions=f.transactions;
  const transactions=activeGrant?Math.round(baseTransactions*(1+IMPROVEMENT_GRANT.transactionUplift)):baseTransactions;
  const revenue=transactions*f.averageSale;
  const businessRates=calculateMonthlyBusinessRates(premise);
  const totalExpenses=f.rent+f.wages+f.otherCosts+businessRates;
  const profit=revenue-totalExpenses;
  return {premiseId:premise.id,tradingMonth,baseTransactions,transactions,activeGrant,
   averageSale:f.averageSale,revenue,rent:f.rent,wages:f.wages,otherCosts:f.otherCosts,
   businessRates,totalExpenses,profit,openingCash,closingCash:openingCash+profit};
}
function advanceTradingMonth(state,premises){
  const results=premises.filter(p=>p.occupied).map(p=>calculateMonthlyTrading(p,state.cashByPremise[p.id],state.month,state.grants));
  const cashByPremise={...state.cashByPremise};
  results.forEach(r=>{cashByPremise[r.premiseId]=r.closingCash;});
  return {...state,month:state.month+1,cashByPremise,latestResults:results};
}
