/* Stage 9C.1 — single owner of monthly presentation and modal navigation.
   Additive to accepted 9B.1.4. No economic rule, save key or grant change.
   The legacy app's Advance listener remains registered; this controller stops it
   only when it processes a real user Advance, preserving existing event functions. */
(function(){
 'use strict';
 const modal=document.getElementById('modal');
 const advance=document.getElementById('advance');
 const sheet=modal?.querySelector('.modal-sheet');
 if(!modal||!advance||typeof openPanel!=='function')return;
 let active=false, eventPresented=false, scheduled=false;
 panelNames['owner-request']='Business-owner request';
 const toggle=document.getElementById('b2-expand');
 const sizePanels=new Set(['report','event','opportunities','owner-request','final']);
 function syncPanel(name){
  const scroll=modal.querySelector('.modal-scroll');if(scroll)scroll.scrollTop=0;
  if(toggle)toggle.hidden=!(name==='final'||(active&&sizePanels.has(name)));
 }
 // Keep the existing consolidated 8B open/close behaviour; one outer controller
 // handles scroll and header controls without further wrappers in feature files.
 const baseOpen=openPanel;
 openPanel=function(name){const r=baseOpen.apply(this,arguments);syncPanel(name);return r;};
 function presentStrategic(){
  const seen=Array.isArray(game.seenStrategicOffers)?game.seenStrategicOffers:[];
  const x=opportunityEntries(game).find(x=>x.status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth&&!seen.includes(x.type));
  if(!x)return false;
  game={...game,seenStrategicOffers:[...seen,x.type]};persist();showOffer(x.type);return true;
 }
 function next(){
  if(!active||!modal.hidden)return;
  if(challengeFinished(game)){active=false;return;}
  if(pendingEvent(game)){
   if(!eventPresented){eventPresented=true;openPanel('event');}
   // Mandatory decisions retain priority until actually resolved.
   return;
  }
  if(presentStrategic())return;
  if(window.HighStreetOwnerRequests?.presentNext())return;
  active=false;
 }
 function schedule(){
  if(!active||scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;next();});
 }
 // Legacy event-confirm buttons call closePanel() by name; other dismiss buttons
 // captured the old callback at registration time. Observe both, but deduplicate.
 const baseClose=closePanel;
 closePanel=function(){const r=baseClose.apply(this,arguments);schedule();return r;};
 for(const button of [document.getElementById('dismiss-modal'),document.getElementById('close')]){
  button?.addEventListener('click',schedule);
 }
 modal.addEventListener('click',event=>{if(event.target===modal)schedule();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')schedule();});
 // Stop old handlers from opening optional offers before the report-first queue.
 // Outside a queue, original behaviour is retained, with owners as a fallback.
 const baseStrategic=openNewStrategicOffer;
 openNewStrategicOffer=function(){
  if(active)return false;
  return baseStrategic.apply(this,arguments)||(!pendingEvent(game)&&!!window.HighStreetOwnerRequests?.presentNext());
 };
 advance.addEventListener('click',event=>{
  event.stopImmediatePropagation();
  if(pendingEvent(game)){openPanel('event');return;}
  if(challengeFinished(game))return;
  try{
   game=runChallengeMonth(game);persist();renderAll();
   if(challengeFinished(game)){active=false;openPanel('final');return;}
   active=true;eventPresented=false;
   openPanel('report');
  }catch(error){alert(error.message);}
 },true);
 // Existing saves can be midway through a decision; don't fabricate old reports.
 // Only an actual Advance triggers the new report-first queue.
 if(modal.hidden&&!pendingEvent(game)&&!challengeFinished(game))openNewStrategicOffer();
})();
