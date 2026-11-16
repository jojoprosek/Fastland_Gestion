/* Fastlane ERP — cycle acheter → stocker → transporter → vendre → encaisser → comptabiliser */
let USERS=[
  {id:'direction',n:'Aminata Touré',r:'direction',totp:false},
  {id:'comptable',n:'Aïssatou Diallo',r:'comptable',totp:false},
  {id:'commercial',n:'Alpha Baldé',r:'commercial',totp:false},
  {id:'magasinier',n:'Fatoumata Camara',r:'magasinier',totp:false},
  {id:'caissier',n:'Mamadou Sylla',r:'caissier',totp:false},
  {id:'flotte',n:'Ibrahima Sow',r:'flotte',totp:false},
  {id:'chauffeur',n:'Mamadou Barry',r:'chauffeur',totp:false}
];
const AUTH={pick:'',pin:'',ticket:'',err:'',step:'list'};
const FL_TEL='+224 614 99 85 86';
const ACL={
  direction:null,
  comptable:['home','dash','acc','etats','tre','immo','paye','set','sales','purch','tiers'],
  commercial:['home','dash','sales','pos','tiers','fleet'],
  magasinier:['home','dash','stock','purch'],
  caissier:['home','dash','pos','tre','sales'],
  flotte:['home','dash','fleet','stock'],
  chauffeur:['home','fleet']
};
function pname(x){return typeof x==='string'?x:(x&&x.n)||''}
function can(view){const r=S.role||'direction'; if(r==='direction'||!ACL[r]) return true; return ACL[r].includes(view)}
function audit(a,d){(S.audit=S.audit||[]).unshift({t:new Date().toISOString(),u:S.user||'—',a,d:d||''}); if(S.audit.length>200)S.audit.length=200}
function dueOf(name, types, st){return S.docs.filter(d=>d.cl===name&&types.includes(d.type)&&st.includes(d.st)).reduce((s,d)=>s+(d.total-(d.paid||0)),0)}
function clientObj(name){return (S.cl||[]).find(c=>pname(c)===name)}
function canCredit(name,amt){const c=clientObj(name); if(!c||c.ceil==null) return true; return dueOf(name,['Facture'],['Impayée'])+amt<=c.ceil}

function upgradeState(){
  if(!S||!S.co) return;
  S.co.allowNeg=S.co.allowNeg===true;
  S.co.cur=S.co.cur||'GNF';
  S.co.fx=S.co.fx||{USD:9200,EUR:10000};
  if(['LogiGest SARL','FastLand','Fastland'].includes(S.co.name) || /logigest/i.test(S.co.mail||'')){
    S.co.name='Fastlane Logistic SARL';
    S.co.mail=(S.co.mail||'finance@fastlane.gn').replace(/logigest/gi,'fastlane');
  }
  S.co.tel=FL_TEL;
  if(!S.dep) S.dep=[{id:'KAL',n:'Dépôt Kaloum',city:'Conakry'},{id:'KAM',n:'Dépôt Kamsar',city:'Kamsar'}];
  if(S.cl&&S.cl.length&&typeof S.cl[0]==='string'){
    const ceil={'Mining Corp Guinée':120e6,'SOGUIPAMI Transport':80e6,'Station Total Kaloum':40e6,'Ets Diallo et Fils':15e6,'Bauxite Logistics':150e6};
    S.cl=S.cl.map((n,i)=>({id:'C'+(i+1),n,tel:'+224 62'+String(100000+i),mail:n.toLowerCase().replace(/[^a-z0-9]+/g,'.')+'@client.gn',city:'Conakry',ceil:ceil[n]||30e6,delay:30,score:n.includes('Diallo')?55:82,cur:'GNF'}));
  }
  if(S.fr&&S.fr.length&&typeof S.fr[0]==='string'){
    S.fr=S.fr.map((n,i)=>({id:'F'+(i+1),n,tel:'+224 65'+String(200000+i),city:'Conakry',delay:n.includes('Total')?7:21,cur:'GNF'}));
  }
  (S.art||[]).forEach(a=>{
    if(a.cost==null) a.cost=Math.round((a.p||0)*0.72);
    a.u=a.u||(a.c==='Énergie'?'L':a.c==='Service'?'t':'U');
    if(!a.dep) a.dep={KAL:a.q||0,KAM:Math.round((a.q||0)*0.15)};
    a.q=Object.values(a.dep).reduce((s,x)=>s+(+x||0),0);
  });
  (S.docs||[]).forEach(d=>{
    if(!d.lines||!d.lines.length) d.lines=[{r:'',n:d.art||d.type,q:d.qty||1,pu:d.pu||d.ht,cost:0}];
    if(d.paid==null) d.paid=(d.st==='Payée')?d.total:0;
    d.depot=d.depot||'KAL';
  });
  S.mv=S.mv||[]; S.audit=S.audit||[]; S.fuel=S.fuel||[]; S.paym=S.paym||[]; S.relance=S.relance||[];
  (S.cl||[]).forEach(c=>{ if(c&&typeof c==='object'&&!c.mail) c.mail=(c.n||'client').toLowerCase().replace(/[^a-z0-9]+/g,'.')+'@client.gn'; });
  S.user=S.user||sessionStorage.getItem('fl_user')||'';
  S.role=S.role||sessionStorage.getItem('fl_role')||'';
}

function stockMove(ref,qty,depot,why,piece,unitCost){
  const a=S.art.find(x=>x.r===ref); if(!a) return true;
  if(a.c==='Service') return true;
  depot=depot||'KAL';
  if(!a.dep) a.dep={KAL:a.q||0,KAM:0};
  const next=(+a.dep[depot]||0)+qty;
  if(next<0 && !S.co.allowNeg){ toast('Stock négatif interdit sur '+a.n); return false; }
  if(qty>0 && unitCost!=null){
    const q0=a.q||0, c0=a.cost||0;
    a.cost=q0+qty>0?((c0*q0)+unitCost*qty)/(q0+qty):unitCost;
  }
  a.dep[depot]=next;
  a.q=Object.values(a.dep).reduce((s,x)=>s+(+x||0),0);
  S.mv.push({d:T,r:ref,q:qty,dep:depot,why,p:piece,c:unitCost||0});
  if(qty<0 && (why==='vente'||why==='bl')){
    const cost=Math.abs(qty)*(a.cost||0);
    post(T,'ST',piece,'Sortie stock '+a.n,[['603',cost,0],['31',0,cost]]);
  }
  if(qty>0 && why==='achat'){
    const cost=qty*(unitCost!=null?unitCost:a.cost||0);
    post(T,'ST',piece,'Entrée stock '+a.n,[['31',cost,0],['603',0,cost]]);
  }
  return true;
}

