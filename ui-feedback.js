/* 10A.2.1 — shared non-native confirmations and lightweight messages.
   Reset and marketing capture the legacy callbacks before they display browser dialogs. */
(function(){
 'use strict';
 const css=document.createElement('style');css.textContent=`
 .hs-ui-backdrop{position:fixed;inset:0;z-index:20000;background:#12281dbb;display:grid;place-items:center;padding:18px}
 .hs-ui-box{width:min(100%,420px);max-height:85dvh;overflow:auto;background:#fff;border-radius:15px;padding:20px;box-shadow:0 15px 40px #0004;color:#263c30}
 .hs-ui-box h3{margin:0 0 8px;font-size:18px}.hs-ui-box p{font-size:14px;line-height:1.5}
 .hs-ui-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}.hs-ui-actions button{min-height:44px;padding:10px 14px;border-radius:9px;font-weight:750;border:1px solid #c4d7c7;background:#f6f9f6;color:#294d3d}
 .hs-ui-actions button:last-child{background:#2c7355;color:white;border-color:#2c7355}
 .hs-ui-message{position:fixed;z-index:20001;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);left:16px;right:16px;max-width:450px;margin:0 auto;background:#253d31;color:#fff;border-radius:12px;padding:12px 38px 12px 14px;box-shadow:0 6px 20px #0004;font-size:13px;line-height:1.4}
 .hs-ui-message button{position:absolute;right:6px;top:3px;border:0;background:transparent;color:#fff;font-size:23px;min-height:38px;width:32px}`;document.head.append(css);
 function showMessage(message){document.querySelector('.hs-ui-message')?.remove();const b=document.createElement('div');b.className='hs-ui-message';b.setAttribute('role','status');b.textContent=String(message);const x=document.createElement('button');x.textContent='×';x.setAttribute('aria-label','Dismiss message');x.addEventListener('click',()=>b.remove());b.append(x);document.body.append(b);}
 // Native alert is used for error/info only; replace it with an accessible, nonblocking message.
 window.alert=showMessage;
 function ask(title,message,confirmLabel,onConfirm){
  if(document.querySelector('.hs-ui-backdrop'))return;
  const cover=document.createElement('div');cover.className='hs-ui-backdrop';
  const dialog=document.createElement('div');dialog.className='hs-ui-box';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',title);
  const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=message;const actions=document.createElement('div');actions.className='hs-ui-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';const okay=document.createElement('button');okay.type='button';okay.textContent=confirmLabel;
  function close(){cover.remove();document.removeEventListener('keydown',escapeKey);}
  function escapeKey(e){if(e.key==='Escape'){e.stopImmediatePropagation();close();}}
  cancel.addEventListener('click',close);okay.addEventListener('click',()=>{close();try{onConfirm();}catch(e){showMessage(e.message);}});
  cover.addEventListener('click',e=>{if(e.target===cover)close();});document.addEventListener('keydown',escapeKey,true);
  actions.append(cancel,okay);dialog.append(h,p,actions);cover.append(dialog);document.body.append(cover);cancel.focus();
 }
 // The original app.js registered this listener before add-on modules loaded.
 // Capturing the event prevents that listener (and its native confirm) from firing.
 const reset=document.getElementById('reset');
 reset?.addEventListener('click',e=>{e.stopImmediatePropagation();ask('Restart challenge?','This will permanently replace progress in the current game and restart at Month 1.','Restart challenge',()=>{game=normaliseGame(startingGame());closePanel();persist();renderAll();});},true);
 // Marketing is rendered on demand; delegate only the specific funding action.
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('button.policy-action');if(!b||!b.textContent.includes('Fund marketing'))return;
  e.stopImmediatePropagation();
  if(b.disabled)return;
  try{const proposed=startCapacityMarketing(game);ask('Fund marketing?','£5,000 and 1 Action Point for a two-month campaign. Projected town footfall: '+townMetrics(proposed).footfall.toLocaleString('en-GB')+' visits.','Fund £5,000',()=>{game=startCapacityMarketing(game);persist();renderAll();openPanel('council');});}
  catch(err){showMessage(err.message);}
 },true);
 window.HighStreetFeedback=Object.freeze({ask,message:showMessage});
})();
