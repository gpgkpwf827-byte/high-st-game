/* Milestone 1D challenge, extended with Stage 1 council rates ledger. */
const CHALLENGE=Object.freeze({lastMonth:12,goalOccupied:10,tenantFitout:12000});
const TENANT_TEMPLATES=Object.freeze([
 {name:'The Flower House',type:'Florist',icon:'💐',colour:'#b47a91',description:'A new independent florist supported by the council fit-out.',finance:{transactions:480,averageSale:21,rent:1050,wages:2700,otherCosts:4400,monthlyBusinessRates:350,cash:12500}},
 {name:'Little Lantern',type:'Gift shop',icon:'🎁',colour:'#b98e52',description:'A small gift and homewares shop taking on a vacant unit.',finance:{transactions:610,averageSale:16,rent:1150,wages:2500,otherCosts:4700,monthlyBusinessRates:390,cash:13000}},
 {name:'Fresh Start',type:'Greengrocer',icon:'🍎',colour:'#79a47d',description:'An independent fruit and vegetable shop.',finance:{transactions:1200,averageSale:10,rent:1250,wages:3800,otherCosts:6100,monthlyBusinessRates:440,cash:15500}}
,
 {name:'The Red Fox',type:'Pub',icon:'🍺',colour:'#865d48',description:'An independent pub aiming to attract afternoon and evening trade.',finance:{transactions:850,averageSale:14,rent:1750,wages:5600,otherCosts:4900,monthlyBusinessRates:610,cash:17500}},
 {name:'Olive & Thyme',type:'Restaurant',icon:'🍽️',colour:'#a16c56',description:'A small independently run restaurant offering lunch and evening meals.',finance:{transactions:620,averageSale:25,rent:1800,wages:6700,otherCosts:5100,monthlyBusinessRates:670,cash:19500}},
 {name:'Green Threads',type:'Clothing shop',icon:'👕',colour:'#8b90aa',description:'A contemporary independent clothing boutique.',finance:{transactions:560,averageSale:29,rent:1500,wages:3300,otherCosts:8200,monthlyBusinessRates:480,cash:14000}},
 {name:'Little Oven',type:'Takeaway',icon:'🥡',colour:'#d19466',description:'A family-run takeaway serving local evening customers.',finance:{transactions:1150,averageSale:13,rent:1250,wages:4400,otherCosts:6200,monthlyBusinessRates:420,cash:13000}}]);
const EVENTS=Object.freeze({
 4:{title:'Spring town market',description:'Support a two-month market and local promotions programme?',cost:8000,uplift:.07,duration:2},
 8:{title:'Autumn high street campaign',description:'Fund a three-month campaign to draw people back into the centre?',cost:12000,uplift:.10,duration:3}
});
function startingGame(){const initial={version:3,month:1,councilBudget:GAME_CONFIG.startingBudget,
 cashByPremise:Object.fromEntries(PREMISES.filter(p=>p.occupied).map(p=>[p.id,p.finance.cash])),
 latestResults:[],grants:[],businesses:{},interventions:[],decisions:[],history:[],closed:[],opened:[],
 ratesBand:'standard',nextRatesBand:'standard',lastRatesReceipt:0,totalRatesReceived:0,lossStreaks:{},riskSeed:81773,lastClosures:[],applicantChoices:{},councilPolicies:{cleaning:'basic',lighting:'basic'},transportChoice:null,marketingUntil:0,lastServiceCost:0,totalServiceCost:0};
 return {...initial,startingVitality:commercialVitality(initial).score};}
