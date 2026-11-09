/* 마이페이지 · 캐릭터 · 자유게시판 · 선생님 일괄 작업 (app.js보다 먼저 불러와요) */

/* ---------- 2D RPG 캐릭터 ---------- */
const XP_PER=20; // 맞힌 문제 20개마다 레벨 1 올라요
const JOBS=[[1,"견습생"],[5,"수련생"],[10,"모험가"],[20,"기사"],[35,"영웅"],[60,"전설"]];
const levelOf=s=>1+Math.floor((+(s&&s.qRight)||0)/XP_PER);
const ga=n=>[2,4,5,9].includes(n%10)?"가":"이";
const jobOf=lv=>{let r=JOBS[0][1];for(const [m,n] of JOBS)if(lv>=m)r=n;return r};
const SKINS=["#ffd9b8","#f1bf8f","#c98d5f"];
const HAIRS=["#2b1d16","#6b3e1f","#d9a441","#a0522d","#4a4a6a"];
const SLOTS=[["helmet","머리"],["armor","옷"],["shoes","신발"],["gloves","장갑"],["weapon","무기"],["effect","효과"]];
const GEAR={
  helmet:[["none","없음",1,""],["band","머리띠",3,"#d94848"],["cap","가죽 모자",8,"#8a5a33"],["iron","철 투구",15,"#9aa3ad"],["crown","황금 왕관",30,"#e9c046"]],
  armor:[["dobok","수련복",1,"#f3f1ea"],["leather","가죽 갑옷",5,"#8a5a33"],["chain","사슬 갑옷",10,"#9aa3ad"],["knight","기사 갑옷",18,"#2f5dab"],["gold","황금 갑옷",40,"#e9c046"]],
  shoes:[["basic","수련화",1,"#e6e0d2"],["boots","가죽 장화",4,"#6b4226"],["iron","철 장화",14,"#8f99a3"],["wing","날개 신발",28,"#7fd3ff"]],
  gloves:[["none","맨손",1,""],["cloth","천 장갑",3,"#efe6d2"],["leather","가죽 장갑",9,"#7a4a28"],["iron","철 건틀릿",16,"#9aa3ad"],["magic","마법 장갑",32,"#8a5cf6"]],
  weapon:[["none","없음",1,""],["stick","나무 막대",2,"#8b5a2b"],["wood","목검",6,"#c89b5d"],["iron","철검",12,"#cfd6de"],["staff","마법 지팡이",20,"#9b6bff"],["hero","용사의 검",45,"#9fd0ff"]],
  effect:[["none","없음",1,""],["spark","반짝이",7,"#fff3a0"],["fire","불꽃 오라",22,"#ff8a3d"],["bolt","번개",38,"#ffe14d"],["rainbow","무지개 오라",60,"#c084fc"]]
};
const gearOf=(slot,id)=>GEAR[slot].find(g=>g[0]===id);
function bestGear(slot,lv){let r=GEAR[slot][0];for(const g of GEAR[slot])if(g[2]<=lv)r=g;return r[0]}
function avOf(s){
  const a=(s&&s.avatar)||{},lv=levelOf(s),slots={};
  for(const [slot] of SLOTS){
    const want=a.slots&&a.slots[slot],g=want&&gearOf(slot,want);
    slots[slot]=g&&g[2]<=lv?want:bestGear(slot,lv);
  }
  return {g:a.g==="f"?"f":"m",hair:HAIRS[a.hair]?+a.hair:((s&&+s.num)||0)%HAIRS.length,skin:SKINS[a.skin]?+a.skin:0,slots,lv};
}
const BASE=[
"................",
".....HHHHHH.....",
"....HHHHHHHH....",
"...HHHHHHHHHH...",
"...HHSSSSSSHH...",
"...HSSSSSSSSH...",
"...SSESSSSESS...",
"...SSSSSSSSSS...",
"....SSSMMSSS....",
".....SSSSSS.....",
"......SSSS......",
"....TTTttTTT....",
"...ATTTTTTTTA...",
"..AATTTTTTTTAA..",
"..AATTTTTTTTAA..",
"..GGBBBBBBBBGG..",
"..GG.PPPPPP.GG..",
".....PPPPPP.....",
".....PPP.PPP....",
".....PPP.PPP....",
".....PPP.PPP....",
".....FFF.FFF....",
"....FFFF.FFFF...",
"................"];
const ARMOR={
  dobok:{T:"#f3f1ea",t:"#d8d4c8",A:"#f3f1ea",B:"#2b2b2b",P:"#ebe7dc"},
  leather:{T:"#8a5a33",t:"#5e3b1f",A:"#a06b3e",B:"#3e2a17",P:"#5b4636"},
  chain:{T:"#9aa3ad",t:"#6b737c",A:"#b8c0c8",B:"#5a4632",P:"#59606a"},
  knight:{T:"#c9ced6",t:"#2f5dab",A:"#aab2bd",B:"#2f5dab",P:"#4b5563",x:[[7,12,2,3,"#2f5dab"],[2,12,2,1,"#aab2bd"],[12,12,2,1,"#aab2bd"]]},
  gold:{T:"#e9c046",t:"#b8860b",A:"#f3d36b",B:"#8a5a00",P:"#7a5a1a",x:[[7,12,2,2,"#e5484d"],[2,12,2,1,"#b8860b"],[12,12,2,1,"#b8860b"]]}
};
const HELMET={
  band:[[3,4,10,1,"#d94848"],[13,4,1,1,"#d94848"],[14,5,1,2,"#d94848"]],
  cap:[[4,0,8,1,"#8a5a33"],[3,1,10,3,"#8a5a33"],[2,4,12,1,"#5e3b1f"]],
  iron:[[4,0,8,1,"#9aa3ad"],[3,1,10,1,"#9aa3ad"],[2,2,12,2,"#9aa3ad"],[2,4,12,1,"#6b737c"],[2,5,1,4,"#9aa3ad"],[13,5,1,4,"#9aa3ad"],[7,0,2,1,"#e5484d"]],
  crown:[[4,1,8,2,"#e9c046"],[4,0,1,1,"#e9c046"],[7,0,2,1,"#e9c046"],[11,0,1,1,"#e9c046"],[6,2,1,1,"#e5484d"],[9,2,1,1,"#3b82f6"]]
};
const SHOES={basic:{F:"#e6e0d2"},boots:{F:"#6b4226",x:[[5,20,3,1,"#6b4226"],[9,20,3,1,"#6b4226"]]},iron:{F:"#8f99a3",x:[[5,19,3,2,"#8f99a3"],[9,19,3,2,"#8f99a3"]]},
  wing:{F:"#f2f2f2",x:[[2,20,2,1,"#7fd3ff"],[3,21,1,1,"#7fd3ff"],[13,20,2,1,"#7fd3ff"],[13,21,1,1,"#7fd3ff"]]}};
