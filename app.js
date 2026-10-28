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
let focusedOfferType=null;
// Keep Stage 2 saves in their existing key and initialise new risk fields on load.
game=normaliseGame(game);
if(!Array.isArray(game.seenStrategicOffers))game.seenStrategicOffers=[];
let activePanel=null;
const modal=document.getElementById('modal');
const modalSheet=modal.querySelector('.modal-sheet');
const panelNames={details:'Shop details',council:'Council management',notifications:'Notifications',opportunities:'Strategic opportunities',issues:'Current issues',performance:'Performance','local-economy-panel':'Local economy',report:'Monthly report',event:'Council decision',final:'Challenge result','goal-panel':'Challenge','economy-hub':'Economy','alerts-hub':'Alerts'};
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
function metricTrend(key, current, inverse=false){
 const history=game.history||[];
 const previous=history.length>=2?history[history.length-2]:null;
 const latest=history.at(-1)||null;
 if(!latest||!previous||!Number.isFinite(latest[key])||!Number.isFinite(previous[key]))return {text:'—',cls:'neutral',points:[]};
 const delta=latest[key]-previous[key];
 const sign=delta>0?'+':'';
 const good=inverse?delta<0:delta>0;
 const text=Math.abs(delta)<.05?'→ No change':(delta>0?'↑ ':'↓ ')+sign+(key==='footfall'?Math.round(delta).toLocaleString('en-GB'):delta.toFixed(1));
 const points=history.slice(-6).map(row=>row[key]).filter(Number.isFinite);
 return {text,cls:Math.abs(delta)<.05?'neutral':good?'positive':'negative',points};
}
function makeSparkline(values){
 if(values.length<2)return null;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 120 27');svg.setAttribute('class','mini-sparkline');svg.setAttribute('role','img');svg.setAttribute('aria-label','Recent monthly trend');
 const low=Math.min(...values),high=Math.max(...values),range=high-low||1;
 const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2.5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('points',values.map((v,i)=>`${3+i*114/(values.length-1)},${23-(v-low)/range*19}`).join(' '));svg.append(line);return svg;
}
function renderMetrics(){
 const m=townMetrics(game),el=document.getElementById('town-metrics');el.replaceChildren();
 for(const [name,value,key,explain] of [['👣 Footfall',m.footfall.toLocaleString('en-GB'),'footfall','Monthly visits'],['💷 Spending',m.spendingPower.toFixed(1)+'/100','underlyingSpendingPower','Spending Power'],['✨ Appeal',m.attractiveness.toFixed(0)+'/100','attractiveness','Town Attractiveness'],['🏬 Vitality',m.vitality.toFixed(0)+'/100','vitality','Commercial Vitality']]){
  const card=document.createElement('div');card.className='metric-card';
  const a=document.createElement('small');a.textContent=name;const b=document.createElement('strong');b.textContent=value;
  const trend=metricTrend(key,m[key]);const t=document.createElement('span');t.className='metric-trend '+trend.cls;t.textContent=trend.text;t.title='Change between the two most recently completed months';
  card.append(a,b,t);const spark=makeSparkline(trend.points);if(spark)card.append(spark);el.append(card);
 }
 renderRecoveryStrip(m);
}
function renderRecoveryStrip(m){
 const el=document.getElementById('recovery-strip');el.replaceChildren();
 const occupied=occupiedPremises(game).length,last=(game.history||[]).at(-1);
 const stable=last&&Number.isFinite(last.stable)?last.stable:null;
 const ratio=stable===null?null:occupied?100*stable/occupied:0;
 const h=document.createElement('div');h.className='recovery-title';h.innerHTML='<strong>🎯 Recovery targets</strong><small>Current position · not a guaranteed Month 12 result</small>';el.append(h);
 const targets=[['Occupancy',occupied+' / 12',occupied>=10],['Footfall',m.footfall.toLocaleString('en-GB'),m.footfall>=10000],['Stable businesses',ratio===null?'After Month 1':ratio.toFixed(0)+'%',ratio===null?null:ratio>=70]];
 for(const [name,value,pass] of targets){const item=document.createElement('div');item.className='recovery-item '+(pass===null?'unknown':pass?'met':'unmet');const marker=document.createElement('span');marker.textContent=pass===null?'•':pass?'✓':'○';const label=document.createElement('span');label.textContent=name;const val=document.createElement('strong');val.textContent=value;item.append(marker,label,val);el.append(item);}
}

