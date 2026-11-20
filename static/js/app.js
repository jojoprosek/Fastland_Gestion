const T=new Date().toISOString().slice(0,10);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const F=n=>Math.round(+n||0).toLocaleString('fr-FR')+' GNF';
const MM=n=>{const x=+n||0,a=Math.abs(x);return (x<0?'−':'')+(a>=1e6?(a/1e6).toFixed(1)+' M':a>=1e3?(a/1e3).toFixed(0)+' k':Math.round(a))};
const FR=s=>new Date(s+'T12:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
const PL={
  '101':'Capital social','106':'Réserves','120':'Résultat net','211':'Terrains','213':'Constructions',
  '244':'Matériel de transport','245':'Matériel de bureau','281':'Amortissements immobilisations',
  '31':'Marchandises','401':'Fournisseurs','408':'Fournisseurs factures non parvenues','411':'Clients',
  '421':'Personnel — rémunérations dues','431':'Sécurité sociale','4431':'État, TVA facturée',
  '4452':'État, TVA récupérable','521':'Banques','571':'Caisse','585':'Monnaie électronique',
  '601':'Achats de marchandises','603':'Variation de stocks','604':'Matières et fournitures','605':'Autres achats','613':'Locations',
  '622':'Entretien et réparations','624':'Transports','661':'Rémunérations du personnel',
  '664':'Charges sociales','681':'Dotations aux amortissements','701':'Ventes de marchandises',
  '706':'Services vendus','707':'Produits accessoires','718':'Transferts de charges'
};
const JOU={VT:'Ventes',AC:'Achats',BQ:'Banque',CA:'Caisse',MM:'Mobile money',OD:'Opérations diverses',PA:'Paie',IM:'Immobilisations',ST:'Stocks'};
const ICO={
  home:'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z',
  dash:'M4 4h7v7H4zm9 0h7v4h-7zM4 13h7v7H4zm9 6h7v4h-7zm0-6h7v4h-7z',
  users:'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m12-12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 12v-1a3.5 3.5 0 0 0-2.5-3.3M18.5 8.5a2.5 2.5 0 0 1 0 5',
  sales:'M6 6h12l-1 12H7L6 6zm3-3h6l1 3H8z',
  purch:'M4 7h16v12H4zm3-3h10v3H7z',
  stock:'M21 8H3l2-4h14zm-18 0v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8',
  acc:'M5 4h14v16H5zm3 4h8M8 12h8M8 16h5',
  tre:'M3 10h18v8H3zm2-4h14l2 4H3z',
  immo:'M4 20V9l8-5 8 5v11H4zm8 0v-6',
  paye:'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-9 0h10v13H7z',
  fleet:'M3 16h2l2-6h8l3 6h3v3H3zm4.5 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  etats:'M5 19h14M7 16l3-7 3 4 2-3 3 6',
  set:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.5 4a7.5 7.5 0 0 0-.2-1.6l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-2.8-1.6L14.5 2h-5L9 5a7.8 7.8 0 0 0-2.8 1.6l-2.4-1-2 3.4 2 1.5A7.5 7.5 0 0 0 3.5 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 2.8 1.6l.6 3h5l.6-3a7.8 7.8 0 0 0 2.8-1.6l2.4 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6z'
};
const svg=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const NAV=[
  ['Saisie des écritures',[
    ['acc','Ajout d’une pièce','acc','piece','Saisie','piece'],
    ['sales','Visualisation / modification','sales','go','','visu'],
    ['acc','Saisie des écritures','acc','go','Saisie','saisie'],
    ['acc','Recherche d’écritures','acc','go','Journal','recherche'],
    ['acc','Journaux de saisie','acc','go','Journal','journaux'],
    ['acc','Créer un compte général','acc','nc','Plan comptable','compte']
  ]],
  ['Gestion et suivi des Tiers',[
    ['tiers','Clients et fournisseurs','users','go','','tiers'],
    ['sales','Documents de vente','sales','go','','ventes'],
    ['purch','Documents d’achat','purch','go','','achats']
  ]],
  ['Fonctions avancées',[
    ['stock','Stocks et inventaire','stock','go','','stock'],
    ['tre','Trésorerie','tre','go','','tre'],
    ['fleet','Flotte et missions','fleet','go','','fleet']
  ]],
  ['Traitements périodiques',[
    ['immo','Immobilisations','immo','go','','immo'],
    ['paye','Paie','paye','go','','paye']
  ]],
  ['États comptables et fiscaux',[
    ['etats','Bilan / résultat','etats','go','Bilan','bilan'],
    ['acc','Balance générale','acc','go','Balance','balance'],
    ['etats','Grand livre','etats','go','Grand livre','grandlivre']
  ]],
  ['Pilotage',[
    ['home','Fastlane — Accueil','home','go','','home'],
    ['dash','Indicateurs','dash','go','','dash'],
    ['set','Paramètres société','set','go','','set']
  ]]
];
const META={home:['Accueil','Fastlane Gestion'],dash:['Tableau de bord','Indicateurs'],tiers:['Tiers','Clients et fournisseurs'],sales:['Ventes','Devis, BL, factures'],purch:['Achats','Factures d’achat'],stock:['Stocks','Articles et inventaire'],acc:['Comptabilité','Saisie, journaux, balance'],etats:['États financiers','Bilan, résultat, grand livre'],tre:['Trésorerie','Banque, caisse, mobile money'],immo:['Immobilisations','Amortissements'],paye:['Paie','Salaires et bulletins'],fleet:['Flotte','Véhicules et missions'],set:['Paramètres','Société, journaux, TVA']};
let S,q='',okFn,navSel='home',tab={home:'Accueil',sales:'Tous',purch:'Tous',acc:'Saisie',etats:'Bilan',tre:'Soldes',tiers:'Clients'};
const V={},A={};

function post(d,j,p,l,ls){ls.forEach(x=>S.j.push({d,j,p,l,c:x[0],db:+x[1]||0,cr:+x[2]||0}))}
function nid(k,p){S.seq[k]=(S.seq[k]||0)+1;return p+'-2026-'+String(S.seq[k]).padStart(4,'0')}
function addDoc(o){
  const id=nid('doc',{Devis:'DEV',Commande:'CMD','Bon de livraison':'BL',Facture:'FAC',Avoir:'AV','Facture d’achat':'FA','Commande d’achat':'CA','Bon de réception':'BR'}[o.type]||'DOC');
  const ht=o.ht, tva=+(ht*S.co.tva).toFixed(0), total=ht+tva;
  const d={id,...o,ht,tva,total}; S.docs.push(d);
  if(o.type==='Facture'){sale(d); if(o.st==='Payée')cash(d,'521')}
  if(o.type==='Facture d’achat'){buy(d); if(o.st==='Payée')payF(d)}
  return d;
}
const sale=o=>post(o.d,'VT',o.id,'Facture '+o.cl,[['411',o.total,0],[o.rev||'701',0,o.ht],['4431',0,o.tva]]);
const cash=(o,c)=>post(T,'BQ',o.id,'Règlement '+o.cl,[[c,o.total,0],['411',0,o.total]]);
const buy=o=>post(o.d,'AC',o.id,'Achat '+o.cl,[[o.chg||'601',o.ht,0],['4452',o.tva,0],['401',0,o.total]]);
const payF=o=>post(T,'BQ',o.id,'Paiement '+o.cl,[['401',o.total,0],['521',0,o.total]]);

function seed(){
  S={
    seq:{doc:0,j:0,im:5,pa:10,mis:103},
    co:{name:'Fastlane Logistic SARL',city:'Kaloum, Conakry',nif:'GN-2024-88421',rccm:'GN-CKY-01-2024-B14',tel:'+224 614 99 85 86',mail:'finance@fastlane.gn',tva:.18,ex:'2026',cloture:false,allowNeg:false,cur:'GNF',fx:{USD:9200,EUR:10000}},
    cl:['Mining Corp Guinée','SOGUIPAMI Transport','Station Total Kaloum','Ets Diallo et Fils','Bauxite Logistics'],
    fr:['TotalEnergies Guinée','CFAO Equipment','Soguiphar','Ets Camara Pièces'],
    art:[
      {r:'GAS-01',n:'Gasoil (litre)',p:12500,q:8200,m:5000,c:'Énergie'},
      {r:'PNE-12',n:'Pneu 12R22.5',p:3200000,q:6,m:8,c:'Pièces'},
      {r:'HUI-20',n:'Huile moteur 20 L',p:850000,q:34,m:15,c:'Pièces'},
      {r:'FIL-AIR',n:'Filtre à air',p:420000,q:22,m:10,c:'Pièces'},
      {r:'PLQ-FR',n:'Plaquettes de frein',p:650000,q:4,m:6,c:'Pièces'},
      {r:'CIM-50',n:'Ciment 50 kg',p:95000,q:420,m:200,c:'Négoce'},
      {r:'TRA-TN',n:'Prestation transport / t',p:185000,q:0,m:0,c:'Service'},
      {r:'LUB-05',n:'Graisse 5 kg',p:210000,q:48,m:20,c:'Pièces'}
    ],
    docs:[], j:[],
    veh:[
      {id:'CAM-01',pl:'RC-4521-A',mo:'Howo 6x4',dr:'Mamadou Barry',km:182340,st:'En mission',ins:'2027-02-14',ct:'2026-11-20'},
      {id:'CAM-02',pl:'RC-1187-B',mo:'Sinotruk A7',dr:'Ibrahima Sow',km:96410,st:'Disponible',ins:'2026-11-12',ct:'2027-03-02'},
      {id:'CAM-03',pl:'RC-7742-C',mo:'Mercedes Actros',dr:'Sékou Camara',km:245900,st:'Maintenance',ins:'2027-01-30',ct:'2026-12-18'},
      {id:'CIT-01',pl:'RC-3320-A',mo:'Citerne 30 000 L',dr:'Aliou Bah',km:121870,st:'En mission',ins:'2027-04-09',ct:'2027-05-21'}
    ],
    mis:[
      {id:'MIS-101',a:'Conakry',b:'Kankan',v:'CAM-01',c:'Mining Corp Guinée',p:62,cost:7.2e6,rev:14.5e6},
      {id:'MIS-102',a:'Conakry',b:'Siguiri',v:'CIT-01',c:'Station Total Kaloum',p:35,cost:6.1e6,rev:11e6},
      {id:'MIS-103',a:'Kamsar',b:'Conakry',v:'CAM-02',c:'Bauxite Logistics',p:100,cost:3.4e6,rev:8.2e6}
    ],
    immo:[
      {id:'IM-01',n:'Camion Howo 6x4',d:'2023-03-12',c:485e6,dur:5,acc:'244'},
      {id:'IM-02',n:'Camion Sinotruk A7',d:'2024-06-01',c:390e6,dur:5,acc:'244'},
      {id:'IM-03',n:'Citerne 30 000 L',d:'2022-09-18',c:275e6,dur:7,acc:'244'},
      {id:'IM-04',n:'Entrepôt Kaloum',d:'2021-01-10',c:820e6,dur:20,acc:'213'},
      {id:'IM-05',n:'Serveurs et postes',d:'2025-02-04',c:28e6,dur:3,acc:'245'}
    ],
    emp:[
      {id:'E-01',n:'Aïssatou Diallo',p:'Responsable finance',s:8500000,d:'2022-04-01'},
      {id:'E-02',n:'Mamadou Barry',p:'Chauffeur poids lourd',s:4200000,d:'2021-09-12'},
      {id:'E-03',n:'Fatoumata Camara',p:'Gestionnaire stock',s:3800000,d:'2023-01-20'},
      {id:'E-04',n:'Ibrahima Sow',p:'Chauffeur',s:4000000,d:'2024-02-08'},
      {id:'E-05',n:'Sékou Touré',p:'Mécanicien',s:3600000,d:'2020-11-03'}
    ],
    pay:[],
    lettrage:[]
  };
  post('2026-01-01','OD','AN-0001','À nouveaux',[['521',450e6,0],['571',18e6,0],['585',6.5e6,0],['211',120e6,0],['213',820e6,0],['244',1150e6,0],['245',28e6,0],['281',0,410e6],['31',86e6,0],['101',0,2268.5e6]]);
  post('2026-10-05','AC','AC-0091','Achat gasoil — TotalEnergies',[['605',42e6,0],['4452',7.56e6,0],['401',0,49.56e6]]);
  post('2026-10-12','BQ','BQ-0188','Loyer entrepôt',[['613',6.5e6,0],['4452',1.17e6,0],['521',0,7.67e6]]);
  addDoc({type:'Facture',cl:'Mining Corp Guinée',d:'2026-10-02',ht:84e6,st:'Payée',rev:'706'});
  addDoc({type:'Facture',cl:'SOGUIPAMI Transport',d:'2026-10-14',ht:52.5e6,st:'Impayée',rev:'706'});
  addDoc({type:'Facture',cl:'Station Total Kaloum',d:'2026-09-20',ht:31e6,st:'Impayée',rev:'701'});
  addDoc({type:'Facture',cl:'Ets Diallo et Fils',d:'2026-10-21',ht:18.2e6,st:'Payée',rev:'701'});
  addDoc({type:'Facture',cl:'Bauxite Logistics',d:'2026-10-29',ht:96e6,st:'Impayée',rev:'706'});
  addDoc({type:'Devis',cl:'Mining Corp Guinée',d:T,ht:120e6,st:'Envoyé',rev:'706'});
  addDoc({type:'Commande',cl:'SOGUIPAMI Transport',d:T,ht:64e6,st:'En cours',rev:'706'});
  addDoc({type:'Bon de livraison',cl:'Station Total Kaloum',d:T,ht:9.4e6,st:'Livré',rev:'701'});
  addDoc({type:'Facture d’achat',cl:'TotalEnergies Guinée',d:'2026-10-18',ht:28e6,st:'À payer',chg:'605'});
  addDoc({type:'Facture d’achat',cl:'CFAO Equipment',d:'2026-10-08',ht:12.4e6,st:'Payée',chg:'622'});
  addDoc({type:'Avoir',cl:'Ets Diallo et Fils',d:'2026-10-25',ht:1.8e6,st:'Validé',rev:'701'});
  S.pay.push({id:'PA-2026-0010',m:'2026-10',tot:S.emp.reduce((s,e)=>s+e.s,0),st:'Comptabilisé'});
  post('2026-10-31','PA','PA-2026-0010','Paie octobre',[['661',S.emp.reduce((s,e)=>s+e.s,0),0],['421',0,S.emp.reduce((s,e)=>s+e.s,0)]]);
}

let persistTimer=0;
async function persist(){
  if(!S||!S.co) return;
  try{
    const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(S)});
    if(!r.ok) throw new Error('save');
  }catch(e){toast('Impossible d’enregistrer dans SQLite')}
}
const save=()=>{clearTimeout(persistTimer);persistTimer=setTimeout(persist,220)};
async function loadState(){
  try{
    const r=await fetch('/api/state');
    if(!r.ok) throw new Error('load');
    S=await r.json();
  }catch(e){seed()}
  if(!S||!S.co)seed();
}
const PLkeys=()=>Object.keys(PL).sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
const acOpts=sel=>PLkeys().map(k=>`<option value="${k}"${k===sel?' selected':''}>${k} — ${PL[k]}</option>`).join('');
const viewK=()=>{const h=(location.hash||'#home').slice(1); return V[h]?h:'home'};
const bal=a=>S.j.filter(x=>x.c==a).reduce((s,x)=>s+x.db-x.cr,0);
const bd=(t,k='')=>`<span class="b ${k}">${esc(t)}</span>`;
const dl=s=>Math.ceil((new Date(s+'T12:00:00')-new Date())/864e5);
const opt=(a,f)=>a.map(f).join('');
const v=i=>$('#'+i)?.value??'';
const totJ=()=>{const d=S.j.reduce((s,x)=>s+x.db,0),c=S.j.reduce((s,x)=>s+x.cr,0);return {d,c,ok:d===c}};
function tbl(h,rows){
  const r=rows.filter(x=>!q||x.join(' ').toLowerCase().includes(q));
  return `<div class="tw"><table><thead><tr>${h.map(x=>`<th class="${x[0]==='.'?'r':''}">${x.replace(/^\./,'')}</th>`).join('')}</tr></thead><tbody>${r.length?r.map(x=>`<tr>${x.map((c,i)=>`<td class="${String(h[i]||'')[0]==='.'?'r':''}">${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${h.length}">Aucun résultat</td></tr>`}</tbody></table></div>`;
}
const kp=(l,x,s)=>`<div class="card kpi"><small>${l}</small><b>${x}</b><span>${s}</span></div>`;
function alerts(){
  const a=[],im=S.docs.filter(d=>d.type==='Facture'&&d.st==='Impayée');
  if(im.length)a.push(['w',`${im.length} factures clients impayées · ${F(im.reduce((s,d)=>s+d.total,0))}`]);
  S.docs.filter(d=>d.type==='Facture d’achat'&&d.st==='À payer').forEach(d=>a.push(['w',`Fournisseur à régler : ${d.cl} · ${F(d.total)}`]));
  S.art.filter(x=>x.q<=x.m&&x.m>0).forEach(x=>a.push(['d',`Stock bas : ${x.n} (${x.q} restants, mini ${x.m})`]));
  S.veh.forEach(x=>[['ins','assurance'],['ct','visite technique']].forEach(([k,n])=>{const d=dl(x[k]);if(d<=45)a.push([d<=15?'d':'w',`${x.id} : ${n} ${d<0?'expirée':'dans '+d+' j'}`])}));
  const tj=totJ(); if(!tj.ok)a.push(['d','Journaux déséquilibrés']);
  return a;
}
const alh=()=>alerts().map(a=>`<div class="al">${bd(a[0]=='d'?'Urgent':'À suivre',a[0])}<span>${esc(a[1])}</span></div>`).join('')||'<div class="muted">Aucune alerte.</div>';
function amort(x){
  const start=new Date(x.d+'T12:00:00'), now=new Date(T+'T12:00:00');
  const years=Math.max(0,(now-start)/315576e5), ann=x.c/x.dur, cum=Math.min(x.c,ann*years);
  return {ann,cum,net:x.c-cum,rest:Math.max(0,x.dur-years)};
}
const caHT=()=>S.docs.filter(d=>d.type==='Facture').reduce((s,d)=>s+d.ht,0);
const creances=()=>S.docs.filter(d=>d.type==='Facture'&&d.st==='Impayée').reduce((s,d)=>s+d.total,0);
const treso=()=>['521','571','585'].reduce((s,a)=>s+bal(a),0);

function tile(ic,bg,t,s,a,v='',k=''){return `<button class="tile" data-a="${a}" data-v="${v}" data-t="${k}"><i style="background:${bg};color:#fff">${ic}</i><span><b>${t}</b><em>${s}</em></span></button>`}
function appc(ic,bg,t,s,h){return `<button class="appc" data-a="go" data-v="${h}"><i style="background:${bg}">${ic}</i><b>${t}</b><span>${s}</span></button>`}
const SG={
  ring:'<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="12.5" stroke="#fff" stroke-width="7"/><circle cx="24" cy="24" r="5.2" stroke="#fff" stroke-width="2"/><path d="M24 10.5v8M24 29.5v8M10.5 24h8M29.5 24h8" stroke="#fff" stroke-width="3.2" stroke-linecap="butt"/></svg>',
  info:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><rect x="14" y="8" width="20" height="32" rx="3"/><circle cx="24" cy="16" r="1.6" fill="#fff" stroke="none"/><path d="M24 22v12"/></svg>',
  book:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><path d="M12 12h10v26H14a2 2 0 0 1-2-2V12z"/><path d="M26 12h10v24a2 2 0 0 1-2 2H26V12z"/><path d="M24 12v26"/></svg>',
  search:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><circle cx="22" cy="22" r="10"/><path d="M30 30l8 8"/></svg>',
  books:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><path d="M10 14h8v24H12a2 2 0 0 1-2-2V14z"/><path d="M20 10h8v28h-6a2 2 0 0 1-2-2V10z"/><path d="M30 16h8v22a2 2 0 0 1-2 2h-6V16z"/></svg>',
  send:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><rect x="10" y="14" width="28" height="22" rx="2"/><path d="M10 18l14 10L38 18"/><path d="M34 10l6 4-4 2"/></svg>',
  globe:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><circle cx="24" cy="24" r="14"/><path d="M10 24h28M24 10c4 5 6 9 6 14s-2 9-6 14c-4-5-6-9-6-14s2-9 6-14z"/></svg>',
  cloud:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><path d="M16 32h18a8 8 0 0 0 1-16 10 10 0 0 0-19-3A7 7 0 0 0 16 32z"/></svg>',
  people:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><circle cx="18" cy="16" r="5"/><path d="M8 34v-2a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8v2"/><circle cx="32" cy="18" r="4"/><path d="M30 34v-1.5a6 6 0 0 1 4-5.6"/></svg>',
  folder:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><path d="M10 16h10l3 3h15v17H10V16z"/></svg>',
  logo:'<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="14" fill="#fff"/><text x="24" y="29" text-anchor="middle" font-size="16" font-weight="800" fill="#00a651">▲</text></svg>',
  legal:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"><path d="M24 8v28M14 38h20"/><path d="M24 14H12l4 12H8z"/><path d="M24 14h12l-4 12h8z"/></svg>',
  cal:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><rect x="10" y="12" width="28" height="26" rx="2"/><path d="M10 20h28M18 8v8M30 8v8M18 28h2M24 28h2M30 28h2M18 34h2M24 34h2"/></svg>',
  portal:'<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6"><path d="M8 36h32M12 36V20l12-10 12 10v16"/><rect x="21" y="26" width="6" height="10"/></svg>'
};
function sgt(ic,title,a,v='',k=''){
  const icn=ic==='logo'?`<img src="/static/img/logo.jpg" alt="">`:(SG[ic]||'');
  return `<button class="sg${ic==='logo'?' sg-brand':''}" data-a="${a}" data-v="${v||''}" data-t="${k||''}"><span class="sg-ic">${icn}</span><span>${title}</span></button>`;
}
function intuiHead(){
  const tt=['Accueil','Favoris','Indicateurs','Connect'];
  return `<div class="intui-head"><div class="intui-brand"><img src="/static/img/logo.jpg" alt="Fastlane Logistic"><span class="wm"><span><b>FAST</b><i>LANE</i></span><small>GESTION</small></span></div><div class="intui-tabs">${tt.map(x=>`<a tabindex="0" class="${x===tab.home?'on':''}" data-a="tb" data-k="home" data-v="${x}">${x}</a>`).join('')}</div></div>`;
}

V.home=()=>{
  const fa=S.docs.filter(d=>d.type==='Facture');
  const head=intuiHead();
  if(tab.home==='Indicateurs') return `<div class="intui">${head}
    <div class="intui-kpis">${kp('Chiffre d’affaires HT',MM(caHT())+' GNF',fa.length+' factures')}${kp('Trésorerie',MM(treso())+' GNF','Banque, caisse, mobile money')}${kp('Créances',MM(creances())+' GNF','à encaisser')}${kp('Alertes',alerts().length,'à traiter aujourd’hui')}</div>
    <div class="intui-sec"><h3>Pilotage</h3><div class="intui-grid">${sgt('logo','Tableau de bord','go','dash')}${sgt('legal','Balance','go','acc','Balance')}${sgt('book','Grand livre','go','etats','Grand livre')}${sgt('cal','États financiers','go','etats')}</div></div>
    <div class="intui-panel"><h3 style="margin-top:0">Alertes et contrôles</h3>${alh()}</div></div>`;
  if(tab.home==='Favoris') return `<div class="intui">${head}<div class="intui-sec"><h3>Favoris</h3><div class="intui-grid">
    ${sgt('send','Nouvelle facture','inv')}${sgt('info','Saisie d’écritures','go','acc')}${sgt('people','Tiers','go','tiers')}${sgt('folder','Documents','go','sales')}${sgt('cloud','Trésorerie','go','tre')}${sgt('portal','Flotte','go','fleet')}</div></div></div>`;
  if(tab.home==='Connect') return `<div class="intui">${head}<div class="intui-sec"><h3>Connect</h3><div class="intui-grid">
    ${sgt('cloud','Données en mobilité','go','tre')}${sgt('globe','Factures dématérialisées','go','sales')}${sgt('send','Sauvegarder SQLite','sv')}${sgt('people','Relation clients','go','tiers')}</div></div></div>`;
  return `<div class="intui">${head}
    <div class="intui-sec"><h3>Démarrer</h3><div class="intui-grid">
      ${sgt('ring','Guide Fastlane','help')}${sgt('ring','Tutoriel','tuto')}${sgt('info','Nouveautés de la version','news')}${sgt('book','Manuel de référence','go','acc','Plan comptable')}${sgt('search','Base de connaissances','go','acc','Journal')}${sgt('books','Bibliothèques','go','etats')}
    </div></div>
    <div class="intui-sec"><h3>Gagner en efficacité</h3><div class="intui-grid">
      ${sgt('send','Déclaration','go','etats')}${sgt('globe','Factures dématérialisées','go','sales')}${sgt('cloud','Données en mobilité','go','tre')}${sgt('people','Relation Clients','go','tiers')}${sgt('folder','Documents électroniques','inv')}
    </div></div>
    <div class="intui-sec"><h3>Actualités</h3><div class="intui-grid">
      ${sgt('logo','Fastlane','go','dash')}${sgt('legal','Légal','go','acc','Balance')}${sgt('cal','Agenda fiscal','go','etats')}${sgt('portal','Portail','go','set')}
    </div></div>
  </div>`;
};

V.dash=()=>{
  const fa=S.docs.filter(d=>d.type==='Facture'), ca=caHT(), cr=creances();
  const mr=S.mis.reduce((s,m)=>s+m.rev,0), mc=S.mis.reduce((s,m)=>s+m.cost,0);
  const rv=[310,355,298,402,447,ca/1e6], ch=[220,248,231,276,301,ca*.62/1e6], mx=Math.max(...rv,...ch);
  const mo=['Juin','Juil','Août','Sept','Oct','Nov'];
  const svgC=`<svg viewBox="0 0 520 230" width="100%" role="img" aria-label="Produits et charges">${mo.map((m,i)=>{const x=24+i*83,a=rv[i]/mx*168,b=ch[i]/mx*168;return `<rect x="${x}" y="${188-a}" width="26" height="${a}" rx="6" fill="var(--br)"/><rect x="${x+30}" y="${188-b}" width="26" height="${b}" rx="6" fill="var(--wa)"/><text x="${x+28}" y="214" text-anchor="middle" fill="var(--mut)" font-size="12">${m}</text>`}).join('')}</svg>`;
  const D=[['Carburant',38,'#0b2f6b'],['Salaires',24,'#d51e2a'],['Maintenance',16,'#3b82c4'],['Loyers',10,'#c57a00'],['Autres',12,'#8a93a3']];
  let c=0; const cg=D.map(x=>{const s=`${x[2]} ${c}% ${c+x[1]}%`;c+=x[1];return s}).join(',');
  const tc={}; fa.forEach(d=>tc[d.cl]=(tc[d.cl]||0)+d.ht); const top=Object.entries(tc).sort((a,b)=>b[1]-a[1]);
  return `<div class="grid g4">${kp('CA HT',MM(ca)+' GNF','cumul factures')}${kp('Créances',MM(cr)+' GNF','clients')}${kp('Trésorerie',MM(treso())+' GNF','tous comptes 5')}${kp('Marge missions',mr?Math.round((mr-mc)/mr*100)+' %':'—',MM(mr-mc)+' GNF')}</div>
  <div class="grid g2"><div class="card"><h3>Produits et charges (millions GNF)</h3>${svgC}<div class="gap" style="margin-top:8px"><span style="color:var(--br)">■ Produits</span><span style="color:var(--wa)">■ Charges</span></div></div>
  <div class="card"><h3>Répartition des charges</h3><div class="gap"><div class="dn" style="background:conic-gradient(${cg})"></div><div>${D.map(x=>`<div style="margin:6px 0"><span style="color:${x[2]}">■</span> ${x[0]} <b>${x[1]} %</b></div>`).join('')}</div></div></div></div>
  <div class="grid g2"><div class="card"><h3>Meilleurs clients</h3>${tbl(['Client','.CA HT','.Part'],top.map(x=>[esc(x[0]),F(x[1]),Math.round(x[1]/ca*100)+' %']))}</div><div class="card"><h3>Alertes</h3>${alh()}</div></div>`;
};

function docsOf(types, tabKey){
  const tt=['Tous',...types];
  const r=S.docs.filter(d=>types.includes(d.type)&& (tab[tabKey]==='Tous'||d.type===tab[tabKey])).slice().reverse();
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs">${tt.map(x=>`<a class="${x===tab[tabKey]?'on':''}" data-a="tb" data-k="${tabKey}" data-v="${x}">${x}</a>`).join('')}</div><button class="btn" data-a="${tabKey==='sales'?'inv':'ap'}">Nouveau document</button></div>
  <div class="card">${tbl(['N°','Type','Tiers','Date','.HT','.TTC','Statut','Actions'],r.map(d=>[esc(d.id),d.type,esc(d.cl),FR(d.d),F(d.ht),F(d.total),stBadge(d),docActs(d)]))}</div>`;
}
function stBadge(d){
  const k=d.st==='Impayée'||d.st==='À payer'||d.st==='Bloqué'?'d':['Payée','Livré','Comptabilisé','Validé'].includes(d.st)?'':(d.st==='Envoyé'||d.st==='En cours'?'w':'i');
  return bd(d.st,k);
}
function docActs(d){
  let s=`<button class="btn s g" data-a="vd" data-v="${d.id}">Voir</button> `;
  if(d.type==='Devis'&&d.st!=='Facturé')s+=`<button class="btn s" data-a="fac" data-v="${d.id}">Facturer</button> `;
  if(d.st==='Impayée')s+=`<button class="btn s" data-a="pay" data-v="${d.id}">Encaisser</button> <button class="btn s g" data-a="rel" data-v="${d.id}">Relancer</button>`;
  if(d.st==='À payer')s+=`<button class="btn s" data-a="pf" data-v="${d.id}">Régler</button>`;
  return s;
}
V.sales=()=>docsOf(['Devis','Commande','Bon de livraison','Facture','Avoir'],'sales');
V.purch=()=>docsOf(['Commande d’achat','Facture d’achat'],'purch');

V.tiers=()=>{
  const clients=S.cl.map(n=>{const docs=S.docs.filter(d=>d.cl===n&&d.type==='Facture'); const ca=docs.reduce((s,d)=>s+d.ht,0); const due=docs.filter(d=>d.st==='Impayée').reduce((s,d)=>s+d.total,0); return {n,ca,due,nb:docs.length}});
  const fourn=S.fr.map(n=>{const docs=S.docs.filter(d=>d.cl===n&&d.type==='Facture d’achat'); const ca=docs.reduce((s,d)=>s+d.ht,0); const due=docs.filter(d=>d.st==='À payer').reduce((s,d)=>s+d.total,0); return {n,ca,due,nb:docs.length}});
  const list=tab.tiers==='Clients'?clients:fourn;
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs"><a class="${tab.tiers==='Clients'?'on':''}" data-a="tb" data-k="tiers" data-v="Clients">Clients</a><a class="${tab.tiers==='Fournisseurs'?'on':''}" data-a="tb" data-k="tiers" data-v="Fournisseurs">Fournisseurs</a></div><button class="btn" data-a="nt">Nouveau tiers</button></div>
  <div class="grid g3">${kp(tab.tiers,list.length,'fiches')}${kp('Volume HT',MM(list.reduce((s,x)=>s+x.ca,0))+' GNF','cumul')}${kp('Encours',MM(list.reduce((s,x)=>s+x.due,0))+' GNF','non soldé')}</div>
  <div class="card">${tbl(['Raison sociale','Pièces','.Volume HT','.Encours','Situation'],list.map(x=>[esc(x.n),x.nb,F(x.ca),F(x.due),x.due?bd('Ouvert','w'):bd('Soldé')]))}</div>`;
};

V.stock=()=>`<div class="grid g3">${kp('Valeur du stock',MM(S.art.reduce((s,x)=>s+x.p*x.q,0))+' GNF','au prix de vente')}${kp('Références',S.art.length,'catalogue')}${kp('Sous le minimum',S.art.filter(x=>x.q<=x.m&&x.m>0).length,'à réapprovisionner')}</div>
<div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn" data-a="na">Nouvel article</button></div>
<div class="card">${tbl(['Réf.','Article','Famille','.Prix','Stock','Mini','.Valeur','État','Mouvement'],S.art.map(x=>[esc(x.r),esc(x.n),x.c,F(x.p),`<div class="bar"><i style="width:${Math.min(100,x.m?x.q/(x.m*3)*100:50)}%"></i></div> ${x.q}`,x.m,F(x.p*x.q),x.m&&x.q<=x.m?bd('À commander','d'):bd('Correct'),`<button class="btn s g" data-a="mv" data-v="${x.r}" data-n="10">+10</button> <button class="btn s g" data-a="mv" data-v="${x.r}" data-n="-10">−10</button>`]))}</div>`;

V.acc=()=>{
  const tt=['Saisie','Journal','Balance','Plan comptable','Lettrage'];
  const h=`<div class="tabs">${tt.map(x=>`<a class="${x===tab.acc?'on':''}" data-a="tb" data-k="acc" data-v="${x}">${x}</a>`).join('')}</div>`;
  if(tab.acc==='Plan comptable') return h+`<div class="card">${tbl(['Compte','Intitulé','Classe','.Solde'],PLkeys().map(k=>[k,PL[k],'Classe '+k[0],F(bal(k))]))}</div>`;
  if(tab.acc==='Balance'){
    const cs=[...new Set(S.j.map(x=>x.c))].sort();
    const R=cs.map(c=>{const d=S.j.filter(x=>x.c==c).reduce((s,x)=>s+x.db,0),k=S.j.filter(x=>x.c==c).reduce((s,x)=>s+x.cr,0);return [c,PL[c]||'',d,k]});
    const td=R.reduce((s,r)=>s+r[2],0), tk=R.reduce((s,r)=>s+r[3],0);
    return h+`<div class="card"><h3>Balance générale — exercice ${S.co.ex}</h3>${tbl(['Compte','Intitulé','.Débit','.Crédit','.Solde'],R.map(r=>[r[0],esc(r[1]),F(r[2]),F(r[3]),F(r[2]-r[3])]).concat([['<b>Total</b>','',`<b>${F(td)}</b>`,`<b>${F(tk)}</b>`,td===tk?bd('Équilibrée'):bd('Écart','d')]]))}</div>`;
  }
  if(tab.acc==='Lettrage'){
    const ouverts=S.docs.filter(d=>d.st==='Impayée'||d.st==='À payer');
    return h+`<div class="card"><h3>Écritures non lettrées</h3>${tbl(['Pièce','Tiers','Date','.Montant','Statut','Action'],ouverts.map(d=>[esc(d.id),esc(d.cl),FR(d.d),F(d.total),stBadge(d),d.type==='Facture'?`<button class="btn s" data-a="pay" data-v="${d.id}">Lettrer encaissement</button>`:`<button class="btn s" data-a="pf" data-v="${d.id}">Lettrer règlement</button>`]))}</div>`;
  }
  if(tab.acc==='Journal'){
    const L=S.j.slice().reverse(), tj=totJ();
    return h+`<div class="card">${tbl(['Date','Jnl','Pièce','Compte','Libellé','.Débit','.Crédit'],L.map(x=>[FR(x.d),x.j+' · '+(JOU[x.j]||''),esc(x.p),x.c+' '+(PL[x.c]||''),esc(x.l),x.db?F(x.db):'',x.cr?F(x.cr):'']))}<p class="eq ${tj.ok?'ok':'no'}">Total débit ${F(tj.d)} · total crédit ${F(tj.c)} · ${tj.ok?'Équilibré':'Écart'}</p></div>`;
  }
  return h+`<div class="card" style="margin-bottom:16px"><h3>Saisie d’une écriture</h3>
    <div class="row"><label>Date<input id="jd" type="date" value="${T}"></label><label>Journal<select id="jj">${Object.keys(JOU).map(k=>`<option value="${k}">${k} — ${JOU[k]}</option>`).join('')}</select></label><label>Pièce<input id="jp" placeholder="OD-00xx"></label><label>Libellé général<input id="jl" placeholder="Ex. Achat pneus Howo"></label></div>
    <div class="tw" style="margin-top:12px"><table class="entry"><thead><tr><th>Compte</th><th>Libellé ligne</th><th class="r">Débit</th><th class="r">Crédit</th></tr></thead>
    <tbody><tr><td><select id="c1">${acOpts('411')}</select></td><td><input id="l1" placeholder="Libellé"></td><td><input id="d1" type="number" min="0" placeholder="0"></td><td><input id="r1" type="number" min="0" placeholder="0"></td></tr>
    <tr><td><select id="c2">${acOpts('701')}</select></td><td><input id="l2" placeholder="Libellé"></td><td><input id="d2" type="number" min="0" placeholder="0"></td><td><input id="r2" type="number" min="0" placeholder="0"></td></tr>
    <tr><td><select id="c3">${acOpts('4431')}</select></td><td><input id="l3" placeholder="3e ligne optionnelle"></td><td><input id="d3" type="number" min="0" placeholder="0"></td><td><input id="r3" type="number" min="0" placeholder="0"></td></tr></tbody></table></div>
    <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-a="jn">Valider l’écriture</button></div></div>
    <div class="card"><h3>Dernières écritures</h3>${tbl(['Date','Jnl','Pièce','Compte','.Débit','.Crédit'],S.j.slice(-12).reverse().map(x=>[FR(x.d),x.j,esc(x.p),x.c+' '+(PL[x.c]||''),x.db?F(x.db):'',x.cr?F(x.cr):'']))}</div>`;
};

function classe(pref){return S.j.filter(x=>pref.split('|').some(p=>x.c.startsWith(p)))}
function sumC(pref, side){return classe(pref).reduce((s,x)=>s+(side==='d'?x.db-x.cr:x.cr-x.db),0)}

V.etats=()=>{
  const tt=['Bilan','Compte de résultat','Grand livre'];
  const h=`<div class="tabs">${tt.map(x=>`<a class="${x===tab.etats?'on':''}" data-a="tb" data-k="etats" data-v="${x}">${x}</a>`).join('')}</div>`;
  if(tab.etats==='Grand livre'){
    const cs=[...new Set(S.j.map(x=>x.c))].sort();
    return h+cs.map(c=>{const L=S.j.filter(x=>x.c===c); let s=0; const rows=L.map(x=>{s+=x.db-x.cr;return [FR(x.d),esc(x.p),esc(x.l),F(x.db||0),F(x.cr||0),F(s)]});
      return `<div class="card" style="margin-bottom:12px"><h3>${c} — ${esc(PL[c]||'')}</h3>${tbl(['Date','Pièce','Libellé','.Débit','.Crédit','.Solde'],rows)}</div>`}).join('');
  }
  if(tab.etats==='Compte de résultat'){
    const chg=[['601','Achats marchandises'],['604','Matières'],['605','Autres achats'],['613','Locations'],['622','Entretien'],['624','Transports'],['661','Salaires'],['664','Charges sociales'],['681','Dotations']];
    const prd=[['701','Ventes marchandises'],['706','Services vendus'],['707','Produits accessoires']];
    const tc=chg.reduce((s,x)=>s+Math.max(0,-bal(x[0])? -bal(x[0]): (bal(x[0])<0?-bal(x[0]): (S.j.filter(j=>j.c==x[0]).reduce((a,j)=>a+j.db-j.cr,0)))),0);
    const charges=chg.map(x=>{const s=S.j.filter(j=>j.c==x[0]).reduce((a,j)=>a+j.db-j.cr,0);return [x[0],x[1],s]});
    const produits=prd.map(x=>{const s=S.j.filter(j=>j.c==x[0]).reduce((a,j)=>a+j.cr-j.db,0);return [x[0],x[1],s]});
    const tch=charges.reduce((s,x)=>s+x[2],0), tpr=produits.reduce((s,x)=>s+x[2],0);
    return h+`<div class="grid g2"><div class="card"><h3>Charges</h3>${tbl(['Cpt','Intitulé','.Montant'],charges.filter(x=>x[2]).map(x=>[x[0],x[1],F(x[2])]).concat([['','<b>Total charges</b>',`<b>${F(tch)}</b>`]]))}</div>
    <div class="card"><h3>Produits</h3>${tbl(['Cpt','Intitulé','.Montant'],produits.filter(x=>x[2]).map(x=>[x[0],x[1],F(x[2])]).concat([['','<b>Total produits</b>',`<b>${F(tpr)}</b>`]]))}</div></div>
    <div class="card">${kp('Résultat net',F(tpr-tch),tpr>=tch?'Bénéfice d’exercice':'Perte d’exercice')}</div>`;
  }
  const sc=c=>S.j.filter(j=>j.c==c).reduce((a,j)=>a+j.cr-j.db,0);
  const sd=c=>S.j.filter(j=>j.c==c).reduce((a,j)=>a+j.db-j.cr,0);
  const netImmo=['211','213','244','245'].reduce((s,a)=>s+Math.max(0,sd(a)),0)-Math.max(0,sc('281'));
  const tch2=['601','604','605','613','622','624','661','664','681'].reduce((s,c)=>s+Math.max(0,sd(c)),0);
  const tpr2=['701','706','707'].reduce((s,c)=>s+Math.max(0,sc(c)),0);
  const actifR=[['Immobilisations nettes',netImmo],['Stocks',Math.max(0,sd('31'))],['Créances clients',Math.max(0,sd('411'))],['TVA récupérable',Math.max(0,sd('4452'))],['Trésorerie',treso()]];
  const passR=[['Capital',Math.max(0,sc('101'))],['Résultat',tpr2-tch2],['Fournisseurs',Math.max(0,sc('401'))],['TVA due',Math.max(0,sc('4431'))],['Personnel à payer',Math.max(0,sc('421'))]];
  const ta=actifR.reduce((s,x)=>s+x[1],0), tp=passR.reduce((s,x)=>s+x[1],0);
  return h+`<div class="grid g2"><div class="card"><h3>Actif</h3>${tbl(['Poste','.Montant'],actifR.map(x=>[x[0],F(x[1])]).concat([['<b>Total actif</b>',`<b>${F(ta)}</b>`]]))}</div>
  <div class="card"><h3>Passif</h3>${tbl(['Poste','.Montant'],passR.map(x=>[x[0],F(x[1])]).concat([['<b>Total passif</b>',`<b>${F(tp)}</b>`]]))}</div></div>
  <div class="card"><div class="eq ${Math.abs(ta-tp)<2?'ok':'no'}">${Math.abs(ta-tp)<2?'Bilan équilibré':'Écart de bilan : '+F(ta-tp)}</div></div>`;
};

V.tre=()=>{
  const fi=S.docs.filter(d=>d.type==='Facture'&&d.st==='Impayée'), ag=[0,0,0];
  fi.forEach(d=>{const n=-dl(d.d); ag[n<=30?0:n<=60?1:2]+=d.total});
  const mv=S.j.filter(x=>['521','571','585'].includes(x.c)).slice(-10).reverse();
  const fp=S.docs.filter(d=>d.type==='Facture d’achat'&&d.st==='À payer');
  return `<div class="grid g3">${[['521','Banque'],['571','Caisse'],['585','Mobile money']].map(a=>kp(a[1],MM(bal(a[0]))+' GNF','compte '+a[0])).join('')}</div>
  <div class="grid g2"><div class="card"><h3>Derniers mouvements de trésorerie</h3>${tbl(['Date','Pièce','Libellé','Compte','.Montant'],mv.map(x=>[FR(x.d),esc(x.p),esc(x.l),PL[x.c]||x.c,x.db?'+ '+F(x.db):'− '+F(x.cr)]))}</div>
  <div class="card"><h3>Créances par ancienneté</h3>${['0 à 30 jours','31 à 60 jours','Plus de 60 jours'].map((l,i)=>`<div class="al"><span style="flex:1">${l}</span><b>${MM(ag[i])} GNF</b></div>`).join('')}<h3 style="margin-top:16px">Fournisseurs à payer</h3>${fp.length?fp.map(d=>`<div class="al"><span style="flex:1">${esc(d.cl)}</span><b>${F(d.total)}</b> <button class="btn s" data-a="pf" data-v="${d.id}">Régler</button></div>`).join(''):'<div class="muted">Aucun.</div>'}</div></div>
  <div class="card"><h3>Encaissement rapide</h3><div class="row"><label>Facture<select id="tf">${opt(fi,d=>`<option value="${d.id}">${d.id} — ${d.cl} — ${F(d.total)}</option>`)||'<option>Aucune impayée</option>'}</select></label><label>Compte<select id="tc"><option value="521">521 Banque</option><option value="571">571 Caisse</option><option value="585">585 Mobile money</option></select></label><button class="btn" data-a="px">Encaisser</button></div></div>`;
};

V.immo=()=>{
  const rows=S.immo.map(x=>{const a=amort(x);return [esc(x.id),esc(x.n),FR(x.d),x.acc,x.dur+' ans',F(x.c),F(a.ann),F(a.cum),F(a.net)]});
  const brut=S.immo.reduce((s,x)=>s+x.c,0), cum=S.immo.reduce((s,x)=>s+amort(x).cum,0);
  return `<div class="grid g3">${kp('Valeur brute',MM(brut)+' GNF',S.immo.length+' biens')}${kp('Amortissements',MM(cum)+' GNF','cumul linéaire')}${kp('Valeur nette',MM(brut-cum)+' GNF','comptable')}</div>
  <div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn g" data-a="dot">Comptabiliser la dotation du mois</button><button class="btn" data-a="ni">Nouvelle immobilisation</button></div>
  <div class="card">${tbl(['N°','Désignation','Mise en service','Cpt','Durée','.Brut','.Dot. annuelle','.Cumul','.VNC'],rows)}</div>`;
};

V.paye=()=>{
  const mass=S.emp.reduce((s,e)=>s+e.s,0);
  return `<div class="grid g3">${kp('Effectif',S.emp.length,'salariés')}${kp('Masse salariale',MM(mass)+' GNF','brut mensuel')}${kp('Dernière paie',S.pay.at(-1)?.m||'—',S.pay.at(-1)?.st||'')}</div>
  <div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn" data-a="np">Générer la paie du mois</button></div>
  <div class="grid g2"><div class="card"><h3>Salariés</h3>${tbl(['Matricule','Nom','Poste','.Salaire brut','Entrée'],S.emp.map(e=>[e.id,esc(e.n),esc(e.p),F(e.s),FR(e.d)]))}</div>
  <div class="card"><h3>Bulletins</h3>${tbl(['N°','Période','.Montant','Statut'],S.pay.slice().reverse().map(p=>[p.id,p.m,F(p.tot),bd(p.st)]))}</div></div>`;
};

V.fleet=()=>`<div class="row" style="justify-content:space-between;margin-bottom:12px"><h3 style="margin:0">Parc de ${S.veh.length} véhicules</h3><button class="btn" data-a="nm">Nouvelle mission</button></div>
<div class="vc" style="margin-bottom:16px">${S.veh.map(x=>`<div class="card"><div class="gap"><b>${esc(x.id)}</b>${bd(x.st,x.st==='Maintenance'?'w':x.st==='Disponible'?'':'i')}</div><div class="muted">${esc(x.mo)} · ${esc(x.pl)}</div><div>Chauffeur : ${esc(x.dr)}</div><div>${x.km.toLocaleString('fr-FR')} km</div>${[['ins','Assurance'],['ct','Visite technique']].map(([k,n])=>{const d=dl(x[k]);return `<div>${n} : ${bd(d<0?'expirée':d+' j',d<=15?'d':d<=45?'w':'')}</div>`}).join('')}</div>`).join('')}</div>
<div class="card"><h3>Missions</h3>${tbl(['N°','Trajet','Véhicule','Client','Avancement','.Coût','.Recette','.Marge','Action'],S.mis.map(m=>[m.id,esc(m.a+' → '+m.b),m.v,esc(m.c),`<div class="bar"><i style="width:${m.p}%"></i></div> ${m.p>=100?'Livrée':m.p+' %'}`,F(m.cost),F(m.rev),F(m.rev-m.cost),m.p<100?`<button class="btn s" data-a="adv" data-v="${m.id}">Avancer +25 %</button>`:bd('Terminée')]))}</div>`;

V.set=()=>`<div class="grid g2"><div class="card"><h3>Société</h3>
  <div class="row"><label>Raison sociale<input id="cn" value="${esc(S.co.name)}"></label><label>Ville<input id="cc" value="${esc(S.co.city)}"></label><label>NIF<input id="nif" value="${esc(S.co.nif)}"></label><label>RCCM<input id="rccm" value="${esc(S.co.rccm)}"></label><label>Téléphone<input id="tel" value="${esc(S.co.tel)}"></label><label>E-mail<input id="em" value="${esc(S.co.mail)}"></label><label>TVA<select id="tva"><option value="0.18" ${S.co.tva==.18?'selected':''}>18 % (Guinée)</option><option value="0.20" ${S.co.tva==.2?'selected':''}>20 %</option><option value="0" ${S.co.tva==0?'selected':''}>Exonéré</option></select></label></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="sc">Enregistrer</button><button class="btn g" data-a="rs">Réinitialiser les données démo</button></div></div>
  <div class="card"><h3>Journaux</h3>${tbl(['Code','Intitulé'],Object.entries(JOU).map(([k,v])=>[k,v]))}<h3 style="margin-top:16px">Modèle comptable</h3><p>Plan SYSCOHADA, TVA ${S.co.tva*100} %, exercice ${S.co.ex}. Les modules Essentiel, Standard, Comptabilité, Commerciale, Stocks, Trésorerie, Immobilisations, Paie et Flotte sont regroupés dans cette application — là où Sage les sépare en Sage 30, 50, 100 et X3.</p></div></div>`;

function fld(b){return String(b).replace(/<label(\b[^>]*)>([\s\S]*?)(<(?:input|select|textarea)\b)/gi,(_,attrs,cap,tag)=>`<label${attrs}><span>${cap.trim()}</span>${tag}`)}
function modal(t,b,f,wide){okFn=f;$('#m').innerHTML=`<div class="mb${wide?' wide':''}"><h3>${t}</h3><div class="mbody">${fld(b)}</div><div class="acts"><button type="button" class="btn g" data-a="x">Annuler</button><button type="button" class="btn" data-a="ok">Valider</button></div></div>`;$('#m').classList.add('o'); const first=$('#m input,#m select,#m textarea'); if(first) setTimeout(()=>first.focus(),30)}
function toast(s){const t=$('#t');t.textContent=s;t.classList.add('o');setTimeout(()=>t.classList.remove('o'),2400)}
const partyName=x=>typeof x==='string'?x:(x&&x.n)||'';
const cop=()=>opt(S.cl,c=>`<option>${esc(partyName(c))}</option>`);
const fop=()=>opt(S.fr,c=>`<option>${esc(partyName(c))}</option>`);

const MENUS={
  Fichier:[
    {l:'Nouveau',a:'add',k:'Ctrl+N'},
    {l:'Enregistrer',a:'sv',k:'Ctrl+S'},
    {l:'Imprimer',a:'pr',k:'Ctrl+P'},
    0,
    {l:'Réinitialiser la démo',a:'rs'}
  ],
  Edition:[
    {l:'Rechercher',a:'focusq',k:'/'},
    {l:'Nouveau tiers',a:'nt'},
    {l:'Nouvel article',a:'na'},
    {l:'Nouvelle immobilisation',a:'ni'}
  ],
  Structure:[
    {l:'Plan comptable',a:'go',v:'acc',t:'Plan comptable'},
    {l:'Nouveau compte général',a:'nc'},
    {l:'Tiers',a:'go',v:'tiers'},
    {l:'Articles / stocks',a:'go',v:'stock'},
    {l:'Journaux',a:'go',v:'acc',t:'Journal'},
    {l:'Paramètres société',a:'go',v:'set'}
  ],
  Traitement:[
    {l:'Saisie des écritures',a:'piece'},
    {l:'Nouvelle facture',a:'inv'},
    {l:'Facture d’achat',a:'ap'},
    {l:'Lettrage',a:'go',v:'acc',t:'Lettrage'},
    0,
    {l:'Dotation du mois',a:'dot'},
    {l:'Paie du mois',a:'np'}
  ],
  Etat:[
    {l:'Bilan',a:'go',v:'etats',t:'Bilan'},
    {l:'Compte de résultat',a:'go',v:'etats',t:'Compte de résultat'},
    {l:'Grand livre',a:'go',v:'etats',t:'Grand livre'},
    {l:'Balance générale',a:'go',v:'acc',t:'Balance'}
  ],
  'Fenêtre':[
    {l:'Accueil Fastlane',a:'go',v:'home'},
    {l:'Tableau de bord',a:'go',v:'dash'},
    {l:'Ventes',a:'go',v:'sales'},
    {l:'Achats',a:'go',v:'purch'},
    {l:'Comptabilité',a:'go',v:'acc'},
    {l:'Trésorerie',a:'go',v:'tre'},
    {l:'Flotte',a:'go',v:'fleet'}
  ]
};
function closeMenu(){
  const dd=$('#dd');
  if(dd){dd.hidden=true; dd.innerHTML=''; delete dd.dataset.v}
  document.querySelectorAll('.menubar button.on').forEach(b=>b.classList.remove('on'));
}
function openMenu(name, btn){
  const dd=$('#dd'); if(!dd||!btn) return;
  if(!dd.hidden && dd.dataset.v===name){ closeMenu(); return; }
  const items=MENUS[name]||[];
  dd.innerHTML=items.map(it=>{
    if(!it) return '<div class="sep"></div>';
    const k=it.k?`<kbd>${it.k}</kbd>`:'';
    return `<button type="button" data-a="${it.a}" data-v="${it.v||''}" data-t="${it.t||''}">${esc(it.l)}${k}</button>`;
  }).join('');
  const r=btn.getBoundingClientRect();
  dd.style.left=Math.max(8, r.left)+'px';
  dd.style.top=(r.bottom)+'px';
  dd.hidden=false;
  dd.dataset.v=name;
  document.querySelectorAll('.menubar button.on').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const first=dd.querySelector('button'); if(first) first.focus();
}

A.x=()=>{closeMenu(); okFn=null; const m=$('#m'); if(m) m.classList.remove('o')};
A.ok=async()=>{
  try{
    if(okFn){
      const r=okFn();
      if(r && typeof r.then==='function'){
        const v=await r;
        if(v===false) return;
      }else if(r===false) return;
    }
    A.x();
  }catch(err){ toast('Saisie invalide') }
};
function pickNav(view, t){
  const items=NAV.flatMap(g=>g[1]);
  const hit=(t&&items.find(n=>n[0]===view&&n[4]===t&&n[3]==='go'))
    ||(t&&items.find(n=>n[0]===view&&n[4]===t))
    ||items.find(n=>n[0]===view&&n[3]==='go'&&!n[4])
    ||items.find(n=>n[0]===view);
  if(hit) navSel=hit[5]||hit[0];
}
A.go=d=>{
  const dest=d.v||'home';
  if(d.t){
    if(['Saisie','Journal','Balance','Plan comptable','Lettrage'].includes(d.t)) tab.acc=d.t;
    if(['Bilan','Compte de résultat','Grand livre'].includes(d.t)) tab.etats=d.t;
    if(['Accueil','Favoris','Indicateurs','Connect'].includes(d.t)) tab.home=d.t;
  }
  if(d.id) navSel=d.id;
  else pickNav(dest, d.t);
  if(viewK()===dest) render();
  else location.hash=dest;
};
A.tb=d=>{ if(d.k) tab[d.k]=d.v; };
A.th=()=>{const r=document.documentElement;r.dataset.theme=r.dataset.theme==='dark'?'light':'dark'};
A.menu=d=>{
  const btn=document.querySelector(`.menubar button[data-v="${CSS.escape(d.v||'')}"]`);
  openMenu(d.v, btn);
};
A.focusq=()=>{const i=$('#q'); if(i){i.focus(); i.select()}};
A.help=()=>{okFn=null;$('#m').innerHTML=`<div class="mb wide"><h3>Guide Fastlane</h3><div class="mbody" style="grid-template-columns:1fr"><p>Fastlane Gestion — accueil façon Sage 100. Les menus, la barre d’outils et le volet gauche ouvrent les modules.</p><p><b>Fichier</b> Nouveau, enregistrer, imprimer.<br><b>Structure</b> Plan, tiers, stocks, journaux.<br><b>Traitement</b> Saisie, factures, paie, dotations.<br><b>État</b> Bilan, résultat, grand livre, balance.</p><p>Raccourcis : <b>Ctrl+N</b> nouveau · <b>Ctrl+S</b> enregistrer · <b>Ctrl+P</b> imprimer · <b>F1</b> aide · <b>/</b> rechercher · <b>Échap</b> fermer.</p></div><div class="acts"><button type="button" class="btn" data-a="x">Fermer</button></div></div>`;$('#m').classList.add('o')};
A.tuto=()=>{toast('Tutoriel : créez une facture, puis ouvrez Comptabilité → Journal'); A.go({v:'sales'})};
A.news=()=>toast('Fastlane Gestion 2026 — modèles Sage 30 / 50 / 100 regroupés, SYSCOHADA, SQLite');
A.pr=()=>window.print();
A.sv=async()=>{await persist();toast('Sauvegarde enregistrée dans SQLite')};
A.piece=()=>{navSel='piece'; tab.acc='Saisie'; A.go({v:'acc',t:'Saisie',id:'piece'}); toast('Saisissez l’écriture puis validez')};
A.add=()=>{
  const k=viewK();
  if(k==='purch') return A.ap();
  if(k==='tiers') return A.nt();
  if(k==='stock') return A.na();
  if(k==='immo') return A.ni();
  if(k==='fleet') return A.nm();
  if(k==='paye') return A.np();
  if(k==='acc') return A.piece();
  return A.inv();
};
A.nc=()=>modal('Nouveau compte général',`<label>N° de compte<input id="f1" placeholder="Ex. 572"></label><label>Intitulé<input id="f2" placeholder="Ex. Caisse secondaire"></label>`,()=>{
  const c=v('f1').trim(), l=v('f2').trim();
  if(!c||!l){ toast('Compte et intitulé requis'); return false; }
  if(PL[c]){ toast('Ce compte existe déjà'); return false; }
  PL[c]=l; tab.acc='Plan comptable'; toast('Compte '+c+' créé'); A.go({v:'acc',t:'Plan comptable'});
});
A.inv=()=>modal('Nouveau document de vente',`<label>Type<select id="f1"><option>Facture</option><option>Devis</option><option>Commande</option><option>Bon de livraison</option><option>Avoir</option></select></label><label>Client<select id="f2">${cop()}</select></label><label>Article<select id="f3">${opt(S.art,a=>`<option value="${a.r}">${esc(a.n)} — ${F(a.p)}</option>`)}</select></label><label>Quantité<input id="f4" type="number" min="1" value="1"></label><label class="span2">Compte de produit<select id="f5"><option value="701">701 Ventes de marchandises</option><option value="706">706 Services vendus</option></select></label>`,()=>{const a=S.art.find(x=>x.r===v('f3')); if(!a){toast('Article introuvable'); return false;} const n=Math.max(1,+v('f4')),t=v('f1'); const o=addDoc({type:t,cl:v('f2'),d:T,ht:a.p*n,st:t==='Facture'?'Impayée':t==='Devis'?'Envoyé':t==='Commande'?'En cours':t==='Avoir'?'Validé':'Livré',rev:v('f5'),art:a.n,qty:n,pu:a.p,r:a.r}); toast(t+' '+o.id+' créé'); A.go({v:'sales'})});
A.ap=()=>modal('Nouveau document d’achat',`<label>Type<select id="f1"><option>Facture d’achat</option><option>Commande d’achat</option><option>Bon de réception</option></select></label><label>Fournisseur<select id="f2">${fop()}</select></label><label>Libellé / article<select id="f3">${opt(S.art,a=>`<option value="${a.r}">${esc(a.n)} — ${F(a.p)}</option>`)}</select></label><label>Quantité<input id="f4" type="number" min="1" value="1"></label><label class="span2">Compte de charge<select id="f5"><option value="601">601 Achats de marchandises</option><option value="605">605 Autres achats</option><option value="622">622 Entretien</option></select></label>`,()=>{const a=S.art.find(x=>x.r===v('f3')); if(!a){toast('Article introuvable'); return false;} const n=Math.max(1,+v('f4')),t=v('f1'); addDoc({type:t,cl:v('f2'),d:T,ht:a.p*n,st:t==='Facture d’achat'?'À payer':t==='Bon de réception'?'Reçu':'En cours',chg:v('f5'),art:a.n,qty:n,pu:a.cost||a.p,r:a.r}); toast(t+' enregistré'); A.go({v:'purch'})});
A.fac=d=>{const o=S.docs.find(x=>x.id===d.v); if(!o) return toast('Document introuvable'); addDoc({type:'Facture',cl:o.cl,d:T,ht:o.ht,st:'Impayée',rev:o.rev||'701'}); o.st='Facturé'; toast('Devis transformé en facture')};
A.pay=d=>{const o=S.docs.find(x=>x.id===d.v); if(!o) return toast('Document introuvable'); o.st='Payée'; cash(o,'521'); toast('Règlement bancaire '+o.id)};
A.pf=d=>{const o=S.docs.find(x=>x.id===d.v); if(!o) return toast('Document introuvable'); o.st='Payée'; payF(o); toast('Fournisseur réglé')};
A.px=()=>{const o=S.docs.find(x=>x.id===v('tf')); if(!o)return toast('Aucune facture'); o.st='Payée'; cash(o,v('tc')||'521'); toast('Encaissé sur '+v('tc'))};
A.rel=()=>{};
A.mv=d=>{const a=S.art.find(x=>x.r===d.v); if(!a) return toast('Article introuvable'); a.q=Math.max(0,a.q+ +d.n); post(T,'ST','ST-'+a.r,(+d.n>0?'Entrée ':'Sortie ')+a.n,[[ '31', +d.n>0?a.p*Math.abs(d.n):0, +d.n<0?a.p*Math.abs(d.n):0 ],['718', +d.n<0?a.p*Math.abs(d.n):0, +d.n>0?a.p*Math.abs(d.n):0]]); toast(a.n+' : stock '+a.q)};
A.jn=()=>{
  const lines=[[v('c1'),v('l1'),+v('d1')||0,+v('r1')||0],[v('c2'),v('l2'),+v('d2')||0,+v('r2')||0],[v('c3'),v('l3'),+v('d3')||0,+v('r3')||0]].filter(x=>x[2]||x[3]);
  const td=lines.reduce((s,x)=>s+x[2],0), tc=lines.reduce((s,x)=>s+x[3],0);
  if(lines.length<2||td!==tc||!td)return toast('Écriture incomplète ou non équilibrée');
  const p=v('jp')||nid('j','OD'); post(v('jd')||T,v('jj')||'OD',p,v('jl')||'Opération diverse',lines.map(x=>[x[0],x[2],x[3]])); toast('Écriture '+p+' validée');
};
A.nm=()=>modal('Nouvelle mission',`<label>Départ<input id="f1" value="Conakry"></label><label>Arrivée<input id="f2" placeholder="Ex. Boké"></label><label>Véhicule<select id="f3">${opt(S.veh.filter(x=>x.st==='Disponible'),x=>`<option>${x.id}</option>`)||'<option>Aucun disponible</option>'}</select></label><label>Client<select id="f4">${cop()}</select></label><label>Recette prévue (GNF)<input id="f5" type="number" value="10000000"></label><label>Coût prévu (GNF)<input id="f6" type="number" value="5000000"></label>`,()=>{const x=S.veh.find(z=>z.id===v('f3')); if(!x){toast('Aucun véhicule disponible'); return false;} x.st='En mission'; S.mis.push({id:'MIS-'+(101+S.mis.length),a:v('f1'),b:v('f2')||'—',v:x.id,c:v('f4'),p:0,cost:+v('f6'),rev:+v('f5')}); toast('Mission planifiée pour '+x.dr); A.go({v:'fleet'})});
A.adv=d=>{const m=S.mis.find(x=>x.id===d.v); if(!m) return toast('Mission introuvable'); m.p=Math.min(100,m.p+25); if(m.p>=100){const x=S.veh.find(z=>z.id===m.v); if(x)x.st='Disponible'; toast('Mission livrée')}};
A.nt=()=>modal('Nouveau tiers',`<label>Type<select id="f1"><option>Client</option><option>Fournisseur</option></select></label><label>Raison sociale<input id="f2" placeholder="Nom de l’entreprise"></label>`,()=>{const n=v('f2').trim(); if(!n){toast('Indiquez un nom'); return false;} if(v('f1')==='Client') S.cl.push({id:'C'+Date.now(),n,ceil:20e6,delay:30,score:70,cur:'GNF',city:'Conakry'}); else S.fr.push({id:'F'+Date.now(),n,delay:15,cur:'GNF',city:'Conakry'}); toast(v('f1')+' ajouté')});
A.na=()=>modal('Nouvel article',`<label>Référence<input id="f1" placeholder="REF-01"></label><label>Désignation<input id="f2"></label><label>Prix<input id="f3" type="number" value="100000"></label><label>Stock<input id="f4" type="number" value="0"></label><label>Mini<input id="f5" type="number" value="5"></label><label>Famille<input id="f6" value="Divers"></label>`,()=>{const q=+v('f4')||0,p=+v('f3')||0; S.art.push({r:v('f1')||'ART-'+S.art.length,n:v('f2')||'Article',p,q,m:+v('f5'),c:v('f6'),cost:Math.round(p*0.72),u:'U',dep:{KAL:q,KAM:0}}); toast('Article créé')});
A.ni=()=>modal('Nouvelle immobilisation',`<label>Désignation<input id="f1" placeholder="Camion, local…"></label><label>Date de mise en service<input id="f2" type="date" value="${T}"></label><label>Valeur brute (GNF)<input id="f3" type="number" value="50000000"></label><label>Durée (années)<input id="f4" type="number" value="5"></label><label class="span2">Compte<select id="f5"><option value="244">244 Matériel de transport</option><option value="213">213 Constructions</option><option value="245">245 Matériel de bureau</option></select></label>`,()=>{const id=nid('im','IM'); S.immo.push({id,n:v('f1')||'Bien',d:v('f2'),c:+v('f3'),dur:+v('f4'),acc:v('f5')}); post(v('f2')||T,'IM',id,'Acquisition '+v('f1'),[[v('f5'),+v('f3'),0],['521',0,+v('f3')]]); toast('Immobilisation '+id+' enregistrée')});
A.dot=()=>{const tot=S.immo.reduce((s,x)=>s+amort(x).ann/12,0); post(T,'OD',nid('im','DOT'),'Dotation mensuelle',[['681',tot,0],['281',0,tot]]); toast('Dotation '+F(tot)+' comptabilisée')};
A.np=()=>{const tot=S.emp.reduce((s,e)=>s+e.s,0), id=nid('pa','PA'); S.pay.push({id,m:T.slice(0,7),tot,st:'Comptabilisé'}); post(T,'PA',id,'Paie '+T.slice(0,7),[['661',tot,0],['421',0,tot]]); toast('Paie '+id+' générée')};
A.sc=()=>{Object.assign(S.co,{name:v('cn'),city:v('cc'),nif:v('nif'),rccm:v('rccm'),tel:v('tel'),mail:v('em'),tva:+v('tva')}); toast('Paramètres société enregistrés')};
A.rs=async()=>{if(!confirm('Effacer la base SQLite et recharger la démo ?'))return; const r=await fetch('/api/reset',{method:'POST'}); const j=await r.json(); S=j.state; toast('Données démo restaurées')};
A.vd=d=>{
  okFn=null;
  const o=S.docs.find(x=>x.id===d.v); if(!o)return;
  const des=o.art?(esc(o.art)+(o.qty?' × '+o.qty:'')):esc(o.type)+' '+esc(o.cl);
  $('#m').innerHTML=`<div class="mb wide"><div class="mbody"><div class="inv" id="invp">
    <div class="gap" style="justify-content:space-between;align-items:flex-start"><div><img src="/static/img/logo.jpg" alt="Fastlane" style="height:48px;width:auto;object-fit:contain;display:block"><div>${esc(S.co.name)}<br>${esc(S.co.city)}<br>NIF ${esc(S.co.nif)} · RCCM ${esc(S.co.rccm)}</div></div>
    <div style="text-align:right"><b style="font-size:20px">${esc(o.type)}</b><div>${esc(o.id)}<br>${FR(o.d)}</div></div></div>
    <p><b>Tiers</b><br>${esc(o.cl)}</p>
    <table><tr><th>Désignation</th><th class="r">HT</th><th class="r">TVA ${S.co.tva*100}%</th><th class="r">TTC</th></tr>
    <tr><td>${des}</td><td class="r">${F(o.ht)}</td><td class="r">${F(o.tva)}</td><td class="r">${F(o.total)}</td></tr></table>
    <p style="text-align:right"><b>Net à payer : ${F(o.total)}</b></p>
    <p style="color:#5a6f66;font-size:12px">Document généré par Fastlane Gestion · SYSCOHADA · ${esc(S.co.mail)}</p>
  </div></div><div class="acts"><button type="button" class="btn g" data-a="x">Fermer</button><button type="button" class="btn" data-a="pr">Imprimer</button></div></div>`;
  $('#m').classList.add('o');
};

function navHTML(k){
  return NAV.map(g=>{
    const open=g[1].some(n=>(n[5]||n[0])===navSel || n[0]===k)?' open':'';
    return `<details${open}><summary>${g[0]}</summary>${g[1].map(n=>{
      const id=n[5]||n[0];
      return `<a class="${id===navSel?'on':''}" tabindex="0" data-a="${n[3]}" data-v="${n[0]}" data-t="${n[4]||''}" data-id="${id}">${svg(ICO[n[2]]||ICO.acc)} ${n[1]}</a>`;
    }).join('')}</details>`;
  }).join('');
}
function render(){
  closeMenu();
  const k=viewK();
  const items=NAV.flatMap(g=>g[1]);
  if(!items.some(n=>(n[5]||n[0])===navSel && n[0]===k)) pickNav(k);
  document.body.classList.toggle('intui-on',k==='home');
  const nav=$('#snav');
  if(nav) nav.innerHTML=navHTML(k);
  const meta=META[k]||['Accueil','Fastlane Gestion'];
  const ti=$('#ti'), sub=$('#sub'), wt=$('#wint');
  if(ti) ti.textContent=meta[0];
  if(sub) sub.textContent=meta[1];
  if(wt) wt.textContent=`Fastlane Gestion — ${(S&&S.co&&S.co.name)||'Fastlane SARL'} — Exercice ${(S&&S.co&&S.co.ex)||'2026'}`;
  const box=$('#v'); if(box && V[k]) box.innerHTML=V[k]();
}
const skipSave=new Set(['vd','x','th','go','tb','pr','help','news','tuto','menu','focusq','inv','ap','nm','nt','na','ni','nc','add','piece']);
const skipRender=new Set(['menu','vd','x','focusq','th','help','news','pr','sv']);
document.addEventListener('click',async e=>{
  if(e.target.closest('#login')) return;
  const b=e.target.closest('[data-a]');
  if(!b){ closeMenu(); return; }
  if(b.tagName==='A') e.preventDefault();
  const act=b.dataset.a;
  const data=Object.assign({}, b.dataset);
  if(!A[act]){ closeMenu(); toast('Action indisponible'); return; }
  if(data.id) navSel=data.id;
  if(act!=='menu') closeMenu();
  try{
    await A[act](data);
    if(!skipRender.has(act) && act!=='go') render();
    if(!skipSave.has(act) && act!=='rs') save();
  }catch(err){
    console.error(err);
    toast('Action impossible');
  }
});
document.querySelector('.menubar')?.addEventListener('mouseover',e=>{
  const b=e.target.closest('[data-a="menu"]');
  const dd=$('#dd');
  if(b && dd && !dd.hidden && dd.dataset.v!==b.dataset.v) A.menu(b.dataset);
});
document.addEventListener('keydown',e=>{
  const loginOn=$('#login') && !$('#login').hidden;
  if(loginOn) return;
  const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName);
  const modalOn=$('#m')?.classList.contains('o');
  const dd=$('#dd');
  const menuOpen=dd && !dd.hidden;
  if(e.key==='Escape'){ closeMenu(); A.x(); return; }
  if(menuOpen && (e.key==='ArrowDown'||e.key==='ArrowUp')){
    e.preventDefault();
    const items=[...dd.querySelectorAll('button')];
    if(!items.length) return;
    let i=items.findIndex(x=>x===document.activeElement || x.classList.contains('on'));
    items.forEach(x=>x.classList.remove('on'));
    i=e.key==='ArrowDown' ? (i+1)%items.length : (i<=0?items.length-1:i-1);
    items[i].classList.add('on'); items[i].focus();
    return;
  }
  if(menuOpen && (e.key==='Enter'||e.key===' ') && e.target.closest('#dd button')){
    e.preventDefault(); e.target.click(); return;
  }
  if(e.key==='Enter' && modalOn && e.target.tagName!=='TEXTAREA'){
    if(!e.target.closest('[data-a="x"]')){ e.preventDefault(); A.ok(); }
    return;
  }
  if((e.key==='Enter'||e.key===' ') && e.target.matches('#snav a, .dd a, .tabs a, .intui-tabs a')){
    e.preventDefault(); e.target.click(); return;
  }
  if(e.key==='F1'){ e.preventDefault(); A.help(); return; }
  const mod=e.ctrlKey||e.metaKey;
  if(mod && e.key.toLowerCase()==='s'){ e.preventDefault(); A.sv(); return; }
  if(mod && e.key.toLowerCase()==='n'){ e.preventDefault(); A.add(); if(!$('#m')?.classList.contains('o')) render(); save(); return; }
  if(mod && e.key.toLowerCase()==='p'){ e.preventDefault(); A.pr(); return; }
  if(!typing && e.key==='/'){ e.preventDefault(); A.focusq(); }
});
$('#q')?.addEventListener('input',e=>{q=e.target.value.toLowerCase(); render()});
addEventListener('hashchange',render);
window.__fastlaneReady=true;
