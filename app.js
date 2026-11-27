{
// 찬양 듣기 — 앨범(catalog.json) + 내 곡(휴대폰 안 저장) + 재생 목록. 차 버튼·잠금 화면은 Media Session.
const $=s=>document.querySelector(s), au=$('#au');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>{t=Math.max(0,t|0);return (t/60|0)+':'+String(t%60).padStart(2,'0')};
const LS={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// ---------- 문제 기록: 에러가 나면 이 기기 안에만 적어 둠 (자동으로 보내지 않음) — 설정 → 문제 알리기 ----------
const ERR={list:LS.get('errlog',[]),add(m){this.list.push({t:new Date().toISOString().slice(0,19),b:String(window.BUILD||''),m:String(m).slice(0,300)});this.list=this.list.slice(-30);LS.set('errlog',this.list)}};
addEventListener('error',e=>ERR.add((e.message||'오류')+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||'')));
addEventListener('unhandledrejection',e=>ERR.add('처리 안 된 오류: '+((e.reason&&e.reason.message)||e.reason)));
let CAT={albums:[]}, tab='album', albumId=LS.get('album',null), openDesc=null;
let queue=[], qi=-1, repeat=LS.get('repeat','all'), shuf=LS.get('shuf',false), ver=LS.get('ver','B'), pick=null, mine=[], lists=LS.get('lists',[]), openList=null;
const urls={};
// ---------- 아이콘 (선 그림) ----------
const IC={play:'<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
 pause:'<rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
 prev:'<path d="M6 5v14"/><path d="M19 5.5 9 12l10 6.5z" fill="currentColor"/>',
 next:'<path d="M18 5v14"/><path d="M5 5.5 15 12 5 18.5z" fill="currentColor"/>',
 shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
 repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
 repeat1:'<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/><path d="M11 10.5h1.2v4.5"/>',
 moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.01"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 disc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
 note:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
 lyrics:'<path d="M4 5h16M4 10h16M4 15h11M4 20h7"/>',
 check:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
 box:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/>',
 back:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
 fwd:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
 down:'<path d="m6 9 6 6 6-6"/>',left:'<path d="m15 18-6-6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
 download:'<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
 parts:'<path d="M4 20V10M9 20V4M14 20v-8M19 20V7"/>',
 save:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="1.5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.2v.01"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 star:'<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
 radio:'<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="m7 8 10-5"/><circle cx="15.5" cy="14" r="2.8"/><path d="M6.5 12h3M6.5 16h3"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
 book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/><path d="M12 6v7M9 8.5h6"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" class="i" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]||''}</svg>`;
document.querySelectorAll('[data-ic]').forEach(e=>e.insertAdjacentHTML('afterbegin',svg(e.dataset.ic)));
const EQ='<span class="eq" aria-label="재생 중"><i></i><i></i><i></i></span>';

// ---------- 내 곡: IndexedDB (이 휴대폰 안에만) ----------
const DB={db:null,
 open(){return new Promise(r=>{setTimeout(()=>r(false),2500);try{const q=indexedDB.open('chanyang',2);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('songs'))d.createObjectStore('songs',{keyPath:'id'});if(!d.objectStoreNames.contains('off'))d.createObjectStore('off',{keyPath:'url'})};q.onsuccess=()=>{this.db=q.result;r(true)};q.onerror=()=>r(false)}catch(e){r(false)}})},
 tx(m){return this.db.transaction('songs',m).objectStore('songs')},
 all(){return new Promise(r=>{if(!this.db)return r([]);const q=this.tx('readonly').getAll();q.onsuccess=()=>r(q.result||[]);q.onerror=()=>r([])})},
 put(o){return new Promise(r=>{if(!this.db)return r(false);const q=this.tx('readwrite').put(o);q.onsuccess=()=>r(true);q.onerror=()=>r(false)})},
 del(id){return new Promise(r=>{if(!this.db)return r();const q=this.tx('readwrite').delete(id);q.onsuccess=q.onerror=()=>r()})}};

// ---------- 인터넷 없이 듣기: 앨범 음원·악보를 이 기기에 저장 ----------
const OFF={map:new Map(),job:null,
 key(u){try{return new URL(u,location.href).href}catch(e){return u}},
 has(u){return this.map.has(this.key(u))},
 url(u){if(!u)return u;const k=this.key(u),b=this.map.get(k);if(!b)return u;if(!urls['off:'+k])urls['off:'+k]=URL.createObjectURL(b);return urls['off:'+k]},
 ok(){return !!(DB.db&&DB.db.objectStoreNames.contains('off'))},
 load(){return new Promise(r=>{if(!this.ok())return r();const q=DB.db.transaction('off').objectStore('off').getAll();q.onsuccess=()=>{for(const o of q.result||[])this.map.set(o.url,o.blob);r()};q.onerror=()=>r()})},
 put(url,blob,tag){return new Promise(r=>{if(!this.ok())return r(false);const k=this.key(url);const q=DB.db.transaction('off','readwrite').objectStore('off').put({url:k,blob,tag});q.onsuccess=()=>{this.map.set(k,blob);r(true)};q.onerror=()=>r(false)})},
 del(url){return new Promise(r=>{if(!this.ok())return r();const k=this.key(url);const q=DB.db.transaction('off','readwrite').objectStore('off').delete(k);q.onsuccess=q.onerror=()=>{this.map.delete(k);if(urls['off:'+k]){URL.revokeObjectURL(urls['off:'+k]);delete urls['off:'+k]}r()}})},
 async json(u){if(this.has(u))return JSON.parse(await this.map.get(this.key(u)).text());return (await fetch(u)).json()}};
const NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
// 앱 안에 이미 들어 있는 반주(local)는 앱에서는 저장할 필요 없음
const offNeeds=(a,v)=>!!(v&&(!v.local||!NATIVE)&&(a.media||v.local));
function offAudio(a,v){return a.tracks.map(t=>rawSrc({...t,album:a},v)).filter(Boolean)}
function offCount(a,v){const l=offAudio(a,v);return {n:l.filter(u=>OFF.has(u)).length,all:l.length}}
async function offPages(u,files){try{const S=JSON.parse(await OFF.map.get(OFF.key(u)).text());const np=Math.max(0,...S.m.map(q=>q[1]))+1;const base=u.slice(0,-6);
 for(let p=1;p<=np;p++){const f=base+'p'+p+'.webp';if(!files.includes(f)){files.push(f);OFF.job.total++}}}catch(e){}}
async function offSave(a,v){if(OFF.job)return;if(!OFF.ok()){toast('이 기기에서는 저장할 수 없습니다');return}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
 const tag=a.id+':'+v.id, files=offAudio(a,v);
 if(a.scores&&a.media)for(const t of a.tracks)files.push(`${a.media}/score/${String(t.n).padStart(2,'0')}/s.json`);
 OFF.job={tag,done:0,total:files.length,stop:false};render();
 const get=async u=>{for(let k=0;k<2;k++){try{const r=await fetch(u,{cache:'no-store'});if(r.ok)return await r.blob()}catch(e){}}return null};
 let fail=0;
 for(let i=0;i<files.length;i++){if(OFF.job.stop)break;const u=files[i];
  if(!OFF.has(u)){const b=await get(u);if(!b){fail++;ERR.add('저장 실패: '+u.slice(-40));if(fail>=3)break;continue}await OFF.put(u,b,tag)}
  if(u.endsWith('/s.json'))await offPages(u,files);
  OFF.job.done=i+1;const el=$('#offst');if(el)el.textContent=`저장하는 중… ${OFF.job.done} / ${OFF.job.total}`}
 const stopped=OFF.job.stop;OFF.job=null;render();
 toast(stopped?'저장을 멈췄습니다 (다시 누르면 이어서)':fail?'인터넷이 끊겨 일부를 못 받았습니다. 다시 누르면 이어서 저장합니다':`「${v.name}」 저장 끝 — 이제 인터넷 없이 들을 수 있습니다`)}
async function offDel(a,v){const tag=a.id+':'+v.id;const ks=[];
 await new Promise(r=>{const q=DB.db.transaction('off').objectStore('off').getAll();q.onsuccess=()=>{for(const o of q.result||[])if(o.tag===tag)ks.push(o.url);r()};q.onerror=()=>r()});
 for(const k of ks)await OFF.del(k);render();toast(`「${v.name}」 저장본을 지웠습니다`)}
const eulReul=w=>{const c=String(w).charCodeAt(String(w).length-1)-0xAC00;return c>=0&&c<11172&&c%28?'을':'를'};
function offBar(a){const v=verOf(a);if(!v||!offNeeds(a,v))return '';
 if(OFF.job&&OFF.job.tag===a.id+':'+v.id)return `<div class="offrow">${svg('save')}<span id="offst">저장하는 중… ${OFF.job.done} / ${OFF.job.total}</span><button class="ghost" data-offstop>그만</button></div>`;
 const c=offCount(a,v);
 if(c.n&&c.n===c.all)return `<div class="offrow on">${svg('save')}<span><b>「${esc(v.name)}」 저장됨</b><small>인터넷 없이 들을 수 있습니다</small></span><button class="ghost" data-offdel>지우기</button></div>`;
 return `<div class="offrow">${svg('save')}<span><b>인터넷 없이 듣기</b><small>「${esc(v.name)}」${eulReul(v.name)} 이 기기에 저장${c.n?` · ${c.n}/${c.all}곡 저장됨`:''} · 와이파이에서 · 약 ${Math.round(a.tracks.length*2.6)}MB</small></span><button class="pill" data-offsave ${OFF.job?'disabled':''}>저장하기</button></div>`}

// 내 앨범: 내 곡마다 앨범 이름(alb)을 붙여 묶음. 앨범 안은 파일 이름 차례(01, 02 … 10)로.
const NOALB='앨범 없는 곡';
let mineAlb=LS.get('mineAlb',null), addTo=null;
const byTitle=(a,b)=>a.title.localeCompare(b.title,'ko',{numeric:true});
const albOf=s=>s.alb||NOALB;
function mineAlbums(){const m=new Map();for(const s of mine){const k=albOf(s);if(!m.has(k))m.set(k,[]);m.get(k).push(s)}
 for(const l of m.values())l.sort(byTitle);
 if(m.has(NOALB)){const l=m.get(NOALB);m.delete(NOALB);m.set(NOALB,l)} return m}
function mineList(s){return mineAlbums().get(albOf(s))||[s]}

const album=id=>CAT.albums.find(a=>a.id===id);
function allTracks(){const m={};for(const a of CAT.albums)for(const t of a.tracks)m[t.id]={...t,album:a};for(const s of mine)m[s.id]=s;return m}
function verOf(a){return (a&&a.versions||[]).find(v=>v.id===ver)||(a&&a.versions||[])[0]}
function rawSrc(t,v){const a=t.album;v=v||(t.rv&&a&&(a.versions||[]).find(x=>x.id===t.rv&&(x.local||a.media)))||verOf(a);if(a&&v&&!v.local&&a.media) return `${a.media}/2ch/${String(t.n).padStart(2,'0')}_${v.id}.${a.ext||'m4a'}`; return t.src}
function trackSrc(t){if(t.blob){if(!urls[t.id])urls[t.id]=URL.createObjectURL(t.blob);return urls[t.id]}
 if(partOn(t))return partUrl(t,'acc');
 return OFF.url(rawSrc(t))} // 기기에 저장된 곡이면 저장본으로 (인터넷 없이)
