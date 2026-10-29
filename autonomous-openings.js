/* High Street Stage 10B.1 — autonomous business openings.
   Business-led fit-out is privately funded; no council money or AP is spent.
   The legacy player-led code remains available in the previous release for rollback. */
(function () {
 'use strict';
 const POLICY=Object.freeze({baseMonthlyChance:.085,minChance:.005,maxChance:.20,privateBudgetFactor:1.7});
 const clamp01=(n,a,b)=>Math.max(a,Math.min(b,n));
 const hash=(seed,salt)=>{
  let x=((seed>>>0)^Math.imul(salt>>>0,0x9e3779b1))>>>0;
  x=Math.imul(x^(x>>>16),0x85ebca6b)>>>0;
  x=Math.imul(x^(x>>>13),0xc2b2ae35)>>>0;
  return ((x^(x>>>16))>>>0)/4294967296;
 };
 function draw(state,month,id,salt){
  const seed=((state.riskSeed??81773)^(state.opportunitySeed??0)^0x10b10000)>>>0;
  return hash(seed,Math.imul(month+1,1013)+Math.imul(id,37)+salt);
 }
 function uniqueAvailable(state){
  const occupied=new Set(occupiedPremises(state).map(p=>p.type));
  return TENANT_TEMPLATES.map((t,index)=>({t,index})).filter(x=>!occupied.has(x.t.type));
 }
 // Broad retail viability rather than treating each shop as economically identical.
 const categoryWeight=Object.freeze({
  'Florist':{spend:.65,foot:.75},'Gift shop':{spend:1.15,foot:1.05},
  'Greengrocer':{spend:.40,foot:.70},'Pub':{spend:.65,foot:1},
  'Restaurant':{spend:1.15,foot:1},'Clothing shop':{spend:1.20,foot:1.15},
  'Takeaway':{spend:.45,foot:.75}
 });
 function privateBudget(state,id,index){
  const t=TENANT_TEMPLATES[index];
  // Investor budget is separate from post-opening cash reserves.
  const base=17500+Math.round(t.finance.cash*POLICY.privateBudgetFactor);
  return Math.round((base+(draw(state,0,id,index+911)-.5)*11000)/500)*500;
 }
 function openingChance(state,id,index,metrics){
  const condition=conditionScore(state,id),fitout=tenantFitoutCost(state,id,index),budget=privateBudget(state,id,index);
  if(fitout>budget)return {chance:0,fitout,budget,affordable:false};
  const weights=categoryWeight[TENANT_TEMPLATES[index].type]||{spend:.8,foot:.8};
  const conditionFactor=clamp01(.35+condition/100*1.1,.35,1.45);
  const townFactor=clamp01(.55+(metrics.attractiveness||0)/100*1.1,.55,1.65);
  const footFactor=clamp01(1+((metrics.footfall||7500)/7500-1)*weights.foot,.4,1.6);
  const spendingFactor=clamp01(1+((metrics.spendingPower||38)-38)/55*weights.spend,.45,1.55);
  const affordabilityFactor=clamp01(.7+.3*(budget-fitout)/Math.max(budget,1),.7,1);
  const chance=clamp01(POLICY.baseMonthlyChance*conditionFactor*townFactor*footFactor*spendingFactor*affordabilityFactor,POLICY.minChance,POLICY.maxChance);
  return {chance,fitout,budget,affordable:true};
 }
 function shortlist(state,id,metrics){
  return uniqueAvailable(state).map(({index,t})=>({index,type:t.type,...openingChance(state,id,index,metrics)})).filter(x=>x.affordable);
 }
 function applyOpening(state,id,option){
  const vacant=currentPremise(state,id),template=TENANT_TEMPLATES[option.index];
  if(!vacant||vacant.occupied||occupiedPremises(state).some(p=>p.type===template.type))return state;
  const p={...vacant,...template,id,occupied:true,side:vacant.side,finance:{...template.finance}};
  const applicants={...(state.applicantChoices||{})};delete applicants[id];
  return {...state,applicantChoices:applicants,
   businesses:{...state.businesses,[id]:p},
   cashByPremise:{...state.cashByPremise,[id]:p.finance.cash},
   lossStreaks:{...(state.lossStreaks||{}),[id]:0},
   opened:[...(state.opened||[]),{id,month:state.month-1,name:p.name,type:p.type,fitout:option.fitout,privatelyFunded:true,privateInvestmentBudget:option.budget}]};
 }
 function assessMonth(state){
  // The completed month was state.month-1. Do not open after the final result.
  if(challengeFinished(state))return state;
  const completed=state.month-1;
  let updated=state;
  const openings=[];
  for(const p of currentPremises(state)){
   const vacancy=currentPremise(updated,p.id);
   if(vacancy.occupied)continue;
   const metrics=townMetrics(updated);
   const options=shortlist(updated,p.id,metrics);
   // Per-unit probability: assess whether *any* available entrepreneur is ready,
   // then select amongst affordable category candidates.
   const average=options.length?options.reduce((sum,x)=>sum+x.chance,0)/options.length:0;
   if(draw(updated,completed,p.id,503)>=average)continue;
   let total=0;const weighted=options.map(x=>{total+=x.chance;return {...x,cumulative:total};});
   if(!total)continue;
   const pick=draw(updated,completed,p.id,701)*total;
   const chosen=weighted.find(x=>pick<x.cumulative)||weighted[weighted.length-1];
   updated=applyOpening(updated,p.id,chosen);
   openings.push({premiseId:p.id,name:TENANT_TEMPLATES[chosen.index].name,type:chosen.type,fitout:chosen.fitout});
  }
  return {...updated,lastIndependentOpenings:openings};
 }
 const priorMonthly=runChallengeMonth;
 runChallengeMonth=function(state){return assessMonth(priorMonthly.call(this,state));};
 const oldTenantPanel=renderTenantPanel;
 renderTenantPanel=function(p){
  if(p.occupied)return oldTenantPanel.apply(this,arguments);
  const panel=document.getElementById('tenant-section');if(!panel)return;
  panel.hidden=false;panel.replaceChildren();
  const heading=document.createElement('h4');heading.textContent='Independent business interest';
  const intro=document.createElement('p');intro.textContent='Businesses decide independently whether to open at the end of each month. Their own investment pays for fit-out work; council funds and Action Points are never deducted automatically.';
  const score=conditionScore(game,p.id),metrics=townMetrics(game),choices=shortlist(game,p.id,metrics);
  const info=document.createElement('p');info.className='property-summary';
  const average=choices.length?choices.reduce((sum,x)=>sum+x.chance,0)/choices.length:0;
  info.textContent='Condition '+score+'/100 · '+choices.length+' affordable business categories currently available · indicative chance of an independent opening next month '+Math.round(average*100)+'%. This changes with property condition and the local economy.';
  panel.append(heading,intro,info);
  const explanation=document.createElement('small');explanation.textContent='These probabilities are estimates, not promises. Vacant Premises Improvement Grants can reduce private fit-out requirements and improve the chance of investment.';panel.append(explanation);
 };
 const earlierInspect=inspectPremise;
 inspectPremise=function(id){
  const result=earlierInspect.apply(this,arguments);
  const current=currentPremise(game,id);
  if(current&&!current.occupied)renderTenantPanel(current);
  return result;
 };
 const earlierReport=renderReport;
 renderReport=function(){
  const result=earlierReport.apply(this,arguments);
  const panel=document.getElementById('report');
  if(panel){
   panel.querySelector('#hs10b-openings')?.remove();
   const arrivals=Array.isArray(game.lastIndependentOpenings)?game.lastIndependentOpenings:[];
   if(arrivals.length){
    const note=document.createElement('div');note.id='hs10b-openings';note.className='note';
    note.textContent='New independent opening'+(arrivals.length===1?'':'s')+': '+arrivals.map(x=>x.name+' (Unit '+x.premiseId+')').join(', ')+'. The businesses privately funded their fit-outs and will trade from this month.';
    panel.append(note);
   }
  }
  return result;
 };
 // Re-render after installing the new panel, with all other screens preserved.
 if(typeof renderAll==='function')renderAll();
 window.HighStreetAutonomy=Object.freeze({chance:openingChance,budget:privateBudget,assess:assessMonth,policy:POLICY});
})();