const _addDoc=addDoc;
addDoc=function(o){
  const from=o.from&&S.docs.find(x=>x.id===o.from);
  const d=_addDoc(o);
  if(!d) return d;
  const a=S.art.find(x=>x.n===d.art||x.r===d.r);
  const saleStock=d.type==='Bon de livraison'||(d.type==='Facture'&&(!from||from.type!=='Bon de livraison'));
  const buyStock=d.type==='Bon de réception'||(d.type==='Facture d’achat'&&(!from||from.type!=='Bon de réception'));
  if(a && saleStock) stockMove(a.r,-(d.qty||1),d.depot||'KAL',d.type==='Facture'?'vente':'bl',d.id);
  if(a && buyStock) stockMove(a.r,d.qty||1,d.depot||'KAL','achat',d.id,d.pu||a.cost);
  audit('document', d.type+' '+d.id);
  return d;
};

NAV.length=0;
[
  ['Pilotage',[
    ['home','Accueil Fastlane','home','go','','home'],
    ['dash','Tableau de bord','dash','go','','dash']
  ]],
  ['Ventes',[
    ['sales','Devis → factures','sales','go','','ventes'],
    ['pos','Caisse comptoir','sales','go','','pos'],
    ['tiers','Clients','users','go','','tiers']
  ]],
  ['Achats',[
    ['purch','Commandes et factures','purch','go','','achats'],
    ['tiers','Fournisseurs','users','go','','fourn']
  ]],
  ['Stocks',[
    ['stock','Articles et CMUP','stock','go','','stock']
  ]],
  ['Comptabilité',[
    ['acc','Saisie des écritures','acc','go','Saisie','saisie'],
    ['acc','Journaux','acc','go','Journal','journaux'],
    ['acc','Balance / lettrage','acc','go','Balance','balance'],
    ['etats','Bilan et résultat','etats','go','Bilan','bilan'],
    ['etats','Grand livre','etats','go','Grand livre','grandlivre']
  ]],
  ['Trésorerie / Flotte',[
    ['tre','Banque, caisse, MoMo','tre','go','','tre'],
    ['fleet','Missions et véhicules','fleet','go','','fleet']
  ]],
  ['Paramètres',[
    ['set','Société et TVA','set','go','','set'],
    ['immo','Immobilisations','immo','go','','immo'],
    ['paye','Paie','paye','go','','paye']
  ]]
].forEach(g=>NAV.push(g));
META.pos=['Caisse','Vente au comptant'];
Object.assign(ICO,{pos:ICO.sales});

V.home=()=>{
  const head=intuiHead();
  if(tab.home==='Indicateurs') return `<div class="intui">${head}<div class="intui-kpis">${kp('CA HT',MM(caHT())+' GNF','factures')}${kp('Trésorerie',MM(treso())+' GNF','521 / 571 / 585')}${kp('Créances',MM(creances())+' GNF','à encaisser')}${kp('Alertes',alerts().length,'contrôles')}</div><div class="intui-panel"><h3 style="margin-top:0">Alertes</h3>${alh()}</div></div>`;
  if(tab.home==='Favoris') return `<div class="intui">${head}<div class="intui-sec"><h3>Favoris</h3><div class="intui-grid">${sgt('send','Facture','inv')}${sgt('info','Saisie','go','acc')}${sgt('folder','Caisse','go','pos')}${sgt('people','Tiers','go','tiers')}${sgt('cloud','Trésorerie','go','tre')}${sgt('portal','Flotte','go','fleet')}</div></div></div>`;
  if(tab.home==='Connect') return `<div class="intui">${head}<div class="intui-sec"><h3>Échanges</h3><div class="intui-grid">${sgt('send','Sauvegarder','sv')}${sgt('globe','Factures','go','sales')}${sgt('cloud','Mobile money','go','tre')}${sgt('people','Relances','go','sales')}</div></div></div>`;
  return `<div class="intui">${head}
    <div class="intui-sec"><h3>Saisies</h3><div class="intui-grid">${sgt('send','Facture client','inv')}${sgt('globe','Facture d’achat','ap')}${sgt('info','Écriture','go','acc')}${sgt('folder','Caisse comptoir','go','pos')}${sgt('people','Nouveau tiers','nt')}</div></div>
    <div class="intui-sec"><h3>Traitements</h3><div class="intui-grid">${sgt('book','Lettrage','go','acc','Lettrage')}${sgt('cal','Paie du mois','np')}${sgt('legal','Dotation','dot')}${sgt('search','Inventaire','go','stock')}${sgt('portal','Nouvelle mission','nm')}</div></div>
    <div class="intui-sec"><h3>Échanges et contrôle</h3><div class="intui-grid">${sgt('logo','Tableau de bord','go','dash')}${sgt('books','États SYSCOHADA','go','etats')}${sgt('cloud','Trésorerie 30/60/90','go','tre')}${sgt('ring','Guide','help')}</div></div>
  </div>`;
};

function abcStock(){
  const rows=S.art.filter(a=>a.c!=='Service').map(a=>{const v=(a.cost||0)*(a.q||0); return {...a,v}}).sort((a,b)=>b.v-a.v);
  const tot=rows.reduce((s,x)=>s+x.v,0)||1; let acc=0;
  return rows.map(x=>{acc+=x.v; const p=acc/tot; x.abc=p<=.8?'A':p<=.95?'B':'C'; x.rot=(x.q&&x.m)?(x.q/Math.max(x.m,1)):0; return x});
}
function marginDocs(){
  const fa=S.docs.filter(d=>d.type==='Facture');
  return fa.map(d=>{
    const cost=(d.lines||[]).reduce((s,l)=>s+(l.cost||0)*(l.q||0),0) || (d.ht*0.72);
    return {cl:d.cl,id:d.id,ht:d.ht,cost,m:d.ht-cost};
  });
}