// 내려받기(웹 앱만): 곡 하나 = 지금 고른 반주 파일, 앨범 전체 = catalog의 zip
const canDL=()=>window.BUILD==='웹';
function dlName(t,a){const v=verOf(a),src=rawSrc({...t,album:a}),ext=(src.split('?')[0].match(/\.(\w+)$/)||[])[1]||'m4a';
 return `${String(t.n).padStart(2,'0')} ${t.kind?t.kind+' ':''}${t.title}${v?' ('+v.name+')':''}.${ext}`.replace(/[\\/:*?"<>|]/g,'')}
function verBar(a){const vs=(a.versions||[]).filter(v=>v.local||a.media); if(vs.length<2)return '';
 return `<div class="verrow"><span class="lbl">반주 고르기</span><div class="seg" role="group" aria-label="반주 고르기">${vs.map(v=>`<button data-ver="${v.id}" aria-pressed="${verOf(a).id===v.id}">${esc(v.name)}</button>`).join('')}</div></div>`}
function shuffled(l,keep){const r=l.filter((_,i)=>i!==keep);for(let i=r.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[r[i],r[j]]=[r[j],r[i]]}return keep>=0?[l[keep],...r]:r}
function label(t){return t.album?`${String(t.n).padStart(2,'0')}. ${t.kind?t.kind+' ':''}「${t.title}」`:t.title}
function sub(t){if(t.rp){const v=t.album&&rawVer(t);return `주찬양 라디오 · ${t.rp}${v?' · '+v.name:''}`}
 if(!t.album)return t.alb?'내 곡 · '+t.alb:'내 곡';const v=verOf(t.album);return `${t.part||''} · ${partOn(t)?'성부 듣기 · ':v&&(t.album.versions||[]).length>1?v.name+' · ':''}${t.album.title}`}
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1800)}

// ---------- 화면 ----------
function render(){ pickBar();
 navSel();
 const v=$('#view'); const cur=queue[qi];
 if(tab==='radio'){v.innerHTML=radioHtml();return}
 if(tab==='bible'){v.innerHTML=bibleShell();bibleLoad();return}
 if(tab==='album'){
  const a=album(albumId)||CAT.albums[0]; if(!a){v.innerHTML='<p class="empty">앨범이 없습니다.</p>';return}
  albumId=a.id; let h='';
  if(CAT.albums.length>1) h+=`<div class="albums">${CAT.albums.map(x=>`<button data-alb="${x.id}" aria-pressed="${x.id===a.id}"><img src="${esc(x.cover)}" alt=""><span>${esc(x.title)}</span></button>`).join('')}</div>`;
  const total=a.tracks.reduce((s,t)=>s+(t.dur||0),0);
  h+=`<section class="hero"><img src="${esc(a.cover)}" alt="${esc(a.title)} 표지"><div><h1>${esc(a.title)}</h1><p>${esc(a.sub||'')}</p><p>${esc(a.artist||'')} · ${a.tracks.length}곡 · ${Math.round(total/60)}분</p><div class="bar" style="margin:0"><button class="pill" data-playalb="${a.id}">${svg('play')}차례로</button><button class="ghost" data-shufalb="${a.id}">${svg('shuffle')}섞어서</button>${canDL()&&a.zip?`<a class="ghost dlall" href="${esc(a.zip)}" download>${svg('download')}앨범 전체 내려받기</a>`:''}</div>${canDL()&&a.zip?`<p class="dlnote">${esc(a.zipNote||'')}</p>`:''}</div></section>${verBar(a)}${offBar(a)}`;
  let part=null;
  for(const t of a.tracks){
   if(t.part&&t.part!==part){part=t.part;h+=`<h2 class="part"><span>${esc(part)}</span><button class="partplay" data-playpart="${esc(part)}" data-from="${a.id}" aria-label="${esc(part)} 듣기">${svg('play')}이 부 듣기</button></h2>`}
   const now=cur&&cur.id===t.id;
   h+=`<div class="row${now?' now':''}">${numCell(t.id,t.n)}<button class="t" data-play="${t.id}" data-from="${a.id}"><b>${t.kind?esc(t.kind)+' ':''}「${esc(t.title)}」</b><small>${fmt(t.dur)}</small></button><button class="icon" data-desc="${t.id}" aria-label="곡 설명">${svg('info')}</button><button class="icon" data-add="${t.id}" aria-label="재생 목록에 넣기">${svg('plus')}</button>${canDL()&&t.src?`<a class="icon" href="${esc(rawSrc({...t,album:a}))}" download="${esc(dlName(t,a))}" aria-label="이 곡 내려받기" title="이 곡 내려받기">${svg('download')}</a>`:''}`;
   if(openDesc===t.id) h+=descHtml(t);
   h+='</div>';
  }
  v.innerHTML=h;
 } else if(tab==='mine'){
  const A=mineAlbums(); if(mineAlb&&!A.has(mineAlb))mineAlb=null;
  let h='';
  if(!mineAlb){
   const nb=`<button class="pill" id="newalb">${svg('plus')}새 앨범 만들고 곡 넣기</button>`;
   h= A.size?`<div class="bar">${nb}</div>`:'';
   h+= A.size? [...A].map(([n,l])=>`<div class="row"><span class="num">${svg('disc')}</span><button class="t" data-malb="${esc(n)}"><b>${esc(n)}</b><small>${l.length}곡 · ${Math.round(l.reduce((s,x)=>s+(x.dur||0),0)/60)}분</small></button><button class="icon" data-mplay="${esc(n)}" aria-label="${esc(n)} 듣기">${svg('play')}</button><span></span></div>`).join('')
    : ecard('note','내 곡이 아직 없습니다','휴대폰에 있는 음악 파일(MP3 등)을 앨범으로 묶어 넣으면 여기서 들을 수 있습니다. 폴더 하나를 앨범 하나로 넣으세요. 넣은 곡은 이 휴대폰 안에만 저장됩니다.',nb);
  } else {
   const l=A.get(mineAlb), total=l.reduce((s,x)=>s+(x.dur||0),0);
   h=`<div class="bar"><button class="ghost" data-mback>${svg('left')}내 곡</button><b class="serif" style="font-size:20px">${esc(mineAlb)}</b></div>`;
   h+=`<p class="empty" style="padding:0 0 6px;text-align:left">${l.length}곡 · ${Math.round(total/60)}분</p>`;
   h+=`<div class="bar"><button class="pill" data-mplay="${esc(mineAlb)}">${svg('play')}차례로</button><button class="ghost" data-mmix="${esc(mineAlb)}">${svg('shuffle')}섞어서</button><button class="ghost" data-maddto>${svg('plus')}곡 더 넣기</button><button class="ghost" data-mdelalb>앨범 지우기</button></div>`;
   h+= l.map((s,i)=>`<div class="row${cur&&cur.id===s.id?' now':''}">${numCell(s.id,i+1)}<button class="t" data-play="${s.id}" data-from="mine"><b>${esc(s.title)}</b><small>${s.dur?fmt(s.dur):''}</small></button><button class="icon" data-add="${s.id}" aria-label="재생 목록에 넣기">${svg('plus')}</button><button class="icon" data-delmine="${s.id}" aria-label="지우기">${svg('x')}</button></div>`).join('');
  }
  v.innerHTML=h;
 } else {
  const m=allTracks();
  if(openList!==null&&lists[openList]){
   const L=lists[openList];
   let h=`<div class="bar"><button class="ghost" data-back>${svg('left')}목록</button><b class="serif" style="font-size:20px">${esc(L.name)}</b></div><div class="bar">${L.ids.length?`<button class="pill" data-playlist="${openList}">${svg('play')}듣기</button>`:''}<button class="ghost" data-dellist="${openList}">목록 지우기</button></div>`;
   h+= L.ids.length? L.ids.map((id,i)=>{const t=m[id];if(!t)return '';return `<div class="row${cur&&cur.id===id&&queue.src==='list'+openList?' now':''}"><span class="num">${i+1}</span><button class="t" data-playat="${i}"><b>${esc(label(t))}</b><small>${esc(sub(t))}</small></button><button class="icon" data-up="${i}" aria-label="위로">${svg('up')}</button><button class="icon" data-rm="${i}" aria-label="빼기">${svg('x')}</button></div>`}).join('')
    : '<p class="empty">앨범이나 내 곡에서 ＋ 를 눌러 곡을 넣으세요.</p>';
   v.innerHTML=h;
  } else {
   const fm=`<form class="bar" id="newl"><input type="text" id="lname" placeholder="새 재생 목록 이름" maxlength="40"><button class="pill">만들기</button></form>`;
   let h= lists.length?fm:'';
   h+= lists.length? lists.map((L,i)=>`<div class="row"><span class="num">${svg('list')}</span><button class="t" data-openlist="${i}"><b>${esc(L.name)}</b><small>${L.ids.length}곡</small></button><button class="icon" data-playlist="${i}" aria-label="듣기">${svg('play')}</button><span></span></div>`).join('')
    : ecard('list','재생 목록이 아직 없습니다','좋아하는 곡을 모아 나만의 목록을 만들어 보세요. 이름을 쓰고 「만들기」를 누른 뒤, 앨범에서 곡 옆의 ＋를 누르면 들어갑니다.',fm);
   v.innerHTML=h;
  }
 }
}
function ecard(ic,t,p,act){return `<div class="ecard"><span class="eic">${svg(ic)}</span><h3>${t}</h3><p>${p}</p>${act||''}</div>`}
function numCell(id,n){const c=queue[qi];return pick?`<button class="num chk${pick.has(id)?' on':''}" data-pick="${esc(id)}" aria-label="고르기" aria-pressed="${pick.has(id)}">${svg(pick.has(id)?'check':'box')}</button>`:`<span class="num">${c&&c.id===id?EQ:n}</span>`}
function pickBar(){const b=$('#pickbar');document.body.classList.toggle('picking',!!pick);$('#bpick').classList.toggle('on',!!pick);if(!pick){b.hidden=true;fitPad();return}b.hidden=false;
 fitPad();$('#pickn').textContent=pick.size?`${pick.size}곡 골랐습니다`:'앨범·내 곡에서 곡을 고르세요'}
function descHtml(t){
 return `<div class="desc"><div class="meta">${esc(t.info||'')}</div><dl>${(t.listen||[]).map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>`;
}

// ---------- 재생 ----------
function setQueue(list,i,src,mix){const o=list.slice();let l=o;if(mix||shuf){l=shuffled(o,mix?-1:i);i=0;l.orig=o;o.src=src}queue=l;queue.src=src;qi=i;load(true)}
function load(play){
 const t=queue[qi]; if(!t)return;
 setSrc(t); partsSetup(t); LS.set('last',{id:t.id,src:queue.src,ids:queue.map(x=>x.id)});
 $('#ptitle').textContent=label(t); $('#psub').textContent=sub(t);
 $('#pimg').src=t.album?t.album.cover:(CAT.albums[0]?.cover||'');
 meta(t); if(play) au.play().catch(()=>{}); render(); if(lyrOpen)showLyr(); syncNP();
}
function next(auto){ if(!queue.length)return; if(auto&&repeat==='one'){au.currentTime=0;au.play();return}
 if(qi<queue.length-1){qi++;load(true)} else if(repeat==='all'||!auto){qi=0;load(true)} }
function prev(){ if(au.currentTime>4){au.currentTime=0;return} if(qi>0){qi--;load(true)} else {au.currentTime=0} }
// 안드로이드 앱(Capacitor)에서는 기기 미디어 세션 플러그인 — 잠금 화면·알림·차 버튼·블루투스
const CAP=window.Capacitor, NMS=(CAP&&CAP.isNativePlatform&&CAP.isNativePlatform()&&CAP.registerPlugin)?CAP.registerPlugin('MediaSession'):null;
function meta(t){
 const m={title:label(t),artist:t.rp?'주찬양 라디오 · '+t.rp:t.album?(t.part||t.album.artist):'내 곡',album:t.album?t.album.title:(t.alb||'내 곡'),
  artwork:[{src:new URL(t.album?t.album.cover:(CAT.albums[0]?.cover||''),location.href).href,sizes:'600x600',type:'image/jpeg'}]};
 if(NMS){NMS.setMetadata(m).catch(()=>{});return}
 const ms=navigator.mediaSession; if(!ms)return;
 try{ms.metadata=new MediaMetadata(m)}catch(e){}
}
const ACT={play:()=>au.play(),pause:()=>au.pause(),stop:()=>au.pause(),previoustrack:prev,nexttrack:()=>next(false),seekto:d=>{if(d&&d.seekTime!=null)au.currentTime=d.seekTime}};
if(NMS){for(const a in ACT)NMS.setActionHandler({action:a},ACT[a]).catch(()=>{})}
else try{const ms=navigator.mediaSession;if(ms)for(const a in ACT){try{ms.setActionHandler(a,ACT[a])}catch(e){}}}catch(e){}
function pstate(s){if(NMS)NMS.setPlaybackState({playbackState:s}).catch(()=>{});else try{navigator.mediaSession.playbackState=s}catch(e){}}
au.addEventListener('play',()=>{$('#bplay').innerHTML=svg('pause');document.body.classList.remove('paused');$('#bplay').setAttribute('aria-label','멈춤');pstate('playing')});
au.addEventListener('pause',()=>{$('#bplay').innerHTML=svg('play');document.body.classList.add('paused');$('#bplay').setAttribute('aria-label','재생');pstate('paused')});
au.addEventListener('timeupdate',()=>{const d=au.duration||0;$('#pfill').style.width=d?(au.currentTime/d*100)+'%':'0'});
// 곡 끝: 녹음 끝 0.6초는 소리 없는 부분(측정함)이라, 0.4초 남으면 다음 곡으로 넘어가 곡 사이를 잇는다 (성부 듣기·한 곡 반복 때는 그대로)
function onEnd(){if(sleepEnd){sleepEnd=false;au.pause();syncNP();toast('잠들기 타이머: 곡이 끝나 멈췄습니다');return}
 if(queue.src==='radio'){const P=progAt(new Date());if(P.id!==queue.prog||qi>=queue.length-1)radioTune(true);else{qi++;load(true)}return}
 if(queue.src==='radio-mix'&&qi>=queue.length-1){radioMix();return}
 const last=String(queue.src||'').startsWith('album:')&&qi===queue.length-1&&queue.length>=10;
 next(true); if(last)askRate()}
au.addEventListener('ended',()=>{if(au._early){au._early=false;return}onEnd()});
au.addEventListener('timeupdate',()=>{const d=au.duration||0,t=queue[qi];if(!d||au.paused||au._early||!t||partOn(t)||repeat==='one')return;
 if(d-au.currentTime<0.4&&d>5){au._early=true;onEnd()}});
au.addEventListener('loadstart',()=>{au._early=false});
au.addEventListener('seeked',()=>{if((au.duration||0)-au.currentTime>1)au._early=false});
au.addEventListener('timeupdate',()=>{const d=au.duration||0;$('#tcur').textContent=fmt(au.currentTime);$('#tdur').textContent=fmt(d);if(d&&!seeking)$('#pos').value=au.currentTime/d*1000;
 if((au.currentTime|0)%5===0)LS.set('pos',au.currentTime);
 const ps={duration:d,position:Math.min(au.currentTime,d),playbackRate:1};
 if(d&&NMS){if((au.currentTime|0)!==au._lp){au._lp=au.currentTime|0;NMS.setPositionState(ps).catch(()=>{})}}
 else try{if(d&&navigator.mediaSession?.setPositionState)navigator.mediaSession.setPositionState(ps)}catch(e){}});
let seeking=false;
$('#pos').addEventListener('input',()=>{seeking=true});
$('#pos').addEventListener('change',()=>{if(au.duration)au.currentTime=$('#pos').value/1000*au.duration;seeking=false});
$('#bplay').onclick=()=>{if(!queue.length){const a=album(albumId)||CAT.albums[0];if(a)setQueue(a.tracks.map(t=>({...t,album:a})),0,'album:'+a.id);return}au.paused?au.play():au.pause()};
$('#bnext').onclick=()=>next(false); $('#bprev').onclick=prev;
const repTxt={all:'⟳ 전체',one:'⟳ 한 곡',off:'⟳ 끔'};
function showRep(){$('#brep').textContent=repTxt[repeat];$('#brep').classList.toggle('on',repeat!=='off')}
$('#brep').onclick=()=>{repeat={all:'one',one:'off',off:'all'}[repeat];LS.set('repeat',repeat);showRep();toast('반복: '+repTxt[repeat].slice(2))};
$('#binfo').onclick=()=>{const t=queue[qi];if(!t)return;sheet(`<h3>${esc(label(t))}</h3>${t.album?descHtml(t):'<p>내 곡입니다.</p>'}<button class="pill" data-close>닫기</button>`)};

function setVer(id){if(ver===id)return;ver=id;LS.set('ver',ver);const t=queue[qi];
 if(t&&t.album){const pos=au.currentTime,pl=!au.paused;setSrc(t);au.addEventListener('loadedmetadata',()=>{au.currentTime=pos;if(pl)au.play().catch(()=>{})},{once:true});$('#psub').textContent=sub(t)}
 render();toast('반주: '+(verOf(album(albumId))?.name||''))}
au.addEventListener('error',()=>{const t=queue[qi];if(t&&t.rv&&t.rv!=='B'){ERR.add('라디오: '+t.rv+' 못 불러 앙상블로');t.rv='B';const p=au.currentTime;setSrc(t);au.addEventListener('loadedmetadata',()=>{au.currentTime=p},{once:true});au.play().catch(()=>{});return}ERR.add('재생 오류 '+(au.error?au.error.code:'')+': '+String(au.currentSrc||'').slice(-50));if(t&&t.album&&!String(au.currentSrc).startsWith('blob:'))toast(navigator.onLine===false?'인터넷이 없습니다 — 이 곡은 저장되어 있지 않습니다':'이 곡을 불러오지 못했습니다 (인터넷 확인)')});
$('#bshuf').onclick=()=>{shuf=!shuf;LS.set('shuf',shuf);$('#bshuf').classList.toggle('on',shuf);
 if(queue.length){const t=queue[qi];const base=queue.orig||queue;if(shuf){const o=queue.slice();const l=shuffled(queue,qi);l.src=queue.src;l.orig=o;queue=l;qi=0}else if(queue.orig){const l=queue.orig;l.src=queue.src;qi=l.findIndex(x=>x.id===t.id);queue=l}}
 toast(shuf?'섞어서 듣기':'차례로 듣기')};
$('#bshuf').classList.toggle('on',shuf);
// ---------- 가사 ----------
let lyrOpen=false, lmode=LS.get('lmode','lyr'); const SC={};
function hasScore(t){return !!(t&&t.album&&t.album.media&&t.album.scores)}
async function scoreOf(t){const k=t.id;if(SC[k]!==undefined)return SC[k];SC[k]=null;
 try{const nn=String(t.n).padStart(2,'0');const j=await OFF.json(`${t.album.media}/score/${nn}/s.json`);j.base=`${t.album.media}/score/${nn}/`;SC[k]=j}catch(e){SC[k]=null}return SC[k]}
let curPg=-1,curM=-1;
let busy=false;async function scoreTick(){if(busy)return;busy=true;try{await scoreTick2()}finally{busy=false}}
async function scoreTick2(){if(!lyrOpen||lmode!=='score')return;const t=queue[qi];if(!hasScore(t))return;const S=await scoreOf(t);if(!S){$('#scoreBox').innerHTML='<p class="empty">악보를 불러오지 못했습니다 (인터넷 연결 확인).</p>';return}
 const tm=au.currentTime-0.05;let i=0;for(let j=0;j<S.m.length;j++){if(S.m[j][0]<=tm)i=j;else break}
 const [_,p,x,y,w,h]=S.m[i]||[0,0,0,0,0,0];
 // 악보 줄(단) 묶기: 화면에 지금 줄 + 다음 2줄 = 3줄
 if(!S.sys){S.sys=[];for(let j=0;j<S.m.length;j++){const q=S.m[j];const L=S.sys[S.sys.length-1];
   if(L&&L.p===q[1]&&Math.abs(L.y-q[3])<0.01){L.x1=Math.max(L.x1,q[2]+q[4]);L.h=Math.max(L.h,q[5])}
   else S.sys.push({p:q[1],y:q[3],h:q[5],x0:q[2],x1:q[2]+q[4],j})}
  for(const L of S.sys){L.top=Math.max(0,L.y-0.07);L.bot=Math.min(1,L.y+L.h+0.03);L.l=Math.max(0,Math.min(L.x0-0.12,0.03));L.r=Math.min(1,L.x1+0.01)}}
 let si=0;for(let j=0;j<S.sys.length;j++){if(S.sys[j].j<=i)si=j}
 const first=si; // 위 줄 = 언제나 지금 부르는 줄
 const key=t.id+':'+first;
 const strip=(L,k)=>{const cw=L.r-L.l,ch=L.bot-L.top;return `<div class="sys" id="sys${k}" style="aspect-ratio:${cw}/${(ch*S.ratio).toFixed(4)}"><img src="${OFF.url(S.base+'p'+(L.p+1)+'.webp')}" alt="" style="width:${100/cw}%;left:${-L.l/cw*100}%;top:${-L.top/ch*100}%"></div>`};
 if($('#scoreBox').dataset.key!==key){const box=$('#scoreBox');box.dataset.key=key;
  const two=S.sys.slice(first,first+2);box.innerHTML=two.map((L,k)=>strip(L,first+k)).join('');$('#sys'+first)?.classList.add('cur');
  const pg=$('#scpg');if(pg)pg.textContent=`${si+1} / ${S.sys.length}줄`;fitScore(two,S)}
 const L=S.sys[si],cw=L.r-L.l,ch=L.bot-L.top,host=$('#sys'+si);
 let hi=$('#scHi'),bar=$('#scBar');if(host&&(!hi||hi.parentNode!==host)){if(hi)hi.remove();if(bar)bar.remove();host.insertAdjacentHTML('beforeend','<div id="scHi"></div><div id="scBar"></div>');hi=$('#scHi');bar=$('#scBar')}
 const X=v=>(v-L.l)/cw*100+'%';
 if(hi){hi.style.left=X(x);hi.style.width=w/cw*100+'%';hi.style.top=(y-L.top)/ch*100+'%';hi.style.height=h/ch*100+'%'}curM=i;
 // 진행 막대: 마디 안 음표 자리 사이를 시간에 맞춰 이동
 const ts=S.m[i]?S.m[i][0]:0, te=S.m[i+1]?S.m[i+1][0]:(ts+2);
 const G=(S.g||[]).filter(q=>q[2]===p&&q[1]>=x-0.002&&q[1]<=x+w&&q[0]>=ts-0.01&&q[0]<te);
 let pts=G.map(q=>[q[0],q[1]]); if(!pts.length||pts[0][0]>ts+0.01)pts.unshift([ts,x+0.004]); pts.push([te,x+w-0.003]);
 let bx=pts[0][1];for(let k=0;k<pts.length-1;k++){const [t0,x0]=pts[k],[t1,x1]=pts[k+1];if(tm>=t0&&tm<=t1){bx=x0+(x1-x0)*((tm-t0)/Math.max(0.01,t1-t0));break}if(tm>t1)bx=x1}
 if(bar){bar.style.left=X(bx);bar.style.top=(y-L.top)/ch*100+'%';bar.style.height=h/ch*100+'%'}}
// 악보 두 줄이 화면 높이에 꼭 맞게 가장 크게
function fitScore(two,S){const box=$('#scoreBox');if(!box||!two.length)return;
 const z=zoomV||1,avail=($('#lyr').clientHeight-$('.lyrtop').offsetHeight*z-$('.sctitle').offsetHeight*z-40)/z;
 const sum=(two.length<2?two.concat(two):two).reduce((s,L)=>s+((L.bot-L.top)*S.ratio)/(L.r-L.l),0);
 box.style.maxWidth=Math.max(240,avail/sum-4)+'px'}
addEventListener('resize',()=>{const b=$('#scoreBox');if(b)b.dataset.key=''});
function scoreLoop(){if(lyrOpen&&lmode==='score'&&!au.paused)scoreTick();requestAnimationFrame(scoreLoop)}requestAnimationFrame(scoreLoop);
au.addEventListener('timeupdate',scoreTick);
function lyrHtml(t){if(!t)return ecard('lyrics','아직 고른 곡이 없습니다','곡을 틀면 여기에 지금 부르는 가사와 악보가 나옵니다.',`<button class="pill" data-golib>${svg('disc')}앨범에서 곡 고르기</button>`);
 let h=`<p class="lnum">${esc(t.album?(t.part||''):'내 곡')}</p><h2>${esc(label(t))}</h2>`;
 if(!t.album)return h+'<p class="empty">내 곡에는 가사가 없습니다.</p>';
 if(t.verse)h+=`<blockquote>${esc(t.verse)}</blockquote>`;
 const L=t.lyr||[]; if(!L.length)return h+'<p class="empty">가사가 없는 곡입니다 (관현악).</p>';
 let r=null; L.forEach(([who,line],i)=>{if(who!==r){r=who;if(who)h+=`<h3>${esc(who)}</h3>`}h+=`<p data-li="${i}">${esc(line)}</p>`});
 return h}
// 지금 부르는 가사 줄: 곡 자료에 줄마다 시작 시간(lyt)이 있으면 강조하고 따라 내려감
let lyrCur=-1;
function lyrTick(){if(!lyrOpen||lmode==='score')return;const t=queue[qi];if(!t||!t.lyt)return;
 const tm=au.currentTime+0.15;let i=-1;for(let j=0;j<t.lyt.length;j++){if(t.lyt[j]!=null&&t.lyt[j]<=tm)i=j}
 if(i===lyrCur)return;lyrCur=i;document.querySelectorAll('#lyrIn p.cur').forEach(p=>p.classList.remove('cur'));
 const p=$(`#lyrIn p[data-li="${i}"]`);if(p){p.classList.add('cur');p.scrollIntoView({block:'center',behavior:'smooth'})}}
au.addEventListener('timeupdate',lyrTick);
function showLyr(){const t=queue[qi];const sc=hasScore(t);if(!sc&&lmode==='score')lmode='lyr';
 $('#lmodes').innerHTML=sc?`<div class="seg"><button data-lmode="lyr" aria-pressed="${lmode==='lyr'}">가사</button><button data-lmode="score" aria-pressed="${lmode==='score'}">악보</button></div>`:'';
 $('#lyrIn').classList.toggle('wide',lmode==='score');$('#lyrIn').classList.toggle('timed',lmode!=='score'&&!!(t&&t.lyt));lyrCur=-1;
 if(lmode==='score'){$('#lyrIn').innerHTML=`<p class="sctitle">${esc(label(t))} · <span id="scpg"></span></p><div id="scoreBox"><p class="empty">악보 불러오는 중…</p></div>`;scoreTick()}
 else{$('#lyrIn').innerHTML=lyrHtml(t);lyrTick()}
 $('#lyr').scrollTop=0}
const PAGE={album:['앨범','disc'],mine:['내 곡','note'],lists:['재생 목록','list'],radio:['라디오','radio'],bible:['성경','book'],lyr:['가사·악보','lyrics']};
function navSel(){document.querySelectorAll('.bnav button').forEach(b=>b.setAttribute('aria-selected',lyrOpen?b.id==='navLyr':b.dataset.tab===tab));
 // 화면마다 이름·색을 바꿔서 지금 어디에 있는지 바로 보이게
 const pg=lyrOpen?'lyr':tab;if(document.body.dataset.tab!==pg){document.body.dataset.tab=pg;const P=PAGE[pg]||PAGE.album;$('#pgTitle').innerHTML=svg(P[1])+'<b>'+P[0]+'</b>';$('#bpick').hidden=!(pg==='album'||pg==='mine')}
 // 라디오·성경 화면에서는 아래 플레이어를 숨기고 메뉴만 (보라색이 겹쳐 헷갈리지 않게)
 const hide=!lyrOpen&&(tab==='radio'||tab==='bible');if(document.body.classList.contains('noplayer')!==hide){document.body.classList.toggle('noplayer',hide);try{fitPad()}catch(e){}}}
function openLyr(){lyrOpen=true;fitPad();showLyr();$('#lyr').classList.add('open');navSel()}
function closeLyr(){lyrOpen=false;$('#lyr').classList.remove('open');navSel()}
$('#blyr').onclick=openLyr;$('#lyrClose').onclick=closeLyr;
// ---------- 시트(재생 목록에 넣기) ----------
function sheet(h){$('#sheetIn').innerHTML=h;$('#sheet').classList.add('open')}
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet'||e.target.closest('[data-close]'))$('#sheet').classList.remove('open');
 const b=e.target.closest('[data-tolist]'); if(b){const [i,id]=b.dataset.tolist.split('|');lists[i].ids.push(id);LS.set('lists',lists);$('#sheet').classList.remove('open');toast(`「${lists[i].name}」에 넣었습니다`)}
 const n=e.target.closest('[data-newwith]'); if(n){const name=($('#sheetName').value||'').trim()||'새 목록';lists.push({name,ids:[n.dataset.newwith]});LS.set('lists',lists);$('#sheet').classList.remove('open');toast(`「${name}」을 만들었습니다`)}});