const GLOVES={cloth:"#efe6d2",leather:"#7a4a28",iron:"#9aa3ad",magic:"#8a5cf6"};
// 무기는 20칸 기준 좌표(오른손 옆)
const WEAPON={
  stick:[[16,7,1,10,"#8b5a2b"]],
  wood:[[16,4,1,1,"#e0b779"],[16,5,1,9,"#c89b5d"],[15,14,3,1,"#6b4226"],[16,15,1,2,"#4a2c17"]],
  iron:[[16,3,1,11,"#e8edf2"],[17,4,1,10,"#9aa3ad"],[15,14,4,1,"#d4a017"],[16,15,1,2,"#4a2c17"],[16,17,1,1,"#d4a017"]],
  staff:[[17,5,1,13,"#6b4226"],[16,2,3,3,"#9b6bff"],[17,3,1,1,"#e6d9ff"]],
  hero:[[16,1,1,13,"#e8f4ff"],[17,1,1,13,"#9fd0ff"],[14,14,6,1,"#f2c14e"],[16,14,2,1,"#e5484d"],[16,15,2,2,"#3b2a1a"],[16,17,2,1,"#f2c14e"]]
};
const avCache=new Map();
let fxSeq=0;
const AVATAR_ON=false; // 캐릭터(아바타) 기능 끔
function avatarSvg(av,size,label){
  if(!AVATAR_ON)return "";
  size=size||40;
  const big=size>=80,key=JSON.stringify(av)+"|"+big;
  let body=avCache.get(key);
  if(!body){
    const W=20,H=24,px=Array.from({length:H},()=>Array(W).fill(null));
    const arm=ARMOR[av.slots.armor]||ARMOR.dobok,sh=SHOES[av.slots.shoes]||SHOES.basic;
    const pal={H:HAIRS[av.hair],S:SKINS[av.skin],E:"#1f2d3a",M:"#d9706a",G:GLOVES[av.slots.gloves]||SKINS[av.skin],F:sh.F,...arm};
    BASE.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!==".")px[y][x+2]=pal[c]}));
    const put=(list,off)=>(list||[]).forEach(([x,y,w,h,c])=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=x+i+off,Y=y+j;if(X>=0&&X<W&&Y>=0&&Y<H)px[Y][X]=c}});
    if(av.g==="f"){put([[2,4,1,8,pal.H],[13,4,1,8,pal.H],[3,7,1,5,pal.H],[12,7,1,5,pal.H],[4,1,8,1,pal.H],[5,5,1,1,"#1f2d3a"],[10,5,1,1,"#1f2d3a"]],2);px[8][9]="#e87a8a";px[8][10]="#e87a8a"}
    put(arm.x,2);put(sh.x,2);put(HELMET[av.slots.helmet],2);put(WEAPON[av.slots.weapon],0);
    let r="";
    for(let y=0;y<H;y++){let x=0;while(x<W){const c=px[y][x];if(!c){x++;continue}let e=x+1;while(e<W&&px[y][e]===c)e++;r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${c}"/>`;x=e}}
    const fx=av.slots.effect,id="rb"+(++fxSeq);
    const fxs={none:"",
      spark:`<g class="fx fx-spark" fill="#fff3a0">${[[1,4],[18,8],[2,17],[17,20],[9,0]].map(([x,y])=>`<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${x-0.5}" y="${y+0.33}" width="2" height=".34"/>`).join("")}</g>`,
      fire:`<g class="fx fx-fire"><ellipse cx="10" cy="14" rx="9.5" ry="11" fill="#ff8a3d" opacity=".28"/><path d="M3 22 L4 15 L5 19 L6 12 L8 18 L10 9 L12 18 L14 12 L15 19 L16 15 L17 22Z" fill="#ff5e1f" opacity=".35"/></g>`,
      bolt:`<g class="fx fx-bolt" fill="none" stroke="#ffe14d" stroke-width=".7" stroke-linejoin="round"><path d="M2 3 L4 7 L2 8 L4 12"/><path d="M18 10 L16 14 L18 15 L16 19"/><ellipse cx="10" cy="14" rx="9.5" ry="11" fill="#ffe14d" stroke="none" opacity=".15"/></g>`,
      rainbow:`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffd93d"/><stop offset=".5" stop-color="#6bcb77"/><stop offset=".75" stop-color="#4d96ff"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs><g class="fx fx-rainbow"><ellipse cx="10" cy="13.5" rx="9.4" ry="11.2" fill="none" stroke="url(#${id})" stroke-width="1.1"/><ellipse cx="10" cy="13.5" rx="9.4" ry="11.2" fill="url(#${id})" opacity=".14"/></g>`}[fx]||"";
    body=`${fxs}<g shape-rendering="crispEdges">${r}</g>`;
    if(fx!=="rainbow")avCache.set(key,body);
  }
  return `<svg class="av rpg${big?" big":""}" width="${Math.round(size*20/24)}" height="${size}" viewBox="0 0 20 24" role="img" aria-label="${esc(label||"캐릭터")}">${body}</svg>`;
}

