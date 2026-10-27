/* 1E Stage 1: interface with council rates policy; retains 1D shop, grant, event and save features. */
const currency=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const STORAGE_KEY='high-street-v1e-s2-save';
let saveAvailable=true;
function readGame(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return startingGame();
  const s=JSON.parse(raw);
  if(s.version===3&&Number.isInteger(s.month)&&s.month>=1&&s.month<=13&&
     Array.isArray(s.history)&&Array.isArray(s.grants)&&s.businesses&&s.cashByPremise&&
     Array.isArray(s.decisions)&&Number.isFinite(s.startingVitality))return s;
 }catch(e){saveAvailable=false;}
 return startingGame();
}
let game=readGame(), selectedId=null;
// Keep Stage 2 saves in their existing key and initialise new risk fields on load.
game=normaliseGame(game);
let activePanel=null;
const modal=document.getElementById('modal');
const modalSheet=modal.querySelector('.modal-sheet');
const panelNames={details:'Shop details',council:'Council & rates',report:'Monthly report',event:'Council decision',final:'Challenge result','goal-panel':'Challenge'};
function openPanel(id){
 activePanel=id;
 for(const name of Object.keys(panelNames))document.getElementById(name).hidden=name!==id;
 modal.hidden=false;document.body.classList.add('modal-active');
 document.getElementById('modal-title').textContent=panelNames[id];
 modalSheet.focus();
}
function closePanel(){
 activePanel=null;modal.hidden=true;document.body.classList.remove('modal-active');
 for(const name of Object.keys(panelNames))document.getElementById(name).hidden=true;
 selectedId=null;renderShops();
}

function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(game));saveAvailable=true;}catch(e){saveAvailable=false;}
 document.getElementById('save-status').textContent=saveAvailable?'Saved on this browser/device (not cloud-backed).':'Local saving unavailable in this viewer; use Safari/GitHub Pages.';}
