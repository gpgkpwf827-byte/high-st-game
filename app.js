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
const panelNames={details:'Shop details',council:'Council management',notifications:'Notifications',issues:'Current issues',performance:'Performance',report:'Monthly report',event:'Council decision',final:'Challenge result','goal-panel':'Challenge'};
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
 document.getElementById('capacity-points').textContent=actionsRemaining(game)+' / 3 points remaining';
 document.getElementById('advance').disabled=challengeFinished(game);
 renderNotificationBadge();
}
function renderMetrics(){
 const m=townMetrics(game),el=document.getElementById('town-metrics');
 el.replaceChildren();
 for(const [name,value,explain] of [['Footfall',m.footfall.toLocaleString('en-GB'),'Monthly visits'],['Spending power',m.spendingPower.toFixed(0)+'/100','Local economy'],['Attractiveness',m.attractiveness.toFixed(0)+'/100','Shopping environment'],['Commercial vitality',m.vitality.toFixed(0)+'/100','Occupancy · diversity · health']]){
  const card=document.createElement('div');card.className='metric-card';
  const a=document.createElement('small');a.textContent=name;const b=document.createElement('strong');b.textContent=value;const c=document.createElement('small');c.textContent=explain;card.append(a,b,c);el.append(card);
 }
}
function renderNotificationBadge(){
 const e=pendingEvent(game),count=e?1:0;
 const tag=document.getElementById('notification-count');tag.hidden=!count;tag.textContent=String(count);
 const banner=document.getElementById('pending-banner');banner.hidden=!e;
 document.getElementById('pending-message').textContent=e?'Month '+game.month+': '+e.title+'. Choose an option before advancing.':'';
 document.getElementById('advance').textContent=e?'Review pending decision →':'Advance month →';
}
function renderNotifications(){
 const c=document.getElementById('notifications');c.replaceChildren();
 const title=document.createElement('h3');title.textContent='Notifications';c.append(title);
 const e=pendingEvent(game);
 if(!e){const p=document.createElement('p');p.textContent='No pending council decisions.';c.append(p);return;}
 const p=document.createElement('p');p.textContent='Month '+game.month+': '+e.title+' — decision required before advancing.';
 const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent='Open decision';btn.addEventListener('click',()=>openPanel('event'));
 c.append(p,btn);
}
function previewMetrics(state){
 const m=townMetrics(state);return 'Footfall '+m.footfall.toLocaleString('en-GB')+' visits  ·  Attractiveness '+m.attractiveness.toFixed(0)+'/100  ·  Spending power '+m.spendingPower.toFixed(0)+'/100  ·  Vitality '+m.vitality.toFixed(0)+'/100';
}
function addBlockReason(container,button,reason){
 if(button.disabled&&reason){const p=document.createElement('p');p.className='unavailable-reason';p.textContent=reason;container.append(p);}
}
function renderCouncil(){
 const c=document.getElementById('council');c.replaceChildren();
 const header=document.createElement('h3');header.textContent='Council Management';c.append(header);
 const impact=document.createElement('div');impact.className='policy-preview';
 const hint=document.createElement('strong');hint.textContent='Town impact — current policies';
 const values=document.createElement('p');values.textContent=previewMetrics(game);
 const projections=projectedCouncil(game);
 const capacity=document.createElement('p');capacity.textContent='Council capacity: '+actionsRemaining(game)+'/3 points available this month. Grants, tenants and marketing cost 1; transport costs 2. Routine policies and required events are free.';impact.append(capacity);
 const money=document.createElement('p');money.textContent='Projected rates receipts '+currency(projections.receipts)+'/month · Services '+currency(projections.expense)+'/month · Net '+currency(projections.net)+'/month';
 impact.append(hint,values,money);c.append(impact);
 const note=document.createElement('p');note.textContent='Select a policy to preview its impact before confirming. Changes to services affect the next trading calculation; their costs are charged each trading month.';c.append(note);
 function section(title,description){const sec=document.createElement('section');sec.className='policy-section';const h=document.createElement('h4');h.textContent=title;const p=document.createElement('p');p.textContent=description;sec.append(h,p);c.append(sec);return sec;}
 const rates=section('Business rates','Rates are paid by shops and added to council funds each month.');
 const r=document.createElement('div');r.className='policy-options';
 for(const [band,label] of [['low','Low −20%'],['standard','Standard'],['high','High +20%']]){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.className=(game.nextRatesBand===band?'chosen':'');b.disabled=challengeFinished(game);
 b.addEventListener('click',()=>{game=setRatesPolicy(game,band);persist();renderCouncil();});r.append(b);
 }rates.append(r);
 const cp=councilPolicies(game);
 for(const [key,title] of [['cleaning','Street cleaning'],['lighting','Street lighting']]){
  const sec=section(title,'Recurring monthly expenditure with a direct effect on Town Attractiveness.');
  const options=document.createElement('div');options.className='policy-options';
  const preview=document.createElement('p');preview.className='policy-compare';
  for(const [level,rule] of Object.entries(SERVICES[key])){
   const btn=document.createElement('button');btn.type='button';btn.textContent=level+' · '+currency(rule.cost)+'/m';btn.className=cp[key]===level?'chosen':'';btn.disabled=challengeFinished(game);
   btn.addEventListener('click',()=>{const proposed=changeService(game,key,level);preview.textContent='Proposed: '+previewMetrics(proposed)+' · total services '+currency(serviceCosts(proposed))+'/month';confirm.hidden=false;confirm.onclick=()=>{game=proposed;persist();renderAll();openPanel('council');};});options.append(btn);
  }
  const confirm=document.createElement('button');confirm.type='button';confirm.className='policy-action';confirm.textContent='Confirm service change';confirm.hidden=true;
  sec.append(options,preview,confirm);
 }
 const investment=section('Major transport choice','One strategic investment: choose buses OR free parking. Costs 2 action points, permanent footfall uplift (illustrative).');
 if(game.transportChoice){const p=document.createElement('p');p.textContent='Selected: '+TRANSPORT[game.transportChoice].name+'.';investment.append(p);}else{
  for(const [key,rule] of Object.entries(TRANSPORT)){
   const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent=rule.name+' · '+currency(rule.cost);
   btn.disabled=challengeFinished(game)||game.councilBudget<rule.cost||actionsRemaining(game)<2;
   const preview=document.createElement('p');preview.className='policy-compare';
   btn.addEventListener('click',()=>{const proposed=chooseCapacityTransport(game,key);preview.textContent='Projected: '+previewMetrics(proposed)+' · Fund after purchase '+currency(proposed.councilBudget);ok.hidden=false;ok.onclick=()=>{game=proposed;persist();renderAll();openPanel('council');};});
   const ok=document.createElement('button');ok.type='button';ok.className='policy-action';ok.textContent='Confirm '+rule.name;ok.hidden=true;
   investment.append(btn,preview,ok);addBlockReason(investment,btn,actionBlockReason(game,rule.cost,2));
  }
 }
 const campaign=section('Local marketing','£5,000 and 1 action point for a two-month +8% footfall campaign.');
 const b=document.createElement('button');b.type='button';b.className='policy-action';b.textContent='Fund marketing · £5,000';b.disabled=challengeFinished(game)||game.councilBudget<MARKETING.cost||actionsRemaining(game)<1||(game.marketingUntil||0)>=game.month;
 b.addEventListener('click',()=>{if(actionsRemaining(game)<1)return alert('No council action points remain.');const proposed=startCapacityMarketing(game);const ok=confirm('Fund a two-month campaign for £5,000? Projected town footfall: '+townMetrics(proposed).footfall.toLocaleString('en-GB')+' visits.');if(ok){game=proposed;persist();renderAll();openPanel('council');}});campaign.append(b);addBlockReason(campaign,b,(game.marketingUntil||0)>=game.month?'Campaign already active.':actionBlockReason(game,MARKETING.cost));
 const e=pendingEvent(game);if(e){const sec=section('Pending event',e.title+' — decide before advancing.');const btn=document.createElement('button');btn.className='policy-action';btn.textContent='Review event';btn.addEventListener('click',()=>openPanel('event'));sec.append(btn);}
 const footer=document.createElement('p');footer.className='grant-note';footer.textContent='Existing £5,000 grants remain available when inspecting individual shops. The new figures are provisional game-balancing assumptions.';c.append(footer);
}
function renderShops(){for(const side of ['north','south']){
 const container=document.getElementById(side);container.replaceChildren();
 currentPremises(game).filter(p=>p.side===side).forEach(p=>{
  const button=document.createElement('button');button.type='button';button.className='shop'+(p.occupied?'':' vacant');
  const health=p.occupied?businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,game.latestResults.find(r=>r.premiseId===p.id),(game.lossStreaks||{})[p.id]||0).name:'Vacant';
  const statusColour={Stable:'#39936f',Struggling:'#d5a03b',Critical:'#c65c56',Vacant:'#899690'};
  button.style.setProperty('--shop-color',statusColour[health]);button.dataset.id=p.id;
  button.classList.add('status-'+health.toLowerCase());
  button.setAttribute('aria-label',`Inspect ${p.name}, ${p.occupied?'occupied':'vacant'}`);
  button.setAttribute('aria-pressed',String(selectedId===p.id));
  if(selectedId===p.id)button.classList.add('selected');
  button.innerHTML=`<div class="roof"></div><div class="front"><span class="shop-icon">${p.icon}</span></div><span class="shop-name">${p.name}</span><span class="shop-type">${p.type}</span>`;
  const indicator=document.createElement('span');indicator.className='shop-condition';
  indicator.textContent=p.occupied?health:premiseCondition(game,p.id)+' · '+monthsVacant(game,p.id)+'m vacant';
  button.append(indicator);
  button.setAttribute('aria-label',`Inspect ${p.name}, ${p.occupied?health+' business':'vacant, '+premiseCondition(game,p.id)+', '+monthsVacant(game,p.id)+' months'}`);
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
 const h=document.createElement('h4');h.textContent='Council improvement grant · 1 action point';
 const desc=document.createElement('p');desc.textContent='£5,000 for shopfront improvements; +10% transactions for six trading months. Council cash is spent immediately.';
 const status=document.createElement('p');status.className='grant-note';const grant=grantForPremise(game.grants,p.id);
 if(grant){const left=Math.max(0,grant.awardedMonth+IMPROVEMENT_GRANT.durationMonths-game.month);status.textContent=left?`${left} trading months of benefit remaining.`:'Grant completed; one grant per shop.';el.append(h,desc,status);return;}
 status.textContent='Council fund: '+currency(game.councilBudget);
 const b=document.createElement('button');b.type='button';b.textContent='Award £5,000 grant';b.disabled=challengeFinished(game)||game.councilBudget<IMPROVEMENT_GRANT.cost||actionsRemaining(game)<1;
 b.addEventListener('click',()=>{game=awardCapacityGrant(game,p);persist();renderAll();});el.append(h,desc,status,b);addBlockReason(el,b,actionBlockReason(game,IMPROVEMENT_GRANT.cost));
}
function renderTenantPanel(p){
 const el=document.getElementById('tenant-section');el.replaceChildren();el.hidden=p.occupied;if(p.occupied)return;
 const h=document.createElement('h4');h.textContent='Choose a new tenant · 1 action point';
 const desc=document.createElement('p');desc.textContent='Condition: '+premiseCondition(game,p.id)+' · vacant for '+monthsVacant(game,p.id)+' months. Fit-outs become more expensive over time and vary by applicant requirements and standard business rates. The chosen shop opens immediately, trading next month.';
 el.append(h,desc);
 const prop=document.createElement('div');prop.className='property-summary';
 const age=monthsVacant(game,p.id),ageCost=Math.min(age,PROPERTY_COSTS.maxAge)*PROPERTY_COSTS.perVacantMonth;
 prop.textContent=`Vacancy age: ${age} months · Condition: ${premiseCondition(game,p.id)} · Deterioration surcharge: ${currency(ageCost)}. This charge reaches its cap after ${PROPERTY_COSTS.maxAge} months.`;
 el.append(prop);
 const choices=applicantsForUnit(game,p.id);
 for(const index of choices){
  const applicant=TENANT_TEMPLATES[index];
  const fitout=tenantFitoutCost(game,p.id,index);
  const choice=document.createElement('div');choice.className='applicant-option';
  const name=document.createElement('strong');name.textContent=applicant.icon+' '+applicant.name+' — '+applicant.type;
  const about=document.createElement('p');about.textContent=applicant.description;
  const meta=document.createElement('small');meta.textContent='Typical sale '+currency(applicant.finance.averageSale)+' · Estimated '+applicant.finance.transactions+' monthly transactions · Business rates '+currency(applicant.finance.monthlyBusinessRates)+'/month (Standard)';
  const button=document.createElement('button');button.type='button';button.textContent='Select '+applicant.name+' · '+currency(fitout);
  button.disabled=challengeFinished(game)||game.councilBudget<fitout||actionsRemaining(game)<1;
  button.addEventListener('click',()=>{
   try{game=openCapacityTenant(game,p.id,index);persist();renderAll();inspectPremise(p.id,false);openPanel('details');}
   catch(err){alert(err.message);}
  });
  choice.append(name,about,meta,button);addBlockReason(choice,button,actionBlockReason(game,fitout));el.append(choice);
 }
 if(challengeFinished(game)){const note=document.createElement('p');note.textContent='The challenge has finished: no new tenants can open.';el.append(note);}
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
 document.getElementById('report-services').textContent=currency(game.lastServiceCost||0);
 const risks=occupiedPremises(game).map(p=>businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,game.latestResults.find(r=>r.premiseId===p.id),(game.lossStreaks||{})[p.id]||0));
 const struggling=risks.filter(r=>r.name==='Struggling').length,critical=risks.filter(r=>r.name==='Critical').length;
 const recent=game.lastClosures||[];
 const thisMonth=game.history[game.history.length-1];
 document.getElementById('report-risks').textContent='Town development: '+(thisMonth?.development||'No recorded development')+'. Business outlook: '+struggling+' struggling, '+critical+' critical. '+(recent.length?'Closures this month: '+recent.map(c=>c.name+' ('+c.reason+')').join('; ')+'.':'No closures this month.');
}
function renderEvent(){const el=document.getElementById('event'),e=pendingEvent(game);el.replaceChildren();el.hidden=!e;if(!e)return;
 const h=document.createElement('h3');h.textContent=e.title+' — Month '+game.month;const p=document.createElement('p');p.textContent=e.description+' Cost: '+currency(e.cost)+'; benefit: +'+Math.round(100*e.uplift)+'% transactions for '+e.duration+' months. Decide before advancing.';
 const actions=document.createElement('div');actions.className='event-actions';for(const fund of [true,false]){const b=document.createElement('button');b.type='button';b.className=fund?'primary':'';b.textContent=fund?'Fund '+currency(e.cost):'Decline — £0';b.disabled=fund&&game.councilBudget<e.cost;b.addEventListener('click',()=>{game=decideEvent(game,fund);persist();renderAll();closePanel();});actions.append(b);}el.append(h,p,actions);
}
function renderFinal(){const el=document.getElementById('final');el.replaceChildren();el.hidden=!challengeFinished(game);if(el.hidden)return;const o=finalOutcome(game);const h=document.createElement('h3');h.textContent=o.won?'Challenge complete — high street recovered!':'Challenge complete — target missed';const p=document.createElement('p');p.textContent=`Month 12: ${o.occupied}/12 premises occupied (goal: 10). Council fund: ${currency(o.budget)}. Tenant openings: ${o.opened}. Closures: ${o.closures}. Rates collected since this version: ${currency(game.totalRatesReceived||0)}.`;el.append(h,p);}
function renderIssues(){
 const el=document.getElementById('issues-content');el.replaceChildren();
 const intro=document.createElement('p');intro.textContent='Current council effects and the most recently recorded town development. A development applies for one trading month, not indefinitely.';el.append(intro);
 const section=(title,lines)=>{const box=document.createElement('div');box.className='issue-card';const h=document.createElement('h4');h.textContent=title;box.append(h);for(const line of lines){const p=document.createElement('p');p.textContent=line;box.append(p);}el.append(box);};
 const cp=councilPolicies(game);
 const cleaning=SERVICES.cleaning[cp.cleaning],lighting=SERVICES.lighting[cp.lighting];
 section('Council services — active now',[
  `Cleaning: ${cp.cleaning} · Attractiveness +${cleaning.attractiveness} points`,
  `Lighting: ${cp.lighting} · Attractiveness +${lighting.attractiveness} points · Footfall ${Math.round(lighting.footfall*100)>0?'+':''}${Math.round(lighting.footfall*100)}%`,
  `Service costs: ${currency(serviceCosts(game))}/month`
 ]);
 const active=[];
 if(game.transportChoice){const t=TRANSPORT[game.transportChoice];active.push(`${game.transportChoice==='bus'?'Improved buses':'Free parking'}: Footfall +${Math.round(t.footfall*100)}%${t.attractiveness?' · Attractiveness +'+t.attractiveness+' points':''}`);}
 if((game.marketingUntil||0)>=game.month)active.push(`Marketing: Footfall +${Math.round(MARKETING.footfall*100)}% · active through Month ${game.marketingUntil}`);
 if(active.length)section('Investments — active now',active);
 const prior=game.history[game.history.length-1];
 if(prior){
  const dev=TOWN_DEVELOPMENTS.find(x=>x.title===prior.development);
  const sign=n=>n>0?'+':'';
  const lines=[`Month ${prior.month}: ${prior.development||'No development recorded'}`];
  if(dev){lines.push(`Footfall: ${sign(dev.footfall*100)}${Math.round(dev.footfall*100)}% during Month ${prior.month}`);
   lines.push(`Spending Power: ${sign(dev.spendingPower)}${dev.spendingPower} points during Month ${prior.month}`);}
  lines.push('This development is historical; it is not automatically active in the current month.');
  section('Latest town development — previous month',lines);
 }else section('Town developments',['No completed month yet. Developments are revealed when you advance time.']);
 const e=pendingEvent(game);if(e)section('Decision awaiting your response',[`Month ${game.month}: ${e.title}. Use the notification bell to review it.`]);
 const metrics=townMetrics(game);section('Current town estimate',[`Footfall: ${metrics.footfall.toLocaleString('en-GB')} visits · Attractiveness: ${metrics.attractiveness.toFixed(0)}/100`,`Commercial Vitality: ${metrics.vitality.toFixed(0)}/100. Vitality contributes to footfall and attractiveness relative to the starting town.`]);
}
function renderAll(){
 renderStats();renderMetrics();renderShops();renderCouncil();renderReport();renderEvent();renderFinal();renderNotifications();renderPerformance(game);renderIssues();
 if(selectedId!==null)inspectPremise(selectedId,false);
 if(activePanel){
  for(const name of Object.keys(panelNames))document.getElementById(name).hidden=name!==activePanel;
 }
}
document.getElementById('close').addEventListener('click',closePanel);
document.getElementById('dismiss-modal').addEventListener('click',closePanel);
modal.addEventListener('click',e=>{if(e.target===modal)closePanel();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closePanel();});
document.getElementById('notification').addEventListener('click',()=>openPanel('notifications'));
document.getElementById('reopen-event').addEventListener('click',()=>openPanel('event'));
document.getElementById('show-council').addEventListener('click',()=>openPanel('council'));
document.getElementById('show-goal').addEventListener('click',()=>openPanel('goal-panel'));
document.getElementById('show-issues').addEventListener('click',()=>{renderIssues();openPanel('issues');});
document.getElementById('show-performance').addEventListener('click',()=>{renderPerformance(game);openPanel('performance');});
document.getElementById('show-report').addEventListener('click',()=>{
 if(!game.latestResults.length){alert('The first monthly report will be available after you advance a month.');return;}
 openPanel('report');
});
document.getElementById('advance').addEventListener('click',()=>{if(pendingEvent(game)){openPanel('event');return;}try{game=runChallengeMonth(game);persist();renderAll();if(challengeFinished(game))openPanel('final');else if(pendingEvent(game))openPanel('event');else openPanel('report');}catch(e){alert(e.message);}});
document.getElementById('reset').addEventListener('click',()=>{if(!confirm('Restart from Month 1? This replaces your current progress in this version.'))return;game=startingGame();closePanel();persist();renderAll();});
renderAll();persist();if(pendingEvent(game))openPanel('event');else if(challengeFinished(game))openPanel('final');
