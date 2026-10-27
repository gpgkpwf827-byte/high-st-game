/* Pure business finances. Council budget movements occur in challenge.js only. */
function calculateMonthlyTrading(premise,openingCash,tradingMonth,grants=[],interventions=[],rateBand='standard'){
 const f=premise.finance;
 const activeGrant=isGrantActive(grants,premise.id,tradingMonth);
 const baseTransactions=f.transactions;
 const demandFactor=Math.max(.5,1-CHALLENGE.monthlyDemandDecline*(tradingMonth-1));
 const eventUplift=interventions.filter(x=>tradingMonth>=x.startMonth&&tradingMonth<x.startMonth+x.duration).reduce((s,x)=>s+x.uplift,0);
 const grantUplift=activeGrant?IMPROVEMENT_GRANT.transactionUplift:0;
 const transactions=Math.max(0,Math.round(baseTransactions*demandFactor*(1+grantUplift+eventUplift)));
 const revenue=transactions*f.averageSale;
 const businessRates=calculateMonthlyBusinessRates(premise,rateBand);
 const totalExpenses=f.rent+f.wages+f.otherCosts+businessRates;
 const profit=revenue-totalExpenses;
 return {premiseId:premise.id,tradingMonth,baseTransactions,transactions,activeGrant,demandFactor,eventUplift,grantUplift,
  averageSale:f.averageSale,revenue,rent:f.rent,wages:f.wages,otherCosts:f.otherCosts,businessRates,rateBand,
  totalExpenses,profit,openingCash,closingCash:openingCash+profit};
}
function advanceTradingMonth(state,premises){
 const band=state.ratesBand||'standard';
 const results=premises.filter(p=>p.occupied).map(p=>calculateMonthlyTrading(p,state.cashByPremise[p.id],state.month,state.grants,state.interventions||[],band));
 const cashByPremise={...state.cashByPremise};results.forEach(r=>{cashByPremise[r.premiseId]=r.closingCash;});
 const ratesReceived=results.reduce((sum,r)=>sum+r.businessRates,0);
 return {...state,month:state.month+1,cashByPremise,latestResults:results,councilBudget:state.councilBudget+ratesReceived};
}
