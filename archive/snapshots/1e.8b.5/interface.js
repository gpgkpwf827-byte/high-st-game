/* High Street Stage 8B.5 — consolidated 8B.1–8B.4.1 interface JS.
   Sections retain their original order and behaviour. Simulation and saves unchanged. */


/* ---- stage8b1.js ---- */
/* Stage 8B.1 presentation-only adapter. Loaded after app.js. No new save keys or financial rules. */
(function(){
 'use strict';
 const root=document.querySelector('.shell');
 const street=document.getElementById('street-viewport');
 if(!root||!street||typeof game==='undefined'||typeof openPanel!=='function')return;
 const nav=document.createElement('nav');nav.className='b1-bottom-nav';nav.setAttribute('aria-label','Main navigation');
 const tabs=[['town','🏘️','Town'],['council','🏛️','Council'],['businesses','🏪','Businesses'],['reports','📊','Reports']];
 let active='town',filter='all';
 const views={};
 const make=(name,tag,cls)=>{let e=document.createElement(tag);e.className=cls||'';e.id='b1-'+name;root.insertBefore(e,document.querySelector('.floating-advance'));return e;};
 views.council=make('council','section','b1-view');views.businesses=make('businesses','section','b1-view');views.reports=make('reports','section','b1-view');
 const openExisting=(name)=>{if(name==='performance'&&typeof renderPerformance==='function')renderPerformance(game);if(name==='issues'&&typeof renderIssues==='function')renderIssues();if(name==='local-economy-panel'&&typeof renderLocalEconomy==='function')renderLocalEconomy();if(name==='report'&&typeof renderReport==='function')renderReport();openPanel(name);};
 const link=(label,sub,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;const s=document.createElement('small');s.textContent=sub;b.append(s);b.addEventListener('click',fn);return b;};
 function renderCouncilHome(){const e=views.council;e.replaceChildren();const h=document.createElement('h2');h.textContent='Council';const msg=document.createElement('div');msg.className='b1-hero';msg.textContent='Available fund: '+currency(game.councilBudget)+' · Action points remaining: '+actionsRemaining(game)+' / 3';const cards=document.createElement('div');cards.className='b1-cards';cards.append(link('⚙️ Services, rates & investments','Current council controls, transport, marketing and programmes',()=>openExisting('council')),link('📣 Current issues','Review active policies and town developments',()=>openExisting('issues')),link('✨ Strategic opportunities','Review offers, decisions and their outcomes',()=>openExisting('notifications')));e.append(h,msg,cards);}
 function renderBusinessHome(){const e=views.businesses;e.replaceChildren();const h=document.createElement('h2');h.textContent='Businesses & premises';const bar=document.createElement('div');bar.className='b1-filters';for(const [id,label] of [['all','All'],['occupied','Occupied'],['vacant','Vacant']]){const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('aria-pressed',String(id===filter));b.addEventListener('click',()=>{filter=id;renderBusinessHome();});bar.append(b);}const list=document.createElement('div');list.className='b1-list';const premises=currentPremises(game).filter(p=>filter==='all'||(filter==='occupied'?p.occupied:!p.occupied));for(const p of premises){const b=document.createElement('button');b.type='button';b.className='b1-list-row';const icon=document.createElement('span');icon.className='b1-shop-icon';icon.textContent=p.icon||'🏬';const info=document.createElement('span');const name=document.createElement('strong');name.textContent=p.name;const meta=document.createElement('small');meta.textContent=p.occupied?p.type+' · Tap to inspect':'Vacant premise · Tap to review applicants';info.append(name,meta);b.append(icon,info);b.addEventListener('click',()=>inspectPremise(p.id,true));list.append(b);}if(!premises.length){const p=document.createElement('p');p.textContent='No premises in this category.';list.append(p);}e.append(h,bar,list);}
 function renderReportsHome(){const e=views.reports;e.replaceChildren();const h=document.createElement('h2');h.textContent='Reports & economy';const cards=document.createElement('div');cards.className='b1-cards';cards.append(link('📈 Performance','Town and business trends over time',()=>openExisting('performance')),link('💷 Local economy','Employment, earnings and spending power',()=>openExisting('local-economy-panel')),link('📍 Current issues','Policies, interventions and economic influences',()=>openExisting('issues')),link('🧾 Monthly trading report','Latest month figures and financial details',()=>openExisting('report')),link('🎯 Recovery objectives','Challenge targets and restart',()=>openExisting('goal-panel')));e.append(h,cards);}
 function update(){renderCouncilHome();renderBusinessHome();renderReportsHome();}
 function activate(id){active=id;document.body.classList.toggle('b1-not-town',id!=='town');Object.keys(views).forEach(k=>views[k].classList.toggle('b1-active',k===id));nav.querySelectorAll('button').forEach(b=>{if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(id!=='town')update();}
 for(const [id,emoji,label] of tabs){const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.innerHTML='<span class="b1-icon" aria-hidden="true">'+emoji+'</span><span>'+label+'</span>';b.addEventListener('click',()=>activate(id));nav.append(b);}document.body.append(nav);
 const extras=document.createElement('div');extras.className='b1-secondary';extras.append(link('📊 Town indicators','Show footfall, Spending Power, appeal and recovery progress',()=>openExisting('performance')));street.parentElement.insertBefore(extras,document.querySelector('.floating-advance'));
 // When the existing app mutates the game, regenerate our list on tab entry; avoid altering its render pipeline.
 const advance=document.getElementById('advance');if(advance)advance.addEventListener('click',()=>{if(active!=='town')activate('town');}, {capture:false});
 activate('town');
})();


/* ---- stage8b2.js ---- */
/* High Street 8B.2: presentation only. No economy, save schema or rule changes. */
(function(){
 'use strict';
 if(typeof game==='undefined'||typeof renderAll!=='function')return;
 const root=document.querySelector('.shell');
 const heading=root?.querySelector('.section-head');
 if(!heading)return;
 // Compact Town recovery tracker. Its values are derived from the existing simulation.
 const tracker=document.createElement('details');tracker.id='b2-recovery';tracker.className='b2-recovery';
 tracker.innerHTML='<summary><span><strong>🎯 Recovery objectives</strong><small id="b2-recovery-sub">Current progress towards Month 12</small></span><span class="b2-chevron" aria-hidden="true">⌄</span></summary><div id="b2-recovery-rows" class="b2-recovery-rows"></div><p class="b2-recovery-note">These are current readings. All three must be met at the end of Month 12.</p>';
 heading.before(tracker);
 const rows=document.getElementById('b2-recovery-rows');
 function updateTracker(){
   const occupied=occupiedPremises(game).length;
   const metrics=townMetrics(game);
   const last=(game.history||[]).at(-1);
   const stable=last&&Number.isFinite(last.stable)?last.stable:null;
   const stablePct=stable===null?null:(occupied?100*stable/occupied:0);
   const values=[
     {label:'🏪 Occupancy',value:occupied,target:10,display:occupied+' / 10 needed',achieved:occupied>=10},
     {label:'👣 Monthly footfall',value:metrics.footfall,target:10000,display:metrics.footfall.toLocaleString('en-GB')+' / 10,000',achieved:metrics.footfall>=10000},
     {label:'💚 Stable businesses',value:stablePct,target:70,display:stablePct===null?'After Month 1':stablePct.toFixed(0)+'% / 70%',achieved:stablePct!==null&&stablePct>=70}
   ];
   document.getElementById('b2-recovery-sub').textContent=values.filter(x=>x.achieved).length+' of 3 currently met · Month '+Math.min(game.month,12)+'/12';
   rows.replaceChildren();
   for(const v of values){
     const row=document.createElement('div');row.className='b2-goal';
     const top=document.createElement('div');top.className='b2-goal-top';
     const label=document.createElement('span');label.textContent=v.label;
     const result=document.createElement('strong');result.textContent=v.display;
     top.append(label,result);
     const progress=document.createElement('div');progress.className='b2-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label',v.label);progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(v.target));progress.setAttribute('aria-valuenow',String(Math.min(v.target,Math.max(0,v.value??0))));
     const fill=document.createElement('span');fill.style.width=Math.min(100,Math.max(0,(v.value??0)/v.target*100))+'%';fill.className=v.achieved?'b2-met':'';progress.append(fill);row.append(top,progress);rows.append(row);
   }
 }
 // Shop details start at a compact height; expand to inspect the full existing detail.
 const modal=document.getElementById('modal');
 const sheet=modal?.querySelector('.modal-sheet');
 const modalBar=modal?.querySelector('.modal-bar');
 const expand=document.createElement('button');expand.type='button';expand.id='b2-expand';expand.className='b2-expand';expand.textContent='Expand ↑';expand.setAttribute('aria-expanded','false');expand.hidden=true;
 modalBar?.insertBefore(expand,document.getElementById('dismiss-modal'));
 function setExpanded(value){sheet?.classList.toggle('b2-expanded',value);expand.textContent=value?'Compact ↓':'Expand ↑';expand.setAttribute('aria-expanded',String(value));}
 expand.addEventListener('click',()=>setExpanded(!sheet.classList.contains('b2-expanded')));
 // Use existing app entrypoints. No duplicate panel state or saved settings.
 const priorOpen=openPanel;
 openPanel=function(name){priorOpen(name);expand.hidden=name!=='details';sheet?.classList.toggle('b2-shop-sheet',name==='details');setExpanded(false);};
 const priorClose=closePanel;
 closePanel=function(){priorClose();sheet?.classList.remove('b2-shop-sheet');setExpanded(false);expand.hidden=true;};
 // When any existing game action rerenders state, update just the new tracker.
 const priorRender=renderAll;
 renderAll=function(){const out=priorRender.apply(this,arguments);updateTracker();return out;};
 updateTracker();
})();