// ---------- 누르기 ----------
document.addEventListener('click',async e=>{
 const g=k=>e.target.closest('['+k+']'); let b;
 if(e.target.closest('#navLyr')){closeNP();openLyr();return}
 if(b=e.target.closest('.tabs button[data-tab]')){tab=b.dataset.tab;openList=null;closeNP();closeLyr();render();scrollTo(0,0);return}
 if(b=g('data-alb')){albumId=b.dataset.alb;LS.set('album',albumId);openDesc=null;render();return}
 if(e.target.closest('[data-offsave]')){const al=album(albumId);if(al)offSave(al,verOf(al));return}
 if(e.target.closest('[data-offstop]')){if(OFF.job)OFF.job.stop=true;return}
 if(e.target.closest('[data-offdel]')){const al=album(albumId);if(al)offDel(al,verOf(al));return}
 if(b=g('data-playalb')){const a=album(b.dataset.playalb);shuf=false;LS.set('shuf',false);$('#bshuf').classList.remove('on');setQueue(a.tracks.map(t=>({...t,album:a})),0,'album:'+a.id);return}
 if(b=g('data-playpart')){const a=album(b.dataset.from);const l=a.tracks.filter(t=>t.part===b.dataset.playpart).map(t=>({...t,album:a}));setQueue(l,0,'part:'+a.id);toast(b.dataset.playpart.split(' —')[0]+' 듣기');return}
 if(b=g('data-shufalb')){const a=album(b.dataset.shufalb);setQueue(a.tracks.map(t=>({...t,album:a})),0,'album:'+a.id,true);toast('섞어서 듣기');return}
 if(b=g('data-ver')){setVer(b.dataset.ver);return}
 if(b=g('data-lmode')){lmode=b.dataset.lmode;LS.set('lmode',lmode);showLyr();return}
 if(b=g('data-pick')){const id=b.dataset.pick;pick.has(id)?pick.delete(id):pick.add(id);render();return}
 if(e.target.id==='bpick'){pick=pick?null:new Set();if(pick&&tab==='lists')tab='album';render();return}
 if(e.target.id==='pickcancel'){pick=null;render();return}
 if(e.target.id==='pickplay'||e.target.id==='pickmix'){if(!pick||!pick.size){toast('곡을 먼저 고르세요');return}const m=allTracks();const l=[...pick].map(id=>m[id]).filter(Boolean);setQueue(l,0,'pick',e.target.id==='pickmix');return}
 if(e.target.id==='picksave'){if(!pick||!pick.size){toast('곡을 먼저 고르세요');return}sheet(`<h3>고른 ${pick.size}곡을 재생 목록으로</h3><div class="bar"><input type="text" id="sheetName" placeholder="목록 이름" maxlength="40"><button class="pill" id="picksave2">저장</button></div><button class="ghost" data-close>닫기</button>`);return}
 if(e.target.id==='picksave2'){const name=($('#sheetName').value||'').trim()||'고른 곡';lists.push({name,ids:[...pick]});LS.set('lists',lists);pick=null;$('#sheet').classList.remove('open');render();toast(`「${name}」을 만들었습니다`);return}
 if(pick&&(b=g('data-play'))){const id=b.dataset.play;pick.has(id)?pick.delete(id):pick.add(id);render();return}
 if(b=g('data-play')){const from=b.dataset.from;
  if(from==='mine'){const s=mine.find(x=>x.id===b.dataset.play);if(!s)return;const l=mineList(s);setQueue(l,l.indexOf(s),'mine:'+albOf(s))}
  else{const a=album(from);const l=a.tracks.map(t=>({...t,album:a}));setQueue(l,l.findIndex(t=>t.id===b.dataset.play),'album:'+a.id)} return}
 if(b=g('data-desc')){openDesc=openDesc===b.dataset.desc?null:b.dataset.desc;render();return}
 if(b=g('data-add')){const id=b.dataset.add;
  sheet(`<h3>재생 목록에 넣기</h3>${lists.map((L,i)=>`<button class="opt" data-tolist="${i}|${esc(id)}">${esc(L.name)} <small>(${L.ids.length}곡)</small></button>`).join('')}<div class="bar"><input type="text" id="sheetName" placeholder="새 목록 이름" maxlength="40"><button class="pill" data-newwith="${esc(id)}">새로 만들기</button></div><button class="ghost" data-close>닫기</button>`);return}
 if(b=g('data-playmine')){setQueue(mine,0,'mine');return}
 if(b=g('data-delmine')){const id=b.dataset.delmine;const s=mine.find(x=>x.id===id);delPending(s);return}
 if(b=g('data-openlist')){openList=+b.dataset.openlist;render();return}
 if(b=g('data-back')){openList=null;render();return}
 if(b=g('data-playlist')){const L=lists[+b.dataset.playlist];const m=allTracks();const l=L.ids.map(id=>m[id]).filter(Boolean);if(l.length)setQueue(l,0,'list'+b.dataset.playlist);return}
 if(b=g('data-playat')){const L=lists[openList];const m=allTracks();const l=L.ids.map(id=>m[id]).filter(Boolean);setQueue(l,+b.dataset.playat,'list'+openList);return}
 if(b=g('data-up')){const L=lists[openList],i=+b.dataset.up;if(i>0){[L.ids[i-1],L.ids[i]]=[L.ids[i],L.ids[i-1]];LS.set('lists',lists);render()}return}
 if(b=g('data-rm')){lists[openList].ids.splice(+b.dataset.rm,1);LS.set('lists',lists);render();return}
 if(b=g('data-dellist')){const i=+b.dataset.dellist;sheet(`<h3>「${esc(lists[i].name)}」 목록을 지울까요?</h3><p>곡 파일은 지워지지 않습니다.</p><div class="bar"><button class="pill" data-yesdel="${i}">지우기</button><button class="ghost" data-close>그만두기</button></div>`);return}
 if(b=g('data-yesdel')){lists.splice(+b.dataset.yesdel,1);LS.set('lists',lists);openList=null;$('#sheet').classList.remove('open');render();return}
 if(b=g('data-yesdelmine')){const id=b.dataset.yesdelmine;await DB.del(id);mine=mine.filter(x=>x.id!==id);$('#sheet').classList.remove('open');render();toast('지웠습니다');return}
 if(e.target.id==='addf'){addTo=null;$('#pick').click();return}
 // ----- 내 앨범 -----
 if(b=g('data-malb')){mineAlb=b.dataset.malb;LS.set('mineAlb',mineAlb);render();scrollTo(0,0);return}
 if(b=g('data-mback')){mineAlb=null;LS.set('mineAlb',null);render();return}
 if(b=g('data-mplay')){const l=mineAlbums().get(b.dataset.mplay)||[];if(l.length){shuf=false;LS.set('shuf',false);$('#bshuf').classList.remove('on');setQueue(l,0,'mine:'+b.dataset.mplay)}return}
 if(b=g('data-mmix')){const l=mineAlbums().get(b.dataset.mmix)||[];if(l.length){setQueue(l,0,'mine:'+b.dataset.mmix,true);toast('섞어서 듣기')}return}
 if(e.target.id==='newalb'){sheet(`<h3>새 앨범</h3><p>앨범 이름을 쓰고 「곡 고르기」를 누르세요.<br>그 폴더의 곡을 모두 골라 주세요. (첫 곡을 길게 누르면 여러 곡을 고를 수 있습니다)</p><div class="bar"><input type="text" id="albName" placeholder="앨범 이름 (예: 꼭 알아야 할 교향곡)" maxlength="60"><button class="pill" id="albgo">곡 고르기</button></div><button class="ghost" data-close>그만두기</button>`);return}
 if(e.target.id==='albgo'){const n=($('#albName').value||'').trim();if(!n){toast('앨범 이름을 써 주세요');return}if(n===NOALB){toast('다른 이름을 써 주세요');return}
  addTo=n;$('#sheet').classList.remove('open');$('#pick').click();return}
 if(b=g('data-maddto')){addTo=mineAlb===NOALB?null:mineAlb;$('#pick').click();return}
 if(b=g('data-mdelalb')){const l=mineAlbums().get(mineAlb)||[];sheet(`<h3>「${esc(mineAlb)}」 앨범을 지울까요?</h3><p>앨범 안의 ${l.length}곡이 이 앱에서 지워집니다. 휴대폰의 원래 파일은 그대로입니다.</p><div class="bar"><button class="pill" data-myesdelalb>지우기</button><button class="ghost" data-close>그만두기</button></div>`);return}
 if(b=g('data-myesdelalb')){const l=mineAlbums().get(mineAlb)||[];for(const s of l)await DB.del(s.id);const ids=new Set(l.map(s=>s.id));mine=mine.filter(x=>!ids.has(x.id));mineAlb=null;LS.set('mineAlb',null);$('#sheet').classList.remove('open');render();toast(`${l.length}곡을 지웠습니다`);return}
});
function delPending(s){sheet(`<h3>「${esc(s.title)}」을 지울까요?</h3><p>이 앱에서만 지워집니다. 휴대폰의 원래 파일은 그대로입니다.</p><div class="bar"><button class="pill" data-yesdelmine="${esc(s.id)}">지우기</button><button class="ghost" data-close>그만두기</button></div>`)}
document.addEventListener('submit',e=>{if(e.target.id!=='newl')return;e.preventDefault();const n=$('#lname').value.trim();if(!n)return;lists.push({name:n,ids:[]});LS.set('lists',lists);render();toast(`「${n}」을 만들었습니다`)});
$('#pick').addEventListener('change',async e=>{
 const fs=[...e.target.files];let ok=0;const to=addTo;addTo=null;
 if(!fs.length){e.target.value='';return}
 for(const [i,f] of fs.entries()){const id='my-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  if(fs.length>3)toast(`넣는 중… ${i+1} / ${fs.length}`);
  const dur=await new Promise(r=>{const a=new Audio();a.preload='metadata';a.onloadedmetadata=()=>{r(a.duration||0);URL.revokeObjectURL(a.src)};a.onerror=()=>r(0);a.src=URL.createObjectURL(f)});
  const s={id,title:f.name.replace(/\.[^.]+$/,''),blob:f,dur,added:Date.now()};
  if(to)s.alb=to;
  if(await DB.put(s)){mine.push(s);ok++}}
 e.target.value='';
 if(ok){mineAlb=to||NOALB;LS.set('mineAlb',mineAlb);tab='mine'}
 render();toast(ok?(to?`「${to}」에 ${ok}곡을 넣었습니다`:`${ok}곡을 넣었습니다`):'이 기기에서는 곡을 저장할 수 없습니다');
});