function normaliseGame(state){return {...state,version:3,lossStreaks:state.lossStreaks||{},riskSeed:state.riskSeed??81773,lastClosures:state.lastClosures||[],applicantChoices:state.applicantChoices||{},ratesBand:state.ratesBand||'standard',nextRatesBand:state.nextRatesBand||state.ratesBand||'standard',lastRatesReceipt:state.lastRatesReceipt||0,totalRatesReceived:state.totalRatesReceived||0,councilPolicies:state.councilPolicies||{cleaning:'basic',lighting:'basic'},transportChoice:state.transportChoice||null,marketingUntil:state.marketingUntil||0,lastServiceCost:state.lastServiceCost||0,totalServiceCost:state.totalServiceCost||0};}
function setRatesPolicy(state,band){
 if(challengeFinished(state))throw Error('Challenge complete.');
 if(!Object.hasOwn(RATE_BANDS,band))throw Error('Unknown rates policy.');
 return {...state,nextRatesBand:band};
}
function currentPremise(state,id){return state.businesses[id]||PREMISES.find(p=>p.id===id);}
function currentPremises(state){return PREMISES.map(p=>currentPremise(state,p.id));}
function occupiedPremises(state){return currentPremises(state).filter(p=>p.occupied);}
function challengeFinished(state){return state.month>CHALLENGE.lastMonth;}
function pendingEvent(state){return !challengeFinished(state)&&EVENTS[state.month]&&!state.decisions.some(d=>d.month===state.month)?EVENTS[state.month]:null;}
function decideEvent(state,fund){
 const e=pendingEvent(state);if(!e)throw Error('No pending council decision.');
 if(fund&&state.councilBudget<e.cost)throw Error('Insufficient council funds.');
 return {...state,councilBudget:state.councilBudget-(fund?e.cost:0),decisions:[...state.decisions,{month:state.month,funded:fund,cost:fund?e.cost:0}],
 interventions:fund?[...state.interventions,{startMonth:state.month,duration:e.duration,uplift:e.uplift}]:state.interventions};
}
// Three stable, distinct applicants for each vacancy. Seeded selection is repeatable
// and cannot be re-rolled simply by opening/closing a panel or refreshing Safari.
// Applicant pool excludes types already trading anywhere on the high street.
// This keeps the current prototype diverse until competition is introduced.
function availableApplicantIndices(state){
 const occupiedTypes=new Set(occupiedPremises(state).map(p=>p.type));
 return TENANT_TEMPLATES.map((t,index)=>({t,index})).filter(x=>!occupiedTypes.has(x.t.type)).map(x=>x.index);
}
function applicantsForUnit(state,id){
 const p=currentPremise(state,id);
 if(!p||p.occupied)return [];
 const eligible=availableApplicantIndices(state);
 const stored=(state.applicantChoices||{})[id];
 // Older saved lists may contain a category that has since opened elsewhere.
 // Preserve surviving options and fill any gaps deterministically.
 const valid=Array.isArray(stored)?[...new Set(stored.filter(i=>eligible.includes(i)))]:[];
 const vacancySerial=(state.closed||[]).filter(x=>x.id===id).length;
 const seed=(state.riskSeed??81773)>>>0;
 const scored=eligible.filter(i=>!valid.includes(i)).map(index=>({index,sort:riskDraw(seed+vacancySerial*37,1,id,index+21)}));
 scored.sort((a,b)=>a.sort-b.sort||a.index-b.index);
 return valid.concat(scored.map(x=>x.index)).slice(0,3);
}
function ensureApplicants(state,id){
 const choices=applicantsForUnit(state,id);
 return {...state,applicantChoices:{...(state.applicantChoices||{}),[id]:choices}};
}
function openTenant(state,id,applicantIndex){
 const vacant=currentPremise(state,id);
 if(!vacant||vacant.occupied)throw Error('Only vacant premises can welcome tenants.');
 if(challengeFinished(state))throw Error('Challenge complete.');
 
 const choices=applicantsForUnit(state,id);
 if(!Number.isInteger(applicantIndex)||!choices.includes(applicantIndex))throw Error('Choose one of the currently available applicants.');
 const template=TENANT_TEMPLATES[applicantIndex];
 const fitout=tenantFitoutCost(state,id,applicantIndex);
 if(state.councilBudget<fitout)throw Error('Insufficient regeneration funding.');
 if(occupiedPremises(state).some(p=>p.type===template.type))throw Error('A business in this category is already trading.');
 const p={...vacant,...template,id,occupied:true,side:vacant.side,finance:{...template.finance}};
 const applicantChoices={...(state.applicantChoices||{})};delete applicantChoices[id];
 return {...state,councilBudget:state.councilBudget-fitout,applicantChoices,
 businesses:{...state.businesses,[id]:p},cashByPremise:{...state.cashByPremise,[id]:p.finance.cash},lossStreaks:{...(state.lossStreaks||{}),[id]:0},
 opened:[...state.opened,{id,month:state.month,name:p.name,type:p.type,fitout}]};
}
function runChallengeMonth(state){
 if(challengeFinished(state))throw Error('Challenge already ended.');
 if(pendingEvent(state))throw Error('Resolve the council event first.');
 const band=state.nextRatesBand||state.ratesBand||'standard';
 const metrics=townMetrics(state);
 const development=monthlyDevelopment(state);
 const adjustedMetrics={...metrics,footfall:Math.max(0,Math.round(metrics.footfall*(1+development.footfall))),spendingPower:Math.max(0,Math.min(100,metrics.spendingPower+development.spendingPower))};
 const results=occupiedPremises(state).map(p=>calculateMonthlyTrading(p,state.cashByPremise[p.id],state.month,state.grants,state.interventions,band,adjustedMetrics));
 const cashByPremise={...state.cashByPremise},businesses={...state.businesses},closed=[...state.closed],applicantChoices={...(state.applicantChoices||{})},lossStreaks={...(state.lossStreaks||{})},lastClosures=[];
 for(const r of results){
  cashByPremise[r.premiseId]=r.closingCash;
  const p=currentPremise(state,r.premiseId);
  const streak=r.profit<0?(lossStreaks[p.id]||0)+1:0;
  lossStreaks[p.id]=streak;
  const exitReason=evaluateExit(p,r,state,streak);
  if(exitReason){
   businesses[p.id]={...p,occupied:false,name:'Unit '+p.id,type:'Vacant premise',icon:'🔑',colour:'#9fa7a0',description:'Vacant following the departure of '+p.name+'. Reason: '+exitReason+'.'};
   const entry={id:p.id,name:p.name,month:state.month,reason:exitReason};closed.push(entry);lastClosures.push(entry);delete lossStreaks[p.id];delete applicantChoices[p.id];
  }
 }
 const ratesReceived=results.reduce((s,r)=>s+r.businessRates,0);
 const serviceCost=serviceCosts(state);
 const councilBudget=state.councilBudget+ratesReceived-serviceCost;
 const occupancy=PREMISES.filter(p=>(businesses[p.id]||p).occupied).length;
 const monthlySales=results.reduce((s,r)=>s+r.revenue,0);
 const monthlyExpenses=results.reduce((s,r)=>s+r.totalExpenses,0);
 const monthlyTransactions=results.reduce((s,r)=>s+r.transactions,0);
 const afterState={...state,businesses,cashByPremise,lossStreaks};
 const health=occupiedPremises(afterState).map(p=>businessRiskStatus(p,cashByPremise[p.id]||0,band,results.find(r=>r.premiseId===p.id),lossStreaks[p.id]||0));
 const stable=health.filter(h=>h.name==='Stable').length;
 const shopHistory=results.map(r=>({id:r.premiseId,name:currentPremise(state,r.premiseId).name,revenue:r.revenue,profit:r.profit,transactions:r.transactions,cash:r.closingCash}));
 return {...state,month:state.month+1,councilBudget,ratesBand:band,nextRatesBand:band,
  lastRatesReceipt:ratesReceived,totalRatesReceived:(state.totalRatesReceived||0)+ratesReceived,lastServiceCost:serviceCost,totalServiceCost:(state.totalServiceCost||0)+serviceCost,
  cashByPremise,businesses,closed,applicantChoices,lossStreaks,lastClosures,latestResults:results,
  history:[...state.history,{month:state.month,footfall:adjustedMetrics.footfall,spendingPower:adjustedMetrics.spendingPower,development:development.title,vitality:metrics.vitality,attractiveness:metrics.attractiveness,occupancy,profit:results.reduce((s,r)=>s+r.profit,0),sales:monthlySales,expenses:monthlyExpenses,transactions:monthlyTransactions,stable,openings:(state.opened||[]).filter(o=>o.month===state.month).length,closures:lastClosures.length,rates:ratesReceived,serviceCost,netCouncil:ratesReceived-serviceCost,ratesBand:band,budget:councilBudget,shops:shopHistory}]};
}
function finalOutcome(state){const occupied=occupiedPremises(state).length;
 return {occupied,won:challengeFinished(state)&&occupied>=CHALLENGE.goalOccupied,
 budget:state.councilBudget,opened:state.opened.length,closures:state.closed.length};}
