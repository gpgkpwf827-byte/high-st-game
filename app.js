/* Milestone 1A: UI only. Economic simulation will be added in 1B. */
const currency = amount => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(amount);
const occupiedCount = PREMISES.filter(p=>p.occupied).length;
document.getElementById('budget').textContent=currency(GAME_CONFIG.startingBudget);
document.getElementById('occupancy').textContent=`${occupiedCount}/${PREMISES.length}`;
document.getElementById('month').textContent=`${GAME_CONFIG.startingMonth}`;
function renderRow(side,target){
  const container=document.getElementById(target);
  PREMISES.filter(p=>p.side===side).forEach(p=>{
    const button=document.createElement('button');
    button.type='button';button.className=`shop${p.occupied?'':' vacant'}`;
    button.style.setProperty('--shop-color',p.colour);
    button.setAttribute('aria-label',`Inspect ${p.name}, ${p.occupied?'occupied':'vacant'}`);
    button.dataset.id=p.id;
    button.innerHTML=`<div class="roof"></div><div class="front"><span class="shop-icon">${p.icon}</span></div><span class="shop-name">${p.name}</span><span class="shop-type">${p.type}</span>`;
    button.addEventListener('click',()=>inspectPremise(p.id));
    container.appendChild(button);
  });
}
function inspectPremise(id){
  const premise=PREMISES.find(p=>p.id===id);if(!premise)return;
  document.querySelectorAll('.shop').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.id)===id);b.setAttribute('aria-pressed',String(Number(b.dataset.id)===id));});
  const panel=document.getElementById('details');panel.hidden=false;
  document.getElementById('detail-icon').textContent=premise.icon;
  document.getElementById('detail-title').textContent=premise.name;
  document.getElementById('detail-description').textContent=premise.description;
  document.getElementById('detail-type').textContent=premise.type;
  document.getElementById('detail-status').textContent=premise.occupied?'Trading':'Vacant';
  document.getElementById('detail-premise').textContent=`Premise ${premise.id}`;
  document.getElementById('detail-position').textContent=premise.side==='north'?'North side':'South side';
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
document.getElementById('close').addEventListener('click',()=>{
  document.getElementById('details').hidden=true;
  document.querySelectorAll('.shop').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
});
renderRow('north','north');renderRow('south','south');