// ---------- 성부 듣기 (연습) ----------
// catalog 곡에 parts가 있으면: 반주 파일을 au(기준 시계)로 틀고, 성부 파일들은 따로 틀면서 au에 박자를 맞춤.
// 성부마다 끔·작게·보통. 파일: {media}/parts/{곡번호}_{k}.m4a
let partsOn=LS.get('partsOn',false), PL=LS.get('partLv',{}), PX=[], fadeF=1;
// 아이폰·아이패드는 소리 크기(volume)를 바꿀 수 없으므로, 「작게」가 필요할 때만 Web Audio 볼륨 조절(GainNode)로 돌림
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let AC=null; const GN=new Map();
function gainFor(el){if(GN.has(el))return GN.get(el);
 try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();el.crossOrigin='anonymous';const g=AC.createGain();AC.createMediaElementSource(el).connect(g).connect(AC.destination);GN.set(el,g);return g}catch(e){return null}}
function setVol(el,v){v=Math.max(0,Math.min(1,v));el.muted=v===0;
 if(GN.has(el)||(IOS&&v>0&&v<1)){const g=gainFor(el);if(g){try{el.volume=1}catch(e){}g.gain.value=v;if(AC.state!=='running')AC.resume().catch(()=>{});return}}
 try{el.volume=v}catch(e){}}
function setSrc(t){const s=trackSrc(t);if(partOn(t)||GN.has(au))au.crossOrigin='anonymous';else au.removeAttribute('crossorigin');au.src=s}
au.addEventListener('play',()=>{if(AC&&AC.state!=='running')AC.resume().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(AC&&!au.paused&&AC.state!=='running')AC.resume().catch(()=>{})});
const LV={0:'끔',1:'작게',2:'보통'}, LVV=[0,0.3,1];
const hasParts=t=>!!(t&&t.album&&t.album.media&&Array.isArray(t.parts)&&t.parts.length);
const partOn=t=>partsOn&&hasParts(t);
const partUrl=(t,k)=>`${t.album.media}/parts/${String(t.n).padStart(2,'0')}_${k}.${t.album.partExt||'m4a'}`;
const lvOf=(t,k)=>{const v=(PL[t.id]||{})[k];return v==null?2:v};
function accVol(t){return LVV[lvOf(t,'acc')]}
function applyPartVols(){const t=queue[qi];
 setVol(au,partOn(t)?accVol(t)*fadeF:fadeF);
 for(const x of PX)setVol(x.el,LVV[lvOf(t,x.k)]*fadeF)}