/* ---------- 마이페이지 ---------- */
let meMsg="";
function renderMyPage(){
  const s=ME,av=avOf(s),sv=valueOf(s),total=(+s.wallet||0)+(+s.bank||0)+sv,lv=av.lv;
  const into=(+s.qRight||0)%XP_PER,nextJob=JOBS.find(([m])=>m>lv);
  const holds=Object.entries(s.stocks||{}).filter(([,h])=>h.qty>1e-6).map(([k,h])=>{
    const c=k.slice(1),st=STOCKS.find(x=>x[0]===c)||[c,c],v=h.qty*coinPrice(c),cost=+h.cost||0,pl=v-cost;
    return {name:st[1],qty:h.qty,cost,v,pl,pct:cost?pl/cost*100:0};
  }).sort((a,b)=>b.v-a.v);
  const cost=holds.reduce((t,x)=>t+x.cost,0),pl=sv-cost,qz=s.quiz||{};
  const sg=x=>x>=0?"+":"";
  const raw=(s.avatar&&s.avatar.slots)||{};
  $("#view-me").innerHTML=`<article class="card me-hero">
    <div class="hero-info">
      <h2>${esc(s.name)}</h2>
      <p class="t-help">${esc(s.grade)}학년 ${esc(s.cls)}반 ${esc(s.num)}번</p>
      <form class="status-form" id="stForm" novalidate>
        <label class="t-field" for="stIn">상태메시지<input type="text" id="stIn" maxlength="40" value="${esc(s.status||"")}" placeholder="오늘의 기분이나 목표를 적어요"></label>
        <button type="submit" class="secondary" id="stSave">저장</button>
      </form>
      <p class="msg" id="meMsg" role="status">${esc(meMsg)}</p>
    </div>
  </article>
  <article class="card"><h3>내 코인</h3>
    <div class="acct four">
      <div class="acct-box"><span class="lbl">모두</span><b>${fmt(total)}</b></div>
      <div class="acct-box"><span class="lbl">지갑</span><b>${fmt(s.wallet)}</b></div>
      <div class="acct-box"><span class="lbl">은행 저금</span><b>${fmt(s.bank)}</b><small>${s.lastPaid?`다음 이자 ${md(addDays(s.lastPaid,7))}`:"저금하면 이자가 붙어요"}</small></div>
      <div class="acct-box"><span class="lbl">주식</span><b>${fmt(sv)}</b><small class="${cost?(pl>=0?"up":"down"):""}">${cost?`${sg(pl)}${fmt(pl)} (${sg(pl)}${(pl/cost*100).toFixed(1)}%)`:"아직 없어요"}</small></div>
    </div>
  </article>
  <article class="card"><h3>내 주식 현황</h3>
    ${holds.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>종목</th><th>가진 주식</th><th>산 값</th><th>지금 값</th><th>수익</th><th>수익률</th></tr></thead><tbody>${holds.map(x=>`<tr><td>${esc(x.name)}</td><td>${fmtQ(x.qty)}주</td><td>${fmt(x.cost)}</td><td>${fmt(x.v)}</td><td class="${x.pl>=0?"up":"down"}">${sg(x.pl)}${fmt(x.pl)}</td><td class="${x.pl>=0?"up":"down"}">${sg(x.pct)}${x.pct.toFixed(1)}%</td></tr>`).join("")}</tbody></table></div><p class="mkt-note">단위: 코인 · 시세 ${esc(MARKET.label||"")}</p>`:`<p class="empty">아직 가진 주식이 없어요. 주식 탭에서 사 볼 수 있어요.</p>`}
  </article>
  <article class="card"><h3>퀴즈 기록</h3>
    <div class="acct four">
      <div class="acct-box"><span class="lbl">도전 횟수</span><b>${+s.qCount||0}</b><small>번</small></div>
      <div class="acct-box"><span class="lbl">맞힌 문제</span><b>${+s.qRight||0}</b><small>문제</small></div>
      <div class="acct-box"><span class="lbl">오늘의 도전</span><b>${qz.date===today()?(qz.state==="완료"?`${qz.right}/${qz.total}`:"푸는 중"):"아직"}</b></div>
      <div class="acct-box"><span class="lbl">오답 노트</span><b>${Object.keys(wrongNote).length}</b><small>문제</small></div>
    </div>
  </article>`;
  meMsg="";
  const m=$("#meMsg");
  const cur=()=>{const a=(ME.avatar&&typeof ME.avatar==="object")?ME.avatar:{};return {g:a.g==="f"?"f":"m",hair:HAIRS[a.hair]?+a.hair:av.hair,skin:SKINS[a.skin]?+a.skin:0,slots:{...(a.slots||{})}}};
  const save=a=>act(null,m,()=>upd({avatar:a})).then(ok=>{if(ok)renderMyPage()});
  document.querySelectorAll("[data-av-g]").forEach(b=>b.onclick=()=>save({...cur(),g:b.dataset.avG}));
  document.querySelectorAll("[data-av-h]").forEach(b=>b.onclick=()=>save({...cur(),hair:+b.dataset.avH}));
  document.querySelectorAll("[data-av-s]").forEach(b=>b.onclick=()=>save({...cur(),skin:+b.dataset.avS}));
  document.querySelectorAll("[data-gear]").forEach(b=>b.onclick=()=>{const [slot,id]=b.dataset.gear.split("|");const a=cur();a.slots[slot]=id;save(a)});
  document.querySelectorAll("[data-gauto]").forEach(b=>b.onclick=()=>{const a=cur();delete a.slots[b.dataset.gauto];save(a)});
  $("#stForm").addEventListener("submit",e=>{
    e.preventDefault();const t=$("#stIn").value.trim().slice(0,40);
    act($("#stSave"),m,()=>upd({status:t})).then(ok=>{if(ok){meMsg=t?"상태메시지를 저장했어요.":"상태메시지를 지웠어요.";document.activeElement&&document.activeElement.blur();renderMyPage()}});
  });
}

/* ---------- 자유게시판 ---------- */
let BRD={posts:{},comments:{},likes:{}},openPost=null,boardMsg="";
const isT=()=>role==="teacher";
const myKey=()=>isT()?"T":KEY;
function whoHtml(k,name){
  const s=STUDENTS[k];
  return `${k==="T"?`<span class="t-badge" aria-hidden="true">T</span>`:avatarSvg(avOf(s||{}),32,name)}<span class="pname">${esc(k==="T"?"선생님":(s?s.name:name))}</span>`;
}
function postHtml(p){
  const likes=(BRD.likes||{})[p.id]||{},nLike=Object.keys(likes).length,liked=!!likes[myKey()];
  const cm=Object.entries((BRD.comments||{})[p.id]||{}).map(([id,c])=>({id,...c})).sort((a,b)=>a.t-b.t);
  const mine=p.k===myKey()||isT(),open=CFG.boardOpen!==false||isT();
  return `<article class="card post ${p.notice?"notice":""}" id="post-${esc(p.id)}">
    <div class="post-head">${whoHtml(p.k,p.name)}<span class="when">${p.notice?"공지 · ":""}${whenKST(p.t)}</span></div>
    <p class="post-text">${esc(p.text)}</p>
    <div class="post-actions">
      <button type="button" class="ghost ${liked?"on":""}" data-like="${esc(p.id)}" aria-pressed="${liked}">좋아요 ${nLike}</button>
      <button type="button" class="ghost" data-cmt="${esc(p.id)}" aria-expanded="${openPost===p.id}">댓글 ${cm.length}</button>
      ${mine?`<button type="button" class="link" data-pdel="${esc(p.id)}">지우기</button>`:""}
    </div>
    ${openPost===p.id?`<div class="cmts">
      ${cm.map(c=>`<div class="cmt"><div class="post-head">${whoHtml(c.k,c.name)}<span class="when">${whenKST(c.t)}</span>${c.k===myKey()||isT()?`<button type="button" class="link" data-cdel="${esc(p.id)}|${esc(c.id)}">지우기</button>`:""}</div><p>${esc(c.text)}</p></div>`).join("")||`<p class="empty">첫 댓글을 달아 보세요.</p>`}
      ${open?`<form class="cmt-form" data-cform="${esc(p.id)}" novalidate><input type="text" id="c-${esc(p.id)}" maxlength="150" placeholder="댓글을 적어요" aria-label="댓글"><button type="submit" class="secondary">달기</button></form>`:""}
    </div>`:""}
  </article>`;
}
function renderBoard(){
  const open=CFG.boardOpen!==false;
  const posts=Object.entries(BRD.posts||{}).map(([id,p])=>({id,...p})).filter(p=>p&&p.text).sort((a,b)=>(!!b.notice-!!a.notice)||((b.t||0)-(a.t||0)));
  $("#view-board").innerHTML=`<article class="card">
    <div class="t-head"><h2>자유게시판</h2>${isT()?`<button type="button" class="ghost" id="bOpen">${open?"글쓰기 닫기":"글쓰기 열기"}</button>`:""}</div>
    ${open||isT()?`<form id="pForm" class="post-form" novalidate>
      <label class="t-field" for="pText">${isT()?"선생님 글":"하고 싶은 이야기"}<textarea id="pText" maxlength="300" rows="3" placeholder="친구들에게 하고 싶은 말을 적어요. 고운 말을 써요."></textarea></label>
      <div class="actions">${isT()?`<label class="inline" for="pNotice"><input type="checkbox" id="pNotice"> 공지로 올리기</label>`:""}<button type="submit" class="primary" id="pGo">올리기</button><span class="lbl" id="pCount">0/300</span></div>
    </form>`:`<p class="t-help">지금은 선생님이 글쓰기를 잠시 닫아 두었어요. 읽기만 할 수 있어요.</p>`}
    ${isT()&&!open?`<p class="t-help">학생 글쓰기가 닫혀 있어요. 선생님만 쓸 수 있어요.</p>`:""}
    <p class="msg" id="pMsg" role="status">${esc(boardMsg)}</p>
  </article>
  ${posts.length?posts.map(postHtml).join(""):`<article class="card"><p class="empty">아직 글이 없어요. 첫 글을 올려 보세요.</p></article>`}`;
  boardMsg="";
  const m=$("#pMsg");
  if($("#bOpen"))$("#bOpen").onclick=()=>act($("#bOpen"),m,()=>R("config/boardOpen").set(!open)).then(ok=>{if(ok){boardMsg=open?"학생 글쓰기를 닫았어요.":"학생 글쓰기를 열었어요.";renderBoard()}});
  if($("#pText"))$("#pText").oninput=e=>{$("#pCount").textContent=`${e.target.value.length}/300`};
  if($("#pForm"))$("#pForm").addEventListener("submit",e=>{
    e.preventDefault();const text=$("#pText").value.trim().slice(0,300);
    if(!text)return m.textContent="글을 적어 주세요.";
    const post=isT()?{k:"T",name:"선생님",text,t:SV.TIMESTAMP,...($("#pNotice").checked?{notice:true}:{})}:{k:KEY,name:ME.name,text,t:SV.TIMESTAMP};
    act($("#pGo"),m,()=>R("board/posts").push(post)).then(ok=>{if(ok){boardMsg="글을 올렸어요.";document.activeElement&&document.activeElement.blur();renderBoard()}});
  });
  document.querySelectorAll("[data-like]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.like,liked=b.getAttribute("aria-pressed")==="true";
    act(null,m,()=>R(`board/likes/${id}/${myKey()}`).set(liked?null:true)).then(ok=>{if(ok)renderBoard()});
  });
  document.querySelectorAll("[data-cmt]").forEach(b=>b.onclick=()=>{openPost=openPost===b.dataset.cmt?null:b.dataset.cmt;renderBoard();const i=$(`#c-${openPost}`);if(i)i.focus()});
  document.querySelectorAll("[data-cform]").forEach(f=>f.addEventListener("submit",e=>{
    e.preventDefault();const id=f.dataset.cform,inp=f.querySelector("input"),text=inp.value.trim().slice(0,150);
    if(!text)return;
    const c=isT()?{k:"T",name:"선생님",text,t:SV.TIMESTAMP}:{k:KEY,name:ME.name,text,t:SV.TIMESTAMP};
    act(f.querySelector("button"),m,()=>R(`board/comments/${id}`).push(c)).then(ok=>{if(ok){inp.value="";inp.blur();renderBoard()}});
  }));
  const arm=b=>{if(b.dataset.armed==="1")return true;b.dataset.armed="1";b.textContent="한 번 더 누르면 지워요";return false};
  document.querySelectorAll("[data-pdel]").forEach(b=>b.onclick=()=>{
    if(!arm(b))return;const id=b.dataset.pdel;
    act(b,m,()=>isT()?R("board").update({[`posts/${id}`]:null,[`comments/${id}`]:null,[`likes/${id}`]:null}):R(`board/posts/${id}`).remove()).then(ok=>{if(ok){boardMsg="글을 지웠어요.";renderBoard()}});
  });
  document.querySelectorAll("[data-cdel]").forEach(b=>b.onclick=()=>{
    if(!arm(b))return;const [pid,cid]=b.dataset.cdel.split("|");
    act(b,m,()=>R(`board/comments/${pid}/${cid}`).remove()).then(ok=>{if(ok)renderBoard()});
  });
}

