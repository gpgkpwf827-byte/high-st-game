/* Milestone 1D: transparent scenario rules, independent of the interface. */
const CHALLENGE=Object.freeze({lastMonth:12,goalOccupied:8,tenantFitout:12000,monthlyDemandDecline:0.025});
const TENANT_TEMPLATES=Object.freeze([
 {name:'The Flower House',type:'Florist',icon:'💐',colour:'#b47a91',description:'A new independent florist supported by the council fit-out.',finance:{transactions:480,averageSale:21,rent:1050,wages:2700,otherCosts:4400,monthlyBusinessRates:350,cash:12500}},
 {name:'Little Lantern',type:'Gift shop',icon:'🎁',colour:'#b98e52',description:'A small gift and homewares shop taking on a vacant unit.',finance:{transactions:610,averageSale:16,rent:1150,wages:2500,otherCosts:4700,monthlyBusinessRates:390,cash:13000}},
 {name:'Fresh Start',type:'Greengrocer',icon:'🍎',colour:'#79a47d',description:'An independent fruit and vegetable shop.',finance:{transactions:1200,averageSale:10,rent:1250,wages:3800,otherCosts:6100,monthlyBusinessRates:440,cash:15500}}
]);
const EVENTS=Object.freeze({
 4:{title:'Spring town market',description:'Support a two-month market and local promotions programme?',cost:8000,uplift:0.07,duration:2},
 8:{title:'Autumn high street campaign',description:'Fund a three-month campaign to draw people back into the centre?',cost:12000,uplift:0.10,duration:3}
});
function startingGame(){return {version:1,month:1,councilBudget:GAME_CONFIG.startingBudget,
 cashByPremise:Object.fromEntries(PREMISES.filter(p=>p.occupied).map(p=>[p.id,p.finance.cash])),
 latestResults:[],grants:[],businesses:{},interventions:[],decisions:[],history:[],closed:[],opened:[]};}
function currentPremise(state,id){return state.businesses[id]||PREMISES.find(p=>p.id===id);}
function currentPremises(state){return PREMISES.map(p=>currentPremise(state,p.id));}
function occupiedPremises(state){return currentPremises(state).filter(p=>p.occupied);}
function challengeFinished(state){return state.month>CHALLENGE.lastMonth;}
function pendingEvent(state){return !challengeFinished(state) && EVENTS[state.month] && !state.decisions.some(d=>d.month===state.month) ? EVENTS[state.month]:null;}
function decideEvent(state,fund){
 const e=pendingEvent(state);if(!e)throw Error('No pending council decision.');
 if(fund&&state.councilBudget<e.cost)throw Error('Insufficient council funds.');
 return {...state,councilBudget:state.councilBudget-(fund?e.cost:0),decisions:[...state.decisions,{month:state.month,funded:fund,cost:fund?e.cost:0}],
 interventions:fund?[...state.interventions,{startMonth:state.month,duration:e.duration,uplift:e.uplift}]:state.interventions};
}
function openTenant(state,id){
 const vacant=currentPremise(state,id);
 if(!vacant||vacant.occupied)throw Error('Only vacant premises can welcome tenants.');
 if(challengeFinished(state))throw Error('Challenge complete.');
 if(state.councilBudget<CHALLENGE.tenantFitout)throw Error('Insufficient regeneration funding.');
 const template=TENANT_TEMPLATES[(id-8+TENANT_TEMPLATES.length)%TENANT_TEMPLATES.length];
 const p={...vacant,...template,id,occupied:true,side:vacant.side,finance:{...template.finance}};
 return {...state,councilBudget:state.councilBudget-CHALLENGE.tenantFitout,
 businesses:{...state.businesses,[id]:p},cashByPremise:{...state.cashByPremise,[id]:p.finance.cash},
 opened:[...state.opened,{id,month:state.month,name:p.name}]};
}
function runChallengeMonth(state){
 if(challengeFinished(state))throw Error('Challenge already ended.');
 if(pendingEvent(state))throw Error('Resolve the council event first.');
 const results=occupiedPremises(state).map(p=>calculateMonthlyTrading(p,state.cashByPremise[p.id],state.month,state.grants,state.interventions));
 const cashByPremise={...state.cashByPremise},businesses={...state.businesses},closed=[...state.closed];
 for(const r of results){
  cashByPremise[r.premiseId]=r.closingCash;
  if(r.closingCash<=0){
   const p=currentPremise(state,r.premiseId);
   businesses[p.id]={...p,occupied:false,name:'Unit '+p.id,type:'Vacant premise',icon:'🔑',colour:'#9fa7a0',description:'This unit became vacant after the previous business ran out of cash.'};
   closed.push({id:p.id,name:p.name,month:state.month});
  }
 }
 const occupancy=PREMISES.filter(p=>(businesses[p.id]||p).occupied).length;
 return {...state,month:state.month+1,cashByPremise,businesses,closed,latestResults:results,
 history:[...state.history,{month:state.month,occupancy,profit:results.reduce((s,r)=>s+r.profit,0),rates:results.reduce((s,r)=>s+r.businessRates,0),budget:state.councilBudget}]};
}
function finalOutcome(state){const occupied=occupiedPremises(state).length;
 return {occupied,won:challengeFinished(state)&&occupied>=CHALLENGE.goalOccupied,
 budget:state.councilBudget,opened:state.opened.length,closures:state.closed.length};}