/* ---- stage8b3.js ---- */
/* Stage 8B.3 Council HQ: presentation-only adapter. No economic or save changes. */
(function(){
'use strict';
const nav=document.querySelector('.b1-bottom-nav');
const home=document.getElementById('b1-council');
const council=document.getElementById('council');
if(!nav||!home||!council||typeof game==='undefined')return;
let section='services';
const areas=[
 ['services','⚙️','Services & Policies','Business rates, cleaning and lighting'],
 ['investments','🚌','Investments','Transport and major projects'],
 ['programmes','🤝','Programmes','Marketing, employment and vouchers'],
 ['commitments','📋','Commitments','Income, running costs and active effects']
];
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function action(label,func){const b=el('button','b3-card-button',label);b.type='button';b.addEventListener('click',func);return b;}
function openArea(key){section=key;renderCategory();openPanel('council');}
function renderHQ(){
 home.replaceChildren();
 const top=el('div','b3-hq-top');top.append(el('h2','', '🏛️ Council HQ'),el('p','b3-muted','Manage regeneration spending and ongoing council decisions.'));
 const stats=el('div','b3-stats');
 for(const [name,value] of [['Available funds',currency(game.councilBudget)],['Action Points',actionsRemaining(game)+' / 3']]){const tile=el('div','b3-stat');tile.append(el('small','',name),el('strong','',value));stats.append(tile);}
 const grid=el('div','b3-grid');
 for(const [key,icon,title,sub] of areas){const b=action('',()=>openArea(key));b.classList.add('b3-tile');b.append(el('span','b3-tile-icon',icon),el('strong','',title),el('small','',sub));grid.append(b);}
 const extras=el('div','b3-extras');extras.append(action('🔔 Strategic opportunities and decisions',()=>openPanel('notifications')),action('📍 Current town issues',()=>{renderIssues();openPanel('issues');}));
 home.append(top,stats,el('h3','b3-choices-title','Council management'),grid,extras);
}
function buildCommitments(){
 const wrap=el('section','b3-commitments');const pr=projectedCouncil(game);
 wrap.append(el('h4','','Council operating outlook'),el('p','b3-muted','Projected monthly figures under current policies; not guaranteed trading outcomes.'));
 const figures=el('div','b3-figures');for(const [label,value] of [['Rates receipts',currency(pr.receipts)],['Services expenditure',currency(pr.expense)],['Projected net',currency(pr.net)]]){let row=el('div','b3-figure');row.append(el('span','',label),el('strong','',value));figures.append(row);}wrap.append(figures);
 const cp=councilPolicies(game);
 const policy=el('div','b3-info');policy.append(el('h4','','Current policy settings'),el('p','',`Rates: ${(game.nextRatesBand||game.ratesBand||'standard')} · Cleaning: ${cp.cleaning} · Lighting: ${cp.lighting}`));wrap.append(policy);
 const transport=game.transportChoice?TRANSPORT[game.transportChoice].name:'No major transport investment selected';wrap.append(el('h4','','Transport'),el('p','',transport));
 wrap.append(el('h4','','Local marketing'),el('p','',(game.marketingUntil||0)>=game.month?'Active through Month '+game.marketingUntil:'No active campaign'));
 const programmes=economicProgrammes(game);wrap.append(el('h4','','Economic programmes'));
 if(!programmes.length)wrap.append(el('p','b3-muted','No programmes funded yet.'));
 for(const entry of programmes){let text=entry.type==='employment'?'Employment and skills':'Shop-local vouchers';let detail=entry.type==='employment'?`Funded Month ${entry.startMonth}; phased effect begins Month ${entry.startMonth+ECONOMIC_PROGRAMMES.employment.delay}`:`Funded Month ${entry.startMonth}; two-month trading effect`;wrap.append(el('p','b3-programme',text+' — '+detail));}
 wrap.append(el('p','b3-muted','Shop-specific grants are managed from individual premises. Current Issues contains the full influence and event history.'));
 return wrap;
}
function renderCategory(){
 if(!council)return;
 const children=[...council.children];
 // All original controls are regenerated by renderCouncil; hide rather than replace them.
 children.forEach(x=>{if(x.classList.contains('b3-category-header')||x.classList.contains('b3-commitments'))x.remove();else x.style.display='none';});
 const bar=el('div','b3-category-header');
 bar.append(action('‹ Council HQ',()=>{closePanel();const tab=nav.querySelector('[data-tab="council"]');if(tab)tab.click();}));
 bar.append(el('h3','',areas.find(a=>a[0]===section)?.[2]||'Council'));
 council.prepend(bar);
 const items=[...council.children].filter(x=>x!==bar);
 const has=(s)=>x=>x?.classList?.contains(s);
 // Existing app.js renders: h3, .policy-preview, explanatory paragraph, .compact-policies,
 // transport .policy-section, marketing .policy-section, programmes .policy-section,
 // optional pending-event .policy-section, concluding .grant-note.
 const policy=items.find(has('compact-policies'));
 const sections=items.filter(has('policy-section'));
 const preview=items.find(has('policy-preview'));
 const topNote=items.find(x=>x.tagName==='P'&&!x.classList.contains('grant-note'));
 const programmeFooter=items.find(has('grant-note'));
 let visible=[];
 if(section==='services')visible=[preview,topNote,policy];
 else if(section==='investments')visible=[sections[0]];
 else if(section==='programmes')visible=[sections[1],sections[2],programmeFooter];
 else {council.append(buildCommitments());}
 // Any required council decision must stay accessible, regardless of section.
 if(sections.length>3)visible.push(sections[3]);
 for(const node of visible)if(node)node.style.display='';
}
const previousOpen=openPanel;
openPanel=function(name){if(name==='council')renderCategory();return previousOpen(name);};
const previousRender=renderAll;
renderAll=function(){const result=previousRender.apply(this,arguments);renderHQ();if(activePanel==='council')renderCategory();return result;};
const councilTab=nav.querySelector('[data-tab="council"]');
if(councilTab)councilTab.addEventListener('click',renderHQ);
renderHQ();
})();