function partsStop(){for(const x of PX){try{x.el.pause();x.el.removeAttribute('src');x.el.load()}catch(e){}}PX=[]}
function partsSetup(t){partsStop();if(!partOn(t))return;
 for(const p of t.parts){if(p.k==='acc')continue;const el=new Audio();el.preload='auto';el.crossOrigin='anonymous';el.src=partUrl(t,p.k);
  el.addEventListener('playing',()=>partSync());PX.push({k:p.k,el})}
 applyPartVols()}
function partSync(force){if(!PX.length)return;const c=au.currentTime;
 for(const x of PX){const el=x.el;
  if(au.paused){if(!el.paused)el.pause();continue}
  if(el.paused&&!el.ended){try{el.currentTime=c}catch(e){}el.play().catch(()=>{});continue}
  const d=el.currentTime-c, ad=Math.abs(d);
  if(ad>(force?0.15:0.3)){el.playbackRate=1;try{el.currentTime=c+0.03}catch(e){}}   // 많이 어긋나면 그 자리로 옮김
  else el.playbackRate=ad>0.02?Math.max(0.94,Math.min(1.06,1-d*0.6)):1}}            // 조금 어긋나면 살짝 빠르게·느리게 해서 소리 끊김 없이 맞춤
au.addEventListener('play',()=>partSync(true));au.addEventListener('pause',()=>partSync());
au.addEventListener('seeked',()=>partSync(true));au.addEventListener('timeupdate',()=>partSync());
au.addEventListener('ended',()=>{for(const x of PX)x.el.pause()});
setInterval(()=>{if(!au.paused)partSync()},250);
function setPartsOn(v){const t=queue[qi];partsOn=v;LS.set('partsOn',v);
 if(t&&t.album&&hasParts(t)){const pos=au.currentTime,pl=!au.paused;setSrc(t);partsSetup(t);
  au.addEventListener('loadedmetadata',()=>{au.currentTime=pos;if(pl)au.play().catch(()=>{})},{once:true});$('#psub').textContent=sub(t)}
 applyPartVols();syncNP();partsSheet();toast(v?'성부 듣기: 켬':'성부 듣기: 끔 (보통 듣기)')}
function setLv(k,v){const t=queue[qi];if(!t)return;PL[t.id]=PL[t.id]||{};PL[t.id][k]=v;LS.set('partLv',PL);applyPartVols();partsSheet()}
function soloPart(k){const t=queue[qi];if(!t)return;const o={};for(const p of t.parts)o[p.k]=p.k===k||p.k==='acc'?2:1;PL[t.id]=o;LS.set('partLv',PL);applyPartVols();partsSheet();
 toast(`「${t.parts.find(p=>p.k===k).name}」 크게, 다른 성부는 작게`)}
function partsSheet(){const t=queue[qi];if(!hasParts(t)){if($('#sheet').classList.contains('open')&&$('#partsBox'))$('#sheet').classList.remove('open');return}
 const rows=t.parts.map(p=>{const v=lvOf(t,p.k);return `<div class="prow"><button class="pname" data-psolo="${p.k}"${p.k==='acc'||!partsOn?' disabled':''}>${esc(p.name)}</button><div class="seg" role="group" aria-label="${esc(p.name)} 소리">${[0,1,2].map(i=>`<button data-plv="${p.k}|${i}" aria-pressed="${v===i}"${partsOn?'':' disabled'}>${LV[i]}</button>`).join('')}</div></div>`}).join('');
 const h=`<div id="partsBox"><h3>성부 듣기 · ${esc(label(t))}</h3>
 <div class="seg wide" role="group" aria-label="성부 듣기"><button data-pon="1" aria-pressed="${partsOn}">성부 듣기 켜기</button><button data-pon="0" aria-pressed="${!partsOn}">보통 듣기</button></div>
 <p class="phelp">${partsOn?'성부 이름을 누르면 그 성부만 크게, 다른 성부는 작게 들립니다.':'켜면 성부마다 끄고 켜며 들을 수 있습니다 (인터넷 연결 필요).'}</p>${rows}
 <div class="bar"><button class="ghost" data-pall="1"${partsOn?'':' disabled'}>모두 보통으로</button><button class="pill" data-close>닫기</button></div></div>`;
 if($('#sheet').classList.contains('open')&&$('#partsBox'))$('#sheetIn').innerHTML=h;else sheet(h)}
$('#sheet').addEventListener('click',e=>{const t=queue[qi];
 const on=e.target.closest('[data-pon]');if(on){const v=on.dataset.pon==='1';if(v!==partsOn)setPartsOn(v);return}
 const lv=e.target.closest('[data-plv]');if(lv){const [k,v]=lv.dataset.plv.split('|');setLv(k,+v);return}
 const so=e.target.closest('[data-psolo]');if(so){soloPart(so.dataset.psolo);return}
 if(e.target.closest('[data-pall]')&&t){delete PL[t.id];LS.set('partLv',PL);applyPartVols();partsSheet()}});
$('#npParts').onclick=()=>partsSheet();

// ---------- 큰 재생 화면 ----------
let npOpen=false;
function syncNP(){if(!npOpen)return;const t=queue[qi];
 $('#npTitle').textContent=$('#ptitle').textContent;$('#npSub').textContent=$('#psub').textContent;
 const img=$('#pimg').getAttribute('src')||'';if($('#npImg').getAttribute('src')!==img)$('#npImg').src=img;
 $('#npSrc').textContent=queue.length&&t?`${qi+1} / ${queue.length}`:'';
 const d=au.duration||0;$('#npCur').textContent=fmt(au.currentTime);$('#npDur').textContent=fmt(d);if(d&&!npSeeking)$('#npPos').value=au.currentTime/d*1000;
 $('#npPlay').innerHTML=svg(au.paused?'play':'pause');$('#npPlay').setAttribute('aria-label',au.paused?'재생':'멈춤');
 $('#npShuf').classList.toggle('on',shuf);$('#npRep').innerHTML=svg(repeat==='one'?'repeat1':'repeat')+({all:'전체 반복',one:'한 곡 반복',off:'반복 끔'})[repeat];$('#npRep').classList.toggle('on',repeat!=='off');
 const hp=hasParts(t);$('#npParts').hidden=!hp;if(hp){$('#npParts').innerHTML=svg('parts')+(partsOn?'성부 켬':'성부');$('#npParts').classList.toggle('on',partsOn)}
 $('#npSleep').innerHTML=svg('moon')+(sleepAt?`${Math.max(1,Math.ceil((sleepAt-Date.now())/60000))}분 뒤`:sleepEnd?'곡 끝나면':'타이머');$('#npSleep').classList.toggle('on',!!(sleepAt||sleepEnd))}
function openNP(){closeLyr();npOpen=true;$('#np').classList.add('open');syncNP()}
function closeNP(){npOpen=false;$('#np').classList.remove('open')}
$('#ptOpen').onclick=openNP;$('#ptOpen').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openNP()}};
$('#npClose').onclick=closeNP;
let npSeeking=false;
$('#npPos').addEventListener('input',()=>{npSeeking=true;if(au.duration)$('#npCur').textContent=fmt($('#npPos').value/1000*au.duration)});
$('#npPos').addEventListener('change',()=>{if(au.duration)au.currentTime=$('#npPos').value/1000*au.duration;npSeeking=false});
function skip(s){if(au.duration)au.currentTime=Math.max(0,Math.min(au.duration-0.5,au.currentTime+s));syncNP()}
$('#npBack').onclick=()=>skip(-10);$('#npFwd').onclick=()=>skip(10);
$('#npPlay').onclick=()=>$('#bplay').click();$('#npPrev').onclick=prev;$('#npNext').onclick=()=>next(false);
$('#npShuf').onclick=()=>{$('#bshuf').click();syncNP()};$('#npRep').onclick=()=>{$('#brep').click();syncNP()};
$('#npLyr').onclick=()=>{closeNP();openLyr()};$('#npInfo').onclick=()=>$('#binfo').click();
for(const ev of ['play','pause','timeupdate','loadedmetadata','emptied'])au.addEventListener(ev,syncNP);

// ---------- 잠들기 타이머 ----------
let sleepAt=0,sleepEnd=false;
function setSleep(m){sleepEnd=m==='end';sleepAt=typeof m==='number'?Date.now()+m*60000:0;fadeF=1;applyPartVols();
 $('#sheet').classList.remove('open');syncNP();toast(m==='end'?'이 곡이 끝나면 멈춥니다':m?`${m}분 뒤에 멈춥니다`:'잠들기 타이머를 껐습니다')}
function sleepTick(){if(!sleepAt)return;const left=sleepAt-Date.now();
 if(left<=0){sleepAt=0;au.pause();fadeF=1;applyPartVols();syncNP();toast('잠들기 타이머: 멈췄습니다');return}
 fadeF=left<10000?Math.max(0,left/10000):1;applyPartVols();} // 마지막 10초는 소리를 천천히 줄임
setInterval(sleepTick,1000);au.addEventListener('timeupdate',sleepTick);
au.addEventListener('play',()=>{if(!sleepAt){fadeF=1;applyPartVols()}});
$('#npSleep').onclick=()=>sheet(`<h3>잠들기 타이머</h3><p>정한 때가 되면 소리를 천천히 줄이고 멈춥니다.</p>${[15,30,45,60,90].map(m=>`<button class="opt" data-sleep="${m}">${m}분 뒤</button>`).join('')}<button class="opt" data-sleep="end">이 곡이 끝나면</button>${sleepAt||sleepEnd?'<button class="opt" data-sleep="0">타이머 끄기</button>':''}<button class="ghost" data-close style="margin-top:10px">닫기</button>`);
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-sleep]');if(!b)return;const v=b.dataset.sleep;setSleep(v==='end'?'end':+v)});

// ---------- 설정: 글자 크기 · 화면 밝기 ----------
let zoomV=LS.get('zoom',1),themeV=LS.get('theme','light'),fontV=LS.get('font','sans');
const FONTS={sans:'"Noto Sans KR"',serif:'"Noto Serif KR",serif',sys:'system-ui'};
function applySet(){document.documentElement.style.setProperty('--z',zoomV);document.documentElement.style.setProperty('--font',FONTS[fontV]||FONTS.sans);
 const th=themeV==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):themeV;document.documentElement.dataset.theme=th;
 document.querySelector('meta[name=theme-color]')?.setAttribute('content',th==='dark'?'#120e22':'#f7f4fc');fitPad()}
$('#bset').onclick=()=>{const seg=(k,cur,opts)=>`<div class="seg">${opts.map(([v,n])=>`<button data-set="${k}:${v}" aria-pressed="${String(cur)===String(v)}">${n}</button>`).join('')}</div>`;
 sheet(`<h3>설정</h3><p class="setrow">글자 크기</p>${seg('zoom',zoomV,[[1,'보통'],[1.15,'크게'],[1.3,'아주 크게']])}<p class="setrow">글꼴</p>${seg('font',fontV,[['sans','고딕'],['serif','명조'],['sys','휴대폰 글꼴']])}<p class="setrow">화면</p>${seg('theme',themeV,[['light','밝게'],['dark','어둡게'],['auto','휴대폰 따라']])}
 <p class="setrow">도움</p><button class="opt" data-help>${svg('help')}도움말</button><button class="opt" data-intro>${svg('play')}처음 안내 다시 보기</button>${reportBtn()}
 <p class="setver">주찬양 플레이어 · 판 ${esc(window.BUILD||'')}</p><button class="pill" data-close style="margin-top:14px">닫기</button>`)};
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-set]');if(!b)return;const [k,v]=b.dataset.set.split(':');
 if(k==='zoom'){zoomV=+v;LS.set('zoom',zoomV)}else if(k==='font'){fontV=v;LS.set('font',fontV)}else{themeV=v;LS.set('theme',themeV)}applySet();
 b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))});

// 재생 막대 높이에 맞춰 아래 여백 맞추기 (글자 크기를 바꿔도 가리지 않게)
function fitPad(){const h=$('#dock').offsetHeight,pb=pick?$('#pickbar').offsetHeight:0;document.documentElement.style.setProperty('--hh',$('header.top').offsetHeight+'px');
 document.body.style.paddingBottom=(h+pb+24)+'px';$('#pickbar').style.bottom=h+'px';$('#toast').style.bottom=(h+pb+16)+'px';$('#lyr').style.bottom=Math.max(0,h-14)+'px'}
addEventListener('resize',fitPad);

// ---------- 곡 사이 끊김 줄이기: 다음 곡을 미리 받아 둠 ----------
const pre=new Audio();pre.preload='auto';pre.muted=true;
function warmNext(){const n=queue[qi+1]||(repeat==='all'?queue[0]:null);if(!n||n.blob||n===queue[qi])return;const s=trackSrc(n);if(s&&pre.src!==new URL(s,location.href).href){pre.src=s;try{pre.load()}catch(e){}}}
au.addEventListener('canplaythrough',warmNext);

