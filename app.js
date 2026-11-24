{
// 찬양 듣기 — 앨범(catalog.json) + 내 곡(휴대폰 안 저장) + 재생 목록. 차 버튼·잠금 화면은 Media Session.
const $=s=>document.querySelector(s), au=$('#au');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>{t=Math.max(0,t|0);return (t/60|0)+':'+String(t%60).padStart(2,'0')};
const LS={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
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
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" class="i" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]||''}</svg>`;
document.querySelectorAll('[data-ic]').forEach(e=>e.insertAdjacentHTML('afterbegin',svg(e.dataset.ic)));
const EQ='<span class="eq" aria-label="재생 중"><i></i><i></i><i></i></span>';

// ---------- 내 곡: IndexedDB (이 휴대폰 안에만) ----------
const DB={db:null,
 open(){return new Promise(r=>{setTimeout(()=>r(false),2500);try{const q=indexedDB.open('chanyang',1);q.onupgradeneeded=()=>q.result.createObjectStore('songs',{keyPath:'id'});q.onsuccess=()=>{this.db=q.result;r(true)};q.onerror=()=>r(false)}catch(e){r(false)}})},
 tx(m){return this.db.transaction('songs',m).objectStore('songs')},
 all(){return new Promise(r=>{if(!this.db)return r([]);const q=this.tx('readonly').getAll();q.onsuccess=()=>r(q.result||[]);q.onerror=()=>r([])})},
 put(o){return new Promise(r=>{if(!this.db)return r(false);const q=this.tx('readwrite').put(o);q.onsuccess=()=>r(true);q.onerror=()=>r(false)})},
 del(id){return new Promise(r=>{if(!this.db)return r();const q=this.tx('readwrite').delete(id);q.onsuccess=q.onerror=()=>r()})}};

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
function trackSrc(t){if(t.blob){if(!urls[t.id])urls[t.id]=URL.createObjectURL(t.blob);return urls[t.id]}
 const a=t.album,v=verOf(a); if(a&&v&&!v.local&&a.media) return `${a.media}/2ch/${String(t.n).padStart(2,'0')}_${v.id}.${a.ext||'m4a'}`; return t.src}
// 내려받기(웹 앱만): 곡 하나 = 지금 고른 반주 파일, 앨범 전체 = catalog의 zip
const canDL=()=>window.BUILD==='웹';
function dlName(t,a){const v=verOf(a),src=trackSrc({...t,album:a}),ext=(src.split('?')[0].match(/\.(\w+)$/)||[])[1]||'m4a';
 return `${String(t.n).padStart(2,'0')} ${t.kind?t.kind+' ':''}${t.title}${v?' ('+v.name+')':''}.${ext}`.replace(/[\\/:*?"<>|]/g,'')}
function verBar(a){const vs=(a.versions||[]).filter(v=>v.local||a.media); if(vs.length<2)return '';
 return `<div class="verrow"><span class="lbl">반주 고르기</span><div class="seg" role="group" aria-label="반주 고르기">${vs.map(v=>`<button data-ver="${v.id}" aria-pressed="${verOf(a).id===v.id}">${esc(v.name)}</button>`).join('')}</div></div>`}
function shuffled(l,keep){const r=l.filter((_,i)=>i!==keep);for(let i=r.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[r[i],r[j]]=[r[j],r[i]]}return keep>=0?[l[keep],...r]:r}
function label(t){return t.album?`${String(t.n).padStart(2,'0')}. ${t.kind?t.kind+' ':''}「${t.title}」`:t.title}
function sub(t){if(!t.album)return t.alb?'내 곡 · '+t.alb:'내 곡';const v=verOf(t.album);return `${t.part||''} · ${v&&(t.album.versions||[]).length>1?v.name+' · ':''}${t.album.title}`}
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1800)}

// ---------- 화면 ----------
function render(){ pickBar();
 navSel();
 const v=$('#view'); const cur=queue[qi];
 if(tab==='album'){
  const a=album(albumId)||CAT.albums[0]; if(!a){v.innerHTML='<p class="empty">앨범이 없습니다.</p>';return}
  albumId=a.id; let h='';
  if(CAT.albums.length>1) h+=`<div class="albums">${CAT.albums.map(x=>`<button data-alb="${x.id}" aria-pressed="${x.id===a.id}"><img src="${esc(x.cover)}" alt=""><span>${esc(x.title)}</span></button>`).join('')}</div>`;
  const total=a.tracks.reduce((s,t)=>s+(t.dur||0),0);
  h+=`<section class="hero"><img src="${esc(a.cover)}" alt="${esc(a.title)} 표지"><div><h1>${esc(a.title)}</h1><p>${esc(a.sub||'')}</p><p>${esc(a.artist||'')} · ${a.tracks.length}곡 · ${Math.round(total/60)}분</p><div class="bar" style="margin:0"><button class="pill" data-playalb="${a.id}">${svg('play')}차례로</button><button class="ghost" data-shufalb="${a.id}">${svg('shuffle')}섞어서</button>${canDL()&&a.zip?`<a class="ghost dlall" href="${esc(a.zip)}" download>${svg('download')}앨범 전체 내려받기</a>`:''}</div>${canDL()&&a.zip?`<p class="dlnote">${esc(a.zipNote||'')}</p>`:''}</div></section>${verBar(a)}`;
  let part=null;
  for(const t of a.tracks){
   if(t.part&&t.part!==part){part=t.part;h+=`<h2 class="part"><span>${esc(part)}</span><button class="partplay" data-playpart="${esc(part)}" data-from="${a.id}" aria-label="${esc(part)} 듣기">${svg('play')}이 부 듣기</button></h2>`}
   const now=cur&&cur.id===t.id;
   h+=`<div class="row${now?' now':''}">${numCell(t.id,t.n)}<button class="t" data-play="${t.id}" data-from="${a.id}"><b>${t.kind?esc(t.kind)+' ':''}「${esc(t.title)}」</b><small>${fmt(t.dur)}</small></button><button class="icon" data-desc="${t.id}" aria-label="곡 설명">${svg('info')}</button><button class="icon" data-add="${t.id}" aria-label="재생 목록에 넣기">${svg('plus')}</button>${canDL()&&t.src?`<a class="icon" href="${esc(trackSrc({...t,album:a}))}" download="${esc(dlName(t,a))}" aria-label="이 곡 내려받기" title="이 곡 내려받기">${svg('download')}</a>`:''}`;
   if(openDesc===t.id) h+=descHtml(t);
   h+='</div>';
  }
  v.innerHTML=h;
 } else if(tab==='mine'){
  const A=mineAlbums(); if(mineAlb&&!A.has(mineAlb))mineAlb=null;
  let h='';
  if(!mineAlb){
   h=`<div class="bar"><button class="pill" id="newalb">${svg('plus')}새 앨범 만들고 곡 넣기</button></div>`;
   h+= A.size? [...A].map(([n,l])=>`<div class="row"><span class="num">${svg('disc')}</span><button class="t" data-malb="${esc(n)}"><b>${esc(n)}</b><small>${l.length}곡 · ${Math.round(l.reduce((s,x)=>s+(x.dur||0),0)/60)}분</small></button><button class="icon" data-mplay="${esc(n)}" aria-label="${esc(n)} 듣기">${svg('play')}</button><span></span></div>`).join('')
    : '<p class="empty">휴대폰에 있는 음악 파일(MP3 등)을 앨범으로 묶어 넣으면 여기서 들을 수 있습니다.<br>폴더 하나를 앨범 하나로 넣으세요.<br>넣은 곡은 이 휴대폰 안에만 저장됩니다.</p>';
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
   let h=`<form class="bar" id="newl"><input type="text" id="lname" placeholder="새 재생 목록 이름" maxlength="40"><button class="pill">만들기</button></form>`;
   h+= lists.length? lists.map((L,i)=>`<div class="row"><span class="num">${svg('list')}</span><button class="t" data-openlist="${i}"><b>${esc(L.name)}</b><small>${L.ids.length}곡</small></button><button class="icon" data-playlist="${i}" aria-label="듣기">${svg('play')}</button><span></span></div>`).join('')
    : '<p class="empty">좋아하는 곡을 모아 나만의 재생 목록을 만들어 보세요.</p>';
   v.innerHTML=h;
  }
 }
}
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
 au.src=trackSrc(t); LS.set('last',{id:t.id,src:queue.src,ids:queue.map(x=>x.id)});
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
 const m={title:label(t),artist:t.album?(t.part||t.album.artist):'내 곡',album:t.album?t.album.title:(t.alb||'내 곡'),
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
au.addEventListener('ended',()=>{if(sleepEnd){sleepEnd=false;syncNP();toast('잠들기 타이머: 곡이 끝나 멈췄습니다');return}next(true)});
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
 if(t&&t.album){const pos=au.currentTime,pl=!au.paused;au.src=trackSrc(t);au.addEventListener('loadedmetadata',()=>{au.currentTime=pos;if(pl)au.play().catch(()=>{})},{once:true});$('#psub').textContent=sub(t)}
 render();toast('반주: '+(verOf(album(albumId))?.name||''))}
au.addEventListener('error',()=>{const t=queue[qi];if(t&&t.album&&!verOf(t.album).local)toast('이 반주는 인터넷 연결이 필요합니다')});
$('#bshuf').onclick=()=>{shuf=!shuf;LS.set('shuf',shuf);$('#bshuf').classList.toggle('on',shuf);
 if(queue.length){const t=queue[qi];const base=queue.orig||queue;if(shuf){const o=queue.slice();const l=shuffled(queue,qi);l.src=queue.src;l.orig=o;queue=l;qi=0}else if(queue.orig){const l=queue.orig;l.src=queue.src;qi=l.findIndex(x=>x.id===t.id);queue=l}}
 toast(shuf?'섞어서 듣기':'차례로 듣기')};
$('#bshuf').classList.toggle('on',shuf);
// ---------- 가사 ----------
let lyrOpen=false, lmode=LS.get('lmode','lyr'); const SC={};
function hasScore(t){return !!(t&&t.album&&t.album.media&&t.album.scores)}
async function scoreOf(t){const k=t.id;if(SC[k]!==undefined)return SC[k];SC[k]=null;
 try{const nn=String(t.n).padStart(2,'0');const j=await (await fetch(`${t.album.media}/score/${nn}/s.json`)).json();j.base=`${t.album.media}/score/${nn}/`;SC[k]=j}catch(e){SC[k]=null}return SC[k]}
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
 const strip=(L,k)=>{const cw=L.r-L.l,ch=L.bot-L.top;return `<div class="sys" id="sys${k}" style="aspect-ratio:${cw}/${(ch*S.ratio).toFixed(4)}"><img src="${S.base}p${L.p+1}.webp" alt="" style="width:${100/cw}%;left:${-L.l/cw*100}%;top:${-L.top/ch*100}%"></div>`};
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
function lyrHtml(t){if(!t)return '<p class="empty">곡을 고르세요.</p>';
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
function navSel(){document.querySelectorAll('.bnav button').forEach(b=>b.setAttribute('aria-selected',lyrOpen?b.id==='navLyr':b.dataset.tab===tab))}
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


// ---------- 큰 재생 화면 ----------
let npOpen=false;
function syncNP(){if(!npOpen)return;const t=queue[qi];
 $('#npTitle').textContent=$('#ptitle').textContent;$('#npSub').textContent=$('#psub').textContent;
 const img=$('#pimg').getAttribute('src')||'';if($('#npImg').getAttribute('src')!==img)$('#npImg').src=img;
 $('#npSrc').textContent=queue.length&&t?`${qi+1} / ${queue.length}`:'';
 const d=au.duration||0;$('#npCur').textContent=fmt(au.currentTime);$('#npDur').textContent=fmt(d);if(d&&!npSeeking)$('#npPos').value=au.currentTime/d*1000;
 $('#npPlay').innerHTML=svg(au.paused?'play':'pause');$('#npPlay').setAttribute('aria-label',au.paused?'재생':'멈춤');
 $('#npShuf').classList.toggle('on',shuf);$('#npRep').innerHTML=svg(repeat==='one'?'repeat1':'repeat')+({all:'전체 반복',one:'한 곡 반복',off:'반복 끔'})[repeat];$('#npRep').classList.toggle('on',repeat!=='off');
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
function setSleep(m){sleepEnd=m==='end';sleepAt=typeof m==='number'?Date.now()+m*60000:0;au.volume=1;
 $('#sheet').classList.remove('open');syncNP();toast(m==='end'?'이 곡이 끝나면 멈춥니다':m?`${m}분 뒤에 멈춥니다`:'잠들기 타이머를 껐습니다')}
function sleepTick(){if(!sleepAt)return;const left=sleepAt-Date.now();
 if(left<=0){sleepAt=0;au.pause();au.volume=1;syncNP();toast('잠들기 타이머: 멈췄습니다');return}
 au.volume=left<10000?Math.max(0,left/10000):1;} // 마지막 10초는 소리를 천천히 줄임
setInterval(sleepTick,1000);au.addEventListener('timeupdate',sleepTick);
au.addEventListener('play',()=>{if(!sleepAt)au.volume=1});
$('#npSleep').onclick=()=>sheet(`<h3>잠들기 타이머</h3><p>정한 때가 되면 소리를 천천히 줄이고 멈춥니다.</p>${[15,30,45,60,90].map(m=>`<button class="opt" data-sleep="${m}">${m}분 뒤</button>`).join('')}<button class="opt" data-sleep="end">이 곡이 끝나면</button>${sleepAt||sleepEnd?'<button class="opt" data-sleep="0">타이머 끄기</button>':''}<button class="ghost" data-close style="margin-top:10px">닫기</button>`);
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-sleep]');if(!b)return;const v=b.dataset.sleep;setSleep(v==='end'?'end':+v)});

// ---------- 설정: 글자 크기 · 화면 밝기 ----------
let zoomV=LS.get('zoom',1),themeV=LS.get('theme','light');
function applySet(){document.documentElement.style.setProperty('--z',zoomV);
 const th=themeV==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):themeV;document.documentElement.dataset.theme=th;
 document.querySelector('meta[name=theme-color]')?.setAttribute('content',th==='dark'?'#120e22':'#f7f4fc');fitPad()}
$('#bset').onclick=()=>{const seg=(k,cur,opts)=>`<div class="seg">${opts.map(([v,n])=>`<button data-set="${k}:${v}" aria-pressed="${String(cur)===String(v)}">${n}</button>`).join('')}</div>`;
 sheet(`<h3>설정</h3><p class="setrow">글자 크기</p>${seg('zoom',zoomV,[[1,'보통'],[1.15,'크게'],[1.3,'아주 크게']])}<p class="setrow">화면</p>${seg('theme',themeV,[['light','밝게'],['dark','어둡게'],['auto','휴대폰 따라']])}<button class="pill" data-close style="margin-top:18px">닫기</button>`)};
$('#sheet').addEventListener('click',e=>{const b=e.target.closest('[data-set]');if(!b)return;const [k,v]=b.dataset.set.split(':');
 if(k==='zoom'){zoomV=+v;LS.set('zoom',zoomV)}else{themeV=v;LS.set('theme',themeV)}applySet();
 b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))});

// 재생 막대 높이에 맞춰 아래 여백 맞추기 (글자 크기를 바꿔도 가리지 않게)
function fitPad(){const h=$('#dock').offsetHeight,pb=pick?$('#pickbar').offsetHeight:0;
 document.body.style.paddingBottom=(h+pb+24)+'px';$('#pickbar').style.bottom=h+'px';$('#toast').style.bottom=(h+pb+16)+'px';$('#lyr').style.bottom=Math.max(0,h-14)+'px'}
addEventListener('resize',fitPad);

// ---------- 곡 사이 끊김 줄이기: 다음 곡을 미리 받아 둠 ----------
const pre=new Audio();pre.preload='auto';pre.muted=true;
function warmNext(){const n=queue[qi+1]||(repeat==='all'?queue[0]:null);if(!n||n.blob||n===queue[qi])return;const s=trackSrc(n);if(s&&pre.src!==new URL(s,location.href).href){pre.src=s;try{pre.load()}catch(e){}}}
au.addEventListener('canplaythrough',warmNext);

// ---------- 시작 ----------
(async()=>{
 $('#bplay').innerHTML=svg('play');$('#npPlay').innerHTML=svg('play'); applySet(); showRep(); $('#bver').textContent=window.BUILD?'판 '+window.BUILD:''; await DB.open(); mine=(await DB.all()).sort((a,b)=>a.added-b.added);
 // 곡 목록: 저장소(인터넷)에서 새로 받고, 안 되면 마지막에 받은 것, 그것도 없으면 앱 안의 것
 const REMOTE='https://raw.githubusercontent.com/j63cho/Chanyang-media/main/catalog.json';
 let local=null; try{local=await (await fetch(window.CATALOG||'catalog.json')).json()}catch(e){}
 const isWeb=window.BUILD==='웹'; // 웹 앱(링크)은 바깥 주소를 막으므로 자기 안의 곡 목록만 씀
 CAT=(isWeb?local:LS.get('cat',null)||local)||{albums:[]};
 if(!isWeb)try{const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);const r=await fetch(REMOTE+'?t='+Date.now(),{signal:ctl.signal,cache:'no-store'});
  if(r.ok){const j=await r.json();if(j&&Array.isArray(j.albums)&&j.albums.length){CAT=j;LS.set('cat',j)}}}catch(e){}
 if(!album(albumId))albumId=CAT.albums[0]?.id;
 const last=LS.get('last',null);
 if(last){const m=allTracks();const l=(last.ids||[]).map(id=>m[id]).filter(Boolean);const i=l.findIndex(t=>t.id===last.id);
  if(i>=0){queue=l;queue.src=last.src;qi=i;const t=l[i];au.src=trackSrc(t);$('#ptitle').textContent=label(t);$('#psub').textContent=sub(t);$('#pimg').src=t.album?t.album.cover:'';meta(t);
   const p=LS.get('pos',0);au.addEventListener('loadedmetadata',()=>{if(p<(au.duration||0)-3)au.currentTime=p},{once:true})}}
 if(!$('#pimg').getAttribute('src'))$('#pimg').src=CAT.albums[0]?.cover||'';
 render();
})();
}
