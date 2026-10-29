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
