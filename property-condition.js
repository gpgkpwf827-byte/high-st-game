/* Stage 10A.1: property lifecycle + UI. No grants or autonomous openings yet.
   The canonical physical-condition calculations live in property.js. */
(function(){
 'use strict';
 const initialVacancies=[79,68,58,46,35];
 const landlordTypes=['responsible','average','neglectful','average','responsible'];
 function initialise(state){
  const existing=state.propertyConditions||{};
  const vacant=PREMISES.filter(p=>!p.occupied);
  const properties={};
  for(const p of PREMISES){
   const old=existing[p.id];
   const index=vacant.findIndex(v=>v.id===p.id);
   const landlord=old?.landlord in LANDLORD_DECAY?old.landlord:landlordTypes[(index>=0?index:p.id)%landlordTypes.length];
   // Existing saves: derive conservative defaults; do not modify completed history.
   const fallback=index>=0?initialVacancies[index%initialVacancies.length]:80;
   const condition=Math.max(0,Math.min(100,Math.round(Number.isFinite(Number(old?.condition))?Number(old.condition):fallback)));
   properties[p.id]={landlord,condition};
  }
  return {...state,propertyConditions:properties};
 }
 function advance(state){
  const props={...state.propertyConditions};
  for(const p of currentPremises(state)){
   if(p.occupied)continue;
   const item=props[p.id];
   props[p.id]={...item,condition:Math.max(0,item.condition-(LANDLORD_DECAY[item.landlord]||4))};
  }
  return {...state,propertyConditions:props};
 }
 const priorStarting=startingGame;
 startingGame=function(){return initialise(priorStarting.apply(this,arguments));};
 const priorMonth=runChallengeMonth;
 runChallengeMonth=function(state){
  const before=initialise(state);
  const result=priorMonth.call(this,before);
  // Deteriorate units that were vacant at the START of the completed month.
  // Newly closed businesses retain their prior physical condition for this turn.
  const props={...result.propertyConditions};
  for(const p of currentPremises(before)){
   if(p.occupied)continue;
   const item=props[p.id];
   props[p.id]={...item,condition:Math.max(0,item.condition-(LANDLORD_DECAY[item.landlord]||4))};
  }
  return {...result,propertyConditions:props};
 };
 const priorInspect=inspectPremise;
 inspectPremise=function(id){
  const result=priorInspect.apply(this,arguments);
  const p=currentPremise(game,id), details=document.getElementById('details');
  let info=document.getElementById('hs10-property');
  if(!info){info=document.createElement('div');info.id='hs10-property';info.className='detail';details.querySelector('.shop-meta .details')?.append(info);}
  if(info){
   const item=game.propertyConditions?.[id];
   info.hidden=!!p?.occupied;
   if(item&&!p?.occupied){info.replaceChildren();const key=document.createElement('small');key.textContent='Property condition';const value=document.createElement('strong');value.textContent=item.condition+'/100 · '+conditionBand(item.condition);const extra=document.createElement('small');extra.textContent='Landlord: '+item.landlord+' · −'+LANDLORD_DECAY[item.landlord]+' points/month while vacant';info.append(key,value,extra);}
  }
  return result;
 };
 // Make condition observable on each vacant building without replacing its art.
 const priorRenderShops=renderShops;
 renderShops=function(){const result=priorRenderShops.apply(this,arguments);
  for(const b of document.querySelectorAll('#north .shop.vacant,#south .shop.vacant')){
   const id=Number(b.dataset.id),score=conditionScore(game,id),band=conditionBand(score);
   b.dataset.propertyScore=String(score);
   b.title='Property condition: '+score+'/100 ('+band+')';
  }
  return result;
 };
 game=initialise(game);
 persist();renderAll();
})();
