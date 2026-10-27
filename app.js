/* Milestone 1C: street UI; model and rates logic live in separate files. */
const currency=amount=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(amount);
const occupiedCount=PREMISES.filter(p=>p.occupied).length;
let game={month:GAME_CONFIG.startingMonth,councilBudget:GAME_CONFIG.startingBudget,
  cashByPremise:Object.fromEntries(PREMISES.filter(p=>p.occupied).map(p=>[p.id,p.finance.cash])),latestResults:[],grants:[]};
let selectedId=null;
function renderStats(){
  document.getElementById('budget').textContent=currency(game.councilBudget);
  document.getElementById('occupancy').textContent=`${occupiedCount}/${PREMISES.length}`;
  document.getElementById('month').textContent=String(game.month);
}
function renderRow(side,target){
  const container=document.getElementById(target);
  PREMISES.filter(p=>p.side===side).forEach(p=>{
    const button=document.createElement('button');
    button.type='button';button.className=`shop${p.occupied?'':' vacant'}`;
    button.style.setProperty('--shop-color',p.colour);
    button.setAttribute('aria-label',`Inspect ${p.name}, ${p.occupied?'occupied':'vacant'}`);
    button.setAttribute('aria-pressed','false');button.dataset.id=p.id;
    button.innerHTML=`<div class="roof"></div><div class="front"><span class="shop-icon">${p.icon}</span></div><span class="shop-name">${p.name}</span><span class="shop-type">${p.type}</span>`;
    button.addEventListener('click',()=>inspectPremise(p.id));container.appendChild(button);
  });
}
function buildFinanceDetails(p){
  const target=document.getElementById('financials');
  if(!p.occupied){target.hidden=true;target.replaceChildren();return;}
  target.hidden=false;
  const r=game.latestResults.find(r=>r.premiseId===p.id) || calculateMonthlyTrading(p,game.cashByPremise[p.id],game.month,game.grants);
  const initial=game.latestResults.length===0;
  // Initial display previews estimated trading, but does not change cash until Advance Month.
  const rows=[
    ['Transactions',String(r.transactions)],['Base transactions',String(r.baseTransactions)],['Grant-funded extra transactions',String(r.transactions-r.baseTransactions)],['Average sale',currency(r.averageSale)],
    ['Revenue',currency(r.revenue)],['Rent',currency(r.rent)],['Wages',currency(r.wages)],
    ['Other operating costs',currency(r.otherCosts)],['Business rates (provisional)',currency(r.businessRates)],
    ['Total expenses',currency(r.totalExpenses)],['Operating profit',currency(r.profit)],
    ['Cash reserves',currency(game.cashByPremise[p.id])]
  ];
  const heading=document.createElement('h4');heading.textContent=initial?'Indicative monthly finances':'Latest completed month';
  const lead=document.createElement('p');lead.textContent=initial?'Forecast only — no month has been advanced.':'Latest result from completed trading.';
  const table=document.createElement('div');table.className='finance-grid';
  rows.forEach(([label,value])=>{
    const row=document.createElement('div');row.className='finance-line';
    const key=document.createElement('span');key.textContent=label;
    const val=document.createElement('strong');val.textContent=value;
    row.append(key,val);table.append(row);
  });
  const disclosure=document.createElement('details');disclosure.className='debug';
  const summary=document.createElement('summary');summary.textContent='Calculation debug view';
  const explanation=document.createElement('pre');
  explanation.textContent=`Grant uplift: ${r.baseTransactions} baseline transactions + ${r.transactions-r.baseTransactions} improvement uplift = ${r.transactions} transactions (${r.activeGrant?"active":"inactive"} for this trading month)\nRevenue: ${r.transactions} × ${currency(r.averageSale)} = ${currency(r.revenue)}\nExpenses: ${currency(r.rent)} rent + ${currency(r.wages)} wages + ${currency(r.otherCosts)} other + ${currency(r.businessRates)} business rates = ${currency(r.totalExpenses)}\nProfit: ${currency(r.revenue)} − ${currency(r.totalExpenses)} = ${currency(r.profit)}\n${initial?'Forecast: opening and closing cash not yet changed.':`Opening cash: ${currency(r.openingCash)}\nClosing cash: ${currency(r.openingCash)} + ${currency(r.profit)} = ${currency(r.closingCash)}`}\nRates basis: provisional per-business monthly estimate, not calculated from rateable value or relief.\nCouncil regeneration fund: ${currency(game.councilBudget)} (no rates receipts credited).`;
  disclosure.append(summary,explanation);
  const caveat=document.createElement('div');caveat.className='note';
  caveat.textContent='Illustrative figures only. Rates are a business expense, not income for the council regeneration fund.';
  target.replaceChildren(heading,lead,table,disclosure,caveat);
}
function inspectPremise(id){
  const p=PREMISES.find(p=>p.id===id);if(!p)return;selectedId=id;
  document.querySelectorAll('.shop').forEach(b=>{const active=Number(b.dataset.id)===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  const panel=document.getElementById('details');panel.hidden=false;
  document.getElementById('detail-icon').textContent=p.icon;
  document.getElementById('detail-title').textContent=p.name;
  document.getElementById('detail-description').textContent=p.description;
  document.getElementById('detail-type').textContent=p.type;
  document.getElementById('detail-status').textContent=p.occupied?'Trading':'Vacant';
  document.getElementById('detail-premise').textContent=`Premise ${p.id}`;
  document.getElementById('detail-position').textContent=p.side==='north'?'North side':'South side';
  buildFinanceDetails(p);renderGrantPanel(p);panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderReport(){
  const report=document.getElementById('report');
  if(!game.latestResults.length){report.hidden=true;return;}
  report.hidden=false;
  const total=(field)=>game.latestResults.reduce((sum,r)=>sum+r[field],0);
  document.getElementById('report-month').textContent=String(game.month-1);
  document.getElementById('report-profit').textContent=currency(total('profit'));
  document.getElementById('report-rates').textContent=currency(total('businessRates'));
  document.getElementById('report-budget').textContent=currency(game.councilBudget);
}
function renderGrantPanel(p){
 const el=document.getElementById('grant-section');
 if(!p.occupied){el.hidden=true;el.replaceChildren();return;}
 el.hidden=false;
 const grant=grantForPremise(game.grants,p.id);
 const heading=document.createElement('h4');heading.textContent='Council improvement grant';
 const info=document.createElement('p');
 info.textContent='£5,000 from the regeneration fund for shopfront improvements. Adds 10% to monthly transactions (rounded) for six trading months, beginning with the next Advance Month. No grant money is added directly to business cash.';
 const status=document.createElement('p');status.className='grant-note';
 let btn=null;
 if(grant){
  const remaining=Math.max(0,grant.awardedMonth+IMPROVEMENT_GRANT.durationMonths-game.month);
  status.textContent=remaining>0?('Awarded in Month '+grant.awardedMonth+' · '+remaining+' trading months of uplift remaining.'):'Grant completed. Only one grant per shop in this prototype.';
 }else{
  status.textContent='Council fund: '+currency(game.councilBudget)+'. Business rates still do not enter the regeneration fund.';
  btn=document.createElement('button');btn.type='button';
  btn.textContent='Award £5,000 grant';btn.disabled=game.councilBudget<IMPROVEMENT_GRANT.cost;
  btn.addEventListener('click',()=>{
   game=awardImprovementGrant(game,p);
   renderStats();renderReport();buildFinanceDetails(p);renderGrantPanel(p);
  });
 }
 el.replaceChildren(...[heading,info,status,...(btn?[btn]:[])]);
}
document.getElementById('close').addEventListener('click',()=>{
  selectedId=null;document.getElementById('details').hidden=true;
  document.querySelectorAll('.shop').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
});
document.getElementById('advance').addEventListener('click',()=>{
  game=advanceTradingMonth(game,PREMISES);renderStats();renderReport();
  if(selectedId!==null){const p=PREMISES.find(p=>p.id===selectedId);buildFinanceDetails(p);renderGrantPanel(p);}
});
renderStats();renderRow('north','north');renderRow('south','south');
