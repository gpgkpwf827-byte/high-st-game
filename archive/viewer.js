/* Historical HTML is fetched from THIS GitHub Pages site and embedded into a
   sandboxed srcdoc iframe with an opaque origin. It cannot access the current
   game's localStorage or navigate the parent page. The storage shim ensures
   historical save calls still work within the current in-memory session. */
(() => {
  'use strict';
  const entries = window.HIGH_STREET_ARCHIVE;
  const $ = id => document.getElementById(id);
  const select = $('version'), frame = $('game'), status = $('status');
  const repo = 'https://github.com/gpgkpwf827-byte/high-st-game/commit/';
  for (const v of entries) {
    const option = document.createElement('option');option.value=v.id;option.textContent=v.name;select.appendChild(option);
  }
  const selected = () => entries.find(v => v.id === select.value);
  function updateInfo(){const v=selected();$('description').textContent=v.description;$('commit').href=repo+v.sha;$('viewer-title').textContent='Historical viewer · '+v.name;}
  const storageShim = `<script>(function(){
    function memoryStorage(){var d=Object.create(null);return {
      getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},
      setItem:function(k,v){d[String(k)]=String(v)},
      removeItem:function(k){delete d[String(k)]},clear:function(){d=Object.create(null)},
      key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}
    }}
    Object.defineProperty(window,'localStorage',{configurable:true,value:memoryStorage()});
    Object.defineProperty(window,'sessionStorage',{configurable:true,value:memoryStorage()});
    /* Opaque-origin sandbox prevents accessing the parent game's storage. */
  })();<\/script>`;
  let serial=0;
  async function openSnapshot(){
    const ticket=++serial,v=selected();
    // The folder must contain the COMPLETE historical commit's game files.
    const location = new URL(`snapshots/${v.id}/`, document.baseURI);
    status.textContent='Opening '+v.name+'…';$('open').disabled=true;
    try{
      const response=await fetch(new URL('index.html',location),{cache:'no-store'});
      if(!response.ok)throw Error('Snapshot not installed (HTTP '+response.status+').');
      let html=await response.text();
      if(!/<head[\s>]/i.test(html) || !/<\/head\s*>/i.test(html)) throw Error('The snapshot index.html is invalid.');
      // srcdoc resolves the old relative script/CSS paths using the snapshot folder.
      const base='<base href="'+location.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">';
      html=html.replace(/<head([^>]*)>/i,'<head$1>'+base+storageShim);
      if(ticket!==serial)return;
      frame.hidden=false;$('empty').hidden=true;fullButton.disabled=false;
      // Resetting srcdoc creates fresh, isolated in-memory storage each time.
      frame.srcdoc=html;
      $('restart').disabled=false;
      status.textContent=v.name+' loaded from local snapshot files. Progress will reset when reopened.';
    }catch(error){if(ticket!==serial)return;frame.removeAttribute('srcdoc');frame.hidden=true;$('empty').hidden=false;$('restart').disabled=true;fullButton.disabled=true;exitFullscreen();status.textContent='Could not load '+v.name+': '+error.message+' Copy its original files into archive/snapshots/'+v.id+'/';}
    finally{if(ticket===serial)$('open').disabled=false;}
  }
  const fullButton=$('fullscreen');
  function exitFullscreen(){
    document.body.classList.remove('archive-fullscreen');
    fullButton.textContent='⛶ Full screen';
    fullButton.setAttribute('aria-pressed','false');
  }
  fullButton.addEventListener('click',()=>{
    if(frame.hidden)return;
    const active=document.body.classList.toggle('archive-fullscreen');
    fullButton.textContent=active?'✕ Exit full screen':'⛶ Full screen';
    fullButton.setAttribute('aria-pressed',String(active));
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && document.body.classList.contains('archive-fullscreen')) exitFullscreen();
  });
  select.addEventListener('change',()=>{exitFullscreen();serial++;frame.removeAttribute('srcdoc');frame.hidden=true;$('empty').hidden=false;$('restart').disabled=true;fullButton.disabled=true;status.textContent='Choose Open snapshot to view this milestone.';updateInfo();});
  $('open').addEventListener('click',openSnapshot);
  $('restart').addEventListener('click',openSnapshot);
  updateInfo();
})();
