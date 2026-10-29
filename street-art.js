/* Stage 9A.1 — visual-only storefront decorator. No economic or save state. */
(function () {
  'use strict';
  const styles = {
    'Bakery':             ['#bc735b','#f1d5af','#7b493d','BAKERY','🥖'],
    'Café':               ['#a46b68','#f1d9bb','#603d42','CAFÉ','☕'],
    'Convenience store':  ['#528b84','#dfede0','#275b59','MARKET','🍎'],
    'Pharmacy':           ['#678caa','#e5e9e1','#305a76','PHARMACY','✚'],
    'Charity shop':       ['#8e80a8','#f1e4cc','#5c527a','CHARITY','♥'],
    'Hairdresser':        ['#9e718b','#f2d8d8','#68465e','SALON','✂'],
    'Independent bookshop':['#927355','#e7d3b4','#584530','BOOKS','📖'],
    'Florist':            ['#67937b','#f6e5cf','#426751','FLORIST','🌼'],
    'Greengrocer':        ['#75935a','#e6e8c2','#4d6338','FRUIT & VEG','🍐'],
    'Gift shop':          ['#b18396','#f7e3d8','#724c64','GIFTS','🎁'],
    'Pub':                ['#785744','#ead8ad','#49352e','PUBLIC HOUSE','🍺'],
    'Restaurant':         ['#a36e50','#f0dcc9','#654a37','RESTAURANT','🍽'],
    'Clothing shop':      ['#71919b','#e9e0d5','#44636d','CLOTHING','👗'],
    'Takeaway':           ['#ac7951','#f3e1c6','#765035','TAKEAWAY','🥡']
  };
  const fallback=['#788f80','#f0e3cc','#526d61','SHOP','✦'];
  function node(tag,className,text){
    const el=document.createElement(tag);el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function decorate(){
    if(typeof game==='undefined'||typeof currentPremises!=='function')return;
    const lookup=new Map(currentPremises(game).map(p=>[String(p.id),p]));
    document.querySelectorAll('#north .shop, #south .shop').forEach(button=>{
      if(button.querySelector('.hs9-upper'))return;
      const p=lookup.get(button.dataset.id);
      if(!p)return;
      const art=p.occupied?(styles[p.type]||fallback):['#88877e','#dedbd0','#62635c','TO LET',''];
      const variant=(Number(p.id)-1)%4;
      button.classList.add('hs9-building','hs9-shell-'+variant);
      // Vacancy deterioration is visual only; existing property.js remains authoritative.
      if(!p.occupied){
        const condition=typeof premiseCondition==='function'?premiseCondition(game,p.id):'Good';
        const key=['Good','Fair','Poor'].includes(condition)?condition.toLowerCase():'good';
        button.classList.add('hs9-vacancy-'+key);
        button.dataset.vacancyCondition=condition;
      }
      button.style.setProperty('--hs-wall',art[0]);
      button.style.setProperty('--hs-wall-light',art[1]);
      button.style.setProperty('--hs-trim',art[2]);
      button.style.setProperty('--hs-awning',p.occupied?art[0]:'#9a9d91');
      button.style.setProperty('--hs-awning-light',art[1]);
      const roof=button.querySelector('.roof');
      const front=button.querySelector('.front');
      if(!roof||!front)return;
      const upper=node('span','hs9-upper');upper.setAttribute('aria-hidden','true');
      upper.append(node('span','hs9-upper-windows'));
      roof.after(upper);
      const sign=node('span','hs9-sign',art[3]);sign.setAttribute('aria-hidden','true');
      const awning=node('span','hs9-awning');awning.setAttribute('aria-hidden','true');
      const doorway=node('span','hs9-doorway');doorway.setAttribute('aria-hidden','true');
      front.prepend(sign,awning,doorway);
      if(!p.occupied){
        const condition=button.dataset.vacancyCondition;
        // Decorative overlays are aria-hidden and never capture taps.
        const wear=node('span','hs9-vacancy-wear');wear.setAttribute('aria-hidden','true');
        const boards=node('span','hs9-vacancy-boards');boards.setAttribute('aria-hidden','true');
        const weeds=node('span','hs9-vacancy-weeds');weeds.setAttribute('aria-hidden','true');
        front.append(wear,boards,weeds);
        sign.textContent='TO LET'; // Retain legible availability across all condition levels.
        button.setAttribute('aria-label',button.getAttribute('aria-label')+', '+condition+' condition');
      }
      // Existing shop icon, name, category, health and accessibility labels remain intact.
      // Vacancy condition treatments are reserved for Stage 9A.2.
    });
  }
  if(typeof renderShops==='function'){
    const original=renderShops;
    renderShops=function(){const result=original.apply(this,arguments);decorate();return result;};
  }
  decorate();
})();
