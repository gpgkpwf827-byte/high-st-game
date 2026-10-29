/* High Street Stage 10A.2 — vacant premises improvement grants.
   New gameplay state is additive, no existing tenant/council choices removed.
   Physical condition is canonical in property.js / property-condition.js. */
(function(){
'use strict';
const TIERS=Object.freeze({
 shopfront:{title:'Shopfront Improvement Grant',cost:3000,improvement:15,description:'Frontage repairs, repainting, windows and signage.'},
 comprehensive:{title:'Comprehensive Improvement Grant',cost:7500,improvement:35,description:'Internal repairs, business readiness and frontage improvements.'}
});
const APPEAL_LIMIT=15;
function vacancyAppeal(state){
 let total=0;
 for(const p of currentPremises(state)){
  if(p.occupied)continue;
  total+=(conditionScore(state,p.id)-50)/10;
 }
 return Math.max(-APPEAL_LIMIT,Math.min(APPEAL_LIMIT,Math.round(total*10)/10));
}
function previousGrants(state){return Array.isArray(state.vacantPremisesGrants)?state.vacantPremisesGrants:[];}
function canImprove(state,id,tier){
 const option=TIERS[tier];if(!option)return 'Unknown improvement scheme.';
 const premise=currentPremise(state,id);
 if(!premise||premise.occupied)return 'The unit must be vacant.';
 if(previousGrants(state).some(x=>x.premiseId===id))return 'This premise has already received its one improvement grant this game.';
 if(conditionScore(state,id)>=100)return 'The property is already in excellent condition (100/100).';
 return actionBlockReason(state,option.cost,1);
}
function provideImprovement(state,id,tier){
 const reason=canImprove(state,id,tier);if(reason)throw Error(reason);
 const option=TIERS[tier],before=conditionScore(state,id),after=Math.min(100,before+option.improvement);
 // First charge the Action Point using the existing capacity system, then council funds.
 const charged=spendCapacity(state,1);
 return {...charged,councilBudget:charged.councilBudget-option.cost,
  propertyConditions:{...charged.propertyConditions,[id]:{...charged.propertyConditions[id],condition:after}},
  vacantPremisesGrants:[...previousGrants(state),{premiseId:id,month:state.month,tier,councilCost:option.cost,landlordContribution:option.cost,from:before,to:after}]};
}
// Reuse the existing town attractiveness model, changing only attractiveness.
// Current condition is recalculated each month; improvements do not stack permanent bonuses.
const originalTownMetrics=townMetrics;
townMetrics=function(state){
 const result=originalTownMetrics.apply(this,arguments);
 const effect=vacancyAppeal(state);
 return {...result,attractiveness:Math.max(0,Math.min(100,result.attractiveness+effect)),vacancyAttractivenessEffect:effect};
};
const fmt=currency;
const doc=document;
const make=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function showGrantOptions(id){
 const premise=currentPremise(game,id),details=doc.getElementById('details');if(!details)return;
 let panel=doc.getElementById('hs10-improvement-panel');
 if(!panel){panel=make('section','hs10-improvement-panel');panel.id='hs10-improvement-panel';doc.getElementById('tenant-section')?.before(panel);}
 if(premise?.occupied){panel.hidden=true;return;}
 panel.hidden=false;panel.replaceChildren();
 const heading=make('h4',null,'Vacant Premises Improvement Grant');panel.append(heading);
 const before=conditionScore(game,id),used=previousGrants(game).find(x=>x.premiseId===id);
 const actual=vacancyAppeal(game);
 panel.append(make('p','hs10-muted','Condition '+before+'/100 · '+conditionBand(before)+' · Town appeal '+(actual>=0?'+':'')+actual.toFixed(1)+' (max ±15)'));
 if(used){panel.append(make('p','hs10-used','Grant completed in Month '+used.month+' · '+TIERS[used.tier].title+' · Condition '+used.from+' → '+used.to+'. One grant per unit.'));return;}
 const choices=make('div','hs10-grant-choices');const preview=make('div','hs10-grant-preview');const status=make('p','hs10-unavailable');
 const confirmBtn=make('button','hs10-grant-confirm');confirmBtn.type='button';
 let selected='shopfront',confirming=false;
 function refresh(){
  const opt=TIERS[selected],after=Math.min(100,before+opt.improvement);
  const prospect={...game,propertyConditions:{...game.propertyConditions,[id]:{...game.propertyConditions[id],condition:after}}};
  const projected=vacancyAppeal(prospect),reason=canImprove(game,id,selected);
  [...choices.children].forEach(x=>{const yes=x.dataset.tier===selected;x.classList.toggle('hs10-selected',yes);x.setAttribute('aria-pressed',String(yes));});
  preview.replaceChildren();
  preview.append(make('strong',null,opt.title),make('p',null,opt.description));
  preview.append(make('small',null,'Council '+fmt(opt.cost)+' · Landlord '+fmt(opt.cost)+' · 1 Action Point'));
  preview.append(make('small',null,'Condition '+before+' → '+after+' (+'+(after-before)+') · Town appeal '+(actual>=0?'+':'')+actual.toFixed(1)+' → '+(projected>=0?'+':'')+projected.toFixed(1)));
  status.textContent=reason||'';confirmBtn.disabled=!!reason;
  confirmBtn.textContent=confirming?'Confirm '+fmt(opt.cost)+' grant':'Review '+fmt(opt.cost)+' grant';
 }
 for(const [tier,opt] of Object.entries(TIERS)){
  const button=make('button','hs10-choice');button.type='button';button.dataset.tier=tier;
  button.append(make('strong',null,tier==='shopfront'?'Shopfront':'Comprehensive'),make('small',null,fmt(opt.cost)));
  button.addEventListener('click',()=>{selected=tier;confirming=false;refresh();});choices.append(button);
 }
 confirmBtn.addEventListener('click',()=>{
  if(!confirming){confirming=true;refresh();const note=make('p','hs10-confirm-note','Confirm spending '+fmt(TIERS[selected].cost)+' and 1 Action Point? The landlord matches the council contribution.');preview.append(note);return;}
  try{game=provideImprovement(game,id,selected);persist();renderAll();inspectPremise(id,false);openPanel('details');}
  catch(e){status.textContent=e.message;confirming=false;refresh();}
 });
 panel.append(choices,preview,status,confirmBtn);refresh();
}

const originalInspect=inspectPremise;
inspectPremise=function(id){
 const result=originalInspect.apply(this,arguments);
 showGrantOptions(id);
 // Stage 10A.1 retained old vacancy-age copy after replacing the underlying cost rule.
 const p=currentPremise(game,id);
 if(p&&!p.occupied){
  const tenants=doc.getElementById('tenant-section');
  const intro=tenants?.querySelector('p');
  if(intro)intro.textContent='Condition: '+conditionBand(conditionScore(game,id))+' ('+conditionScore(game,id)+'/100). Tenant fit-out estimates include repairs required by the property condition and category-specific works. The selected shop opens immediately, trading next month.';
  const old=tenants?.querySelector('.property-summary');
  if(old)old.textContent='Property condition '+conditionScore(game,id)+'/100 · '+conditionBand(conditionScore(game,id))+' · Fit-out repair allowance '+fmt((100-conditionScore(game,id))*PROPERTY_COSTS.conditionCoefficient)+' before applicant-specific costs. Improving the property lowers this allowance.';
 }
 return result;
};
window.HighStreetPropertyImprovements=Object.freeze({grant:provideImprovement,reason:canImprove,appeal:vacancyAppeal,tiers:TIERS});
// Deliberately no new initial game or monthly-run wrappers: townMetrics derives
// the attractiveness contribution from current property condition on demand.
renderAll();
})();
