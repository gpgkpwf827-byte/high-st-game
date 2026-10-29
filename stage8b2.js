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