/* ---- stage8b4.js ---- */
/* Stage 8B.4: completed-month reporting presentation only. No save/economy modifications. */
(function(){
'use strict';
const report=document.getElementById('report');
const reportsHome=document.getElementById('b1-reports');
const nav=document.querySelector('.b1-bottom-nav');
if(!report||!reportsHome||!nav||typeof game==='undefined'||typeof renderReport!=='function')return;
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const num=x=>Number(x).toLocaleString('en-GB');
const record=()=>((game.history||[]).at(-1)||null);
const prior=()=>((game.history||[]).at(-2)||null);
function heading(name,sub){const x=el('div','b4-section-title');x.append(el('h4','',name));if(sub)x.append(el('small','',sub));return x;}
function tile(name,value,change){const t=el('div','b4-kpi');t.append(el('small','',name),el('strong','',value));if(change)t.append(el('span','b4-delta',change));return t;}
function delta(current,previous,unit){if(!Number.isFinite(current)||!Number.isFinite(previous))return 'No previous record';const d=current-previous;if(Math.abs(d)<0.000001)return 'No change from previous month';const sign=d>0?'+':'−',abs=Math.abs(d);return sign+(unit==='money'?currency(abs):unit==='percent'?abs.toFixed(0)+' pp':num(abs))+' vs previous month';}
function link(label,description,fn){const b=el('button','b4-link');b.type='button';b.append(el('strong','',label),el('small','',description),el('span','b4-arrow','›'));b.addEventListener('click',fn);return b;}
function open(name){if(name==='performance')renderPerformance(game);if(name==='local-economy-panel')renderLocalEconomy();if(name==='issues')renderIssues();if(name==='report')renderReport();openPanel(name);}
function reportHome(){
 reportsHome.replaceChildren();reportsHome.append(el('h2','','📊 Reports'),el('p','b4-muted','Completed trading results, performance trends and the local economy.'));
 const last=record();
 if(last){
  const intro=el('div','b4-home-intro');intro.append(el('strong','','Latest completed month · '+last.month),el('small','','Recorded results, not a forecast'));reportsHome.append(intro);
  const grid=el('div','b4-home-kpis');grid.append(tile('Footfall',num(last.footfall)),tile('Stable shops',num(last.stable)+' / '+num(last.occupancy)),tile('Occupied premises',num(last.occupancy)+' / 12'),tile('Operating profit',currency(last.profit)));reportsHome.append(grid);
 }else{reportsHome.append(el('p','b4-empty','No completed months yet. Advance the game to generate your first report.'));}
 const links=el('div','b4-links');
 links.append(link('🧾 Latest monthly briefing','Key results, town developments and full accounts',()=>{if(!record())return alert('The first monthly report is available after advancing a month.');open('report');}),link('📈 Performance trends','Historical town and shop charts',()=>open('performance')),link('💷 Local economy','Employment, earnings, spending power and living costs',()=>open('local-economy-panel')),link('📍 Current issues','Policies, events and town influences',()=>open('issues')),link('🎯 Recovery objectives','The three Month 12 targets and restart options',()=>open('goal-panel')));
 reportsHome.append(links);
}
// Preserve original report HTML, IDs, detailed figures and risk commentary inside disclosure.
const detail=el('details','b4-full-accounts');detail.append(el('summary','','Detailed monthly accounts & explanations'));
const existing=[...report.children];for(const child of existing)detail.append(child);
const briefing=el('div','b4-briefing');report.append(briefing,detail);
function buildBriefing(){
 briefing.replaceChildren();const h=record(),prev=prior();if(!h){briefing.append(el('p','b4-empty','The first monthly briefing becomes available after Month 1.'));return;}
 const head=el('div','b4-briefing-head');head.append(el('small','b4-kicker','HIGH STREET COUNCIL · COMPLETED RESULTS'),el('h3','','Month '+h.month+' briefing'),el('p','b4-muted','What happened during the last completed trading month.'));briefing.append(head);
 const stableShare=h.occupancy?100*h.stable/h.occupancy:0,prevShare=prev&&prev.occupancy?100*prev.stable/prev.occupancy:null;
 briefing.append(heading('Town performance','Actual figures for Month '+h.month));
 const kpis=el('div','b4-kpis');kpis.append(tile('👣 Footfall',num(h.footfall),prev?delta(h.footfall,prev.footfall):'First recorded month'),tile('🏪 Occupied premises',h.occupancy+' / 12',prev?delta(h.occupancy,prev.occupancy):'First recorded month'),tile('💚 Stable businesses',stableShare.toFixed(0)+'%',prev?delta(stableShare,prevShare,'percent'):'First recorded month'),tile('💷 Business profit',currency(h.profit),prev?delta(h.profit,prev.profit,'money'):'First recorded month'));briefing.append(kpis);
 briefing.append(heading('Business health','Recorded stable count and current business risks'));
 const health=el('div','b4-line-items');health.append(line('Stable at month end',h.stable+' of '+h.occupancy),line('Not stable at month end',Math.max(0,h.occupancy-h.stable)+' businesses'),line('New openings',num(h.openings||0)),line('Closures',num(h.closures||0)));briefing.append(health);
 briefing.append(heading('Council finances','Actual completed-month receipts and costs'));
 const finance=el('div','b4-line-items');finance.append(line('Business rates received',currency(h.rates)),line('Council services cost',currency(h.serviceCost)),line('Net operating cash flow',currency(h.netCouncil)),line('Closing council fund',currency(h.budget)));briefing.append(finance);
 briefing.append(heading('Local economy & developments','Changes recorded during this month'));
 const econ=el('div','b4-note-list');if(h.economyChange)econ.append(note('Local conditions',h.economyChange));if(h.development)econ.append(note('Town development',h.development));if(h.programmeEffects){const p=h.programmeEffects;if(p.employment||p.earnings||p.spendingPower)econ.append(note('Council programmes','Employment '+signed(p.employment)+' · Earnings '+signed(p.earnings)+' · Temporary Spending Power '+signed(p.spendingPower)));}
 if(Array.isArray(h.opportunityResults)&&h.opportunityResults.length)for(const o of h.opportunityResults){let name=typeof STRATEGIC_OPPORTUNITIES!=='undefined'&&STRATEGIC_OPPORTUNITIES[o.type]?STRATEGIC_OPPORTUNITIES[o.type].title:'Strategic project';econ.append(note('Strategic opportunity',name+' — '+(o.success?'succeeded':'failed')));}
 if(!econ.children.length)econ.append(note('Developments','No additional economic developments recorded.'));briefing.append(econ);
 const foot=el('p','b4-muted b4-footnote','All figures above come from completed-month records. The detailed accounts below retain the existing breakdown and explanatory information.');briefing.append(foot);
}
function signed(v){return (v>=0?'+':'')+(Number(v)||0).toFixed(2);}
function line(key,val){const r=el('div','b4-line');r.append(el('span','',key),el('strong','',val));return r;}
function note(name,value){const n=el('div','b4-note');n.append(el('strong','',name),el('p','',value));return n;}
const oldReport=renderReport;renderReport=function(){const value=oldReport.apply(this,arguments);buildBriefing();return value;};
const oldRender=renderAll;renderAll=function(){const result=oldRender.apply(this,arguments);reportHome();return result;};
const reportsTab=nav.querySelector('[data-tab="reports"]');if(reportsTab)reportsTab.addEventListener('click',reportHome);
// Existing Advance event handler already opens report automatically unless a required
// event, strategic opportunity or final result takes priority. Do not interrupt those flows.
// Reset the shared modal scroll whenever a different shop detail panel is opened.
// Keep the existing dismiss handlers and 8B.2 expand/compact behaviour intact.
const beforeShopOpen=openPanel;
openPanel=function(name){
 const result=beforeShopOpen.apply(this,arguments);
 if(name==='details'){
  const scroll=document.querySelector('#modal .modal-scroll');
  if(scroll)scroll.scrollTop=0;
 }
 return result;
};
reportHome();buildBriefing();
})();

