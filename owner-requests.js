/* Stage 9C.3: owner-request presentation only. Rules and economic hooks live in owner-request-rules.js. */
(function(){
 'use strict';
 const rules=window.HighStreetOwnerRequestRules;
 if(!rules)throw Error('Owner-request rules must load before owner-request UI.');
 const {TYPES,DURATION,getRequests,owning,initialise,nextOffer,answer}=rules;
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
    for(const value of ['decline','permission','support']){
     const b=el('button',config[value].label,'owner-request-option');b.type='button';
     b.addEventListener('click',()=>{selected=value;refresh();});opts.append(b);buttons[value]=b;
    }
    confirmButton.addEventListener('click',()=>{
     try{game=answer(game,r.id,selected);persist();renderAll();
       if(source==='details'&&typeof inspectPremise==='function')inspectPremise(r.premiseId,false);
       else if(source==='popup')closePanel(); // Resume the existing monthly queue.
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
  if(!p?.occupied){if(existing){document.getElementById('financials').before(grant);existing.remove();}return;}
  const related=getRequests(game).filter(r=>r.premiseId===p.id&&r.businessName===p.name&&r.offeredMonth<=game.month).slice(-2).reverse();
  const outstanding=related.filter(r=>r.status==='offered'&&game.month<=r.expiresMonth&&owning(game,r));
  const section=existing||el('details',undefined,'owner-support-disclosure');
  if(!existing){grant.before(section);section.append(el('summary'));}
  // Present Council support first, before the premises and finance disclosures.
  const premisesDisclosure=details.querySelector('.shop-meta');
  if(premisesDisclosure&&section.nextElementSibling!==premisesDisclosure)premisesDisclosure.before(section);
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
 // Presentation data only. Modal navigation and monthly sequencing now belong to
 // modal-controller.js, the single Stage 9C.1 controller.
 window.HighStreetOwnerRequests={
  presentNext(){
   const r=getRequests(game).find(x=>x.status==='offered'&&game.month<=x.expiresMonth&&owning(game,x)&&!x.shown);
   if(!r)return false;
   game={...game,ownerRequests:getRequests(game).map(x=>x.id===r.id?{...x,shown:true}:x)};
   persist();renderAll();
   const panel=document.getElementById('owner-request');
   if(!panel)return false;
   panel.replaceChildren(card(r,true,'popup'));
   openPanel('owner-request');
   return true;
  },
  getOutstanding(){return getRequests(game).filter(x=>x.status==='offered'&&game.month<=x.expiresMonth&&owning(game,x));}
 };
 // Also initialise fresh state after the existing Restart button is used.
 if(typeof startingGame==='function'){const oldStartingGame=startingGame;startingGame=function(){return initialise(oldStartingGame.apply(this,arguments));};}
 // Legacy games get a new current-month start only; no historical offers are fabricated.
 game=nextOffer(initialise(game));persist();renderAll();
})();