/* ---------- 선생님: 여러 학생 한꺼번에 ---------- */
let bulkSel=new Set(),bulkMsg="";
function enhanceTeacher(){
  enhanceTeacherLotto();
  const tbl=document.querySelector("#view-teacher .tbl:not(.lotto-tbl)");if(!tbl)return;
  [...bulkSel].forEach(k=>{if(!STUDENTS[k])bulkSel.delete(k)});
  const keys=[...tbl.querySelectorAll("[data-pick]")].map(b=>b.dataset.pick);
  const hr=tbl.querySelector("thead tr");
  if(hr&&keys.length)hr.insertAdjacentHTML("afterbegin",`<th><input type="checkbox" id="bAll" aria-label="모두 선택" ${keys.length&&keys.every(k=>bulkSel.has(k))?"checked":""}></th>`);
  else if(hr)hr.insertAdjacentHTML("afterbegin","<th></th>");
  tbl.querySelectorAll("tbody tr").forEach(tr=>{
    const b=tr.querySelector("[data-pick]");
    if(!b){const td=tr.querySelector("td[colspan]");if(td)td.colSpan=9;return}
    const k=b.dataset.pick;
    tr.insertAdjacentHTML("afterbegin",`<td><input type="checkbox" data-bsel="${esc(k)}" aria-label="${esc(k)} 선택" ${bulkSel.has(k)?"checked":""}></td>`);
  });
  const n=bulkSel.size,wrap=tbl.closest(".tbl-wrap");
  wrap.insertAdjacentHTML("afterend",`<section class="bulk-bar" id="bulkBar" ${n?"":"hidden"} aria-label="여러 학생 한꺼번에">
    <div class="t-head"><h3>선택한 학생 ${n}명 한꺼번에</h3><button type="button" class="link" id="bClear">선택 풀기</button></div>
    <p class="t-help">${[...bulkSel].map(k=>esc(`${k} ${STUDENTS[k]?STUDENTS[k].name:""}`)).join(", ")}</p>
    <div class="row2">
      <label class="t-field" for="bAmt">코인 (빼려면 -)<input type="number" id="bAmt" step="1" placeholder="예: 30 또는 -20"></label>
      <label class="t-field" for="bWhy">이유<input type="text" id="bWhy" maxlength="30" placeholder="예: 모둠 활동 칭찬"></label>
    </div>
    <div class="actions"><button type="button" class="primary" id="bGive">모두에게 코인 반영</button></div>
    <div class="reset-grid">
      <button type="button" class="ghost" data-bop="quiz">오늘 퀴즈 다시 풀게 하기</button>
      <button type="button" class="ghost" data-bop="pw">비밀번호 초기화</button>
      <button type="button" class="ghost" data-bop="sell">주식 모두 팔아 지갑으로</button>
      <button type="button" class="ghost" data-bop="zero">코인 모두 0으로</button>
      <button type="button" class="ghost" data-bop="full">기록 전체 초기화</button>
      <button type="button" class="ghost danger" data-bop="del">학생 삭제</button>
    </div>
    <p class="msg" id="bMsg" role="status">${esc(bulkMsg)}</p>
  </section>${!n&&bulkMsg?`<p class="msg">${esc(bulkMsg)}</p>`:""}`);
  bulkMsg="";
  const m=$("#bMsg");
  if($("#bAll"))$("#bAll").onchange=e=>{keys.forEach(k=>e.target.checked?bulkSel.add(k):bulkSel.delete(k));renderTeacher()};
  tbl.querySelectorAll("[data-bsel]").forEach(c=>c.onchange=()=>{c.checked?bulkSel.add(c.dataset.bsel):bulkSel.delete(c.dataset.bsel);renderTeacher()});
  $("#bClear").onclick=()=>{bulkSel.clear();renderTeacher()};
  const L=(up,k,text,amount)=>{up[`logs/${k}/${R("logs").push().key}`]={t:SV.TIMESTAMP,text,amount:r2(amount)}};
  $("#bGive").onclick=()=>{
    const a=r2(+$("#bAmt").value||0),why=$("#bWhy").value.trim()||"선생님";
    if(!a)return m.textContent="코인을 적어 주세요.";
    const ks=[...bulkSel];
    act($("#bGive"),m,async()=>{const up={};ks.forEach(k=>{const s=STUDENTS[k];if(!s)return;up[`students/${k}/wallet`]=r2(Math.max(0,(+s.wallet||0)+a));L(up,k,`선생님: ${why}`,a)});await db.ref("matchum").update(up)})
      .then(ok=>{if(ok){bulkMsg=`${ks.length}명에게 ${a>0?"+":""}${fmt(a)}코인을 반영했어요.`;renderTeacher()}});
  };
  const LABEL={quiz:"오늘 퀴즈를 다시 풀 수 있게 했어요",pw:"비밀번호를 초기화했어요",sell:"주식을 모두 팔아 지갑에 넣었어요",zero:"코인을 모두 0으로 만들었어요",full:"기록을 전체 초기화했어요",del:"학생을 삭제했어요"};
  document.querySelectorAll("#bulkBar [data-bop]").forEach(b=>b.onclick=()=>{
    if(b.dataset.armed!=="1"){
      document.querySelectorAll("#bulkBar [data-bop]").forEach(x=>{if(x!==b&&x.dataset.armed==="1"){x.dataset.armed="";x.textContent=x.dataset.label;x.classList.remove("armed")}});
      b.dataset.label=b.textContent;b.dataset.armed="1";b.textContent=`${bulkSel.size}명 ${b.dataset.label} (한 번 더)`;b.classList.add("armed");return;
    }
    const op=b.dataset.bop,ks=[...bulkSel];
    act(b,m,async()=>{
      const up={};
      for(const k of ks){
        const s=STUDENTS[k];if(!s)continue;
        const sv=r2(valueOf(s)),total=r2((+s.wallet||0)+(+s.bank||0)+sv);
        if(op==="quiz")up[`students/${k}/quiz`]=null;
        else if(op==="pw"){up[`gens/${k}`]=await bumpGen(k);up[`students/${k}/uid`]=null}
        else if(op==="sell"){if(sv>0){up[`students/${k}/wallet`]=r2((+s.wallet||0)+sv);up[`students/${k}/stocks`]=null;L(up,k,"선생님: 주식 모두 팔기",sv)}}
        else if(op==="zero"){Object.assign(up,{[`students/${k}/wallet`]:0,[`students/${k}/bank`]:0,[`students/${k}/lastPaid`]:"",[`students/${k}/stocks`]:null});if(total)L(up,k,"선생님: 코인 초기화",-total)}
        else if(op==="full")Object.assign(up,{[`students/${k}/wallet`]:0,[`students/${k}/bank`]:0,[`students/${k}/lastPaid`]:"",[`students/${k}/stocks`]:null,[`students/${k}/quiz`]:null,[`students/${k}/qCount`]:0,[`students/${k}/qRight`]:0,[`logs/${k}`]:null,[`purchases/${k}`]:null});
        else if(op==="del")Object.assign(up,{[`students/${k}`]:null,[`logs/${k}`]:null,[`purchases/${k}`]:null,[`gens/${k}`]:await bumpGen(k)});
      }
      if(Object.keys(up).length)await db.ref("matchum").update(up);
    }).then(ok=>{if(ok){bulkMsg=`${ks.length}명: ${LABEL[op]}.`;if(op==="del"){ks.forEach(k=>bulkSel.delete(k));if(ks.includes(selKey))selKey=null}renderTeacher()}});
  });
}