V.dash=()=>{
  const fa=S.docs.filter(d=>d.type==='Facture'), ca=caHT(), cr=creances();
  const det=S.docs.filter(d=>d.type==='Facture d’achat'&&d.st==='À payer').reduce((s,d)=>s+d.total,0);
  const stockV=S.art.reduce((s,a)=>s+(a.cost||0)*(a.q||0),0);
  const bfr=cr+stockV-det;
  const mg=marginDocs(); const tm=mg.reduce((s,x)=>s+x.m,0);
  const abc=abcStock();
  const aged=[0,0,0]; fa.filter(d=>d.st==='Impayée').forEach(d=>{const n=-dl(d.d); aged[n<=30?0:n<=60?1:2]+=d.total-(d.paid||0)});
  const mr=S.mis.reduce((s,m)=>s+m.rev,0), mc=S.mis.reduce((s,m)=>s+m.cost,0);
  const rv=[310,355,298,402,447,ca/1e6], ch=[220,248,231,276,301,ca*.62/1e6], mx=Math.max(...rv,...ch,1);
  const mo=['Juin','Juil','Août','Sept','Oct','Nov'];
  const svgC=`<svg viewBox="0 0 520 230" width="100%" role="img">${mo.map((m,i)=>{const x=24+i*83,a=rv[i]/mx*168,b=ch[i]/mx*168;return `<rect x="${x}" y="${188-a}" width="26" height="${a}" rx="4" fill="var(--br)"/><rect x="${x+30}" y="${188-b}" width="26" height="${b}" rx="4" fill="var(--bd)"/><text x="${x+28}" y="214" text-anchor="middle" fill="var(--mut)" font-size="12">${m}</text>`}).join('')}</svg>`;
  return `<div class="grid g4">${kp('CA HT',MM(ca)+' GNF',fa.length+' factures')}${kp('Marge réelle',MM(tm)+' GNF','sur coût de revient')}${kp('BFR',MM(bfr)+' GNF','créances + stock − dettes')}${kp('Trésorerie',MM(treso())+' GNF','30 / 60 / 90 j')}</div>
  <div class="grid g2"><div class="card"><h3>Produits et charges (M GNF)</h3>${svgC}</div>
  <div class="card"><h3>Créances âgées</h3>${['0-30 j','31-60 j','> 60 j'].map((l,i)=>`<div class="al"><span style="flex:1">${l}</span><b>${F(aged[i])}</b></div>`).join('')}<p class="muted">DSO estimé : ${fa.length?Math.round(cr/(ca/180)):'—'} j</p></div></div>
  <div class="grid g2"><div class="card"><h3>ABC du stock (CMUP)</h3>${tbl(['Classe','Réf.','Article','.Valeur CMUP'],abc.slice(0,8).map(x=>[bd(x.abc,x.abc==='A'?'':x.abc==='B'?'w':'d'),x.r,esc(x.n),F(x.v)]))}</div>
  <div class="card"><h3>Marge par client</h3>${tbl(['Client','.CA HT','.Marge'],Object.entries(mg.reduce((o,x)=>{o[x.cl]=o[x.cl]||{ht:0,m:0}; o[x.cl].ht+=x.ht; o[x.cl].m+=x.m; return o},{})).map(([n,v])=>[esc(n),F(v.ht),F(v.m)]))}</div></div>
  <div class="grid g2"><div class="card"><h3>Missions (recette − coût)</h3>${kp('Marge flotte',MM(mr-mc)+' GNF',mr?Math.round((mr-mc)/mr*100)+' %':'—')}</div><div class="card"><h3>Contrôles</h3>${alh()}</div></div>`;
};

function alerts(){
  const a=[];
  const im=S.docs.filter(d=>d.type==='Facture'&&d.st==='Impayée');
  if(im.length)a.push(['w',`${im.length} factures impayées · ${F(im.reduce((s,d)=>s+d.total-(d.paid||0),0))}`]);
  S.docs.filter(d=>d.type==='Facture d’achat'&&d.st==='À payer').forEach(d=>a.push(['w',`Fournisseur : ${d.cl} · ${F(d.total)}`]));
  S.art.filter(x=>x.c!=='Service'&&x.q<=x.m&&x.m>0).forEach(x=>a.push(['d',`Stock bas ${x.n} (${x.q} / mini ${x.m}) — commander`]));
  S.veh.forEach(x=>[['ins','assurance'],['ct','visite technique']].forEach(([k,n])=>{const d=dl(x[k]); if(d<=45)a.push([d<=15?'d':'w',`${x.id} : ${n} ${d<0?'expirée':'dans '+d+' j'}`])}));
  S.docs.filter(d=>d.type==='Facture'&&d.ht && d.lines&&d.lines[0]&&d.lines[0].cost && d.lines[0].pu<d.lines[0].cost).forEach(d=>a.push(['d','Vente sous le coût : '+d.id]));
  const ids={}; S.docs.forEach(d=>{const k=d.type+'|'+d.cl+'|'+d.total; ids[k]=(ids[k]||0)+1; if(ids[k]===2)a.push(['w','Possible doublon : '+d.cl+' '+F(d.total)])});
  if(!totJ().ok)a.push(['d','Journaux déséquilibrés']);
  return a;
}

V.pos=()=>{
  const arts=S.art.filter(a=>a.c!=='Service');
  return `<div class="card"><h3>Caisse comptoir — vente au comptant</h3>
  <div class="row"><label>Client<select id="f2">${opt(S.cl,c=>`<option>${esc(pname(c))}</option>`)}</select></label>
  <label>Article<select id="f3">${opt(arts,a=>`<option value="${a.r}">${esc(a.n)} — ${F(a.p)}</option>`)}</select></label>
  <label>Quantité<input id="f4" type="number" min="1" value="1"></label>
  <label>Encaissement<select id="tc"><option value="571">Espèces (571)</option><option value="585">Orange / MTN MoMo (585)</option><option value="521">Virement (521)</option></select></label>
  <label>Dépôt<select id="dep">${opt(S.dep,d=>`<option value="${d.id}">${esc(d.n)}</option>`)}</select></label></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="pos">Encaisser et livrer</button></div>
  <p class="muted">Écriture automatique : caisse / client / TVA / sortie de stock au CMUP. Aucune ressaisie comptable.</p></div>`;
};

