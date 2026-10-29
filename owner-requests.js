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
 function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
 const formatPct=p=>Math.round(p*100)+'%';
 const statuses={offered:'Awaiting council response',pending:'Awaiting owner delivery',succeeded:'Completed successfully',failed:'Project did not proceed',declined:'Council declined',expired:'Request expired',cancelled:'Request cancelled'};
 // Compact selection: only one option's consequence appears at a time.
 // A change of selection does not commit funds or resolve the request.
 function card(r,interactive,source='notifications'){
  const t=TYPES[r.type];const box=el('section',undefined,'owner-request-card');box.dataset.requestId=r.id;
  box.append(el('strong',r.businessName+' · '+t.title));
  box.append(el('p',t.description,'owner-request-description'));
  box.append(el('p',statuses[r.status]+' · Month '+r.offeredMonth+(r.status==='offered'?' · Deadline M'+r.expiresMonth:''),'owner-request-meta'));
  if(r.status==='offered'){
   if(interactive&&!challengeFinished(game)&&owning(game,r)){
    let selected='permission';
    const opts=el('div',undefined,'owner-request-options');opts.setAttribute('role','group');
    opts.setAttribute('aria-label','Council response to '+t.title);
    const preview=el('p',undefined,'owner-request-preview');preview.setAttribute('aria-live','polite');
    const error=el('p',undefined,'owner-request-error');error.setAttribute('role','status');
    const confirmButton=el('button',undefined,'owner-request-confirm');confirmButton.type='button';
    const config={
     permission:{label:'Permit',display:'Permission',cost:0,ap:0,prob:t.permission,boost:t.freeUplift},
     support:{label:'Support',display:'Council support',cost:t.cost,ap:1,prob:t.supported,boost:t.supportedUplift},
     decline:{label:'Decline',display:'Decline',cost:0,ap:0,prob:null,boost:0}
    };
    const buttons={};
    function refresh(){
     for(const [value,b] of Object.entries(buttons))b.setAttribute('aria-pressed',String(value===selected));
     const x=config[selected];
     preview.textContent=selected==='decline'?'£0 · 0 AP · No project or trading benefit':
      currency(x.cost)+' · '+x.ap+' AP · '+formatPct(x.prob)+' completion chance · +'+Math.round(x.boost*100)+'% transactions for 3 trading months if completed';
     const unavailable=selected==='support'&&(game.councilBudget<t.cost||actionsRemaining(game)<1);
     confirmButton.disabled=unavailable;
     confirmButton.textContent='Confirm '+x.display.toLowerCase();
     error.textContent=unavailable?(game.councilBudget<t.cost?'Insufficient council funds.':'Requires 1 Action Point.') : '';
    }
    for(const value of ['permission','support','decline']){
     const b=el('button',config[value].label,'owner-request-option');b.type='button';
     b.addEventListener('click',()=>{selected=value;refresh();});opts.append(b);buttons[value]=b;
    }
    confirmButton.addEventListener('click',()=>{
     const x=config[selected];
     const prompt='Confirm '+x.display.toLowerCase()+' for '+r.businessName+'? '+
       (selected==='support'?'The council will spend '+currency(t.cost)+' and 1 Action Point.':'No council funds or Action Points will be used.');
     if(!confirm(prompt))return;
     try{game=answer(game,r.id,selected);persist();renderAll();
       if(source==='details'&&typeof inspectPremise==='function')inspectPremise(r.premiseId,false);
       else openPanel('notifications');
     }catch(e){error.textContent=e.message;}
    });
    box.append(opts,preview,error,confirmButton);refresh();
   }else{
    box.append(el('p','Awaiting council decision · Review via Notifications.','owner-request-meta'));
   }
  }else if(r.response&&r.response!=='decline'){
   const uplift=r.response==='support'?t.supportedUplift:t.freeUplift;
   const detail=r.status==='pending'?'Delivery decision due Month '+r.outcomeMonth+'.':
    r.status==='succeeded'?'Delivered: +'+Math.round(uplift*100)+'% transactions in Months '+r.outcomeMonth+'–'+(r.outcomeMonth+DURATION-1)+'.':
    (r.note||'The project did not deliver the proposed trading benefit.');
   box.append(el('p',(r.response==='support'?'Council spent '+currency(r.investedAmount)+' and 1 AP. ':'Permission granted at no council cost. ')+detail,'owner-request-meta'));
  }
  return box;
 }
 function renderOwnerRequests(){
  const all=getRequests(game),open=all.filter(r=>r.status==='offered'&&game.month<=r.expiresMonth&&owning(game,r));
  const notification=document.getElementById('notifications');
  if(notification){const section=el('div',undefined,'owner-request-section');section.append(el('h4','Business-owner requests'+(open.length?' ('+open.length+' awaiting response)':'')));
   const visible=all.filter(r=>r.offeredMonth<=game.month).slice(-7).reverse();
   if(!visible.length)section.append(el('p','No requests from business owners yet.'));
   for(const r of visible)section.append(card(r,true,'notifications'));notification.append(section);
  }
  decorateBusinessRows();
  const bell=document.getElementById('notification');
  if(bell&&open.length){bell.setAttribute('aria-label','Notifications — '+open.length+' owner requests awaiting response');}
 }
 // Wrap the final render pipeline after Stage 8B and 9A UI decorators.
 if(typeof renderAll==='function'){
  const prior=renderAll;renderAll=function(){const result=prior.apply(this,arguments);renderOwnerRequests();return result;};
 }
 // Combine an occupied shop's grant and owner-request information into one
 // compact disclosure. Existing grant button/handlers are moved, never cloned.
 function supportSection(){
  const details=document.getElementById('details');
  const grant=document.getElementById('grant-section');
  if(!details||!grant||selectedId===null)return;
  details.querySelectorAll('.owner-request-section').forEach(n=>n.remove());
  const p=currentPremise(game,selectedId);
  const existing=details.querySelector('.owner-support-disclosure');
  if(!p?.occupied){if(existing){existing.before(grant);existing.remove();}return;}
  const related=getRequests(game).filter(r=>r.premiseId===p.id&&r.businessName===p.name&&r.offeredMonth<=game.month).slice(-2).reverse();
  const outstanding=related.filter(r=>r.status==='offered'&&game.month<=r.expiresMonth&&owning(game,r));
  const section=existing||el('details',undefined,'owner-support-disclosure');
  if(!existing){grant.before(section);section.append(el('summary'));}
  const summary=section.querySelector('summary');summary.replaceChildren();
  summary.append(el('span','Council support & requests'));
  const count=outstanding.length;
  if(count){const badge=el('span',String(count),'owner-support-count');badge.setAttribute('aria-label',count+' outstanding owner request'+(count===1?'':'s'));summary.append(badge);}
  if(!existing){section.open=!!count;}
  else if(count&&section.dataset.previousPending!=='true')section.open=true;
  section.dataset.previousPending=String(!!count);
  const body=section.querySelector('.owner-support-body')||el('div',undefined,'owner-support-body');body.replaceChildren();
  if(related.length){
   const heading=el('h4','Owner requests','owner-support-subheading');body.append(heading);
   for(const r of related)body.append(card(r,true,'details'));
  }
  grant.hidden=false;grant.classList.add('owner-grant-condensed');body.append(grant);
  section.append(body);
 }
 if(typeof inspectPremise==='function'){
  const prior=inspectPremise;
  inspectPremise=function(){const result=prior.apply(this,arguments);supportSection();return result;};
 }
 function decorateBusinessRows(){
  const list=document.querySelector('#b1-businesses .b1-list');if(!list)return;
  const active=new Set(getRequests(game).filter(r=>r.status==='offered'&&game.month<=r.expiresMonth&&owning(game,r)).map(r=>r.businessName));
  for(const row of list.querySelectorAll('.b1-list-row')){
   const title=row.querySelector('strong');const name=title?.textContent;
   const badge=row.querySelector('.owner-business-request-badge');
   if(name&&active.has(name)){
    if(!badge){const n=el('span','Request','owner-business-request-badge');n.setAttribute('aria-label','Outstanding owner request');row.append(n);}
   }else badge?.remove();
  }
 }
 const businessView=document.getElementById('b1-businesses');
 if(businessView&&typeof MutationObserver!=='undefined'){
  let working=false;
  new MutationObserver(()=>{if(working)return;working=true;try{decorateBusinessRows();}finally{working=false;}}).observe(businessView,{childList:true,subtree:true});
 }
 // Stage 9B.1.3: single, explicit month-end presentation controller.
 // Closing a queued item never equals declining it. Seen flags remain in the save.
 let queueActive=false, eventShown=false;
 function availableOwner(){return getRequests(game).find(r=>r.status==='offered'&&game.month<=r.expiresMonth&&owning(game,r)&&!r.shown);}
 function presentOwner(){
  const r=availableOwner();if(!r)return false;
  game={...game,ownerRequests:getRequests(game).map(x=>x.id===r.id?{...x,shown:true}:x)};
  persist();renderAll();openPanel('notifications');
  const target=[...document.querySelectorAll('#notifications .owner-request-card')].find(n=>n.dataset.requestId===r.id);
  target?.scrollIntoView({block:'nearest'});return true;
 }
 function presentStrategic(){
  const seen=Array.isArray(game.seenStrategicOffers)?game.seenStrategicOffers:[];
  const offer=opportunityEntries(game).find(x=>x.status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth&&!seen.includes(x.type));
  if(!offer)return false;
  game={...game,seenStrategicOffers:[...seen,offer.type]};persist();showOffer(offer.type);return true;
 }
 function nextQueued(){
  if(!queueActive||!modal.hidden)return;
  if(challengeFinished(game)){queueActive=false;return;}
  if(!eventShown&&pendingEvent(game)){eventShown=true;openPanel('event');return;}
  if(presentStrategic())return;
  if(presentOwner())return;
  queueActive=false;
 }
 // Existing legacy event handlers call this. Never preempt an active report-first queue.
 if(typeof openNewStrategicOffer==='function'){
  const original=openNewStrategicOffer;
  openNewStrategicOffer=function(){
   if(queueActive)return false;
   return original.apply(this,arguments)||(!pendingEvent(game)&&presentOwner());
  };
 }
 // The legacy Close button registered the ORIGINAL closePanel as its event callback.
 // Wrapping closePanel alone cannot observe that callback; listen to the actual dismiss
 // interactions and continue AFTER the original listener has hidden the dialog.
 const dismissTargets=[document.getElementById('dismiss-modal'),document.getElementById('close')];
 for(const target of dismissTargets)target?.addEventListener('click',()=>{
  if(queueActive)queueMicrotask(nextQueued);
 });
 modal?.addEventListener('click',event=>{
  if(event.target===modal&&queueActive)queueMicrotask(nextQueued);
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&queueActive)queueMicrotask(nextQueued);
 });
 // Mandatory council event confirmation also calls closePanel; the actual close
 // happens in a different button callback, so observe that completion explicitly.
 const originalClose=closePanel;
 closePanel=function(){const result=originalClose.apply(this,arguments);
  if(queueActive)queueMicrotask(nextQueued);
  return result;
 };
 // Reset ALL modal content to its top; give every panel the existing Expand / Compact control.
 const previousOpen=openPanel;
 openPanel=function(name){
  const result=previousOpen.apply(this,arguments);
  const scroll=modal.querySelector('.modal-scroll');if(scroll)scroll.scrollTop=0;
  const expand=document.getElementById('b2-expand');
  if(expand)expand.hidden=false;
  return result;
 };
 // Intercept Advance before the old monthly presentation handler.
 const advanceButton=document.getElementById('advance');
 advanceButton?.addEventListener('click',event=>{
  event.stopImmediatePropagation();
  if(pendingEvent(game)){openPanel('event');return;}
  if(challengeFinished(game))return;
  try{
   game=runChallengeMonth(game);persist();renderAll();
   if(challengeFinished(game)){queueActive=false;openPanel('final');return;}
   eventShown=false;queueActive=true;
   openPanel('report');
  }catch(error){alert(error.message);}
 },true);
 // Also initialise fresh state after the existing Restart button is used.
 if(typeof startingGame==='function'){const oldStartingGame=startingGame;startingGame=function(){return initialise(oldStartingGame.apply(this,arguments));};}
 // Legacy games get a new current-month start only; no historical offers are fabricated.
 game=nextOffer(initialise(game));persist();renderAll();
 if(modal.hidden&&!pendingEvent(game)&&!challengeFinished(game))openNewStrategicOffer();
})();