// ---------- 처음 안내 · 도움말 · 문제 알리기 · 별점 ----------
const INTRO=[
 ['듣기',`앨범에서 곡을 누르거나 <b>「차례로」</b>를 누르세요.<br>아래 재생 막대를 누르면 <b>큰 재생 화면</b>이 열립니다. 화면을 꺼도, 차에서도 계속 들립니다.`],
 ['반주 · 가사 · 악보',`<b>반주 고르기</b>에서 앙상블·피아노·관현악을 바꿀 수 있습니다.<br>아래 메뉴 <b>「가사·악보」</b>를 누르면 지금 부르는 줄이 보입니다.`],
 ['인터넷 없이 · 내 곡',`앨범 위 <b>「저장하기」</b>를 누르면 인터넷 없이 들을 수 있습니다.<br><b>「내 곡」</b>에는 휴대폰의 음악 파일을 넣어 들을 수 있습니다.`]];
function intro(i=0){const [h,b]=INTRO[i];sheet(`<div class="intro"><p class="step">${i+1} / ${INTRO.length}</p><h3>${h}</h3><p>${b}</p>
 <div class="bar">${i<INTRO.length-1?`<button class="pill" data-introgo="${i+1}">다음</button><button class="ghost" data-introend>건너뛰기</button>`:`<button class="pill" data-introend>시작하기</button>`}</div></div>`)}
const HELP=[['곡이 안 나와요','인터넷을 확인하세요. 앨범 위 「저장하기」를 해 두면 인터넷 없이 들립니다.'],
 ['차에서 다음 곡으로 넘기기','블루투스로 연결하면 운전대의 다음·이전 단추가 그대로 됩니다.'],
 ['반주를 바꾸면?','지금 듣던 자리에서 그대로 이어집니다.'],
 ['성부 듣기','큰 재생 화면의 「성부」를 누르면 소프라노·알토·테너·베이스를 따로 켜고 끄며 연습할 수 있습니다 (준비된 곡부터).'],
 ['잠들기 타이머','큰 재생 화면의 「타이머」 — 정한 시간이 되면 소리를 천천히 줄이고 멈춥니다.'],
 ['글자가 작아요','오른쪽 위 설정 → 글자 크기 「크게」·「아주 크게」.'],
 ['내 곡은 어디에 저장되나요?','이 기기 안에만 저장됩니다. 다른 사람에게 보이지 않습니다.']];