function showOffer(type){
 focusedOfferType=type;
 renderOpportunities();
 openPanel('opportunities');
}
// Record the first presentation before opening the dialog so a reload cannot repeat it.
function openNewStrategicOffer(){
 if(challengeFinished(game)||pendingEvent(game))return false;
 const unseen=opportunityEntries(game).find(x=>x.status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth&&!(Array.isArray(game.seenStrategicOffers)?game.seenStrategicOffers:[]).includes(x.type));
 if(!unseen)return false;
 game={...game,seenStrategicOffers:[...(Array.isArray(game.seenStrategicOffers)?game.seenStrategicOffers:[]),unseen.type]};
 persist();showOffer(unseen.type);return true;
}
function renderNotificationBadge(){
 const e=pendingEvent(game),count=(e?1:0)+(game.finalNotification?1:0)+opportunityEntries(game).filter(x=>x.status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth).length;
 const tag=document.getElementById('notification-count');tag.hidden=!count;tag.textContent=String(count);
 const banner=document.getElementById('pending-banner');banner.hidden=!e;
 document.getElementById('pending-message').textContent=e?'Month '+game.month+': '+e.title+'. Choose an option before advancing.':'';
 document.getElementById('advance').textContent=e?'Review decision →':'Advance →';
}
function renderNotifications(){
 const c=document.getElementById('notifications');c.replaceChildren();
 const title=document.createElement('h3');title.textContent='Notifications';c.append(title);
 const e=pendingEvent(game);
 if(e){
  const p=document.createElement('p');p.textContent='⚠ Decision required · Month '+game.month+': '+e.title+'. Resolve before advancing.';
  const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent='Open decision';btn.addEventListener('click',()=>openPanel('event'));c.append(p,btn);
 }else{const p=document.createElement('p');p.textContent='No pending council decisions.';c.append(p);}
 const offerHistory=opportunityEntries(game).filter(x=>x.offerMonth<=game.month);
 if(offerHistory.length){
  const h=document.createElement('h4');h.textContent='Strategic opportunities';c.append(h);
  for(const x of offerHistory){
   const status=opportunityStatus(x,game.month),available=status==='offered'&&game.month<=x.expiresMonth;
   const card=document.createElement('section');card.className='policy-section';
   const heading=document.createElement('strong');heading.textContent=STRATEGIC_OPPORTUNITIES[x.type].title;
   const label=document.createElement('p');label.className='policy-compare';label.textContent=available?'Optional opportunity · available through Month '+x.expiresMonth:status==='pending'?'Funded · outcome due Month '+x.resultMonth:'Outcome: '+status;
   const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent=available?'Review opportunity':'Review record';btn.addEventListener('click',()=>showOffer(x.type));
   card.append(heading,label,btn);c.append(card);
  }
 }
 if(game.finalNotification){
  const o=game.finalNotification;
  const h=document.createElement('h4');h.textContent='🏆 Completed challenge · Month 12';
  const p=document.createElement('p');p.textContent=o.won?'Balanced recovery achieved — all three targets met.':'Challenge finished — '+o.met+' of 3 targets achieved.';
  const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent='Review final results';btn.addEventListener('click',()=>openPanel('final'));
  c.append(h,p,btn);
 }
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
 const policyChoices=document.createElement('div');policyChoices.className='compact-policies';c.append(policyChoices);
 function selector(title,items,current,onSelect){
  const box=document.createElement('section');box.className='compact-policy';
  const h=document.createElement('h4');h.textContent=title;box.append(h);
  const slider=document.createElement('input');slider.type='range';slider.className='policy-slider';
  slider.min='0';slider.max=String(items.length-1);slider.step='1';
  slider.value=String(Math.max(0,items.findIndex(i=>i.key===current)));
  slider.disabled=challengeFinished(game);
  slider.setAttribute('aria-label',title+' policy level');
  const chosen=document.createElement('div');chosen.className='policy-slider-label';chosen.setAttribute('aria-live','polite');
  const ticks=document.createElement('div');ticks.className='policy-slider-ticks';
  for(const item of items){const tick=document.createElement('span');tick.textContent=item.label;ticks.append(tick);}
  const detail=document.createElement('p');detail.className='policy-compare';
  const action=document.createElement('button');action.type='button';action.className='policy-action compact-apply';action.textContent='Apply selection';
  const refresh=()=>{
   const item=items[Number(slider.value)];
   chosen.textContent=item.label;detail.textContent=item.description;
   action.hidden=item.key===current||challengeFinished(game);
   slider.style.setProperty('--slider-progress',(Number(slider.value)/(items.length-1)*100)+'%');
  };
  slider.addEventListener('input',refresh);
  action.addEventListener('click',()=>onSelect(items[Number(slider.value)].key));
  box.append(chosen,slider,ticks,detail,action);policyChoices.append(box);refresh();
 }
 selector('Business rates',[
  {key:'low',label:'Low −20%',description:'Shop costs and council receipts are 20% below standard. Takes effect next trading month.'},
  {key:'standard',label:'Standard',description:'Maintain baseline business-rates costs and council receipts.'},
  {key:'high',label:'High +20%',description:'Higher council income, but businesses pay 20% more in rates.'}
 ],game.nextRatesBand,band=>{game=setRatesPolicy(game,band);persist();renderAll();openPanel('council');});
 const cp=councilPolicies(game);
 for(const [key,title] of [['cleaning','Street cleaning'],['lighting','Street lighting']]){
  const items=Object.entries(SERVICES[key]).map(([level,rule])=>({key:level,label:level.charAt(0).toUpperCase()+level.slice(1),description:currency(rule.cost)+'/month · Attractiveness +'+rule.attractiveness+' · Footfall '+(rule.footfall>=0?'+':'')+((rule.footfall||0)*100).toFixed(0)+'% (policy contribution).'}));
  selector(title,items,cp[key],level=>{game=changeService(game,key,level);persist();renderAll();openPanel('council');});
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
 const programmes=section('Local economic programmes','Support household conditions or temporarily stimulate spending. These measures are independent of ordinary cleaning, lighting and business rates.');
 for(const [type,title,description] of [
  ['employment','Employment and skills','£25,000 · 2 Action Points. After two months, employment rises +0.9 and earnings +0.25 each month for five months. The improvement persists. One programme per challenge.'],
  ['vouchers','Shop-local vouchers','£10,000 · 1 Action Point. Spending Power used for shop trading rises by 4 points for two months, starting this month. Underlying household finances do not change.']
 ]){
  const item=document.createElement('div');item.className='economy-programme';
  const h=document.createElement('h4');h.textContent=title;
  const info=document.createElement('p');info.textContent=description;
  const btn=document.createElement('button');btn.type='button';btn.className='policy-action';btn.textContent='Fund '+title+' · '+currency(ECONOMIC_PROGRAMMES[type].cost);
  const reason=programmeAvailability(game,type);btn.disabled=!!reason;
  const confirmation=document.createElement('div');confirmation.className='policy-preview';confirmation.hidden=true;
  const confirmText=document.createElement('p');confirmText.textContent='Confirm '+title+': '+currency(ECONOMIC_PROGRAMMES[type].cost)+' upfront and '+ECONOMIC_PROGRAMMES[type].points+' Action Point'+(ECONOMIC_PROGRAMMES[type].points===1?'':'s')+'.';
  const apply=document.createElement('button');apply.type='button';apply.className='policy-action compact-apply';apply.textContent='Confirm funding';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='policy-action';cancel.textContent='Cancel';
  confirmation.append(confirmText,apply,cancel);
  btn.addEventListener('click',()=>{confirmation.hidden=false;btn.hidden=true;});
  cancel.addEventListener('click',()=>{confirmation.hidden=true;btn.hidden=false;});
  apply.addEventListener('click',()=>{
   try{game=fundEconomicProgramme(game,type);persist();renderAll();openPanel('council');}catch(err){alert(err.message);renderAll();openPanel('council');}
  });
  item.append(h,info,btn,confirmation);if(reason){const note=document.createElement('p');note.className='unavailable-reason';note.textContent=reason;item.append(note);}
  programmes.append(item);
 }
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
 pre.textContent=`Transactions: ${r.baseTransactions} × ${r.demandFactor.toFixed(3)} town conditions × (1 + ${(r.grantUplift*100).toFixed(0)}% grant + ${(r.eventUplift*100).toFixed(0)}% event) = ${r.transactions}\nRevenue: ${r.transactions} × ${currency(r.averageSale)} = ${currency(r.revenue)}\nBusiness rates: ${currency(p.finance.monthlyBusinessRates)} standard × ${ratesBandFactor(r.rateBand).toFixed(1)} = ${currency(r.businessRates)}\nExpenses: ${currency(r.rent)} rent + ${currency(r.wages)} wages + ${currency(r.otherCosts)} other + ${currency(r.businessRates)} rates = ${currency(r.totalExpenses)}\nSales-linked costs: ${currency(r.salesLinkedCost||0)} adjustment vs the shop’s baseline other costs (55% of sales difference, with a £0 floor).\nProfit: ${currency(r.revenue)} − ${currency(r.totalExpenses)} = ${currency(r.profit)}\n${preview?'Forecast; cash has not changed.':`Opening cash: ${currency(r.openingCash)}; closing cash: ${currency(r.closingCash)}`}\nBusiness rates also count as council income when this trading month is processed.`;
 debug.append(label,pre);const note=document.createElement('div');note.className='note';note.textContent='Game estimates only. Rates are paid by shops and received into the same council fund on month advancement.';
 const collapsible=document.createElement('details');collapsible.className='finance-collapse';const summary=document.createElement('summary');summary.textContent='Detailed business finances';collapsible.append(summary,h,lead,grid,debug,note);target.append(collapsible);
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
function shopOverview(p){
 const el=document.getElementById('shop-overview');el.replaceChildren();el.hidden=!p.occupied;
 if(!p.occupied)return;
 const latest=game.latestResults.find(r=>r.premiseId===p.id)||null;
 const estimate=latest||calculateMonthlyTrading(p,game.cashByPremise[p.id],game.month,game.grants,game.interventions,game.nextRatesBand,townMetrics(game));
 const tiles=document.createElement('div');tiles.className='shop-kpis';
 for(const [name,v] of [['Monthly profit',currency(estimate.profit)],['Cash reserves',currency(game.cashByPremise[p.id]||0)]]){
  const tile=document.createElement('div');tile.className='shop-kpi';const small=document.createElement('small');small.textContent=name;const big=document.createElement('strong');big.textContent=v;tile.append(small,big);tiles.append(tile);
 }
 const label=document.createElement('strong');label.textContent='Monthly operating profit';
 const records=(game.history||[]).map(h=>({month:h.month,record:(h.shops||[]).find(s=>s.id===p.id)})).filter(x=>x.record&&Number.isFinite(x.record.profit)).slice(-8);
 const chart=document.createElement('div');chart.className='shop-spark';
 if(records.length<2){chart.textContent='Profit trend appears after two completed months of trading.';}
 else{
  const vals=records.map(x=>x.record.profit);let min=Math.min(0,...vals),max=Math.max(0,...vals);if(max===min)max=min+1;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 320 82');svg.setAttribute('role','img');svg.setAttribute('aria-label','Monthly profit trend from '+currency(vals[0])+' to '+currency(vals.at(-1)));
  const zero=74-(0-min)/(max-min)*64;
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [k,v] of Object.entries({x1:4,x2:316,y1:zero,y2:zero,stroke:'#b0bdb2','stroke-dasharray':'3 4'}))line.setAttribute(k,v);svg.append(line);
  const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');poly.setAttribute('points',vals.map((v,i)=>(4+i*312/(vals.length-1)).toFixed(1)+','+(74-(v-min)/(max-min)*64).toFixed(1)).join(' '));poly.setAttribute('fill','none');poly.setAttribute('stroke','#2c7355');poly.setAttribute('stroke-width','3');poly.setAttribute('stroke-linecap','round');svg.append(poly);chart.append(svg);
  const foot=document.createElement('small');foot.textContent='Months '+records[0].month+'–'+records.at(-1).month+' · latest '+currency(vals.at(-1));chart.append(foot);
 }
 el.append(tiles,label,chart);
}
function inspectPremise(id,scroll){const p=currentPremise(game,id);if(!p)return;selectedId=id;const el=document.getElementById('details');el.hidden=false;
 document.querySelectorAll('.shop').forEach(b=>{const yes=Number(b.dataset.id)===id;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
 for(const [key,value] of [['detail-icon',p.icon],['detail-title',p.name],['detail-description',p.description],['detail-type',p.type],['detail-status',p.occupied?'Trading':'Vacant'],['detail-premise','Premise '+p.id],['detail-position',p.side==='north'?'North side':'South side']])document.getElementById(key).textContent=value;
 const previous=game.latestResults.find(r=>r.premiseId===p.id)||null;
 const status=businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,previous,(game.lossStreaks||{})[p.id]||0);
 document.getElementById('risk-box').hidden=!p.occupied;
 document.getElementById('detail-risk').textContent=p.occupied?status.name+' · '+status.health.toFixed(0)+'/100 · '+status.runway.toFixed(1)+' months cost cover':'';
 shopOverview(p);buildFinanceDetails(p);renderGrantPanel(p);renderTenantPanel(p);if(scroll)openPanel('details');
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
 const economyDetail=thisMonthEconomyLine();
 const risks=occupiedPremises(game).map(p=>businessRiskStatus(p,game.cashByPremise[p.id]||0,game.ratesBand,game.latestResults.find(r=>r.premiseId===p.id),(game.lossStreaks||{})[p.id]||0));
 const struggling=risks.filter(r=>r.name==='Struggling').length,critical=risks.filter(r=>r.name==='Critical').length;
 const recent=game.lastClosures||[];
 const thisMonth=game.history[game.history.length-1];
 document.getElementById('report-risks').textContent='Local economy: '+economyDetail+' Council programme impact: '+(thisMonth?.programmeEffects?.employment||0).toFixed(2)+' employment, '+(thisMonth?.programmeEffects?.earnings||0).toFixed(2)+' earnings, +'+(thisMonth?.programmeEffects?.spendingPower||0).toFixed(1)+' temporary Spending Power. Town development: '+(thisMonth?.development||'No recorded development')+'. Strategic opportunities: '+(thisMonth?.opportunityResults||[]).map(x=>STRATEGIC_OPPORTUNITIES[x.type].title+' '+(x.success?'succeeded':'failed')).join(', ')+'. Business outlook: '+struggling+' struggling, '+critical+' critical. '+(recent.length?'Closures this month: '+recent.map(c=>c.name+' ('+c.reason+')').join('; ')+'.':'No closures this month.');
}
function renderEvent(){const el=document.getElementById('event'),e=pendingEvent(game);el.replaceChildren();el.hidden=!e;if(!e)return;
 const h=document.createElement('h3');h.textContent=e.title+' — Month '+game.month;const p=document.createElement('p');p.textContent=e.description+' Cost: '+currency(e.cost)+'; benefit: +'+Math.round(100*e.uplift)+'% transactions for '+e.duration+' months. Decide before advancing.';
 const actions=document.createElement('div');actions.className='event-actions';for(const fund of [true,false]){const b=document.createElement('button');b.type='button';b.className=fund?'primary':'';b.textContent=fund?'Fund '+currency(e.cost):'Decline — £0';b.disabled=fund&&game.councilBudget<e.cost;b.addEventListener('click',()=>{game=decideEvent(game,fund);persist();renderAll();closePanel();openNewStrategicOffer();});actions.append(b);}el.append(h,p,actions);
}
function renderFinal(){
 const el=document.getElementById('final');el.replaceChildren();el.hidden=!challengeFinished(game);if(el.hidden)return;
 const o=game.finalNotification||makeFinalNotification(game),heading=document.createElement('h3');
 heading.textContent=o.won?'Challenge complete — balanced recovery achieved!':`Challenge complete — ${o.met} of 3 recovery targets met`;
 el.append(heading);
 const intro=document.createElement('p');intro.textContent='The final assessment uses the last completed trading month, not a forecast. All three objectives are required for a full victory.';el.append(intro);
 const lines=[
 ['Occupied premises',o.occupied+'/12','At least 10',o.checks.occupancy],
 ['Monthly footfall',o.footfall===null?'Not recorded':o.footfall.toLocaleString('en-GB'),'At least 10,000 visits',o.checks.footfall],
 ['Stable trading businesses',o.stable===null?'Not recorded':o.stable+' of '+o.occupied,'At least '+o.stableRequired+' of '+o.occupied+' (70%)',o.checks.sustainability]
 ];
 const grid=document.createElement('div');grid.className='recovery-results';
 for(const [label,value,required,passed] of lines){const item=document.createElement('div');item.className='recovery-result';const name=document.createElement('strong');name.textContent=(passed?'✓ ':'✕ ')+label;const detail=document.createElement('span');detail.textContent=value+' · Target: '+required;item.append(name,detail);grid.append(item);}el.append(grid);
 const p=document.createElement('p');p.textContent='Council fund: '+currency(o.budget)+'. Tenant openings: '+o.opened+'. Closures: '+o.closures+'. Business rates collected: '+currency(o.rates||0)+'.';el.append(p);
}

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
 const fx=appliedProgrammeEffects(game,game.month);
 if(economicProgrammes(game).length)section('Economic programmes — current month',[`Employment +${fx.employment.toFixed(2)} · Earnings +${fx.earnings.toFixed(2)} · Temporary trading Spending Power +${fx.spendingPower.toFixed(1)}`, 'Employment programme changes persist once applied; voucher boosts end after two trading months.']);
 const availableOpps=opportunityEntries(game).filter(x=>x.status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth);
 if(availableOpps.length)section('Strategic offers — available now',availableOpps.map(x=>STRATEGIC_OPPORTUNITIES[x.type].title+' · '+Math.round(STRATEGIC_OPPORTUNITIES[x.type].chance*100)+'% chance · expires Month '+x.expiresMonth));
 const projects=opportunityEntries(game).filter(x=>x.status==='pending'||x.status==='succeeded');
 if(projects.length)section('Strategic investments — recorded',projects.map(x=>STRATEGIC_OPPORTUNITIES[x.type].title+' · '+x.status+(x.status==='pending'?' · result Month '+x.resultMonth:'')));
 const e=pendingEvent(game);if(e)section('Decision awaiting your response',[`Month ${game.month}: ${e.title}. Use the notification bell to review it.`]);
 const metrics=townMetrics(game);section('Current town estimate',[`Footfall: ${metrics.footfall.toLocaleString('en-GB')} visits · Attractiveness: ${metrics.attractiveness.toFixed(0)}/100`,`Commercial Vitality: ${metrics.vitality.toFixed(0)}/100. Vitality contributes to footfall and attractiveness relative to the starting town.`]);
}
function thisMonthEconomyLine(){
 const last=(game.history||[]).at(-1);
 if(!last||!Number.isFinite(last.underlyingSpendingPower))return 'No recorded economic change yet.';
 const preceding=(game.history||[]).at(-2);
 const baseline=preceding&&Number.isFinite(preceding.underlyingSpendingPower)?preceding.underlyingSpendingPower:spendingIndex(initialLocalEconomy());
 const diff=Math.round((last.underlyingSpendingPower-baseline)*10)/10;
 return 'Underlying Spending Power '+last.underlyingSpendingPower.toFixed(1)+'/100 ('+(diff>0?'+':'')+diff.toFixed(1)+'); '+last.economyChange+'.';
}
function renderLocalEconomy(){
 const el=document.getElementById('local-economy-content');el.replaceChildren();
 const e=currentLocalEconomy(game),index=spendingIndex(e),last=(game.history||[]).at(-1);
 const intro=document.createElement('p');intro.textContent='Local household conditions evolve independently of council policies. Higher employment and earnings improve Spending Power; higher living-cost pressure reduces it.';el.append(intro);
 const headline=document.createElement('div');headline.className='policy-preview';
 const top=document.createElement('strong');top.textContent='Underlying Spending Power · '+index.toFixed(1)+'/100';
 const sub=document.createElement('p');sub.textContent='This is an index of residents’ spending capacity, not actual household income. Temporary town developments may change the trading-month figure.';
 headline.append(top,sub);el.append(headline);
 const rows=[['Employment',e.employment,'More people in work supports household spending.'],['Earnings',e.earnings,'Higher local income supports spending per transaction.'],['Living costs',e.livingCosts,'Higher pressure leaves less disposable income.']];
 for(const [name,val,meaning] of rows){const section=document.createElement('section');section.className='economy-factor';const line=document.createElement('div');line.className='economy-factor-head';const label=document.createElement('strong');label.textContent=name;const value=document.createElement('strong');value.textContent=val.toFixed(1)+'/100';line.append(label,value);const track=document.createElement('div');track.className='economy-track';const fill=document.createElement('div');fill.className='economy-fill'+(name==='Living costs'?' economy-cost':'');fill.style.width=val+'%';track.append(fill);const note=document.createElement('small');note.textContent=meaning;section.append(line,track,note);el.append(section);}
 const explanation=document.createElement('p');explanation.className='note';explanation.textContent=last&&last.economyChange?'Latest monthly movements: '+last.economyChange+'.':'Initial town economy. Advance a month to see changes.';el.append(explanation);
 const active=economicProgrammes(game);if(active.length){
  const h=document.createElement('h4');h.textContent='Council economic programmes';el.append(h);
  const effects=appliedProgrammeEffects(game,game.month);
  for(const x of active){const p=document.createElement('p');
   p.textContent=x.type==='employment'?'Employment programme funded in Month '+x.startMonth+'. Benefits begin Month '+(x.startMonth+ECONOMIC_PROGRAMMES.employment.delay)+' and run through Month '+(x.startMonth+ECONOMIC_PROGRAMMES.employment.delay+ECONOMIC_PROGRAMMES.employment.duration-1)+'.':'Voucher scheme funded in Month '+x.startMonth+'. Trading support through Month '+(x.startMonth+1)+'.';el.append(p);
  }
  const p=document.createElement('p');p.textContent='Current-month programme contribution: employment +'+effects.employment.toFixed(2)+'; earnings +'+effects.earnings.toFixed(2)+'; temporary spending power +'+effects.spendingPower+'.';el.append(p);
 }
 const foot=document.createElement('p');foot.textContent='Calculation: 40% employment + 30% earnings + 30% (100 − living-cost pressure). Employment support adds lasting improvements with a lag; shop-local vouchers only affect temporary trading-month purchasing power.';el.append(foot);
}

function renderOpportunities(){
 const el=document.getElementById('opportunities');el.replaceChildren();
 const h=document.createElement('h3');h.textContent='Strategic opportunities';el.append(h);
 const note=document.createElement('p');note.textContent='Optional opportunity — invest, decline, or close to decide later. Offers expire without blocking the next month. Success is rolled once and saved.';el.append(note);
 const entries=opportunityEntries(game).filter(x=>x.offerMonth<=game.month&&(!focusedOfferType||x.type===focusedOfferType));
 if(!entries.length){const p=document.createElement('p');p.textContent='No opportunities recorded yet.';el.append(p);}
 for(const x of entries){
  const p=STRATEGIC_OPPORTUNITIES[x.type],status=opportunityStatus(x,game.month);
  const box=document.createElement('section');box.className='policy-section';
  const heading=document.createElement('h4');heading.textContent=p.title;box.append(heading);
  const description=document.createElement('p');description.textContent=p.description;box.append(description);
  const detail=document.createElement('p');detail.className='policy-compare';detail.textContent=currency(p.cost)+' upfront · '+p.points+' Action Point(s) · '+Math.round(p.chance*100)+'% success chance · '+(p.delay?'Outcome in '+p.delay+' months':'Immediate outcome')+' · '+(status==='offered'?'Available Months '+x.offerMonth+'–'+x.expiresMonth:'Status: '+status);box.append(detail);
  const positive=document.createElement('p');positive.textContent='If successful: '+p.success;box.append(positive);
  const negative=document.createElement('p');negative.textContent='If unsuccessful: '+p.failure;box.append(negative);
  if(status==='offered'&&game.month>=x.offerMonth&&game.month<=x.expiresMonth){
   const reason=opportunityAvailability(game,x.type);
   const fund=document.createElement('button');fund.type='button';fund.className='policy-action';fund.textContent='Consider investing';fund.disabled=!!reason;
   const decline=document.createElement('button');decline.type='button';decline.className='policy-action';decline.textContent='Decline offer';
   const confirmation=document.createElement('div');confirmation.className='policy-preview';confirmation.hidden=true;
   const prompt=document.createElement('p');prompt.textContent='Confirm '+currency(p.cost)+' and '+p.points+' Action Points? Success chance '+Math.round(p.chance*100)+'%. No refunds for failure.';
   const yes=document.createElement('button');yes.type='button';yes.className='policy-action compact-apply';yes.textContent='Confirm investment';
   const cancel=document.createElement('button');cancel.type='button';cancel.className='policy-action';cancel.textContent='Cancel';
   fund.addEventListener('click',()=>{confirmation.hidden=false;fund.hidden=true;});
   cancel.addEventListener('click',()=>{confirmation.hidden=true;fund.hidden=false;});
   yes.addEventListener('click',()=>{try{game=decideOpportunity(game,x.type,true);persist();renderAll();showOffer(x.type);}catch(err){alert(err.message);}});
   decline.addEventListener('click',()=>{game=decideOpportunity(game,x.type,false);persist();renderAll();showOffer(x.type);});
   confirmation.append(prompt,yes,cancel);box.append(fund,decline,confirmation);
   if(reason){const r=document.createElement('p');r.className='unavailable-reason';r.textContent=reason;box.append(r);}
  }else if(status==='pending'){
   const pending=document.createElement('p');pending.textContent='Investment committed in Month '+x.investedMonth+'. Decision scheduled for Month '+x.resultMonth+'.';box.append(pending);
  }else if(x.investedMonth){const outcome=document.createElement('p');outcome.textContent=x.success?'✓ Project succeeded.': '✕ Project failed. Investment lost.';box.append(outcome);}
  el.append(box);
 }
}

function renderAll(){
 renderStats();renderMetrics();renderShops();renderCouncil();renderReport();renderEvent();renderFinal();renderNotifications();renderPerformance(game);renderIssues();renderLocalEconomy();renderOpportunities();
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


document.getElementById('show-economy').addEventListener('click',()=>openPanel('economy-hub'));
document.getElementById('hub-local-economy').addEventListener('click',()=>{renderLocalEconomy();openPanel('local-economy-panel');});
document.getElementById('hub-issues').addEventListener('click',()=>{renderIssues();openPanel('issues');});
document.getElementById('show-alerts').addEventListener('click',()=>openPanel('alerts-hub'));
document.getElementById('hub-notifications').addEventListener('click',()=>openPanel('notifications'));
document.getElementById('hub-challenge').addEventListener('click',()=>openPanel('goal-panel'));
document.getElementById('show-performance').addEventListener('click',()=>{renderPerformance(game);openPanel('performance');});
document.getElementById('hub-report').addEventListener('click',()=>{
 if(!game.latestResults.length){alert('The first monthly report will be available after you advance a month.');return;}
 openPanel('report');
});
document.getElementById('advance').addEventListener('click',()=>{if(pendingEvent(game)){openPanel('event');return;}try{game=runChallengeMonth(game);persist();renderAll();if(challengeFinished(game))openPanel('final');else if(pendingEvent(game))openPanel('event');else if(!openNewStrategicOffer())openPanel('report');}catch(e){alert(e.message);}});
document.getElementById('reset').addEventListener('click',()=>{if(!confirm('Restart from Month 1? This replaces your current progress in this version.'))return;game=normaliseGame(startingGame());closePanel();persist();renderAll();});
renderAll();persist();if(pendingEvent(game))openPanel('event');else if(challengeFinished(game))openPanel('final');else openNewStrategicOffer();

/* Stage 7D: show the road scroll hint only when horizontal overflow exists. */
(function setupStreetScrollHint(){
 const viewport=document.getElementById('street-viewport');
 const cue=document.getElementById('street-scroll-cue');
 if(!viewport||!cue)return;
 const update=()=>{cue.hidden=viewport.scrollWidth<=viewport.clientWidth+2;};
 viewport.addEventListener('scroll',update,{passive:true});
 window.addEventListener('resize',update);
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(update);observer.observe(viewport);observer.observe(viewport.querySelector('.map'));}
 update();
})();