/* ---------- 코인 복권 ---------- */
const LOTTO_DEF={p:[10000,3000,1500,700,300],w:[1,4,10,25,60],cap:[1,2,3,0,0],daily:1};
const isLotto=it=>!!it&&(it.kind==="lotto"||/복권/.test(it.name||""));
const n0=(v,d)=>{const x=+v;return isFinite(x)&&v!==""&&v!=null?x:d};
function lottoCfg(){
  const l=CFG.lotto||{},p=[],w=[],cap=[];
  for(let i=0;i<5;i++){
    p.push(Math.max(0,Math.round(n0((l.p||[])[i],LOTTO_DEF.p[i]))));
    w.push(Math.max(0,n0((l.w||[])[i],LOTTO_DEF.w[i])));
    cap.push(Math.max(0,Math.round(n0((l.cap||[])[i],LOTTO_DEF.cap[i]))));
  }
  const daily=Math.max(0,Math.round(n0(l.daily,LOTTO_DEF.daily)));
  if(!w.some(x=>x>0))return {...LOTTO_DEF};
  return {p,w,cap,daily};
}
const weekOf=ds=>{const d=new Date(ds+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)};
const kstDay=t=>new Date(t).toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
let LW={},lwRef=null,lwWeek="";
function watchLottoWeek(){
  const wk=weekOf(today());
  if(lwRef&&lwWeek===wk&&subs.includes(lwRef))return;
  if(lwRef&&subs.includes(lwRef)){lwRef.off();subs.splice(subs.indexOf(lwRef),1)}
  lwWeek=wk;lwRef=R("lottoWeek/"+wk);
  on(lwRef,s=>{LW=s.val()||{};if(current==="shop"||current==="teacher")rerender()});
}
function lottoOdds(){const L=lottoCfg(),t=L.w.reduce((a,b)=>a+b,0);return L.p.map((p,i)=>({rank:i+1,prize:p,pct:L.w[i]/t*100,cap:L.cap[i],won:+LW["r"+(i+1)]||0}))}
const pctTxt=x=>x>=1?`${Math.round(x*10)/10}%`:`${Math.round(x*100)/100}%`;
function drawRank(){const L=lottoCfg(),t=L.w.reduce((a,b)=>a+b,0);let x=Math.random()*t;for(let i=0;i<5;i++){x-=L.w[i];if(x<0)return i+1}return 5}
async function claimRank(r){
  const L=lottoCfg(),wk=weekOf(today());
  for(let k=r;k<=5;k++){
    const cap=L.cap[k-1];
    if(!cap)return k;
    const res=await R(`lottoWeek/${wk}/r${k}`).transaction(c=>{c=+c||0;if(c>=cap)return;return c+1});
    if(res.committed)return k;
  }
  return 5;
}
const boughtToday=()=>BUYS.filter(b=>isLotto(b)&&b.t&&kstDay(b.t)===today()).length;
function enhanceShop(){
  watchLottoWeek();
  const L=lottoCfg(),odds=lottoOdds(),left=L.daily?Math.max(0,L.daily-boughtToday()):Infinity;
  document.querySelectorAll("#view-shop .item").forEach(li=>{
    const nm=(li.querySelector(".iname")||{}).textContent||"";
    if(!isLotto({name:nm})||li.querySelector(".lotto-odds"))return;
    li.querySelector(".idesc").insertAdjacentHTML("afterend",`<ul class="lotto-odds" aria-label="복권 상금">${odds.map(o=>`<li><b class="rk r${o.rank}">${o.rank}등</b><span>${fmt(o.prize)}코인</span><small>${pctTxt(o.pct)}${o.cap?` · 이번 주 ${Math.max(0,o.cap-o.won)}/${o.cap}명 남음`:""}</small></li>`).join("")}</ul>
      <p class="lotto-rule">${L.daily?`하루 ${L.daily}장까지 살 수 있어요.`:""} 1~3등은 한 주에 우리 반에서 정해진 인원만 나와요. 매주 월요일에 다시 채워져요.</p>`);
    const b=li.querySelector("[data-buy]");
    if(b&&left<=0){b.disabled=true;b.textContent="오늘은 이미 샀어요"}
  });
  document.querySelectorAll("#view-shop .receipts li[data-rid]").forEach(li=>{
    const r=BUYS.find(x=>x.id===li.dataset.rid);if(!r||!isLotto(r))return;
    const code=li.querySelector(".rcode");if(code)code.remove();
    const tag=li.querySelector(".donetag");if(!tag)return;
    if(r.used&&r.rank)tag.innerHTML=`<b class="rk r${r.rank}">${r.rank}등</b> +${fmt(r.prize)}코인`;
    else if(!r.used)tag.outerHTML=`<button type="button" class="primary" data-scratch="${esc(r.id)}">복권 긁기</button>`;
  });
  document.querySelectorAll("[data-scratch]").forEach(b=>b.onclick=()=>scratchLotto(b.dataset.scratch,b));
}
function scratchLotto(id,btn){
  const m=$("#shopMsg");let rank=0,prize=0;
  act(btn,m,async()=>{
    const cur=(await R(`purchases/${KEY}/${id}`).once("value")).val();
    if(!cur||cur.used)throw new Error("이미 긁은 복권이에요.");
    const rk=await claimRank(drawRank()),pz=lottoCfg().p[rk-1];
    const res=await R(`purchases/${KEY}/${id}`).transaction(c=>{if(!c||c.used)return;return {...c,used:true,rank:rk,prize:pz,usedAt:SV.TIMESTAMP}});
    if(!res.committed)throw new Error("이미 긁은 복권이에요.");
    rank=rk;prize=pz;
    const w=(await R(`students/${KEY}/wallet`).once("value")).val()||0;
    await upd({wallet:r2(w+prize)});
    await log(`복권 ${rank}등 당첨`,prize);
  }).then(ok=>{if(ok)showLottoReveal(rank,prize)});
}
function showLottoReveal(rank,prize){
  const old=$("#lottoOverlay");if(old)old.remove();
  document.body.insertAdjacentHTML("beforeend",`<div class="lotto-overlay" id="lottoOverlay" role="dialog" aria-modal="true" aria-labelledby="lTitle">
    <div class="lotto-card"><p class="kind" id="lTitle">코인 복권</p>
      <div class="lotto-ball" id="lBall" aria-hidden="true">?</div>
      <p class="lotto-txt" id="lTxt" aria-live="polite">두근두근…</p>
      <button type="button" class="primary" id="lClose" hidden>확인</button></div></div>`);
  const ball=$("#lBall"),txt=$("#lTxt"),close=$("#lClose");
  const done=()=>{ball.textContent=`${rank}등`;ball.className=`lotto-ball r${rank} final`;
    txt.textContent=rank===1?`대박! 1등이에요! +${fmt(prize)}코인`:rank<=3?`축하해요! ${rank}등이에요. +${fmt(prize)}코인`:`${rank}등이에요. +${fmt(prize)}코인을 지갑에 넣었어요.`;
    close.hidden=false;close.focus()};
  close.onclick=()=>{$("#lottoOverlay").remove();if(current==="shop")renderShop()};
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches){done();return}
  let n=0;const seq=[5,4,3,2,1];const t=setInterval(()=>{ball.textContent=`${seq[n%5]}등`;ball.className=`lotto-ball r${seq[n%5]}`;n++;if(n>14){clearInterval(t);done()}},90);
}
function enhanceTeacherLotto(){
  watchLottoWeek();
  const shopCard=$("#tShop")&&$("#tShop").closest("article");if(!shopCard||$("#lottoCard"))return;
  const L=lottoCfg(),it=Object.values(SHOP||{}).find(isLotto),price=it?Math.round(+it.price||0):0,wk=weekOf(today());
  shopCard.insertAdjacentHTML("afterend",`<article class="card" id="lottoCard"><h3>복권 상금</h3>
    <p class="t-help">상점에서 이름에 '복권'이 들어간 품목은 복권이 돼요. 학생이 사서 '내 구매 확인증'에서 긁으면 바로 등수가 나오고, 상금이 지갑에 자동으로 들어가요. 확률은 비율이라 합이 100이 아니어도 돼요.</p>
    <div class="tbl-wrap"><table class="tbl lotto-tbl"><thead><tr><th>등수</th><th>상금(코인)</th><th>확률(비율)</th><th>실제 확률</th><th>한 주 최대 인원</th><th>이번 주</th></tr></thead><tbody>
    ${[0,1,2,3,4].map(i=>`<tr><td><b class="rk r${i+1}">${i+1}등</b></td><td><input type="number" id="lp${i}" min="0" step="1" value="${L.p[i]}" aria-label="${i+1}등 상금"></td><td><input type="number" id="lw${i}" min="0" step="0.1" value="${L.w[i]}" aria-label="${i+1}등 확률"></td><td id="lpct${i}"></td><td><input type="number" id="lc${i}" min="0" step="1" value="${L.cap[i]||""}" placeholder="제한 없음" aria-label="${i+1}등 한 주 최대 인원"></td><td>${+LW["r"+(i+1)]||0}명</td></tr>`).join("")}
    </tbody></table></div>
    <div class="row2"><label class="t-field" for="lDaily">학생 한 명이 하루에 살 수 있는 장수 (0이면 제한 없음)<input type="number" id="lDaily" min="0" step="1" value="${L.daily}"></label></div>
    <p class="t-help" id="lottoEv"></p>
    <p class="t-help">한 주 최대 인원이 다 차면 그 등수 대신 한 단계 낮은 등수가 나와요. 이번 주(${md(wk)} 월요일부터) 당첨 인원은 매주 월요일에 자동으로 0이 돼요.</p>
    <div class="actions"><button type="button" class="primary" id="lottoSave">복권 설정 저장</button><button type="button" class="ghost" id="lottoDef">기본값으로</button><button type="button" class="ghost" id="lottoWkReset">이번 주 당첨 인원 0으로</button></div>
    <p class="msg" id="lottoMsg" role="status"></p></article>`);
  const read=()=>({p:[0,1,2,3,4].map(i=>Math.max(0,Math.round(+$("#lp"+i).value||0))),w:[0,1,2,3,4].map(i=>Math.max(0,+$("#lw"+i).value||0)),cap:[0,1,2,3,4].map(i=>Math.max(0,Math.round(+$("#lc"+i).value||0))),daily:Math.max(0,Math.round(+$("#lDaily").value||0))});
  const calc=()=>{const v=read(),t=v.w.reduce((a,b)=>a+b,0);
    [0,1,2,3,4].forEach(i=>$("#lpct"+i).textContent=t?pctTxt(v.w[i]/t*100):"-");
    const ev=t?v.p.reduce((a,p,i)=>a+p*v.w[i]/t,0):0;
    $("#lottoEv").textContent=t?`인원 제한이 없을 때 한 장당 평균 ${fmt(ev)}코인을 돌려받아요.${price?` 복권값 ${fmt(price)}코인의 ${Math.round(ev/price*100)}%예요. 인원 제한이 걸리면 이보다 조금 낮아져요.`:""}`:"확률을 하나 이상 0보다 크게 적어 주세요."};
  [0,1,2,3,4].forEach(i=>{$("#lp"+i).oninput=calc;$("#lw"+i).oninput=calc});calc();
  $("#lottoDef").onclick=()=>{[0,1,2,3,4].forEach(i=>{$("#lp"+i).value=LOTTO_DEF.p[i];$("#lw"+i).value=LOTTO_DEF.w[i];$("#lc"+i).value=LOTTO_DEF.cap[i]||""});$("#lDaily").value=LOTTO_DEF.daily;calc()};
  const fin=(b,label,msg)=>ok=>{if(ok){b.disabled=false;b.textContent=label;$("#lottoMsg").textContent=msg}};
  $("#lottoSave").onclick=()=>{const v=read();if(!v.w.some(x=>x>0))return $("#lottoMsg").textContent="확률을 하나 이상 0보다 크게 적어 주세요.";
    act($("#lottoSave"),$("#lottoMsg"),()=>R("config/lotto").set(v)).then(fin($("#lottoSave"),"복권 설정 저장","복권 설정을 저장했어요."))};
  $("#lottoWkReset").onclick=()=>{const b=$("#lottoWkReset");if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 0으로";return}
    act(b,$("#lottoMsg"),()=>R("lottoWeek/"+wk).remove()).then(ok=>{if(ok){b.dataset.armed="";renderTeacher();$("#lottoMsg")&&($("#lottoMsg").textContent="이번 주 당첨 인원을 0으로 만들었어요.")}})};
}
