/* Stage 6A: view-only historical metrics; no third-party charting library. */
const PERFORMANCE_METRICS={
 footfall:['Footfall','visits','town'],spendingPower:['Spending Power','points','town'],attractiveness:['Attractiveness','points','town'],vitality:['Commercial Vitality','points','town'],occupancy:['Occupied premises','shops','town'],stable:['Stable businesses','shops','town'],openings:['New openings','shops','town'],closures:['Business closures','shops','town'],sales:['Business revenue','£','town'],expenses:['Business expenses','£','town'],profit:['Business operating profit','£','town'],transactions:['Business transactions','transactions','town'],budget:['Council closing fund','£','town'],rates:['Business rates income','£','town'],serviceCost:['Council services cost','£','town'],netCouncil:['Council operating cash flow','£','town'],
 shopRevenue:['Shop revenue','£','shop'],shopProfit:['Shop profit','£','shop'],shopCash:['Shop cash reserves','£','shop'],shopTransactions:['Shop transactions','transactions','shop']
};
const perfMoney=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const perfNum=(n,u)=>u==='£'?perfMoney(n):Number(n).toLocaleString('en-GB',{maximumFractionDigits:u==='points'?1:0});
function performancePoints(game,key,id){return (game.history||[]).map(h=>{
 let value;
 if(key.startsWith('shop')){const shop=(h.shops||[]).find(x=>x.id===id);const field={shopRevenue:'revenue',shopProfit:'profit',shopCash:'cash',shopTransactions:'transactions'}[key];value=shop&&shop[field];}
 else value=h[key];
 return {month:h.month,value:Number.isFinite(value)?value:null};
 });}
function renderPerformance(game){
 const metric=document.getElementById('perf-metric'),select=document.getElementById('perf-shop');
 const prev=metric.value||'footfall';
 metric.replaceChildren();
 for(const [key,meta] of Object.entries(PERFORMANCE_METRICS)){
  const o=document.createElement('option');o.value=key;o.textContent=(meta[2]==='shop'?'Individual shop · ':'')+meta[0];metric.append(o);
 }
 metric.value=PERFORMANCE_METRICS[prev]?prev:'footfall';
 const previousShop=select.value;
 const shops=new Map();
 (game.history||[]).forEach(h=>(h.shops||[]).forEach(s=>shops.set(s.id,s.name)));
 currentPremises(game).filter(p=>p.occupied).forEach(p=>shops.set(p.id,p.name));
 select.replaceChildren();
 [...shops.entries()].sort((a,b)=>a[0]-b[0]).forEach(([id,name])=>{const o=document.createElement('option');o.value=id;o.textContent='Unit '+id+' · '+name;select.append(o);});
 if([...shops.keys()].some(id=>String(id)===previousShop))select.value=previousShop;
 drawPerformance(game);
}
function drawPerformance(game){
 const key=document.getElementById('perf-metric').value||'footfall';const meta=PERFORMANCE_METRICS[key];if(!meta)return;
 const select=document.getElementById('perf-shop');select.hidden=meta[2]!=='shop';document.querySelector('label[for="perf-shop"]').hidden=select.hidden;
 const shopId=Number(select.value);
 const data=performancePoints(game,key,shopId),valid=data.filter(d=>d.value!==null);
 const summary=document.getElementById('perf-summary'),chart=document.getElementById('perf-chart'),target=document.getElementById('perf-data');
 chart.replaceChildren();target.replaceChildren();
 if(!valid.length){summary.textContent='No recorded data for this metric yet.';chart.textContent='Advance a month to begin building your performance history. Earlier saves may not contain every new measure.';return;}
 const first=valid[0],last=valid[valid.length-1],diff=last.value-first.value;
 summary.textContent=meta[0]+': '+perfNum(last.value,meta[1])+' (Month '+last.month+') · Change '+(diff>0?'+':'')+perfNum(diff,meta[1])+' since first recorded month';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 350 238');svg.setAttribute('role','img');svg.setAttribute('aria-label',meta[0]+' by month');
 const node=(tag,attrs,text)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;svg.append(e);return e;};
 let low=Math.min(...valid.map(x=>x.value)), high=Math.max(...valid.map(x=>x.value));
 if(low===high){const pad=Math.max(1,Math.abs(low)*.1);low-=pad;high+=pad;}
 const pad=(high-low)*.08;low-=pad;high+=pad;
 const x=m=>48+(m-1)*294/11,y=v=>187-(v-low)*160/(high-low);
 for(let i=0;i<5;i++){let yy=27+i*40;node('line',{x1:48,x2:344,y1:yy,y2:yy,stroke:'#d9e2d9','stroke-dasharray':'3 3'});node('text',{x:42,y:yy+3,'text-anchor':'end'},perfNum(high-i*(high-low)/4,meta[1]));}
 for(let i=1;i<=12;i+=i===1?2:2){node('text',{x:x(i),y:207,'text-anchor':'middle'},String(i));}
 let segment=[];
 const flush=()=>{if(segment.length>1)node('polyline',{points:segment.join(' '),fill:'none',stroke:'#238a72','stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round'});segment=[];};
 for(const d of data){if(d.value===null){flush();continue;}const xx=x(d.month), yy=y(d.value);segment.push(xx+','+yy);node('circle',{cx:xx,cy:yy,r:3.5,fill:'#238a72'});}
 flush();node('text',{x:196,y:232,'text-anchor':'middle'},'Completed month');chart.append(svg);
 const label=document.createElement('div');label.className='perf-legend';label.textContent='Missing values are left blank. Past months are not estimated.';target.append(label);
 const table=document.createElement('table');table.className='perf-table';const thead=document.createElement('tr');for(const t of ['Month',meta[0]]){const th=document.createElement('th');th.textContent=t;thead.append(th);}table.append(thead);
 for(const d of data){const tr=document.createElement('tr');for(const s of [String(d.month),d.value===null?'Not recorded':perfNum(d.value,meta[1])]){const td=document.createElement('td');td.textContent=s;tr.append(td);}table.append(tr);}target.append(table);
}
document.getElementById('perf-metric').addEventListener('change',()=>drawPerformance(game));
document.getElementById('perf-shop').addEventListener('change',()=>drawPerformance(game));