V.tiers=()=>{
  const isC=tab.tiers!=='Fournisseurs';
  const src=isC?S.cl:S.fr;
  const list=src.map(p=>{
    const n=pname(p);
    const docs=S.docs.filter(d=>d.cl===n&&(isC?d.type==='Facture':d.type==='Facture d’achat'));
    const ca=docs.reduce((s,d)=>s+d.ht,0);
    const due=docs.filter(d=>isC?d.st==='Impayée':d.st==='À payer').reduce((s,d)=>s+d.total-(d.paid||0),0);
    return {n,ca,due,nb:docs.length,ceil:p.ceil,score:p.score,delay:p.delay};
  });
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs"><a class="${isC?'on':''}" data-a="tb" data-k="tiers" data-v="Clients">Clients</a><a class="${!isC?'on':''}" data-a="tb" data-k="tiers" data-v="Fournisseurs">Fournisseurs</a></div><button class="btn" data-a="nt">Nouveau tiers</button></div>
  <div class="grid g3">${kp(isC?'Clients':'Fournisseurs',list.length,'fiches')}${kp('Volume HT',MM(list.reduce((s,x)=>s+x.ca,0))+' GNF','cumul')}${kp('Encours',MM(list.reduce((s,x)=>s+x.due,0))+' GNF','non soldé')}</div>
  <div class="card">${tbl(isC?['Raison sociale','Pièces','.CA HT','.Encours','.Plafond','Score','Situation']:['Raison sociale','Pièces','.Volume','.Dettes','Délai j','Situation'],
    list.map(x=>isC?[esc(x.n),x.nb,F(x.ca),F(x.due),F(x.ceil||0),x.score||'—',x.due?(x.ceil&&x.due>x.ceil?bd('Plafond','d'):bd('Ouvert','w')):bd('Soldé')]:[esc(x.n),x.nb,F(x.ca),F(x.due),(x.delay||'—')+' j',x.due?bd('À payer','w'):bd('Soldé')]))}</div>`;
};

V.stock=()=>{
  const val=S.art.reduce((s,x)=>s+(x.cost||0)*(x.q||0),0);
  const abc=abcStock();
  const mv=(S.mv||[]).slice(-12).reverse();
  return `<div class="grid g4">${kp('Valeur CMUP',MM(val)+' GNF','coût de revient')}${kp('Références',S.art.length,'catalogue')}${kp('Sous mini',S.art.filter(x=>x.q<=x.m&&x.m>0).length,'à commander')}${kp('Dépôts',S.dep.length,S.dep.map(d=>d.n).join(' · '))}</div>
  <div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn g" data-a="xfer">Transfert de dépôt</button><button class="btn" data-a="na">Nouvel article</button></div>
  <div class="card">${tbl(['Réf.','Article','Unité','ABC','.CMUP','.PV HT','Kaloum','Kamsar','Mini','État'],S.art.map(x=>{
    const cls=abc.find(a=>a.r===x.r);
    return [esc(x.r),esc(x.n),x.u||'U',cls?bd(cls.abc,cls.abc==='A'?'':cls.abc==='B'?'w':'d'):'—',F(x.cost||0),F(x.p),(x.dep&&x.dep.KAL)||0,(x.dep&&x.dep.KAM)||0,x.m,x.m&&x.q<=x.m?bd('Commander','d'):bd('OK')];
  }))}</div>
  <div class="card" style="margin-top:12px"><h3>Derniers mouvements</h3>${tbl(['Date','Pièce','Réf.','Dépôt','Motif','.Qté'],mv.map(x=>[FR(x.d),esc(x.p),x.r,x.dep,x.why,x.q]))}</div>`;
};

V.sales=()=>docsOf(['Devis','Commande','Bon de livraison','Facture','Avoir'],'sales');
V.purch=()=>docsOf(['Commande d’achat','Bon de réception','Facture d’achat'],'purch');

const FLOW={'Devis':'Commande','Commande':'Bon de livraison','Bon de livraison':'Facture','Commande d’achat':'Bon de réception','Bon de réception':'Facture d’achat'};
const _docActs=docActs;
docActs=function(d){
  let s=_docActs(d);
  if(FLOW[d.type] && d.st!=='Converti' && d.st!=='Facturé') s+=` <button class="btn s" data-a="cv" data-v="${d.id}">→ ${FLOW[d.type]}</button>`;
  if(d.st==='Bloqué') s+=` <button class="btn s w" data-a="unb" data-v="${d.id}">Débloquer</button>`;
  return s;
};

A.cv=d=>{
  const o=S.docs.find(x=>x.id===d.v); if(!o||!FLOW[o.type]) return toast('Conversion impossible');
  const next=FLOW[o.type];
  if(next==='Facture' && !d.force && !canCredit(o.cl,o.total)){
    o.st='Bloqué'; audit('blocage',o.id+' plafond '+o.cl); return toast('Plafond de crédit dépassé — déblocage direction requis');
  }
  const nd=addDoc({type:next,cl:o.cl,d:T,ht:o.ht,st:next==='Facture'?'Impayée':next==='Facture d’achat'?'À payer':next==='Bon de livraison'?'Livré':'En cours',rev:o.rev,chg:o.chg,art:o.art,qty:o.qty,pu:o.pu,from:o.id,depot:o.depot||'KAL'});
  o.st='Converti'; toast(o.id+' converti en '+nd.id);
};
A.unb=d=>{
  if((S.role||'direction')!=='direction' && S.role!=='comptable') return toast('Seul un responsable peut débloquer');
  const o=S.docs.find(x=>x.id===d.v); if(!o) return;
  o.st='Envoyé'; A.cv({v:o.id, force:true});
};
A.pos=()=>{
  const a=S.art.find(x=>x.r===v('f3')); if(!a) return toast('Article introuvable');
  const n=Math.max(1,+v('f4')||1), dep=v('dep')||'KAL';
  if(a.c!=='Service' && ((a.dep&&a.dep[dep])||0)<n && !S.co.allowNeg) return toast('Stock insuffisant à '+dep);
  const o=addDoc({type:'Facture',cl:v('f2'),d:T,ht:a.p*n,st:'Impayée',rev:a.c==='Service'?'706':'701',art:a.n,qty:n,pu:a.p,r:a.r,depot:dep});
  const c=v('tc')||'571'; o.st='Payée'; o.paid=o.total; cash(o,c);
  toast('Ticket '+o.id+' encaissé sur '+c);
};
A.xfer=()=>modal('Transfert entre dépôts',`<label>Article<select id="f3">${opt(S.art.filter(a=>a.c!=='Service'),a=>`<option value="${a.r}">${esc(a.n)}</option>`)}</select></label><label>Quantité<input id="f4" type="number" min="1" value="10"></label><label>De<select id="f1">${opt(S.dep,d=>`<option value="${d.id}">${esc(d.n)}</option>`)}</select></label><label>Vers<select id="f2">${opt(S.dep,d=>`<option value="${d.id}">${esc(d.n)}</option>`)}</select></label>`,()=>{
  const a=S.art.find(x=>x.r===v('f3')), q=+v('f4')||0, fr=v('f1'), to=v('f2');
  if(!a||fr===to||q<=0){toast('Transfert invalide'); return false;}
  if(!stockMove(a.r,-q,fr,'transfert','TRF')) return false;
  stockMove(a.r,q,to,'transfert','TRF',a.cost);
  toast('Transfert '+a.n+' '+fr+' → '+to+' (sans impact P&L)');
});
A.fuel=()=>modal('Bon carburant',`<label>Véhicule<select id="f1">${opt(S.veh,x=>`<option>${x.id}</option>`)}</select></label><label>Litres<input id="f4" type="number" value="80"></label><label>Montant GNF<input id="f5" type="number" value="1000000"></label>`,()=>{
  const veh=v('f1'), l=+v('f4'), m=+v('f5'); S.fuel.push({d:T,v:veh,l,m}); post(T,'CA',nid('j','CAR'),'Gasoil '+veh,[['605',m,0],['571',0,m]]); toast('Carburant '+veh+' comptabilisé');
});
function relTpl(o){
  const co=S.co||{};
  return `Bonjour ${o.cl},\n\nLa facture ${o.id} du ${o.d} d’un montant de ${F(o.total)} reste due.\nMerci de procéder au règlement (espèces, virement ou Orange Money / MTN MoMo).\n\n${co.name||'Fastlane Logistic'} — ${co.tel||''}\n${co.mail||''}`;
}
A.rel=d=>{
  const o=S.docs.find(x=>x.id===d.v); if(!o) return toast('Document introuvable');
  const cl=clientObj(o.cl)||{};
  const tel=FL_TEL; const mail=cl.mail||'';
  modal('Relance — '+o.id,`<label>Canal<select id="fch"><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">E-mail</option></select></label>
    <label>Destinataire<input id="fto" value="${esc(tel)}" placeholder="+224 614 99 85 86"></label>
    <label>E-mail (si e-mail)<input id="fem" value="${esc(mail)}"></label>
    <label>Message<textarea id="fmsg" rows="7">${esc(relTpl(o))}</textarea></label>
    <p class="muted">WhatsApp et SMS s’ouvrent dans l’application réelle. Si Twilio est configuré (Paramètres), l’envoi part tout seul.</p>`,async()=>{
    const ch=v('fch'), to=ch==='email'?v('fem'):v('fto'), msg=v('fmsg');
    if(!to||!msg){ toast('Destinataire et message requis'); return false; }
    try{
      const r=await fetch('/api/remind',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel:ch,to,message:msg,subject:'Relance '+o.id,doc_id:o.id})});
      const j=await r.json();
      if(!j.ok && r.status===401){ toast('Reconnectez-vous pour envoyer'); return false; }
      if(j.open){ const a=document.createElement('a'); a.href=j.open; a.target='_blank'; a.rel='noopener'; a.click(); }
      (S.relance=S.relance||[]).unshift({t:new Date().toISOString(),ch,to,doc:o.id,mode:j.mode||'app'});
      audit('relance', ch+' '+o.id);
      toast(j.mode==='api'?'Relance envoyée':'Ouverture de '+ch);
    }catch(e){
      const href=ch==='whatsapp'?('https://wa.me/'+String(to).replace(/\D/g,'')+'?text='+encodeURIComponent(msg)):ch==='sms'?('sms:'+to+'?&body='+encodeURIComponent(msg)):('mailto:'+to+'?subject='+encodeURIComponent('Relance '+o.id)+'&body='+encodeURIComponent(msg));
      const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener'; a.click();
      toast('Hors ligne — ouverture de l’application');
    }
  });
};
A.picku=d=>{
  AUTH.pick=d.v; AUTH.pin=''; AUTH.err=''; AUTH.step='pin'; showLogin('pin');
};
A.backu=()=>{ AUTH.pick=''; AUTH.pin=''; AUTH.ticket=''; AUTH.err=''; AUTH.step='list'; showLogin('list'); };
A.pd=d=>{
  if(d.v==='x') AUTH.pin=(AUTH.pin||'').slice(0,-1);
  else if(d.v==='ok') return AUTH.step==='otp'?A.otp():A.login();
  else if((AUTH.pin||'').length<(AUTH.step==='otp'?6:8)) AUTH.pin+=(d.v||'');
  if(AUTH.step==='otp' && (AUTH.pin||'').length===6) return A.otp();
  if(AUTH.step==='pin' && (AUTH.pin||'').length===4) return A.login();
  showLogin(AUTH.step||'pin');
};
A.login=async()=>{
  const u=USERS.find(x=>x.id===AUTH.pick); if(!u) return;
  const pin=AUTH.pin||v('pin')||'';
  if(!pin){ AUTH.err='Saisissez le PIN'; showLogin('pin'); return; }
  try{
    const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id,pin})});
    const j=await r.json();
    if(!j.ok){ AUTH.err=j.error||'PIN incorrect'; AUTH.pin=''; showLogin('pin'); return; }
    if(j.need_2fa){ AUTH.ticket=j.ticket; AUTH.pin=''; AUTH.err=''; AUTH.step='otp'; showLogin('otp'); return; }
    finishLogin(j);
  }catch(e){
    if(pin==='1234'){ finishLogin({id:u.id,n:u.n,r:u.r}); return; }
    AUTH.err='Serveur injoignable — PIN démo 1234 hors ligne'; AUTH.pin=''; showLogin('pin');
  }
};
A.otp=async()=>{
  const code=(AUTH.pin||v('otp')||'').replace(/\s/g,'');
  if(code.length<6){ AUTH.err='Code à 6 chiffres'; showLogin('otp'); return; }
  try{
    const r=await fetch('/api/auth/verify-2fa',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:AUTH.ticket,code})});
    const j=await r.json();
    if(!j.ok){ AUTH.err=j.error||'Code incorrect'; AUTH.pin=''; showLogin('otp'); return; }
    finishLogin(j);
  }catch(e){ AUTH.err='Hors ligne — le 2FA nécessite le serveur'; showLogin('otp'); }
};
function finishLogin(j){
  sessionStorage.setItem('fl_user',j.id); sessionStorage.setItem('fl_role',j.r);
  S.user=j.id; S.role=j.r; AUTH.pin=''; AUTH.ticket=''; AUTH.err=''; AUTH.step='list';
  audit('login',j.n||j.id);
  const box=$('#login'); if(box) box.hidden=true;
  paintWho(); render(); if(typeof save==='function') save(); toast('Connecté : '+(j.n||j.id)+' ('+j.r+')');
}
A.out=async()=>{
  try{ await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}); }catch(e){}
  sessionStorage.removeItem('fl_user'); sessionStorage.removeItem('fl_role'); S.user=''; S.role=''; AUTH.pick=''; AUTH.pin=''; showLogin('list');
};
A.tfa=async()=>{
  try{
    const r=await fetch('/api/auth/setup-2fa',{method:'POST',credentials:'same-origin'});
    const j=await r.json();
    if(!j.ok){ toast(j.error||'Connexion requise'); return; }
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(j.otpauth)}`;
    modal('Activer le 2FA',`<p>Scannez ce QR avec Google Authenticator, Microsoft Authenticator ou FreeOTP.</p>
      <p style="text-align:center"><img src="${qr}" alt="QR 2FA" width="180" height="180" style="border-radius:8px;background:#fff"></p>
      <p class="muted">Ou saisissez la clé : <b>${esc(j.secret)}</b></p>
      <label>Code à 6 chiffres<input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label>`,async()=>{
      const code=v('otp');
      const c=await fetch('/api/auth/confirm-2fa',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
      const x=await c.json();
      if(!x.ok){ toast(x.error||'Code invalide'); return false; }
      toast('2FA activé pour ce compte');
    });
  }catch(e){ toast('2FA indisponible hors ligne'); }
};
A.tfadis=()=>modal('Désactiver le 2FA',`<label>PIN<input id="pin" type="password" inputmode="numeric"></label><label>Code Authenticator<input id="otp" inputmode="numeric" maxlength="6"></label>`,async()=>{
  const r=await fetch('/api/auth/disable-2fa',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:v('pin'),code:v('otp')})});
  const j=await r.json();
  if(!j.ok){ toast(j.error||'Impossible'); return false; }
  toast('2FA désactivé');
});
A.ncfg=()=>modal('Passerelles SMS / WhatsApp / e-mail',`<p class="muted">Twilio (SMS + WhatsApp Business) et SMTP. Laissés vides, Fastlane ouvre WhatsApp, SMS ou Mail de l’appareil.</p>
  <label>Twilio Account SID<input id="f1" placeholder="ACxxxx"></label>
  <label>Twilio Auth Token<input id="f2" type="password" placeholder="••••"></label>
  <label>N° SMS expéditeur<input id="f3" placeholder="+224..."></label>
  <label>N° WhatsApp Twilio<input id="f4" placeholder="+1415... ou whatsapp:+..."></label>
  <label>SMTP hôte<input id="f5" placeholder="smtp.gmail.com"></label>
  <label>SMTP port<input id="f6" value="587"></label>
  <label>SMTP utilisateur<input id="f7"></label>
  <label>SMTP mot de passe<input id="f8" type="password"></label>
  <label>E-mail expéditeur<input id="f9" placeholder="finance@fastlane.gn"></label>`,async()=>{
  const body={twilio_sid:v('f1'),twilio_token:v('f2'),twilio_sms_from:v('f3'),twilio_wa_from:v('f4'),smtp_host:v('f5'),smtp_port:v('f6'),smtp_user:v('f7'),smtp_pass:v('f8'),smtp_from:v('f9')};
  const r=await fetch('/api/notify/config',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  if(!j.ok){ toast(j.error||'Enregistrement refusé'); return false; }
  toast('Passerelles enregistrées');
});
const _rs=A.rs;
A.rs=async function(){ await _rs(); upgradeState(); paintWho(); };
A.mv=d=>{
  const a=S.art.find(x=>x.r===d.v); if(!a) return toast('Article introuvable');
  const n=+d.n; if(!n) return;
  if(!stockMove(a.r,n,'KAL','ajustement','AJ-'+a.r,a.cost)) return;
  const cost=Math.abs(n)*(a.cost||0);
  if(cost) post(T,'ST','AJ-'+a.r,'Ajustement '+a.n, n>0?[['31',cost,0],['603',0,cost]]:[['603',cost,0],['31',0,cost]]);
  toast(a.n+' : stock '+a.q);
};

const _go=A.go;
A.go=d=>{
  if(d.v==='pos'){ navSel='pos'; location.hash='pos'; return; }
  if(d.v && !can(d.v) && d.v!=='home'){ toast('Droit insuffisant pour ce module'); return; }
  if(d.id==='fourn'){ tab.tiers='Fournisseurs'; d.v='tiers'; }
  _go(d);
};
const _add=A.add;
A.add=()=>{ if(viewK()==='pos'){ const i=$('#f4'); if(i) i.focus(); return; } if(viewK()==='stock') return A.xfer(); _add(); };

function paintWho(){
  const el=$('#who'); if(!el) return;
  const u=USERS.find(x=>x.id===S.user);
  el.textContent=u?u.n.split(' ')[0]+' · '+u.r:'Connexion';
}
function padHTML(){
  const keys=['1','2','3','4','5','6','7','8','9','x','0','ok'];
  return `<div class="pinpad">${keys.map(k=>`<button type="button" data-a="pd" data-v="${k}">${k==='x'?'⌫':k==='ok'?'OK':k}</button>`).join('')}</div>`;
}
function showLogin(step){
  const box=$('#login'); if(!box) return;
  box.hidden=false;
  AUTH.step=step||AUTH.step||'list';
  const err=AUTH.err?`<p class="login-err">${esc(AUTH.err)}</p>`:'';
  if(AUTH.step==='pin'){
    const u=USERS.find(x=>x.id===AUTH.pick)||{n:'Utilisateur',r:''};
    box.innerHTML=`<div class="login-card narrow"><img src="/static/img/logo.jpg" alt="Fastlane"><h2>Code PIN</h2><p>${esc(u.n)} · ${esc(u.r)} — démo 1234</p>
      <div class="pindots">${[0,1,2,3].map(i=>`<i class="${i<(AUTH.pin||'').length?'on':''}"></i>`).join('')}</div>
      ${err}${padHTML()}
      <button type="button" class="btn g" data-a="backu" style="margin-top:12px">Retour aux profils</button></div>`;
    return;
  }
  if(AUTH.step==='otp'){
    box.innerHTML=`<div class="login-card narrow"><img src="/static/img/logo.jpg" alt="Fastlane"><h2>Authentification 2FA</h2><p>Saisissez le code à 6 chiffres de votre application Authenticator.</p>
      <div class="pindots six">${[0,1,2,3,4,5].map(i=>`<i class="${i<(AUTH.pin||'').length?'on':''}"></i>`).join('')}</div>
      ${err}${padHTML()}
      <button type="button" class="btn g" data-a="backu" style="margin-top:12px">Annuler</button></div>`;
    return;
  }
  box.innerHTML=`<div class="login-card"><img src="/static/img/logo.jpg" alt="Fastlane"><h2>Fastlane Gestion</h2><p>Choisissez un profil, puis saisissez le PIN (démo 1234) et le 2FA s’il est activé.</p>
    <div class="login-grid">${USERS.map(u=>`<button type="button" data-a="picku" data-v="${u.id}"><b>${esc(u.n)}</b><span>${u.r}${u.totp?' · 2FA':''}</span></button>`).join('')}</div></div>`;
}
async function gate(){
  upgradeState();
  try{
    const ru=await fetch('/api/auth/users',{credentials:'same-origin'});
    if(ru.ok){ const j=await ru.json(); if(j.users&&j.users.length) USERS=j.users; }
  }catch(e){}
  let me=null;
  try{
    if(navigator.onLine){
      const r=await fetch('/api/auth/me',{credentials:'same-origin'});
      if(r.ok) me=await r.json();
    }
  }catch(e){}
  if(me&&me.id){
    S.user=me.id; S.role=me.r;
    sessionStorage.setItem('fl_user',me.id); sessionStorage.setItem('fl_role',me.r);
    const box=$('#login'); if(box) box.hidden=true;
  }else if(sessionStorage.getItem('fl_user')&&!navigator.onLine){
    S.user=sessionStorage.getItem('fl_user'); S.role=sessionStorage.getItem('fl_role');
    const box=$('#login'); if(box) box.hidden=true;
  }else showLogin('list');
  paintWho();
  if(typeof paintOff==='function') paintOff();
  const k=viewK(); if(k!=='home' && !can(k)){ location.hash='home'; }
  render();
}

skipSave.add('out'); skipSave.add('xfer'); skipSave.add('fuel'); skipSave.add('picku'); skipSave.add('pd'); skipSave.add('backu'); skipSave.add('tfa'); skipSave.add('tfadis'); skipSave.add('ncfg'); skipSave.add('install'); skipSave.add('rel');
skipRender.add('picku'); skipRender.add('pd'); skipRender.add('backu'); skipRender.add('otp'); skipRender.add('login'); skipRender.add('tfa'); skipRender.add('tfadis'); skipRender.add('ncfg'); skipRender.add('rel');

function pinDigit(e){
  if(/^[0-9]$/.test(e.key)) return e.key;
  const c=e.code||'';
  if(/^Numpad[0-9]$/.test(c) || /^Digit[0-9]$/.test(c)) return c.slice(-1);
  return '';
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('#login [data-a]');
  if(!b) return;
  e.preventDefault();
  e.stopPropagation();
  const data=Object.assign({}, b.dataset);
  const act=data.a;
  if(A[act]) A[act](data);
}, true);
document.addEventListener('keydown',e=>{
  const box=$('#login');
  if(!box||box.hidden) return;
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  if(AUTH.step==='list' && (e.key==='Enter'||e.key===' ')){
    const el=e.target.closest('.login-grid [data-a="picku"]');
    if(el){ e.preventDefault(); e.stopImmediatePropagation(); A.picku(Object.assign({}, el.dataset)); }
    return;
  }
  if(AUTH.step!=='pin'&&AUTH.step!=='otp') return;
  const d=pinDigit(e);
  if(d){ e.preventDefault(); e.stopImmediatePropagation(); A.pd({v:d}); }
  else if(e.key==='Backspace'||e.key==='Delete'){ e.preventDefault(); e.stopImmediatePropagation(); A.pd({v:'x'}); }
  else if(e.key==='Enter'){ e.preventDefault(); e.stopImmediatePropagation(); A.pd({v:'ok'}); }
  else if(e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); A.backu(); }
}, true);

