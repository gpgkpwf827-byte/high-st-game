/* High Street Stage 9B.1: owner-initiated requests.
   Additive presentation and state logic. Keeps save key/version and economic code unchanged. */
(function(){
 'use strict';
 const TYPES=Object.freeze({
  seating:{title:'Outdoor seating',categories:['Café','Restaurant','Pub'],cost:3000,permission:.60,supported:.82,freeUplift:.03,supportedUplift:.05,description:'The owner wants to offer outdoor tables, subject to council permission.'},
  deliveries:{title:'Delivery and loading access',categories:['Bakery','Convenience store','Greengrocer','Takeaway'],cost:2000,permission:.75,supported:.90,freeUplift:.02,supportedUplift:.04,description:'The owner asks for a more practical arrangement for receiving deliveries.'},
  frontage:{title:'Shopfront improvements',categories:null,cost:4000,permission:.55,supported:.78,freeUplift:.03,supportedUplift:.06,description:'The owner wants to improve the appearance of their shopfront.'}
 });
 const DURATION=3;
 const seedNumber=(seed,salt)=>{
   let x=((seed>>>0)^Math.imul(salt,2654435761))>>>0;
   x=Math.imul(x^(x>>>16),2246822507)>>>0;
   x=Math.imul(x^(x>>>13),3266489909)>>>0;
   return ((x^(x>>>16))>>>0)/4294967296;
 };
 const getRequests=s=>Array.isArray(s.ownerRequests)?s.ownerRequests:[];
 const eligible=(p,type)=>p.occupied&&(!TYPES[type].categories||TYPES[type].categories.includes(p.type));
 const owning=(s,r)=>{const p=currentPremise(s,r.premiseId);return p&&p.occupied&&p.name===r.businessName;};
 function initialise(s){
  if(Number.isInteger(s.ownerRequestsStartedMonth))return s;
  // For legacy saves, begin the new system in the current month, never invent old offers.
  return {...s,ownerRequests:getRequests(s),ownerRequestsStartedMonth:s.month,ownerRequestSeed:((s.riskSeed??81773)^(s.opportunitySeed??0)^0x9b1009)>>>0};
 }
 function nextOffer(s){
  const lastMonth=(typeof CHALLENGE!=='undefined'&&Number.isInteger(CHALLENGE.lastMonth))?CHALLENGE.lastMonth:12;
  // A new request must be able to resolve in a playable trading month.
  if(s.month>=lastMonth||s.month<2||s.month%2!==0)return s;
  if(getRequests(s).some(r=>r.offeredMonth===s.month))return s;
  if(getRequests(s).some(r=>r.status==='offered'&&s.month<=r.expiresMonth))return s;
  const candidates=[];
  for(const p of currentPremises(s))for(const type of Object.keys(TYPES)){
   if(!eligible(p,type))continue;
   if(getRequests(s).some(r=>r.premiseId===p.id&&r.type===type&&s.month-r.offeredMonth<5))continue;
   candidates.push({p,type});
  }
  if(!candidates.length)return s;
  const ix=Math.floor(seedNumber(s.ownerRequestSeed,s.month*173+11)*candidates.length);
  const chosen=candidates[ix];
  const request={shown:false,id:'owner-'+s.month+'-'+chosen.p.id+'-'+chosen.type,premiseId:chosen.p.id,businessName:chosen.p.name,type:chosen.type,offeredMonth:s.month,expiresMonth:Math.min(lastMonth-1,s.month+1),status:'offered',response:null,success:null,investedAmount:0,pointsUsed:0,outcomeMonth:null};
  return {...s,ownerRequests:[...getRequests(s),request].slice(-30)};
 }
 function advance(s){
  const requests=getRequests(s).map(r=>{
   if(r.status==='offered'){
    if(!owning(s,r))return {...r,status:'cancelled',note:'Business closed before a council decision.'};
    if(s.month>r.expiresMonth)return {...r,status:'expired'};
   }
   if(r.status==='pending'&&s.month>=r.outcomeMonth){
    if(!owning(s,r))return {...r,status:'cancelled',note:'Business closed before the project was delivered.'};
    return {...r,status:r.success?'succeeded':'failed'};
   }
   return r;
  });
  return nextOffer({...s,ownerRequests:requests});
 }
 function answer(s,id,response){
  const r=getRequests(s).find(x=>x.id===id);
  if(!r||r.status!=='offered'||s.month>r.expiresMonth||!owning(s,r))throw Error('This owner request is no longer available.');
  if(!['permission','support','decline'].includes(response))throw Error('Invalid response.');
  const type=TYPES[r.type];
  if(response==='support'){
   if(s.councilBudget<type.cost)throw Error('Not enough council funding.');
   if(actionsRemaining(s)<1)throw Error('Not enough Action Points.');
  }
  const supported=response==='support';
  const funded=supported?spendCapacity(s,1):s;
  const probability=supported?type.supported:type.permission;
  const salt=r.offeredMonth*457+r.premiseId*31+Object.keys(TYPES).indexOf(r.type)*191;
  const success=response==='decline'?false:seedNumber(s.ownerRequestSeed,salt)<probability;
  return {...funded,councilBudget:funded.councilBudget-(supported?type.cost:0),
   ownerRequests:getRequests(s).map(x=>x.id===id?{...x,response,investedAmount:supported?type.cost:0,pointsUsed:supported?1:0,probability:response==='decline'?0:probability,success:response==='decline'?false:success,
    status:response==='decline'?'declined':'pending',decisionMonth:s.month,outcomeMonth:response==='decline'?null:s.month+1}:x)};
 }
 function transactionBoost(s,p,month){
  return getRequests(s).filter(r=>r.premiseId===p.id&&r.businessName===p.name&&(r.status==='succeeded'||(r.status==='pending'&&r.success===true))&&month>=r.outcomeMonth&&month<r.outcomeMonth+DURATION).reduce((sum,r)=>sum+(r.response==='support'?TYPES[r.type].supportedUplift:TYPES[r.type].freeUplift),0);
 }
 // Apply the modifier only within the state actively being simulated, never stale UI state.
 let tradingState=null;
 // Integrate a narrow, explainable transaction modifier; all original trading maths remain in charge.
 if(typeof calculateMonthlyTrading==='function'){
  const prior=calculateMonthlyTrading;
  calculateMonthlyTrading=function(p,cash,month,grants,interventions,band,metrics){
   const r=prior.apply(this,arguments);
   const boost=transactionBoost(tradingState||game,p,month);
   if(!boost)return r;
   const extra=Math.round(r.transactions*boost);
   const transactions=r.transactions+extra;
   const revenue=Math.round(transactions*r.averageSale*100)/100;
   const addedRevenue=Math.round((revenue-r.revenue)*100)/100;
   const linkedCost=Math.round(addedRevenue*(typeof VARIABLE_COST_RATE==='number'?VARIABLE_COST_RATE:.55)*100)/100;
   const otherCosts=r.otherCosts+linkedCost,totalExpenses=r.totalExpenses+linkedCost,profit=revenue-totalExpenses;
   return {...r,transactions,revenue,otherCosts,totalExpenses,profit,closingCash:r.openingCash+profit,
     salesLinkedCost:r.salesLinkedCost+linkedCost,ownerRequestBoost:boost,ownerRequestExtraTransactions:extra};
  };
 }
 // Existing advance button calls runChallengeMonth dynamically, so wrap the completed turn.
 if(typeof runChallengeMonth==='function'){
  const prior=runChallengeMonth;
  runChallengeMonth=function(s){
   const previous=tradingState;tradingState=s;
   try{return advance(prior.apply(this,arguments));}
   finally{tradingState=previous;}
  };
 }
 // Published rules API: UI must not duplicate game rules or decision probabilities.
 window.HighStreetOwnerRequestRules=Object.freeze({TYPES,DURATION,getRequests,owning,initialise,nextOffer,advance,answer,transactionBoost});
})();