function renderStats(){
 document.getElementById('budget').textContent=currency(game.councilBudget);
 document.getElementById('occupancy').textContent=`${occupiedPremises(game).length}/${PREMISES.length}`;
 document.getElementById('month').textContent=challengeFinished(game)?'12 / 12':game.month+' / 12';
 document.getElementById('advance').disabled=challengeFinished(game)||!!pendingEvent(game);
}
function renderMetrics(){
 const m=townMetrics(game),el=document.getElementById('town-metrics');
 el.replaceChildren();
 for(const [name,value,explain] of [['Footfall',m.footfall.toLocaleString('en-GB'),'Monthly visits'],['Spending power',m.spendingPower.toFixed(0)+'/100','Local economy'],['Attractiveness',m.attractiveness.toFixed(0)+'/100','Shopping environment'],['Commercial vitality',m.vitality.toFixed(0)+'/100','Occupancy · diversity · health']]){
  const card=document.createElement('div');card.className='metric-card';
  const a=document.createElement('small');a.textContent=name;const b=document.createElement('strong');b.textContent=value;const c=document.createElement('small');c.textContent=explain;card.append(a,b,c);el.append(card);
 }
}
function renderCouncil(){
 const container=document.getElementById('council');container.replaceChildren();
 const h=document.createElement('h3');h.textContent='Council business rates policy';
 const desc=document.createElement('p');desc.textContent='Choose a Low, Standard or High rates level for the next trading month. Higher rates raise council receipts but reduce shop profits. Fictional game policy — not actual council rate-setting powers.';
 const caption=document.createElement('p');caption.textContent='Current: '+(game.ratesBand||'standard')+' · Next trading month: '+(game.nextRatesBand||'standard')+'. Receipts are added to the available council fund after monthly trading.';
 const row=document.createElement('div');row.className='event-actions';
 for(const [band,label] of [['low','Low (−20%)'],['standard','Standard'],['high','High (+20%)']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  const chosen=(game.nextRatesBand||'standard')===band;button.className=chosen?'primary':'';button.disabled=challengeFinished(game);
  button.setAttribute('aria-pressed',String(chosen));
  button.addEventListener('click',()=>{game=setRatesPolicy(game,band);persist();renderCouncil();if(selectedId!==null)buildFinanceDetails(currentPremise(game,selectedId));});row.append(button);
 }
 const hint=document.createElement('p');hint.className='grant-note';hint.textContent='Last month rates receipts: '+currency(game.lastRatesReceipt||0)+' · Total collected during this challenge: '+currency(game.totalRatesReceived||0)+'.';
 container.append(h,desc,caption,row,hint);
}
function renderShops(){for(const side of ['north','south']){
 const container=document.getElementById(side);container.replaceChildren();
 currentPremises(game).filter(p=>p.side===side).forEach(p=>{
  const button=document.createElement('button');button.type='button';button.className='shop'+(p.occupied?'':' vacant');
  button.style.setProperty('--shop-color',p.colour);button.dataset.id=p.id;
  button.setAttribute('aria-label',`Inspect ${p.name}, ${p.occupied?'occupied':'vacant'}`);
  button.setAttribute('aria-pressed',String(selectedId===p.id));
  if(selectedId===p.id)button.classList.add('selected');
  button.innerHTML=`<div class="roof"></div><div class="front"><span class="shop-icon">${p.icon}</span></div><span class="shop-name">${p.name}</span><span class="shop-type">${p.type}</span>`;
  button.addEventListener('click',()=>inspectPremise(p.id,true));container.append(button);
 });}}
function financeLine(label,value){const r=document.createElement('div');r.className='finance-line';const a=document.createElement('span');a.textContent=label;const b=document.createElement('strong');b.textContent=value;r.append(a,b);return r;}
function buildFinanceDetails(p){
 const target=document.getElementById('financials');target.replaceChildren();target.hidden=!p.occupied;if(!p.occupied)return;
 const prior=game.latestResults.find(x=>x.premiseId===p.id);
 const r=prior||calculateMonthlyTrading(p,game.cashByPremise[p.id],game.month,game.grants,game.interventions,game.nextRatesBand,townMetrics(game));
 const preview=!prior;
 const h=document.createElement('h4');h.textContent=preview?'Indicative monthly finances':'Latest completed month';
 const lead=document.createElement('p');lead.textContent=preview?'Forecast with the selected next-month rates band; no cash has changed.':'Latest completed trading. Changing rates now will affect the next month, not this result.';
 const grid=document.createElement('div');grid.className='finance-grid';
 for(const [k,v] of [['Transactions',r.transactions],['Base transactions',r.baseTransactions],['Change from baseline',r.transactions-r.baseTransactions]])grid.append(financeLine(k,String(v)));
 for(const [k,v] of [['Average sale',r.averageSale],['Revenue',r.revenue],['Rent',r.rent],['Wages',r.wages],['Other operating costs',r.otherCosts],['Business rates ('+r.rateBand+')',r.businessRates],['Total expenses',r.totalExpenses],['Operating profit',r.profit],['Cash reserves',game.cashByPremise[p.id]]])grid.append(financeLine(k,currency(v)));
 const debug=document.createElement('details');debug.className='debug';const label=document.createElement('summary');label.textContent='Calculation debug view';const pre=document.createElement('pre');
 pre.textContent=`Transactions: ${r.baseTransactions} × ${r.demandFactor.toFixed(3)} town conditions × (1 + ${(r.grantUplift*100).toFixed(0)}% grant + ${(r.eventUplift*100).toFixed(0)}% event) = ${r.transactions}\nRevenue: ${r.transactions} × ${currency(r.averageSale)} = ${currency(r.revenue)}\nBusiness rates: ${currency(p.finance.monthlyBusinessRates)} standard × ${ratesBandFactor(r.rateBand).toFixed(1)} = ${currency(r.businessRates)}\nExpenses: ${currency(r.rent)} rent + ${currency(r.wages)} wages + ${currency(r.otherCosts)} other + ${currency(r.businessRates)} rates = ${currency(r.totalExpenses)}\nProfit: ${currency(r.revenue)} − ${currency(r.totalExpenses)} = ${currency(r.profit)}\n${preview?'Forecast; cash has not changed.':`Opening cash: ${currency(r.openingCash)}; closing cash: ${currency(r.closingCash)}`}\nBusiness rates also count as council income when this trading month is processed.`;
 debug.append(label,pre);const note=document.createElement('div');note.className='note';note.textContent='Game estimates only. Rates are paid by shops and received into the same council fund on month advancement.';
 target.append(h,lead,grid,debug,note);
}
function renderGrantPanel(p){
 const el=document.getElementById('grant-section');el.replaceChildren();el.hidden=!p.occupied;if(!p.occupied)return;
 const h=document.createElement('h4');h.textContent='Council improvement grant';
 const desc=document.createElement('p');desc.textContent='£5,000 for shopfront improvements; +10% transactions for six trading months. Council cash is spent immediately.';
 const status=document.createElement('p');status.className='grant-note';const grant=grantForPremise(game.grants,p.id);
 if(grant){const left=Math.max(0,grant.awardedMonth+IMPROVEMENT_GRANT.durationMonths-game.month);status.textContent=left?`${left} trading months of benefit remaining.`:'Grant completed; one grant per shop.';el.append(h,desc,status);return;}
 status.textContent='Council fund: '+currency(game.councilBudget);
 const b=document.createElement('button');b.type='button';b.textContent='Award £5,000 grant';b.disabled=challengeFinished(game)||game.councilBudget<IMPROVEMENT_GRANT.cost;
 b.addEventListener('click',()=>{game=awardImprovementGrant(game,p);persist();renderAll();});el.append(h,desc,status,b);
}
function renderTenantPanel(p){const el=document.getElementById('tenant-section');el.replaceChildren();el.hidden=p.occupied;if(p.occupied)return;
 const h=document.createElement('h4');h.textContent='Bring in a new tenant';const desc=document.createElement('p');desc.textContent='Spend £12,000 to open a new independent shop now; it starts trading on the next Advance Month. Choosing between three applicants arrives in Stage 4.';
 const b=document.createElement('button');b.type='button';b.textContent='Fund £12,000 fit-out';b.disabled=challengeFinished(game)||game.councilBudget<CHALLENGE.tenantFitout;
 b.addEventListener('click',()=>{game=openTenant(game,p.id);persist();renderAll();inspectPremise(p.id,false);openPanel('details');});el.append(h,desc,b);
}
function inspectPremise(id,scroll){const p=currentPremise(game,id);if(!p)return;selectedId=id;const el=document.getElementById('details');el.hidden=false;
 document.querySelectorAll('.shop').forEach(b=>{const yes=Number(b.dataset.id)===id;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
 for(const [key,value] of [['detail-icon',p.icon],['detail-title',p.name],['detail-description',p.description],['detail-type',p.type],['detail-status',p.occupied?'Trading':'Vacant'],['detail-premise','Premise '+p.id],['detail-position',p.side==='north'?'North side':'South side']])document.getElementById(key).textContent=value;
 const previous=game.latestResults.find(r=>r.premiseId===p.id)||null;
 const status=businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,previous,(game.lossStreaks||{})[p.id]||0);
 document.getElementById('risk-box').hidden=!p.occupied;
 document.getElementById('detail-risk').textContent=p.occupied?status.name+' · '+status.health.toFixed(0)+'/100 · '+status.runway.toFixed(1)+' months cost cover':'';
 buildFinanceDetails(p);renderGrantPanel(p);renderTenantPanel(p);if(scroll)openPanel('details');
}
function renderReport(){const el=document.getElementById('report');el.hidden=!game.latestResults.length;if(el.hidden)return;
 const total=k=>game.latestResults.reduce((sum,r)=>sum+r[k],0);
 document.getElementById('report-month').textContent=game.month-1;
 document.getElementById('report-profit').textContent=currency(total('profit'));
 document.getElementById('report-rates').textContent=currency(total('businessRates'));
 document.getElementById('report-budget').textContent=currency(game.councilBudget);
 document.getElementById('report-receipts').textContent=currency(game.lastRatesReceipt||0);
 document.getElementById('report-band').textContent=(game.ratesBand||'standard').toUpperCase();
 const risks=occupiedPremises(game).map(p=>businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,game.latestResults.find(r=>r.premiseId===p.id),(game.lossStreaks||{})[p.id]||0));
 const struggling=risks.filter(r=>r.name==='Struggling').length,critical=risks.filter(r=>r.name==='Critical').length;
 const recent=game.lastClosures||[];
 document.getElementById('report-risks').textContent='Business outlook: '+struggling+' struggling, '+critical+' critical. '+(recent.length?'Closures this month: '+recent.map(c=>c.name+' ('+c.reason+')').join('; ')+'.':'No closures this month.');
}
function renderEvent(){const el=document.getElementById('event'),e=pendingEvent(game);el.replaceChildren();el.hidden=!e;if(!e)return;
 const h=document.createElement('h3');h.textContent=e.title+' — Month '+game.month;const p=document.createElement('p');p.textContent=e.description+' Cost: '+currency(e.cost)+'; benefit: +'+Math.round(100*e.uplift)+'% transactions for '+e.duration+' months. Decide before advancing.';
 const actions=document.createElement('div');actions.className='event-actions';for(const fund of [true,false]){const b=document.createElement('button');b.type='button';b.className=fund?'primary':'';b.textContent=fund?'Fund '+currency(e.cost):'Decline — £0';b.disabled=fund&&game.councilBudget<e.cost;b.addEventListener('click',()=>{game=decideEvent(game,fund);persist();renderAll();closePanel();});actions.append(b);}el.append(h,p,actions);
}
function renderFinal(){const el=document.getElementById('final');el.replaceChildren();el.hidden=!challengeFinished(game);if(el.hidden)return;const o=finalOutcome(game);const h=document.createElement('h3');h.textContent=o.won?'Challenge complete — high street recovered!':'Challenge complete — target missed';const p=document.createElement('p');p.textContent=`Month 12: ${o.occupied}/12 premises occupied (goal: 10). Council fund: ${currency(o.budget)}. Tenant openings: ${o.opened}. Closures: ${o.closures}. Rates collected since this version: ${currency(game.totalRatesReceived||0)}.`;el.append(h,p);}
function renderAll(){
 renderStats();renderMetrics();renderShops();renderCouncil();renderReport();renderEvent();renderFinal();
 if(selectedId!==null)inspectPremise(selectedId,false);
 if(activePanel){
  for(const name of Object.keys(panelNames))document.getElementById(name).hidden=name!==activePanel;
 }
}
document.getElementById('close').addEventListener('click',closePanel);
document.getElementById('dismiss-modal').addEventListener('click',closePanel);
modal.addEventListener('click',e=>{if(e.target===modal)closePanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closePanel();});
document.getElementById('show-council').addEventListener('click',()=>openPanel('council'));
document.getElementById('show-goal').addEventListener('click',()=>openPanel('goal-panel'));
document.getElementById('show-report').addEventListener('click',()=>{
 if(!game.latestResults.length){alert('The first monthly report will be available after you advance a month.');return;}
 openPanel('report');
});
document.getElementById('advance').addEventListener('click',()=>{try{game=runChallengeMonth(game);persist();renderAll();if(challengeFinished(game))openPanel('final');else if(pendingEvent(game))openPanel('event');else openPanel('report');}catch(e){alert(e.message);}});
document.getElementById('reset').addEventListener('click',()=>{if(!confirm('Restart from Month 1? This replaces your current progress in this version.'))return;game=startingGame();closePanel();persist();renderAll();});
renderAll();persist();if(pendingEvent(game))openPanel('event');else if(challengeFinished(game))openPanel('final');