V.tre=()=>{
  const fi=S.docs.filter(d=>d.type==='Facture'&&d.st==='Impayée'), ag=[0,0,0];
  fi.forEach(d=>{const n=-dl(d.d); ag[n<=30?0:n<=60?1:2]+=d.total-(d.paid||0)});
  const fp=S.docs.filter(d=>d.type==='Facture d’achat'&&d.st==='À payer');
  const in30=ag[0], out30=fp.filter(d=>-dl(d.d)<=30).reduce((s,d)=>s+d.total,0);
  const mv=S.j.filter(x=>['521','571','585'].includes(x.c)).slice(-10).reverse();
  return `<div class="grid g3">${[['521','Banque'],['571','Caisse'],['585','Mobile money']].map(a=>kp(a[1],MM(bal(a[0]))+' GNF','compte '+a[0])).join('')}</div>
  <div class="grid g3">${kp('Prévision 30 j',MM(treso()+in30-out30)+' GNF','encaissements − règlements')}${kp('60 j',MM(treso()+ag[0]+ag[1]-out30)+' GNF','échéances')}${kp('90 j',MM(treso()+ag.reduce((s,x)=>s+x,0)-fp.reduce((s,d)=>s+d.total,0))+' GNF','horizon')}</div>
  <div class="grid g2"><div class="card"><h3>Mouvements</h3>${tbl(['Date','Pièce','Libellé','Compte','.Montant'],mv.map(x=>[FR(x.d),esc(x.p),esc(x.l),PL[x.c]||x.c,x.db?'+ '+F(x.db):'− '+F(x.cr)]))}</div>
  <div class="card"><h3>Créances / dettes</h3>${['0 à 30 jours','31 à 60 jours','Plus de 60 jours'].map((l,i)=>`<div class="al"><span style="flex:1">${l}</span><b>${MM(ag[i])} GNF</b></div>`).join('')}<h3 style="margin-top:16px">Fournisseurs</h3>${fp.length?fp.map(d=>`<div class="al"><span style="flex:1">${esc(d.cl)}</span><b>${F(d.total)}</b> <button class="btn s" data-a="pf" data-v="${d.id}">Régler</button></div>`).join(''):'<div class="muted">Aucun.</div>'}</div></div>
  <div class="card"><h3>Encaissement</h3><div class="row"><label>Facture<select id="tf">${opt(fi,d=>`<option value="${d.id}">${d.id} — ${d.cl} — ${F(d.total)}</option>`)||'<option>Aucune impayée</option>'}</select></label><label>Compte<select id="tc"><option value="521">521 Banque</option><option value="571">571 Caisse</option><option value="585">585 Orange / MTN</option></select></label><button class="btn" data-a="px">Encaisser</button></div></div>`;
};

