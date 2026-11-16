/* Fastlane — PWA, IndexedDB, synchro hors ligne */
const FL_DB = "fastlane";
function flOpen(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(FL_DB,1);
    r.onupgradeneeded=()=>r.result.createObjectStore("kv");
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
async function flGet(k){
  try{
    const db=await flOpen();
    return await new Promise((res,rej)=>{
      const q=db.transaction("kv").objectStore("kv").get(k);
      q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error);
    });
  }catch(e){ return undefined; }
}
async function flSet(k,v){
  try{
    const db=await flOpen();
    await new Promise((res,rej)=>{
      const q=db.transaction("kv","readwrite").objectStore("kv").put(v,k);
      q.onsuccess=()=>res(); q.onerror=()=>rej(q.error);
    });
  }catch(e){ /* quota / navigation privée */ }
}
function paintOff(){
  const el=$("#offbar"); if(!el) return;
  const on=navigator.onLine;
  el.hidden=on;
  el.textContent=on?"En ligne":"Hors ligne — saisies synchronisées à la reconnexion";
  el.classList.toggle("on",on);
}

const _persist=persist;
persist=async function(){
  if(!S||!S.co) return;
  await flSet("state",S);
  if(!navigator.onLine){
    await flSet("pending",S);
    paintOff();
    return;
  }
  try{
    const r=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(S),credentials:"same-origin"});
    if(!r.ok) throw new Error("save");
    await flSet("pending",null);
  }catch(e){
    await flSet("pending",S);
    toast("Hors ligne — enregistré sur cet appareil");
  }
  paintOff();
};

const _loadState=loadState;
loadState=async function(){
  try{
    const r=await fetch("/api/state",{credentials:"same-origin"});
    if(!r.ok) throw new Error("load");
    S=await r.json();
    await flSet("state",S);
  }catch(e){
    const local=await flGet("state");
    if(local&&local.co){ S=local; toast("Mode hors ligne — données locales"); }
    else { await _loadState(); }
  }
  if(!S||!S.co) seed();
};

async function flushSync(){
  const pending=await flGet("pending");
  if(!pending||!navigator.onLine) return;
  try{
    const r=await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(pending),credentials:"same-origin"});
    if(r.ok){ await flSet("pending",null); toast("Synchronisé"); }
  }catch(e){ /* reste en file */ }
  paintOff();
}

addEventListener("online",()=>{ paintOff(); flushSync(); });
addEventListener("offline",paintOff);
paintOff();
setInterval(()=>{ if(navigator.onLine) flushSync(); },30000);

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});
}

let deferredInstall=null;
addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();
  deferredInstall=e;
  const b=$("#btn-install");
  if(b) b.hidden=false;
});
A.install=async()=>{
  if(!deferredInstall){ toast("L’app peut déjà être installée, ou ouvrez-la en HTTPS / localhost"); return; }
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall=null;
};