function help(){sheet(`<h3>도움말</h3>${HELP.map(([q,a])=>`<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}<button class="pill" data-close style="margin-top:14px">닫기</button>`)}
function reportText(){const L=ERR.list.slice(-15).map(e=>`${e.t} [판 ${e.b}] ${e.m}`).join('\n')||'(기록된 문제 없음)';
 return `어떤 문제가 있었는지 적어 주세요:\n\n\n---- 자동으로 붙는 정보 ----\n판: ${window.BUILD||''}\n기기: ${navigator.userAgent}\n듣던 곡: ${queue[qi]?label(queue[qi]):''}\n최근 문제 기록:\n${L}`}
// 받는 주소는 곡 목록(catalog.json)의 contact — 앱 업데이트 없이 바꿀 수 있음. 없으면 기록 복사 단추
function reportBtn(){const c=CAT.contact;return c?`<a class="opt" href="mailto:${esc(c)}?subject=${encodeURIComponent('주찬양 플레이어 문제 알림')}&body=${encodeURIComponent(reportText())}">${svg('mail')}문제 알리기 (메일)</a>`:`<button class="opt" data-copyerr>${svg('mail')}문제 기록 복사하기</button>`}
const PLAY_URL='https://play.google.com/store/apps/details?id=org.eshel.chanyang';
function askRate(){if(!NATIVE||LS.get('rated',false))return;const n=LS.get('rateAsk',0);if(n>=2)return;LS.set('rateAsk',n+1);
 setTimeout(()=>sheet(`<h3>앨범을 끝까지 들으셨네요</h3><p>은혜가 되셨다면 별점과 한 줄 평을 남겨 주세요. 다른 분들이 이 음악을 찾는 데 큰 힘이 됩니다.</p>
 <div class="bar"><a class="pill" href="${PLAY_URL}" target="_blank" rel="noopener" data-rated>${svg('star')}별점 남기기</a><button class="ghost" data-close>나중에</button></div>`),800)}
$('#sheet').addEventListener('click',e=>{
 const g=e.target.closest('[data-introgo]');if(g){intro(+g.dataset.introgo);return}
 if(e.target.closest('[data-introend]')){LS.set('intro1',true);$('#sheet').classList.remove('open');return}
 if(e.target.closest('[data-intro]')){intro(0);return}
 if(e.target.closest('[data-help]')){help();return}
 if(e.target.closest('[data-copyerr]')){const s=reportText();(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast('문제 기록을 복사했습니다 — 메일·문자에 붙여 넣어 보내 주세요')).catch(()=>toast('복사하지 못했습니다'));return}
 if(e.target.closest('[data-rated]')){LS.set('rated',true);$('#sheet').classList.remove('open')}});

// ---------- 주찬양 라디오 ----------
// 1단계 「끝없이 섞어 듣기」 / 2단계 「시간표 라디오」: 시간대마다 프로그램, 같은 지역(시간대)에서는 모두 같은 시각에 같은 곡
// 날마다 새 방송표: radio.json(저장소)의 days[날짜] → 없으면 교회력·주제 돌림으로 앱이 스스로
let RADIO=LS.get('radio',null);
const RADIO_DEF={themes:[{id:'comfort',name:'위로',tracks:[4,9,10,22,23,21],verse:4},{id:'hope',name:'소망',tracks:[21,22,23,25,12],verse:21},{id:'victory',name:'이김',tracks:[6,15,16,24,13,18],verse:24},{id:'worship',name:'예배와 찬양',tracks:[8,10,11,18,16,13],verse:8},{id:'wait',name:'기다림',tracks:[25,19,14,3,7],verse:25},{id:'repent',name:'처음 사랑',tracks:[5,2,17,20],verse:5},{id:'kingdom',name:'하나님의 나라',tracks:[13,20,21,24],verse:13},{id:'thanks',name:'감사',tracks:[18,10,12,8,13,24],verse:18}],
 seasons:{advent:'wait',christmas:'worship',lent:'repent',easter:'victory',thanksgiving:'thanks'},ordinary:['comfort','worship','hope','victory','kingdom','repent'],days:{}};
const RD=()=>RADIO&&RADIO.themes?RADIO:RADIO_DEF;
function easterOf(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
function seasonOf(d){const y=d.getFullYear(),day=new Date(y,d.getMonth(),d.getDate()),DAY=864e5;
 const xmas=new Date(y,11,25),adv1=new Date(xmas.getTime()-((xmas.getDay()||7)+21)*DAY);
 if(day>=adv1&&day<new Date(y,11,24))return 'advent';
 if(day>=new Date(y,11,24)||day<=new Date(y,0,6))return 'christmas';
 const E=easterOf(y);if(day>=new Date(E.getTime()-46*DAY)&&day<E)return 'lent';
 if(day>=E&&day<new Date(E.getTime()+49*DAY))return 'easter';
 if(d.getMonth()===10&&d.getDay()===4&&d.getDate()>=22&&d.getDate()<=28)return 'thanksgiving';
 return ''}
const SEASON_NAME={advent:'대림절',christmas:'성탄절',lent:'사순절',easter:'부활절기',thanksgiving:'추수감사절'};
function radioDay(d){const x=new Date(d);if(x.getHours()<5)x.setDate(x.getDate()-1);return x}
function dayKey(d){const x=radioDay(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
function dayPlan(d=new Date()){const R=RD(),k=dayKey(d),x=radioDay(d),D=(R.days||{})[k],th=id=>R.themes.find(t=>t.id===id);
 const s=seasonOf(x);let T=D&&th(D.theme);
 if(!T&&s&&R.seasons&&R.seasons[s])T=th(R.seasons[s]);
 if(!T){const o=R.ordinary||R.themes.map(t=>t.id);T=th(o[Math.floor(x.getTime()/864e5)%o.length])||R.themes[0]}
 return {key:k,theme:T,title:(D&&D.title)||SEASON_NAME[s]||'',greeting:(D&&D.greeting)||'',verse:(D&&D.verse)||T.verse,order:(D&&D.order)||T.tracks,notes:(D&&D.notes)||{},fresh:!!D}}
async function loadRadio(isWeb){try{const u=isWeb?'radio.json':'https://raw.githubusercontent.com/j63cho/Chanyang-media/main/radio.json?t='+Date.now();
 const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);const r=await fetch(u,{signal:ctl.signal,cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.themes){RADIO=j;LS.set('radio',j)}}}catch(e){}}
const PROGS=[
 {id:'sun',name:'주일 예배 준비',desc:'예배 전, 마음을 여는 찬양',days:[0],from:6,to:11,ver:'B',order:'album'},
 {id:'morn',name:'아침 말씀',desc:'곡마다 말씀 한 구절과 함께 여는 아침',from:5,to:9,ver:'B',order:'album'},
 {id:'rest',name:'낮의 쉼',desc:'잔잔한 피아노 반주로 듣는 한낮',from:9,to:17,ver:'A',order:'mix'},
 {id:'eve',name:'위로와 소망',desc:'하루를 마치며 듣는 관현악 오라토리오',from:17,to:22,ver:'C',order:'album'},
 {id:'night',name:'밤의 평안',desc:'조용히 잠드는 시간 — 잠들기 타이머와 함께',from:22,to:29,ver:'A',order:'mix'}];
function progAt(d){const h=d.getHours(),hh=h<5?h+24:h,day=(h<5?(d.getDay()+6)%7:d.getDay());
 return PROGS.find(P=>P.days&&P.days.includes(day)&&hh>=P.from&&hh<P.to)||PROGS.find(P=>!P.days&&hh>=P.from&&hh<P.to)||PROGS[2]}
function progStart(P,d){const s=new Date(d);if(d.getHours()<5)s.setDate(s.getDate()-1);s.setHours(P.from%24,0,0,0);if(P.from>=24)s.setDate(s.getDate()+1);return s.getTime()}
function seeded(seed){let x=seed|0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%100000)/100000}}
function progPool(P,d){let l=[];for(const a of CAT.albums)for(const t of a.tracks)if(t.src||a.media)l.push({...t,album:a,rv:P.ver,rp:P.name});
 if(P.order==='mix'){const s=new Date(progStart(P,d));const r=seeded(s.getFullYear()*10000+(s.getMonth()+1)*100+s.getDate()+P.from);for(let i=l.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[l[i],l[j]]=[l[j],l[i]]}}
 // 오늘의 주제 곡을 앞에 (첫 앨범 기준 곡 번호)
 const D=dayPlan(d),first=CAT.albums[0]&&CAT.albums[0].id,top=[];
 for(const n of D.order){const i=l.findIndex(t=>t.album.id===first&&String(t.n)===String(n));if(i>=0)top.push(l.splice(i,1)[0])}
 // 이번 주일 렉셔너리 본문과 이어지는 곡을 맨 앞에
 try{const rs=rclSongs(rclNext(d));for(const r of rs.reverse()){const i=l.findIndex(t=>t.album.id===r.album.id&&String(t.n)===String(r.n));if(i>=0)top.unshift(l.splice(i,1)[0])}}catch(e){}
 return top.concat(l)}
const durOf=t=>parseFloat(t.dur)||120;
function radioNow(d=new Date()){const P=progAt(d),pool=progPool(P,d);if(!pool.length)return null;
 const total=pool.reduce((s,t)=>s+durOf(t),0);let off=((d.getTime()-progStart(P,d))/1000)%total;let i=0;
 while(i<pool.length-1&&off>=durOf(pool[i])){off-=durOf(pool[i]);i++}return {P,pool,i,off}}
const rawVer=t=>{const a=t.album;return t.rv&&a&&(a.versions||[]).find(x=>x.id===t.rv&&(x.local||a.media))||verOf(a)};
function radioTune(play){const R=radioNow();if(!R){toast('라디오에 틀 곡이 없습니다');return}
 const l=[...R.pool.slice(R.i),...R.pool.slice(0,R.i)];l.src='radio';l.prog=R.P.id;queue=l;qi=0;
 const off=R.off;au.addEventListener('loadedmetadata',()=>{if(off>2&&off<(au.duration||0)-3)au.currentTime=off},{once:true});
 load(play!==false);toast(`주찬양 라디오 — 「${R.P.name}」`)}
function radioMix(){const l=[];for(const a of CAT.albums)for(const t of a.tracks)if(t.src||a.media)l.push({...t,album:a,rp:'끝없이 섞어 듣기'});
 const s=shuffled(l,-1);s.src='radio-mix';queue=s;qi=0;load(true)}
// ---------- 렉셔너리(RCL) A·B·C — 이번 주일 본문 ----------
let RCL=LS.get('rcl',null);
async function loadRcl(isWeb){const urls=isWeb?['rcl.json']:['https://raw.githubusercontent.com/j63cho/Chanyang-media/main/rcl.json?t='+Date.now(),'rcl.json'];
 for(const u of urls){try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);const r=await fetch(u,{signal:ctl.signal,cache:'no-store'});
  if(r.ok){const j=await r.json();if(j&&j.A&&j.B&&j.C){RCL=j;LS.set('rcl',j);return}}}catch(e){}}}
const ORD=['','첫째','둘째','셋째','넷째','다섯째','여섯째','일곱째','여덟째','아홉째','열째','열한째','열두째','열셋째','열넷째','열다섯째','열여섯째','열일곱째','열여덟째','열아홉째','스무째','스물한째','스물두째','스물셋째','스물넷째','스물다섯째','스물여섯째','스물일곱째','스물여덟째'];
const RCL_NAME={xmaseve:'성탄 전야',xmas:'성탄절',chr1:'성탄 후 첫째 주일',chr2:'성탄 후 둘째 주일',epiph:'주현절',epi1:'주님의 세례 주일',transf:'산상변모 주일',ash:'재의 수요일',palm:'종려·수난 주일',maundy:'성목요일',goodfri:'성금요일',easter:'부활절',ascen:'주님의 승천일',pent:'성령강림절',trinity:'삼위일체 주일',p29:'그리스도 왕 주일',allsaints:'모든 성도의 날',thanks:'추수감사절'};
function rclDate(y,m,d){return new Date(y,m,d)}
function rclAdv1(y){const x=rclDate(y,10,27);x.setDate(27+(7-x.getDay())%7);return x}
const rclDays=(a,b)=>Math.round((a-b)/864e5);
// 날짜 하나의 렉셔너리 자리: {y:'A'|'B'|'C', key, name}
function rclKey(day){const d=rclDate(day.getFullYear(),day.getMonth(),day.getDate());
 let Y=d.getFullYear();if(d<rclAdv1(Y))Y--;const y='ABC'[((Y-2025)%3+3)%3];
 const A1=rclAdv1(Y),E=easterOf(Y+1),dE=rclDays(d,E),m=d.getMonth(),dd=d.getDate(),sun=d.getDay()===0;
 const nm=(key,name)=>({y,key,name:name||RCL_NAME[key]});
 // 정해진 날
 if(m===11&&dd===24)return nm('xmaseve');if(m===11&&dd===25)return nm('xmas');if(m===0&&dd===6)return nm('epiph');
 if(dE===-46)return nm('ash');if(dE===-3)return nm('maundy');if(dE===-2)return nm('goodfri');if(dE===39)return nm('ascen');
 if(m===10&&dd===1&&!sun)return nm('allsaints');
 if(m===10&&d.getDay()===4&&dd>=22&&dd<=28)return nm('thanks');
 if(!sun)return null;
 const w=rclDays(d,A1)/7;if(w>=0&&w<4)return nm('adv'+(w+1),`대림절 ${ORD[w+1]} 주일`);
 if((m===11&&dd>=26)||(m===0&&dd===1))return nm('chr1');
 if(m===0&&dd>=2&&dd<=5)return nm('chr2');
 const ep=rclDate(Y+1,0,6),b1=rclDate(Y+1,0,6+((7-ep.getDay())%7||7));
 if(dE===-49)return nm('transf');
 if(d>=b1&&dE<-49){const n=rclDays(d,b1)/7+1;return n===1?nm('epi1'):nm('epi'+n,`주현 후 ${ORD[n]} 주일`)}
 if(dE>=-42&&dE<=-14)return nm('lent'+(dE/7+7),`사순절 ${ORD[dE/7+7]} 주일`);
 if(dE===-7)return nm('palm');if(dE===0)return nm('easter');
 if(dE>=7&&dE<=42)return nm('east'+(dE/7+1),`부활절 ${ORD[dE/7+1]} 주일`);
 if(dE===49)return nm('pent');if(dE===56)return nm('trinity');
 if(dE>56){const p=d<rclDate(Y+1,4,29)?3:4+Math.floor(rclDays(d,rclDate(Y+1,4,29))/7);
  return nm('p'+p,p===29?RCL_NAME.p29:`성령강림 후 ${ORD[(dE-49)/7]} 주일`)}
 return null}
// 오늘이 절기 날이면 오늘, 아니면 다가오는 주일
function rclNext(now=new Date()){const d=rclDate(now.getFullYear(),now.getMonth(),now.getDate());
 for(let i=0;i<8;i++){const x=new Date(d);x.setDate(d.getDate()+i);const k=rclKey(x);if(k&&(i===0||x.getDay()===0))return {...k,date:x,today:i===0}}return null}
function rclEntry(k){return k&&RCL&&RCL[k.y]&&RCL[k.y][k.key]}
// 곡과 본문 잇기: 곡의 rcl 표시(예 "B:adv1") 또는 앨범 책(book)·곡 구절(장:절)이 본문 범위와 겹치면
function rclRefs(e){const out=[];for(const s of [e.o,e.p,e.o2,e.p2,e.e,e.g].filter(Boolean))for(const part of s.split(/ 또는 |; /)){const m=part.match(/^([가-힣]+)(?:\([^)]*\))? (\d+)(?::([\d,\s\-a-c()]+))?/);if(m)out.push({b:m[1],c:+m[2],v:m[3]||''})}return out}
function rclSongs(k){const e=rclEntry(k);if(!e)return [];const refs=rclRefs(e),tag=k.y+':'+k.key,out=[];
 for(const a of CAT.albums)for(const t of a.tracks){if(!(t.src||a.media))continue;
  if((t.rcl||[]).includes(tag)||(t.rcl||[]).includes('*:'+k.key)){out.push({...t,album:a});continue}
  if(!a.book||!t.verse)continue;const m=String(t.verse).match(/\((\d+):(\d+)/);if(!m)continue;const c=+m[1],v=+m[2];
  if(refs.some(r=>r.b===a.book&&r.c===c&&(()=>{const nums=(r.v.match(/\d+/g)||[]).map(Number);return !nums.length||(v>=Math.min(...nums)-1&&v<=Math.max(...nums)+1)})()))out.push({...t,album:a})}
 return out}
function rclHtml(){const k=rclNext();const e=rclEntry(k);if(!e)return '';
 const dt=k.date,ds=`${dt.getMonth()+1}월 ${dt.getDate()}일`,songs=rclSongs(k);
 const row=(l,r)=>r?`<li><small>${l}</small><button class="bref" data-bref="${esc(r)}" data-btitle="${esc(k.name+' · '+l.replace(/ [①②]/,''))}">${esc(r)}</button></li>`:'';
 const two=e.o2?`<li class="rtrack"><small>본문 선택</small><span>이어 읽기 본문과 복음에 맞춘 본문 가운데 하나를 고릅니다.</span></li>${row('구약 ①',e.o)}${row('시편 ①',e.p)}${row('구약 ②',e.o2)}${row('시편 ②',e.p2)}`:`${row(/^사도행전/.test(e.o)?'첫째 본문':'구약',e.o)}${row('시편',e.p)}`;
 return `<div class="rcl"><div class="rclh"><span class="chip">${k.today?'오늘':'이번 주일'} · ${ds}</span><span class="chip soft">${k.y}해</span></div>
 <h3>${esc(k.name)}</h3><ul>${two}${row('서신',e.e)}${row('복음',e.g)}</ul>
 ${songs.length?`<div class="rclsongs"><small>이 본문과 이어지는 곡</small>${songs.slice(0,4).map(t=>`<button class="rsong" data-rclplay="${esc(t.album.id)}|${esc(t.n)}">${svg('play')}${esc(label(t))}</button>`).join('')}</div>`:''}
 <p class="rclsrc">개정공동성구집(RCL) · 본문 목록 밴더빌트 신학대학 도서관</p></div>`}
// ---------- 성경 읽기 (개역한글) ----------
let BIDX=null;const BCACHE={};let bpos=LS.get('bpos',{i:0,c:1});
async function bIndex(){if(BIDX)return BIDX;try{BIDX=await (await fetch('bible/index.json')).json()}catch(e){}return BIDX}
async function bBook(i){if(BCACHE[i])return BCACHE[i];const r=await fetch(`bible/${String(i+1).padStart(2,'0')}.json`);if(!r.ok)throw new Error('bible '+i);return BCACHE[i]=await r.json()}
// "이사야 58:1-9a, (9b-12)" "시편 42·43" "창세기 2:15-17; 3:1-7" "마가복음 11:1-11 또는 요한복음 12:12-16"
function bParse(s){const out=[];
 for(const opt of String(s).split(/ 또는 |; (?=[가-힣])/)){
  const m=opt.trim().match(/^([가-힣]+)(\([^)]*\))?(?: (.+))?$/);if(!m)continue;
  const i=BIDX.books.findIndex(b=>b[0]===m[1]);if(i<0){out.push({label:opt.trim(),missing:true});continue}
  const spec=(m[3]||'').replace(/[()]/g,'').replace(/(\d)[a-c]\b/g,'$1').replace(/\s+/g,' ').trim();
  const segs=[];let ch=null;
  if(spec&&!spec.includes(':')){for(const c of spec.split(/[·,]\s*/))if(+c)segs.push([+c,1,+c,999])}
  else for(let part of spec.split(/[;,]\s*/)){part=part.trim();if(!part)continue;
   let r=part.match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
   if(r){ch=+r[1];const c2=r[3]?+r[3]:ch,v2=r[4]?+r[4]:+r[2];segs.push([ch,+r[2],c2,v2]);ch=c2;continue}
   r=part.match(/^(\d+)(?:-(\d+))?$/);
   if(r&&ch){segs.push([ch,+r[1],ch,r[2]?+r[2]:+r[1]]);continue}}
  if(segs.length)out.push({label:opt.trim(),i,segs})}
 return out}
function bVerses(B,segs){const multi=new Set(segs.flatMap(s=>[s[0],s[2]])).size>1,seen=new Set();let h='';
 for(const [c1,v1,c2,v2] of segs)for(let c=c1;c<=c2;c++){const vs=B.c[c-1]||[];const a=c===c1?v1:1,z=Math.min(c===c2?v2:vs.length,vs.length);
  for(let v=a;v<=z;v++){if(seen.has(c+':'+v))continue;seen.add(c+':'+v);h+=`<p class="bv"><sup>${multi?c+':':''}${v}</sup>${esc(vs[v-1])}</p>`}}
 return h}
async function bShow(ref,title){if(!await bIndex()){toast('성경을 열 수 없습니다');return}
 const ps=bParse(ref);let h=`<div class="bsheet"><h3>${esc(title||ref)}</h3>`;
 for(const p of ps){if(p.missing){h+=`<p class="bmiss">${esc(p.label)} — 개역한글(정경 66권)에는 없는 책입니다.</p>`;continue}
  try{const B=await bBook(p.i);h+=`<section class="bpass"><h4>${esc(p.label)}</h4>${bVerses(B,p.segs)}
  <button class="ghost bmore" data-bread="${p.i}|${p.segs[0][0]}">${svg('book')}${esc(B.n)} ${p.segs[0][0]}장 전체 읽기</button></section>`}catch(e){h+=`<p class="bmiss">${esc(p.label)} — 불러오지 못했습니다.</p>`}}
 h+=`<p class="bsrc">성경전서 개역한글판</p><button class="pill" data-close>닫기</button></div>`;sheet(h);$('#sheetIn').scrollTop=0}
function bibleShell(){return `<section class="bible"><div class="btop"><button class="ghost" data-bpick="book" id="bBookBtn">${svg('book')}<b>…</b></button><button class="ghost" data-bpick="ch" id="bChBtn">…장</button><span class="bver">개역한글</span><button class="ghost bfont" data-bset aria-label="글꼴과 글자 크기">가</button></div><div id="btext" class="btext"><p class="empty">불러오는 중…</p></div>
 <div class="bar bnavbar"><button class="ghost" data-bgo="-1">◀ 앞 장</button><button class="ghost" data-bgo="1">다음 장 ▶</button></div></section>`}
async function bibleLoad(){const X=await bIndex();const t=$('#btext');if(!t)return;if(!X){t.innerHTML='<p class="empty">성경 파일을 열 수 없습니다.</p>';return}
 let {i,c}=bpos;i=Math.max(0,Math.min(65,i|0));c=Math.max(1,Math.min(X.books[i][2],c|0));bpos={i,c};LS.set('bpos',bpos);
 const B=await bBook(i);if(tab!=='bible')return;
 $('#bBookBtn b').textContent=B.n;$('#bChBtn').textContent=c+'장';
 t.innerHTML=`<h2 class="bch">${esc(B.n)} ${c}장</h2>`+bVerses(B,[[c,1,c,999]])}
function bPicker(kind){const X=BIDX;if(!X)return;
 if(kind==='book'){const g=(a,z)=>X.books.slice(a,z).map((b,k)=>`<button class="bpk${a+k===bpos.i?' on':''}" data-bbook="${a+k}" title="${esc(b[0])}">${esc(b[1])}</button>`).join('');
  sheet(`<h3>성경 고르기</h3><h4 class="bgh">구약</h4><div class="bgrid">${g(0,39)}</div><h4 class="bgh">신약</h4><div class="bgrid">${g(39,66)}</div><button class="ghost" data-close>닫기</button>`)}
 else{const n=X.books[bpos.i][2];sheet(`<h3>${esc(X.books[bpos.i][0])} — 장 고르기</h3><div class="bgrid">${Array.from({length:n},(_,k)=>`<button class="bpk${k+1===bpos.c?' on':''}" data-bch="${k+1}">${k+1}</button>`).join('')}</div><button class="ghost" data-close>닫기</button>`)}}
function bGo(i,c){bpos={i,c};LS.set('bpos',bpos);$('#sheet').classList.remove('open');if(tab!=='bible'){tab='bible';closeNP();closeLyr();render()}else bibleLoad();scrollTo(0,0)}
document.addEventListener('click',e=>{let b;
 if(e.target.closest('[data-golib]')){closeLyr();tab='album';render();scrollTo(0,0);return}
 if(e.target.closest('[data-bset]')){$('#bset').click();return}
 if(b=e.target.closest('[data-bref]')){bShow(b.dataset.bref,b.dataset.btitle);return}
 if(b=e.target.closest('[data-bread]')){const [i,c]=b.dataset.bread.split('|').map(Number);bGo(i,c);return}
 if(b=e.target.closest('[data-bpick]')){bPicker(b.dataset.bpick);return}
 if(b=e.target.closest('[data-bbook]')){bpos={i:+b.dataset.bbook,c:1};LS.set('bpos',bpos);bPicker('ch');return}
 if(b=e.target.closest('[data-bch]')){bGo(bpos.i,+b.dataset.bch);return}
 if(b=e.target.closest('[data-bgo]')){const X=BIDX;if(!X)return;let {i,c}=bpos;c+=+b.dataset.bgo;
  if(c<1){if(i>0){i--;c=X.books[i][2]}else c=1}else if(c>X.books[i][2]){if(i<65){i++;c=1}else c=X.books[i][2]}
  bGo(i,c)}});
const hm=h=>`${String(h%24).padStart(2,'0')}:00`;
function radioHtml(){const R=radioNow();if(!R)return '<p class="empty">라디오에 틀 곡이 아직 없습니다.</p>';
 const on=queue.src==='radio'&&!au.paused,cur=on?queue[qi]:R.pool[R.i],nx=on?queue[qi+1]:R.pool[(R.i+1)%R.pool.length];
 const v=rawVer(cur),day=new Date().getDay();
 const lst=PROGS.filter(P=>!P.days||P.days.includes(day)).map(P=>`<li class="${P.id===R.P.id?'cur':''}"><b>${hm(P.from)}–${hm(P.to)}</b><span>${esc(P.name)}<small>${esc(P.desc)}</small></span></li>`).join('');
 const D=dayPlan(),dn=D.notes[String(cur.n)];
 const vt=(CAT.albums[0]?.tracks||[]).find(t=>String(t.n)===String(D.verse));
 const note=dn?'':(()=>{if(!(cur.listen&&cur.listen[0]))return '';const ss=String(cur.listen[0][1]).split(/(?<=다\.)\s*/);let o='';for(const x of ss){if((o+x).length>170)break;o+=x+' '}return o.trim()||ss[0]})();
 return `<section class="radio">
 <div class="onair"><i></i>주찬양 라디오 · 지금 방송 중</div>
 <div class="today"><span class="chip">오늘의 주제 · ${esc(D.theme.name)}</span>${D.title?`<span class="chip soft">${esc(D.title)}</span>`:''}${D.greeting?`<p>${esc(D.greeting)}</p>`:''}${vt&&vt.verse?`<blockquote><small>오늘의 말씀</small>${esc(vt.verse)}</blockquote>`:''}</div>
 ${rclHtml()}
 <div class="rprog"><b>${esc(R.P.name)}</b><small>${hm(R.P.from)}–${hm(R.P.to)} · ${esc(R.P.desc)}</small></div>
 <div class="nowcard"><img src="${esc(cur.album.cover)}" alt=""><div><small>${on?'지금 나오는 곡':'지금 방송 중인 곡'}</small><b>${esc(label(cur))}</b><small>${esc(cur.part||'')}${v?' · '+esc(v.name):''}</small></div></div>
 ${dn?`<p class="rnote"><small>진행자의 말</small>${esc(dn)}</p>`:R.P.id==='morn'&&cur.verse?`<blockquote class="rverse"><small>이 곡의 말씀</small>${esc(cur.verse)}</blockquote>`:note?`<p class="rnote"><small>이 곡에서 들을 것</small>${esc(note)}</p>`:''}
 ${nx?`<p class="nextup">다음 곡 · ${esc(label(nx))}</p>`:''}
 <div class="bar"><button class="pill big" data-radio="live">${svg(on?'pause':'play')}${on?'라디오 멈춤':'라디오 듣기'}</button><button class="ghost" data-radio="mix">${svg('shuffle')}끝없이 섞어 듣기</button></div>
 <p class="rhelp">시간표 라디오는 같은 시간대에 있는 사람이 모두 같은 곡을 함께 듣습니다. 곡이 끝나면 다음 곡이, 시간이 바뀌면 다음 프로그램이 이어집니다.</p>
 <h2 class="part"><span>오늘 방송표</span></h2><ul class="sched">${lst}</ul></section>`}
$('#view').addEventListener('click',e=>{const r=e.target.closest('[data-rclplay]');if(r){const [aid,n]=r.dataset.rclplay.split('|');const a=album(aid);const l=a.tracks.map(t=>({...t,album:a}));const i=l.findIndex(t=>String(t.n)===n);if(i>=0)setQueue(l,i,'album:'+a.id);return}});
$('#view').addEventListener('click',e=>{const b=e.target.closest('[data-radio]');if(!b)return;
 if(b.dataset.radio==='live'){if(queue.src==='radio'&&!au.paused){au.pause();render();return}radioTune(true)}else radioMix()});
setInterval(()=>{if(tab==='radio'&&!npOpen&&!lyrOpen&&!$('#sheet').classList.contains('open'))render()},20000);
au.addEventListener('play',()=>{if(tab==='radio')render()});au.addEventListener('pause',()=>{if(tab==='radio')render()});

// ---------- 이 곡 링크 보내기 (성가대 연습 안내용) ----------
// 링크: 친구용 웹판 주소 + ?s=곡&t=초&v=반주&p=성부&m=화면 → 누르면 그 곡·그 자리·그 성부가 바로 준비됨
const SHARE_BASE='https://j63cho.github.io/Chanyang-media/';
function shareSheet(){const t=queue[qi];if(!t||!t.album){toast('앨범 곡을 틀고 눌러 주세요');return}
 const v=verOf(t.album),now=Math.floor(au.currentTime||0),hp=hasParts(t);
 const parts=hp?t.parts.filter(x=>x.k!=='acc'):[];
 sheet(`<h3>${svg('share')} 이 곡 링크 보내기</h3><p>${esc(label(t))}</p>
 <p class="setrow">어디부터</p><div class="seg" id="shT"><button data-sh="t:0" aria-pressed="${now<5}">처음부터</button><button data-sh="t:${now}" aria-pressed="${now>=5}">지금 자리 ${fmt(now)}부터</button></div>
 ${hp?`<p class="setrow">크게 들을 성부</p><div class="seg wrap" id="shP"><button data-sh="p:" aria-pressed="true">없음</button>${parts.map(x=>`<button data-sh="p:${x.k}" aria-pressed="false">${esc(x.name)}</button>`).join('')}</div>`:''}
 <p class="setrow">함께 열 화면</p><div class="seg" id="shM"><button data-sh="m:" aria-pressed="true">없음</button><button data-sh="m:lyr" aria-pressed="false">가사</button>${hasScore(t)?`<button data-sh="m:score" aria-pressed="false">악보</button>`:''}</div>
 <p class="phelp">반주는 지금 고른 「${esc(v?v.name:'')}」로 열립니다.</p>
 <div class="bar"><button class="pill" data-shgo>${svg('share')}링크 보내기</button><button class="ghost" data-close>닫기</button></div>`)}
function shareUrl(){const t=queue[qi],q=new URLSearchParams();const sel=id=>{const b=document.querySelector(`#${id} [aria-pressed="true"]`);return b?b.dataset.sh.split(':')[1]:''};
 q.set('s',t.id);const tt=sel('shT');if(tt&&tt!=='0')q.set('t',tt);const v=verOf(t.album);if(v)q.set('v',v.id);
 if($('#shP')){const pp=sel('shP');if(pp)q.set('p',pp)}const m=sel('shM');if(m)q.set('m',m);return SHARE_BASE+'?'+q.toString()}
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-sh]');if(b){b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
 if(e.target.closest('[data-shgo]')){const u=shareUrl(),t=queue[qi],txt=`${label(t)} — 주찬양 플레이어에서 들어 보세요`;
  if(navigator.share)navigator.share({title:'주찬양 플레이어',text:txt,url:u}).catch(()=>{});
  else (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('링크를 복사했습니다 — 문자·카톡에 붙여 넣으세요')).catch(()=>sheet(`<h3>링크</h3><p style="word-break:break-all">${esc(u)}</p><button class="pill" data-close>닫기</button>`))}});