V.fleet=()=>`<div class="row" style="justify-content:space-between;margin-bottom:12px"><h3 style="margin:0">Parc de ${S.veh.length} véhicules</h3><div class="gap"><button class="btn g" data-a="fuel">Bon carburant</button><button class="btn" data-a="nm">Nouvelle mission</button></div></div>
<div class="vc" style="margin-bottom:16px">${S.veh.map(x=>{const fu=(S.fuel||[]).filter(f=>f.v===x.id); const L=fu.reduce((s,f)=>s+f.l,0), M=fu.reduce((s,f)=>s+f.m,0); return `<div class="card"><div class="gap"><b>${esc(x.id)}</b>${bd(x.st,x.st==='Maintenance'?'w':x.st==='Disponible'?'':'i')}</div><div class="muted">${esc(x.mo)} · ${esc(x.pl)}</div><div>Chauffeur : ${esc(x.dr)}</div><div>${x.km.toLocaleString('fr-FR')} km${L?` · ${L} L · ${F(M)}`:''}</div>${[['ins','Assurance'],['ct','Visite technique']].map(([k,n])=>{const d=dl(x[k]);return `<div>${n} : ${bd(d<0?'expirée':d+' j',d<=15?'d':d<=45?'w':'')}</div>`}).join('')}</div>`}).join('')}</div>
<div class="card"><h3>Missions — rentabilité</h3>${tbl(['N°','Trajet','Véhicule','Client','Avancement','.Coût','.Recette','.Marge','Action'],S.mis.map(m=>[m.id,esc(m.a+' → '+m.b),m.v,esc(m.c),`<div class="bar"><i style="width:${m.p}%"></i></div> ${m.p>=100?'Livrée':m.p+' %'}`,F(m.cost),F(m.rev),F(m.rev-m.cost),m.p<100?`<button class="btn s" data-a="adv" data-v="${m.id}">POD +25 %</button>`:bd('Livrée')]))}</div>`;

