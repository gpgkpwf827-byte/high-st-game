/* Game prototype grant, not a statutory UK grant scheme.
   £5,000 pays for premises improvements; cash is not paid into the shop.
   Bonus affects the next completed trading month and lasts six turns. */
const IMPROVEMENT_GRANT = Object.freeze({cost:5000,transactionUplift:0.10,durationMonths:6});
function grantForPremise(grants,premiseId){return (grants||[]).find(g=>g.premiseId===premiseId);}
function isGrantActive(grants,premiseId,tradingMonth){
 const g=grantForPremise(grants,premiseId);
 return !!g && tradingMonth>=g.awardedMonth && tradingMonth<g.awardedMonth+IMPROVEMENT_GRANT.durationMonths;
}
function awardImprovementGrant(state,premise){
 if(!premise || !premise.occupied)throw new Error('Grants require an occupied premise.');
 if(grantForPremise(state.grants,premise.id))throw new Error('This premise has already received a grant.');
 if(state.councilBudget<IMPROVEMENT_GRANT.cost)throw new Error('Insufficient regeneration funds.');
 return {...state,councilBudget:state.councilBudget-IMPROVEMENT_GRANT.cost,
  grants:[...(state.grants||[]),{premiseId:premise.id,awardedMonth:state.month}]};
}