$('#npShare').onclick=()=>shareSheet();
// 받은 링크로 열었을 때
function openShared(){const q=new URLSearchParams(location.search);const s=q.get('s');if(!s)return false;
 try{history.replaceState(null,'',location.pathname)}catch(e){}
 let A=null,i=-1;for(const a of CAT.albums){const k=a.tracks.findIndex(t=>t.id===s);if(k>=0){A=a;i=k;break}}if(!A){toast('링크의 곡을 찾지 못했습니다');return false}
 const v=q.get('v');if(v&&(A.versions||[]).some(x=>x.id===v)){ver=v;LS.set('ver',v)}
 const p=q.get('p'),T=A.tracks[i];if(p&&Array.isArray(T.parts)&&T.parts.some(x=>x.k===p)){partsOn=true;LS.set('partsOn',true);const o={};for(const x of T.parts)o[x.k]=x.k===p||x.k==='acc'?2:1;PL[T.id]=o;LS.set('partLv',PL)}
 albumId=A.id;tab='album';const l=A.tracks.map(t=>({...t,album:A}));l.src='album:'+A.id;queue=l;qi=i;
 const tt=+q.get('t')||0;au.addEventListener('loadedmetadata',()=>{if(tt>0&&tt<(au.duration||0)-2)au.currentTime=tt},{once:true});
 load(false);applyPartVols();
 const m=q.get('m');if(m==='lyr'||m==='score'){lmode=m;LS.set('lmode',m)}
 const pn=p&&T.parts?T.parts.find(x=>x.k===p):null;
 sheet(`<div class="intro"><p class="step">받은 링크</p><h3>${esc(label(T))}</h3><p>${[verOf(A)?.name+' 반주',pn?pn.name+' 크게':'',tt?fmt(tt)+'부터':''].filter(Boolean).join(' · ')}</p>
 <div class="bar"><button class="pill big" data-shplay="${m||''}">${svg('play')}듣기</button><button class="ghost" data-close>닫기</button></div></div>`);
 return true}
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-shplay]');if(!b)return;$('#sheet').classList.remove('open');au.play().catch(()=>{});if(b.dataset.shplay)openLyr();else openNP()});

// ---------- 시작 ----------
(async()=>{
 $('#bplay').innerHTML=svg('play');$('#npPlay').innerHTML=svg('play'); applySet(); showRep(); $('#bver').textContent='주찬양 플레이어'+(window.BUILD?' · 판 '+window.BUILD:''); await DB.open(); await OFF.load(); mine=(await DB.all()).sort((a,b)=>a.added-b.added);
 // 곡 목록: 저장소(인터넷)에서 새로 받고, 안 되면 마지막에 받은 것, 그것도 없으면 앱 안의 것
 const REMOTE='https://raw.githubusercontent.com/j63cho/Chanyang-media/main/catalog.json';
 let local=null; try{local=await (await fetch(window.CATALOG||'catalog.json')).json()}catch(e){}
 const isWeb=window.BUILD==='웹'; // 웹 앱(링크)은 바깥 주소를 막으므로 자기 안의 곡 목록만 씀
 CAT=(isWeb?local:LS.get('cat',null)||local)||{albums:[]};
 if(!isWeb)try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);const r=await fetch(REMOTE+'?t='+Date.now(),{signal:ctl.signal,cache:'no-store'});
  if(r.ok){const j=await r.json();if(j&&Array.isArray(j.albums)&&j.albums.length){CAT=j;LS.set('cat',j)}}}catch(e){}
 await loadRadio(isWeb&&!!window.CATALOG);
 await loadRcl(isWeb&&!!window.CATALOG);
 if(!album(albumId))albumId=CAT.albums[0]?.id;
 const last=LS.get('last',null);
 if(last){const m=allTracks();const l=(last.ids||[]).map(id=>m[id]).filter(Boolean);const i=l.findIndex(t=>t.id===last.id);
  if(i>=0){queue=l;queue.src=last.src;qi=i;const t=l[i];setSrc(t);partsSetup(t);$('#ptitle').textContent=label(t);$('#psub').textContent=sub(t);$('#pimg').src=t.album?t.album.cover:'';meta(t);
   const p=LS.get('pos',0);au.addEventListener('loadedmetadata',()=>{if(p<(au.duration||0)-3)au.currentTime=p},{once:true})}}
 if(!$('#pimg').getAttribute('src'))$('#pimg').src=CAT.albums[0]?.cover||'';
 render();
 const shared=openShared();
 if(!shared&&!LS.get('intro1',false))setTimeout(()=>{if(!$('#sheet').classList.contains('open'))intro(0)},600);
})();
}
