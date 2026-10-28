/* Stage 7C.1: deterministic, save-backed strategic opportunities.
 * Outcomes are rolled once at commitment and never re-rolled on refresh.
 */
const STRATEGIC_OPPORTUNITIES=Object.freeze({
 employer:{title:'Attract a major employer',cost:45000,points:2,chance:.65,delay:2,window:2,description:'Offer relocation support for a regional employer. If the bid succeeds, jobs and earnings improve gradually after the project is confirmed.',success:'Employment +1.8 and earnings +0.5 each trading month for three months after approval.',failure:'The relocation bid fails. The council does not recover its contribution.'},
 festival:{title:'Regional shopping festival',cost:18000,points:1,chance:.75,delay:0,window:2,description:'Underwrite a high-profile town festival. The outcome is immediate and a successful event gives temporary extra customers and spending.',success:'Footfall +20% and trading Spending Power +3 for two months.',failure:'The festival fails to attract enough visitors. The investment is lost.'},
 cinema:{title:'Redevelop the former cinema',cost:55000,points:2,chance:.45,delay:2,window:2,description:'Help a private operator restore the old cinema. The decision takes time and may not succeed.',success:'Once delivered: footfall +8% and Attractiveness +4 for the rest of the challenge.',failure:'The redevelopment falls through. The council does not recover its contribution.'}
});
function opportunityRandom(seed,salt){let x=((seed>>>0)^(salt*2654435761))>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}
function opportunitySchedule(seed){
 const types=['employer','festival','cinema'];
 return types.map((type,i)=>({type,offerMonth:[2,5,6][i]+(opportunityRandom(seed,11+i)>.52?1:0),available:opportunityRandom(seed,31+i)<.88})).filter(x=>x.available);
}
function initialOpportunities(seed,fromMonth=1){return opportunitySchedule(seed).filter(x=>x.offerMonth>=fromMonth).map(x=>({type:x.type,offerMonth:x.offerMonth,expiresMonth:x.offerMonth+STRATEGIC_OPPORTUNITIES[x.type].window-1,status:'offered'}));}
function opportunityEntries(state){return Array.isArray(state.strategicOpportunities)?state.strategicOpportunities:[];}
function opportunityStatus(entry,month){return entry.status==='offered'&&month>entry.expiresMonth?'expired':entry.status;}
function normaliseOpportunities(state){
 const seed=Number.isInteger(state.opportunitySeed)?state.opportunitySeed:Math.floor(Math.random()*4294967296);
 return {...state,opportunitySeed:seed,strategicOpportunities:Array.isArray(state.strategicOpportunities)?state.strategicOpportunities:initialOpportunities(seed,state.month).map(x=>({...x}))};
}
function opportunityAvailability(state,type){
 const item=opportunityEntries(state).find(x=>x.type===type),p=STRATEGIC_OPPORTUNITIES[type];
 if(!item||!p||opportunityStatus(item,state.month)!=='offered'||state.month<item.offerMonth)return 'This opportunity is not currently available.';
 if(challengeFinished(state))return 'The challenge is complete.';
 if(state.councilBudget<p.cost)return 'Insufficient council funds.';
 if(actionsRemaining(state)<p.points)return 'Not enough Council Action Points.';
 return null;
}
function decideOpportunity(state,type,invest){
 const item=opportunityEntries(state).find(x=>x.type===type);
 if(!item||opportunityStatus(item,state.month)!=='offered'||state.month<item.offerMonth)throw Error('Opportunity no longer available.');
 if(!invest)return {...state,strategicOpportunities:opportunityEntries(state).map(x=>x===item?{...x,status:'declined',decidedMonth:state.month}:x)};
 const reason=opportunityAvailability(state,type);if(reason)throw Error(reason);
 const p=STRATEGIC_OPPORTUNITIES[type];
 const funded=spendCapacity(state,p.points);
 const success=opportunityRandom(state.opportunitySeed,[...type].reduce((n,c)=>n*31+c.charCodeAt(0),7))<p.chance;
 const resultMonth=state.month+p.delay;
 return {...funded,councilBudget:funded.councilBudget-p.cost,strategicOpportunities:opportunityEntries(state).map(x=>x===item?{...x,status:p.delay?'pending':success?'succeeded':'failed',investedMonth:state.month,decidedMonth:state.month,resultMonth,success,cost:p.cost}:x)};
}
function settleOpportunities(state,completedMonth){
 return {...state,strategicOpportunities:opportunityEntries(state).map(x=>{
  if(x.status==='offered'&&completedMonth>=x.expiresMonth)return {...x,status:'expired'};
  if(x.status==='pending'&&completedMonth>=x.resultMonth)return {...x,status:x.success?'succeeded':'failed'};
  return x;
 })};
}
function opportunityEffects(state,month){
 const result={employment:0,earnings:0,footfall:0,attractiveness:0,spendingPower:0};
 for(const x of opportunityEntries(state)){
  if(!x.success||!Number.isInteger(x.resultMonth)||month<x.resultMonth)continue;
  if(x.type==='employer'&&month<x.resultMonth+3){result.employment+=1.8;result.earnings+=.5;}
  if(x.type==='festival'&&month<x.resultMonth+2){result.footfall+=.20;result.spendingPower+=3;}
  if(x.type==='cinema'){result.footfall+=.08;result.attractiveness+=4;}
 }
 return result;
}
function opportunitiesJustResolved(previous,next){
 const prior=new Map(opportunityEntries(previous).map(x=>[x.type,x.status]));
 return opportunityEntries(next).filter(x=>(x.status==='succeeded'||x.status==='failed')&&prior.get(x.type)==='pending');
}