V.set=()=>`<div class="grid g2"><div class="card"><h3>Société</h3>
  <div class="row"><label>Raison sociale<input id="cn" value="${esc(S.co.name)}"></label><label>Ville<input id="cc" value="${esc(S.co.city)}"></label><label>NIF<input id="nif" value="${esc(S.co.nif)}"></label><label>RCCM<input id="rccm" value="${esc(S.co.rccm)}"></label><label>Téléphone<input id="tel" value="${esc(S.co.tel)}"></label><label>E-mail<input id="em" value="${esc(S.co.mail)}"></label><label>TVA<select id="tva"><option value="0.18" ${S.co.tva==.18?'selected':''}>18 % (Guinée)</option><option value="0.20" ${S.co.tva==.2?'selected':''}>20 %</option><option value="0" ${S.co.tva==0?'selected':''}>Exonéré</option></select></label></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="sc">Enregistrer</button><button class="btn g" data-a="rs">Réinitialiser les données démo</button></div></div>
  <div class="card"><h3>Sécurité · 2FA</h3><p>PIN obligatoire. Après 5 essais : blocage 15 min. Activez un code TOTP (Google Authenticator, FreeOTP) pour ce compte.</p>
  <div class="gap"><button class="btn" data-a="tfa">Activer / renouveler le 2FA</button><button class="btn g" data-a="tfadis">Désactiver le 2FA</button></div>
  <h3 style="margin-top:18px">Relances WhatsApp / SMS</h3><p class="muted">Sans passerelle : ouverture de WhatsApp, SMS ou Mail. Avec Twilio / SMTP : envoi direct depuis le serveur.</p>
  <button class="btn g" data-a="ncfg">Configurer Twilio et SMTP</button>
  <h3 style="margin-top:18px">Application hors ligne</h3><p class="muted">PWA installable. Les saisies continuent sans réseau puis se synchronisent.</p>
  <button class="btn" id="btn-install" data-a="install">Installer sur cet appareil</button>
  <h3 style="margin-top:18px">Relances envoyées</h3>${(S.relance||[]).length?tbl(['Heure','Canal','Pièce','Dest.'],S.relance.slice(0,6).map(x=>[esc((x.t||'').slice(11,19)),esc(x.ch),esc(x.doc),esc(x.to)])):('<p class="muted">Aucune relance pour l’instant.</p>')}
  <h3 style="margin-top:16px">Audit récent</h3>${tbl(['Heure','Utilisateur','Action','Détail'],(S.audit||[]).slice(0,8).map(x=>[x.t.slice(11,19),esc(x.u),esc(x.a),esc(x.d)]))}</div></div>`;

loadState().then(gate);
