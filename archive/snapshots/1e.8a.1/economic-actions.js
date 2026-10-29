/* Stage 7B: council programmes. Values are provisional game parameters. */
const ECONOMIC_PROGRAMMES=Object.freeze({
 employment:{cost:25000,points:2,delay:2,duration:5,employmentPerMonth:0.9,earningsPerMonth:0.25},
 vouchers:{cost:10000,points:1,duration:2,spendingPower:4}
});
function economicProgrammes(state){return Array.isArray(state.economicProgrammes)?state.economicProgrammes:[];}
function programmeAvailability(state,type){
 const p=ECONOMIC_PROGRAMMES[type];if(!p)return 'Unknown programme.';
 if(challengeFinished(state))return 'The challenge is complete.';
 const previous=economicProgrammes(state).filter(x=>x.type===type);
 if(type==='employment'&&previous.length)return 'The employment programme has already been funded this challenge.';
 if(type==='vouchers'&&previous.some(x=>state.month<=x.startMonth+p.duration-1))return 'A voucher scheme is already active.';
 if(state.councilBudget<p.cost)return 'Insufficient council funds.';
 if(actionsRemaining(state)<p.points)return 'Not enough Council Action Points.';
 return null;
}
function fundEconomicProgramme(state,type){
 const reason=programmeAvailability(state,type);if(reason)throw Error(reason);
 const p=ECONOMIC_PROGRAMMES[type];
 const funded=spendCapacity(state,p.points);
 return {...funded,councilBudget:funded.councilBudget-p.cost,economicProgrammes:[...economicProgrammes(funded),{type,startMonth:state.month,cost:p.cost}]};
}
function appliedProgrammeEffects(state,month){
 let employment=0,earnings=0,spendingPower=0;
 for(const x of economicProgrammes(state)){
  if(x.type==='employment'){
   const p=ECONOMIC_PROGRAMMES.employment;
   if(month>=x.startMonth+p.delay&&month<x.startMonth+p.delay+p.duration){employment+=p.employmentPerMonth;earnings+=p.earningsPerMonth;}
  }else if(x.type==='vouchers'){
   const p=ECONOMIC_PROGRAMMES.vouchers;
   if(month>=x.startMonth&&month<x.startMonth+p.duration)spendingPower+=p.spendingPower;
  }
 }
 return {employment,earnings,spendingPower};
}
