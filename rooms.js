/* ---------- 주제별 토의방 (app.js보다 먼저 불러와요) ----------
   rooms/list/방id    {k 방장 학번(선생님은 T), title 주제, q 처음 질문, type talk|vote|poll|idea, anon 익명방, opts{o1..o6} 설문 보기, t, closed 닫은 시각, summary 정리글, closedBy}
   rooms/msgs/방id/말id {k, text, t, tag 말머리, re 답장할 말id, toK 답장 받는 사람, side 찬반 입장, sys 입장 바꿈 표시, hid 선생님이 가림}
   rooms/members/방id/학번 {t 처음 참여, side pro|con|mid}
   rooms/votes/방id/학번 = 보기 id      rooms/react/방id/말id/학번 = true      rooms/mute/학번 = true (선생님만)
   운영 시간: config roomFrom~roomTo (평일, roomWeekend면 매일), roomUntil 시각까지 선생님이 더 열어 줄 수 있어요. roomOn=false면 읽기만. */
let ROOMS={},openRoom=null,roomFilter="open",roomMsg="",roomMake=false,roomReply=null,roomTag="",roomDraft="",roomClosing=false,ideaSort="new",roomLastSend=0;
const RTYPES={talk:["💬","토의","함께 생각을 모아요"],vote:["⚖️","찬반","찬성·반대로 나눠 이야기해요"],poll:["📊","설문","보기 중에 골라요"],idea:["💡","아이디어","생각을 쪽지로 붙이고 공감을 모아요"]};
const RTAGS={talk:["내 생각은","왜냐하면","질문 있어요","덧붙이면","다르게 생각해요"],vote:["내 주장은","근거는","반론할게요","질문 있어요"],poll:["내가 고른 이유는","질문 있어요"],idea:[]};
const SIDES={pro:"찬성",con:"반대",mid:"고민 중"};
const rmK=()=>role==="teacher"?"T":KEY;
const rList=()=>Object.entries((ROOMS&&ROOMS.list)||{}).map(([id,r])=>({id,...r})).filter(r=>r&&r.title);
const rRoom=id=>{const r=((ROOMS&&ROOMS.list)||{})[id];return r&&r.title?{id,...r}:null};
const rMsgs=id=>Object.entries(((ROOMS&&ROOMS.msgs)||{})[id]||{}).map(([mid,m])=>({id:mid,...m})).filter(m=>m&&m.t&&(m.text||m.sys)).sort((a,b)=>(a.t||0)-(b.t||0));
const rMembers=id=>((ROOMS&&ROOMS.members)||{})[id]||{};
const rPeople=id=>Object.keys(rMembers(id)).filter(k=>k!=="T");
const rVotes=id=>((ROOMS&&ROOMS.votes)||{})[id]||{};
const rReact=(id,mid)=>((((ROOMS&&ROOMS.react)||{})[id]||{})[mid])||{};
const rMuted=k=>!!(((ROOMS&&ROOMS.mute)||{})[k]);
const rLastT=r=>{const ms=rMsgs(r.id);return ms.length?ms[ms.length-1].t:(+r.t||0)};
const rTime=t=>{const d=new Date(t).toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});return d===today()?new Date(t).toLocaleTimeString("ko-KR",{timeZone:"Asia/Seoul",hour:"2-digit",minute:"2-digit"}):whenKST(t)};

/* 운영 시간 */
function roomHours(){
  const from=CFG.roomFrom||"08:00",to=CFG.roomTo||"16:00",until=+CFG.roomUntil||0,now=Date.now(),days=CFG.roomWeekend?"매일":"평일";
  if(CFG.roomOn===false)return {open:false,from,to,days,why:"선생님이 토의방을 잠시 닫아 두었어요. 읽기만 할 수 있어요."};
  if(until>now)return {open:true,from,to,days,extra:until};
  const dw=dowOf(today()),hm=nowHM(),open=(CFG.roomWeekend||(dw>0&&dw<6))&&hm>=from&&hm<to;
  return {open,from,to,days,why:open?"":`토의방은 ${days} ${from}~${to}에 열려요. 지금은 읽기만 할 수 있어요.`};
}
const hmOf=t=>new Date(t).toLocaleTimeString("en-GB",{timeZone:"Asia/Seoul",hour12:false}).slice(0,5);

/* 익명방: 참여한 순서대로 익명 1, 2… (방장이 1). 선생님 화면에는 실제 이름도 보여요 */
function anonMap(r){
  const mem=rMembers(r.id),ks=rPeople(r.id).sort((a,b)=>(a===r.k?-1:b===r.k?1:0)||((+mem[a].t||0)-(+mem[b].t||0))),m={};
  ks.forEach((k,i)=>m[k]=i+1);return m;
}
function rName(r,k,am){
  if(k==="T")return "선생님";
  const real=(STUDENTS[k]||{}).name||k;
  if(!r.anon)return k===KEY?`${real} (나)`:real;
  const n=(am||anonMap(r))[k],lab=n?`익명 ${n}`:"익명";
  return role==="teacher"?`${lab} (${real})`:(k===KEY?`${lab} (나)`:lab);
}
function ownerTxt(r){
  if(r.k==="T")return "선생님이 연 방";
  if(r.anon&&role!=="teacher")return r.k===KEY?"내가 연 익명방":"익명방";
  return `방장 ${(STUDENTS[r.k]||{}).name||r.k}${r.k===KEY?" (나)":""}`;
}

/* 안 읽은 이야기 (이 기기에 저장) */
let RSEEN=null;
const rSeenKey=()=>"roomSeen:"+(rmK()||"");
function rSeen(){if(RSEEN&&RSEEN.key===rSeenKey())return RSEEN.v;let v={};try{v=JSON.parse(localStorage.getItem(rSeenKey())||"{}")||{}}catch(e){v={}}RSEEN={key:rSeenKey(),v};return v}
function seeRoom(id){const ms=rMsgs(id),t=ms.length?ms[ms.length-1].t:0,v=rSeen();if(!t||(v[id]||0)>=t)return;v[id]=t;try{localStorage.setItem(rSeenKey(),JSON.stringify(v))}catch(e){}}
const rUnread=r=>{const s=rSeen()[r.id]||0;return rMsgs(r.id).filter(m=>m.t>s&&m.k!==rmK()&&!m.sys).length};

/* ---------- 화면 ---------- */
function renderRooms(){
  const v=$("#view-rooms");if(!v)return;
  if(openRoom&&!rRoom(openRoom))openRoom=null;
  const L=$("#rmList"),stick=!L||L.scrollHeight-L.scrollTop-L.clientHeight<80,top=L?L.scrollTop:0,wasIn=!!L;
  v.classList.toggle("in-room",!!openRoom);
  v.innerHTML=openRoom?roomViewHtml(rRoom(openRoom)):roomListHtml();
  if(openRoom){
    bindRoom(openRoom);
    const N=$("#rmList");if(N)N.scrollTop=stick||!wasIn?N.scrollHeight:top;
    seeRoom(openRoom);
  }else bindRoomList();
  roomMsg="";
}
/* 입력하는 중에도 새 이야기는 바로 보여요 (입력칸은 그대로) */
function roomsLive(){
  if(current!=="rooms"||!$("#view-rooms")||$("#view-rooms").hidden)return;
  const r=openRoom&&rRoom(openRoom);
  if(r&&$("#rmList")&&typing()&&!(r.closed&&$("#rmForm"))){
    const L=$("#rmList"),stick=L.scrollHeight-L.scrollTop-L.clientHeight<80;
    L.innerHTML=msgsHtml(r);const P=$("#rmPanel");if(P)P.innerHTML=panelHtml(r);
    if(stick)L.scrollTop=L.scrollHeight;
    bindMsgs(r.id);bindPanel(r.id);seeRoom(r.id);return;
  }
  rerender();
}

function hoursHtml(){
  const h=roomHours();
  if(role==="teacher"){
    const until=+CFG.roomUntil||0,ext=until>Date.now();
    return `<article class="card room-set">
      <div class="t-head"><h3>토의방 운영 시간</h3><span class="rstate ${h.open?"on":""}">${h.open?(h.extra?`${hmOf(h.extra)}까지 더 열림`:"지금 열려 있어요"):"지금 닫혀 있어요"}</span></div>
      <div class="rs-row">
        <label class="t-field" for="rsFrom">시작<input type="time" id="rsFrom" value="${esc(h.from)}"></label>
        <label class="t-field" for="rsTo">끝<input type="time" id="rsTo" value="${esc(h.to)}"></label>
        <label class="inline" for="rsWk"><input type="checkbox" id="rsWk" ${CFG.roomWeekend?"checked":""}> 주말에도 열기</label>
        <label class="inline" for="rsOn"><input type="checkbox" id="rsOn" ${CFG.roomOn!==false?"checked":""}> 토의방 켜기</label>
        <button type="button" class="secondary" id="rsSave">저장</button>
      </div>
      <div class="rs-ext"><span class="lbl">허락한 시간만큼 더 열기</span><button type="button" class="ghost" data-rext="30">지금부터 30분</button><button type="button" class="ghost" data-rext="60">1시간</button><button type="button" class="ghost" data-rext="120">2시간</button>${ext?`<button type="button" class="link" id="rsExtOff">늘린 시간 취소 (${hmOf(until)}까지)</button>`:""}</div>
      <p class="t-help">운영 시간이 아니면 학생은 읽기만 할 수 있어요. 선생님은 언제든 쓸 수 있어요.</p>
      <p class="msg" id="rsMsg" role="status"></p>
    </article>`;
  }
  const muted=rMuted(KEY);
  return `<p class="room-hours ${h.open&&!muted?"on":""}" role="status">${muted?"선생님이 잠시 말하기를 멈춰 두었어요. 읽기만 할 수 있어요.":h.open?(h.extra?`선생님이 ${hmOf(h.extra)}까지 시간을 늘려 줬어요.`:`지금 열려 있어요 · ${h.days} ${h.from}~${h.to}`):h.why}</p>`;
}

function roomListHtml(){
  const all=rList(),me=rmK(),h=roomHours();
  const isMine=r=>r.k===me||!!rMembers(r.id)[me];
  const groups={open:all.filter(r=>!r.closed),closed:all.filter(r=>r.closed),mine:all.filter(isMine)};
  const show=(groups[roomFilter]||groups.open).sort((a,b)=>rLastT(b)-rLastT(a));
  const myOpen=role==="student"&&all.find(r=>r.k===KEY&&!r.closed);
  const canMake=role==="teacher"||(h.open&&!rMuted(KEY)&&!myOpen);
  const seg=[["open","진행 중"],["closed","끝난 방"],["mine",role==="teacher"?"선생님 방":"내가 참여한 방"]];
  return `${hoursHtml()}
  <article class="card room-top">
    <div class="t-head"><h2>토의방</h2>${roomMake?"":`<button type="button" class="primary" id="rmNew" ${canMake?"":"disabled"}>+ 방 만들기</button>`}</div>
    ${myOpen&&!roomMake?`<p class="t-help">이미 연 방이 있어요. 그 방을 정리하고 닫으면 새 방을 열 수 있어요.</p>`:""}
    ${roomMake?makeHtml():`<p class="t-help">궁금한 주제로 방을 열고 친구들과 생각을 나눠요. 고운 말로, 친구 생각을 존중하며 이야기해요.</p>`}
    <div class="seg room-seg" role="group" aria-label="방 고르기">${seg.map(([k,l])=>`<button type="button" class="ghost ${roomFilter===k?"on":""}" data-rfil="${k}" aria-pressed="${roomFilter===k}">${l} ${groups[k].length}</button>`).join("")}</div>
    <p class="msg" id="rmMsg" role="status">${esc(roomMsg)}</p>
  </article>
  ${show.length?`<ul class="room-grid">${show.map(roomCardHtml).join("")}</ul>`:`<article class="card"><p class="empty">${roomFilter==="closed"?"아직 끝난 방이 없어요.":roomFilter==="mine"?"아직 참여한 방이 없어요.":"아직 열린 방이 없어요. 첫 방을 열어 보세요."}</p></article>`}`;
}
function roomCardHtml(r){
  const [ico,nm]=RTYPES[r.type]||RTYPES.talk,n=rPeople(r.id).length,cnt=rMsgs(r.id).filter(m=>!m.sys).length,un=r.closed?0:rUnread(r);
  return `<li><button type="button" class="room-card ${r.closed?"closed":""}" data-room="${esc(r.id)}">
    <span class="rc-top"><span class="rbadge t-${esc(r.type)}">${ico} ${nm}</span>${r.anon?`<span class="rbadge">익명방</span>`:""}${r.closed?`<span class="rbadge done">끝남</span>`:""}${un?`<b class="rc-new">새 이야기 ${un}</b>`:""}</span>
    <b class="rc-title">${esc(r.title)}</b>
    ${r.q?`<span class="rc-q">${esc(r.q)}</span>`:""}
    <small>${esc(ownerTxt(r))} · ${n}명 참여 · 이야기 ${cnt}개 · ${rTime(rLastT(r))}</small>
  </button></li>`;
}
function makeHtml(){
  return `<form id="rmMake" class="room-make" novalidate>
    <fieldset class="rtypes"><legend>어떤 방을 열까요?</legend>
      ${Object.entries(RTYPES).map(([k,[ico,nm,d]],i)=>`<label class="rtype"><input type="radio" name="rmType" value="${k}" ${i===0?"checked":""}><span><b>${ico} ${nm}</b><small>${d}</small></span></label>`).join("")}
    </fieldset>
    <label class="t-field" for="rmTitle">주제<input type="text" id="rmTitle" maxlength="40" placeholder="예: 쉬는 시간을 10분 더 늘려야 할까?" autocomplete="off"></label>
    <label class="t-field" for="rmQ">처음 질문이나 설명 (안 써도 돼요)<textarea id="rmQ" maxlength="150" rows="2" placeholder="친구들이 무엇을 이야기하면 좋을지 적어요."></textarea></label>
    <div class="rm-opts" id="rmOpts" hidden>
      <span class="lbl">설문 보기 (2~6개)</span>
      <div id="rmOptList">${[1,2].map(i=>`<input type="text" class="rm-opt" maxlength="20" placeholder="보기 ${i}" aria-label="보기 ${i}">`).join("")}</div>
      <button type="button" class="ghost" id="rmOptAdd">+ 보기 추가</button>
    </div>
    <label class="inline rm-anon" for="rmAnon"><input type="checkbox" id="rmAnon"> 익명방으로 열기</label>
    <p class="t-help" id="rmAnonHelp">익명방에서는 이름 대신 '익명 1, 익명 2…'로 보여요. 선생님은 누가 썼는지 볼 수 있어요.</p>
    <div class="actions"><button type="submit" class="primary" id="rmMakeGo">방 열기</button><button type="button" class="secondary" id="rmMakeX">취소</button></div>
  </form>`;
}

function roomViewHtml(r){
  const closed=!!r.closed,own=r.k===rmK(),T=role==="teacher";
  return `<div class="room-side">
    <article class="card room-head">
      <button type="button" class="link rm-back" id="rmBack">← 방 목록</button>
      <div id="rmPanel">${panelHtml(r)}</div>
      ${!closed&&(own||T)?(roomClosing?`<form id="rmCloseF" class="rm-close" novalidate>
          <label class="t-field" for="rmSum">정리글 · 우리가 이야기한 것<textarea id="rmSum" maxlength="300" rows="3" placeholder="예: 쉬는 시간은 그대로 두고, 점심시간에 놀이 시간을 늘리자는 의견이 많았어요."></textarea></label>
          <div class="actions"><button type="submit" class="primary" id="rmCloseGo">정리하고 닫기</button><button type="button" class="secondary" id="rmCloseX">취소</button></div>
        </form>`:`<div class="actions"><button type="button" class="secondary" id="rmClose">정리하고 방 닫기</button></div>`):""}
      ${T?`<div class="actions rm-tools">${closed?`<button type="button" class="ghost" id="rmReopen">다시 열기</button>`:""}<button type="button" class="link" id="rmDel">방 지우기</button></div>`:""}
      <p class="msg" id="rmMsg" role="status">${esc(roomMsg)}</p>
    </article>
  </div>
  <article class="card room-chat">
    ${r.type==="idea"?`<div class="t-head"><h3>아이디어 쪽지</h3><div class="seg">${[["new","새 쪽지 순"],["like","공감 순"]].map(([k,l])=>`<button type="button" class="ghost ${ideaSort===k?"on":""}" data-isort="${k}" aria-pressed="${ideaSort===k}">${l}</button>`).join("")}</div></div>`:""}
    <div class="rm-list ${r.type==="idea"?"ideas":""}" id="rmList" role="log" aria-label="이야기" tabindex="0">${msgsHtml(r)}</div>
    ${composerHtml(r)}
  </article>`;
}
function panelHtml(r){
  const [ico,nm]=RTYPES[r.type]||RTYPES.talk,n=rPeople(r.id).length;
  let extra="";
  if(r.type==="vote")extra=votePanel(r);
  if(r.type==="poll")extra=pollPanel(r);
  return `<div class="rc-top"><span class="rbadge t-${esc(r.type)}">${ico} ${nm}</span>${r.anon?`<span class="rbadge">익명방</span>`:""}${r.closed?`<span class="rbadge done">끝난 방</span>`:""}</div>
    <h2 class="rm-title">${esc(r.title)}</h2>
    ${r.q?`<p class="rm-q">${esc(r.q)}</p>`:""}
    <p class="lbl">${esc(ownerTxt(r))} · ${n}명 참여 · ${whenKST(r.t)} 열림</p>
    ${extra}
    ${r.closed?`<div class="rm-summary"><b>정리글</b>${r.summary?`<p>${esc(r.summary)}</p>`:`<p class="empty">정리글 없이 닫혔어요.</p>`}<small>${r.closedBy==="T"?"선생님":"방장"}이 ${whenKST(r.closed)}에 닫았어요.</small></div>`:""}`;
}
function votePanel(r){
  const mem=rMembers(r.id),c={pro:0,con:0,mid:0};Object.entries(mem).forEach(([k,m])=>{if(k!=="T"&&m&&c[m.side]!=null)c[m.side]++});
  const tot=c.pro+c.con+c.mid,mine=(mem[KEY]||{}).side,can=role==="student"&&!r.closed&&roomHours().open&&!rMuted(KEY);
  return `<div class="vote-box">
    <div class="vote-bar" role="img" aria-label="찬성 ${c.pro}명, 반대 ${c.con}명, 고민 중 ${c.mid}명">${tot?["pro","con","mid"].map(s=>c[s]?`<span class="vb-${s}" style="flex:${c[s]}"></span>`:"").join(""):`<span class="vb-none"></span>`}</div>
    <div class="vote-cnt">${["pro","con","mid"].map(s=>`<span class="vc-${s}">${SIDES[s]} <b>${c[s]}</b></span>`).join("")}</div>
    ${role==="student"?`<div class="vote-pick" role="group" aria-label="내 입장">${["pro","con","mid"].map(s=>`<button type="button" class="ghost vp-${s} ${mine===s?"on":""}" data-side="${s}" aria-pressed="${mine===s}" ${can?"":"disabled"}>${SIDES[s]}</button>`).join("")}</div>
      <p class="t-help">${mine?`내 입장: ${SIDES[mine]} · 생각이 바뀌면 언제든 바꿀 수 있어요.`:"먼저 내 입장을 골라야 이야기할 수 있어요."}</p>`:""}
  </div>`;
}
function pollPanel(r){
  const opts=Object.entries(r.opts||{}).sort(),votes=rVotes(r.id),mine=votes[KEY],tot=Object.keys(votes).length;
  const see=role==="teacher"||r.k===rmK()||!!mine||!!r.closed,can=role==="student"&&!r.closed&&roomHours().open&&!rMuted(KEY);
  return `<div class="poll-box" role="group" aria-label="설문">
    ${opts.map(([oid,label])=>{const who=Object.entries(votes).filter(([,v])=>v===oid).map(([k])=>k),pct=tot?Math.round(who.length/tot*100):0;
      return `<button type="button" class="poll-opt ${mine===oid?"on":""}" data-vote="${esc(oid)}" aria-pressed="${mine===oid}" ${can?"":"disabled"}>
        ${see?`<span class="po-fill" style="width:${pct}%"></span>`:""}<span class="po-l">${mine===oid?"✔ ":""}${esc(label)}</span>${see?`<span class="po-n">${who.length}명 · ${pct}%</span>`:""}
        ${see&&(!r.anon||role==="teacher")&&who.length?`<small class="po-who">${who.map(k=>esc((STUDENTS[k]||{}).name||k)).join(", ")}</small>`:""}
      </button>`}).join("")}
    <p class="t-help">${see?`모두 ${tot}명이 골랐어요.`:"골라야 결과를 볼 수 있어요."}${role==="student"&&!r.closed?" 방이 닫히기 전까지 바꿀 수 있어요.":""}</p>
  </div>`;
}
function msgsHtml(r){
  const ms=rMsgs(r.id),am=r.anon?anonMap(r):null,byId={};ms.forEach(m=>byId[m.id]=m);
  if(!ms.length)return `<p class="empty rm-empty">${r.type==="idea"?"첫 아이디어 쪽지를 붙여 보세요.":"아직 이야기가 없어요. 첫 마디를 꺼내 보세요."}</p>`;
  if(r.type==="idea"){
    const list=ms.filter(m=>!m.sys).map(m=>({m,n:Object.keys(rReact(r.id,m.id)).length}));
    list.sort((a,b)=>ideaSort==="like"?(b.n-a.n)||(b.m.t-a.m.t):(b.m.t-a.m.t));
    return list.map(({m})=>msgHtml(r,m,am,byId)).join("");
  }
  return ms.map(m=>msgHtml(r,m,am,byId)).join("");
}
function msgHtml(r,m,am,byId){
  const nm=rName(r,m.k,am);
  if(m.sys)return `<div class="rm-sys"><b>${esc(nm)}</b> ${esc(m.text)}</div>`;
  const T=role==="teacher",mine=m.k===rmK(),rc=rReact(r.id,m.id),n=Object.keys(rc).length,on=!!rc[rmK()];
  const live=!r.closed&&(T||(roomHours().open&&!rMuted(KEY))),par=m.re&&byId[m.re];
  const hidden=m.hid&&!T;
  return `<div class="rm ${mine?"me":""} ${m.k==="T"?"tch":""} ${m.side?"s-"+esc(m.side):""} ${m.hid?"hid":""}" id="rm-${esc(m.id)}">
    <div class="rm-who"><b>${esc(nm)}</b>${m.k===r.k?`<span class="rchip">방장</span>`:""}${m.side&&SIDES[m.side]?`<span class="rchip c-${esc(m.side)}">${SIDES[m.side]}</span>`:""}<small>${rTime(m.t)}</small></div>
    ${par&&!hidden?`<div class="rm-quote">↩ ${esc(rName(r,par.k,am))} · ${esc(snip(par.hid?"가린 말":par.text))}</div>`:""}
    <p class="rm-text">${hidden?`<i>선생님이 가린 말이에요.</i>`:`${m.tag?`<b class="rm-tag">${esc(m.tag)}</b> `:""}${esc(m.text)}`}</p>
    ${hidden?"":`<div class="rm-acts">
      <button type="button" class="rm-like ${on?"on":""}" data-rlike="${esc(m.id)}" aria-pressed="${on}" aria-label="공감 ${n}개" ${live?"":"disabled"}>👍${n?` ${n}`:""}</button>
      ${live&&r.type!=="idea"&&!mine?`<button type="button" class="link" data-rre="${esc(m.id)}">답장</button>`:""}
      ${T?`<button type="button" class="link" data-rhide="${esc(m.id)}">${m.hid?"다시 보이기":"가리기"}</button><button type="button" class="link" data-rdel="${esc(m.id)}">지우기</button>${m.k!=="T"?`<button type="button" class="link" data-rmute="${esc(m.k)}">${rMuted(m.k)?"말하기 풀기":"말하기 멈춤"}</button>`:""}`:""}
    </div>`}
  </div>`;
}
function composerHtml(r){
  const T=role==="teacher",h=roomHours();
  if(r.closed)return `<p class="t-help rm-note">끝난 방이에요. 이야기를 읽을 수만 있어요.</p>`;
  if(!T&&rMuted(KEY))return `<p class="t-help rm-note">선생님이 잠시 말하기를 멈춰 두었어요.</p>`;
  if(!T&&!h.open)return `<p class="t-help rm-note">${esc(h.why)}</p>`;
  if(!T&&r.type==="vote"&&!(rMembers(r.id)[KEY]||{}).side)return `<p class="t-help rm-note">위에서 내 입장(찬성·반대·고민 중)을 먼저 골라 주세요.</p>`;
  const tags=RTAGS[r.type]||[],am=r.anon?anonMap(r):null,ph=r.type==="idea"?"아이디어를 쪽지에 적어요":"고운 말로 내 생각을 적어요";
  return `<form id="rmForm" class="rm-form" novalidate>
    ${tags.length?`<div class="rm-tags" role="group" aria-label="말머리 (누르면 문장 앞에 붙어요)">${tags.map(t=>`<button type="button" class="rm-chip" data-rtag="${esc(t)}" aria-pressed="${roomTag===t}">${esc(t)}</button>`).join("")}</div>`:""}
    ${roomReply?`<div class="rm-replying">↩ <b>${esc(rName(r,roomReply.k,am))}</b>에게 답장 <button type="button" class="link" id="rmReX">취소</button></div>`:""}
    <div class="rm-in"><textarea id="rmText" maxlength="200" rows="2" placeholder="${ph}" aria-label="보낼 말">${esc(roomDraft)}</textarea><button type="submit" class="primary" id="rmGo">${r.type==="idea"?"붙이기":"보내기"}</button></div>
    <span class="lbl" id="rmCount">${roomDraft.length}/200 · Enter로 보내요 (줄 바꿈은 Shift+Enter)</span>
  </form>`;
}

/* ---------- 동작 ---------- */
function bindRoomList(){
  const m=$("#rmMsg");
  document.querySelectorAll("[data-rfil]").forEach(b=>b.onclick=()=>{roomFilter=b.dataset.rfil;renderRooms()});
  document.querySelectorAll("[data-room]").forEach(b=>b.onclick=()=>{openRoom=b.dataset.room;roomReply=null;roomTag="";roomDraft="";roomClosing=false;renderRooms();window.scrollTo({top:0})});
  if($("#rmNew"))$("#rmNew").onclick=()=>{roomMake=true;renderRooms();const t=$("#rmTitle");if(t)t.focus()};
  bindHours();
  const f=$("#rmMake");if(!f)return;
  const sync=()=>{const t=(f.querySelector("[name=rmType]:checked")||{}).value;$("#rmOpts").hidden=t!=="poll"};
  f.querySelectorAll("[name=rmType]").forEach(x=>x.onchange=sync);sync();
  $("#rmOptAdd").onclick=()=>{const L=$("#rmOptList"),n=L.querySelectorAll("input").length;if(n>=6)return;L.insertAdjacentHTML("beforeend",`<input type="text" class="rm-opt" maxlength="20" placeholder="보기 ${n+1}" aria-label="보기 ${n+1}">`);L.lastElementChild.focus();if(n+1>=6)$("#rmOptAdd").hidden=true};
  $("#rmMakeX").onclick=()=>{roomMake=false;renderRooms()};
  f.addEventListener("submit",e=>{
    e.preventDefault();
    const type=(f.querySelector("[name=rmType]:checked")||{}).value||"talk",title=$("#rmTitle").value.trim().slice(0,40),q=$("#rmQ").value.trim().slice(0,150),anon=$("#rmAnon").checked;
    if(!title)return m.textContent="주제를 적어 주세요.";
    if(role==="student"&&!roomHours().open)return m.textContent=roomHours().why;
    if(role==="student"&&rList().some(r=>r.k===KEY&&!r.closed))return m.textContent="이미 연 방이 있어요. 그 방을 닫으면 새 방을 열 수 있어요.";
    const room={k:rmK(),title,type,t:SV.TIMESTAMP,...(q?{q}:{}),...(anon?{anon:true}:{})};
    if(type==="poll"){
      const os=[...f.querySelectorAll(".rm-opt")].map(i=>i.value.trim().slice(0,20)).filter(Boolean);
      if(os.length<2)return m.textContent="설문 보기를 2개 이상 적어 주세요.";
      if(new Set(os).size!==os.length)return m.textContent="같은 보기가 있어요. 다르게 적어 주세요.";
      room.opts={};os.forEach((o,i)=>room.opts["o"+(i+1)]=o);
    }
    const id=R("rooms/list").push().key,up={[`list/${id}`]:room};
    if(role==="student")up[`members/${id}/${KEY}`]={t:SV.TIMESTAMP};
    act($("#rmMakeGo"),m,()=>R("rooms").update(up)).then(ok=>{if(ok){roomMake=false;openRoom=id;roomDraft="";roomTag="";roomReply=null;roomMsg="방을 열었어요. 친구들이 들어오면 이야기를 시작해요.";document.activeElement&&document.activeElement.blur();renderRooms()}});
  });
}
function bindHours(){
  const m=$("#rsMsg");if(!m)return;
  $("#rsSave").onclick=()=>{
    const from=$("#rsFrom").value||"08:00",to=$("#rsTo").value||"16:00";
    if(from>=to)return m.textContent="끝 시각이 시작 시각보다 늦어야 해요.";
    act($("#rsSave"),m,()=>R("config").update({roomFrom:from,roomTo:to,roomWeekend:$("#rsWk").checked,roomOn:$("#rsOn").checked})).then(ok=>{if(ok){roomMsg="운영 시간을 저장했어요.";renderRooms()}});
  };
  document.querySelectorAll("[data-rext]").forEach(b=>b.onclick=()=>{const until=Date.now()+(+b.dataset.rext)*60000;
    act(b,m,()=>R("config").update({roomUntil:until,roomOn:true})).then(ok=>{if(ok){roomMsg=`토의방을 ${hmOf(until)}까지 열었어요.`;renderRooms()}})});
  if($("#rsExtOff"))$("#rsExtOff").onclick=()=>act($("#rsExtOff"),m,()=>R("config/roomUntil").set(0)).then(ok=>{if(ok){roomMsg="늘린 시간을 취소했어요.";renderRooms()}});
}
function bindRoom(id){
  const m=$("#rmMsg"),r=rRoom(id);if(!r)return;
  $("#rmBack").onclick=()=>{openRoom=null;roomReply=null;roomDraft="";roomClosing=false;renderRooms();window.scrollTo({top:0})};
  if($("#rmClose"))$("#rmClose").onclick=()=>{roomClosing=true;renderRooms();const s=$("#rmSum");if(s)s.focus()};
  if($("#rmCloseX"))$("#rmCloseX").onclick=()=>{roomClosing=false;renderRooms()};
  if($("#rmCloseF"))$("#rmCloseF").addEventListener("submit",e=>{
    e.preventDefault();const sum=$("#rmSum").value.trim().slice(0,300);
    if(!sum&&role!=="teacher")return m.textContent="정리글을 적어야 방을 닫을 수 있어요. 우리가 이야기한 것을 짧게 적어요.";
    act($("#rmCloseGo"),m,()=>R(`rooms/list/${id}`).update({closed:SV.TIMESTAMP,closedBy:rmK(),...(sum?{summary:sum}:{})})).then(ok=>{if(ok){roomClosing=false;roomMsg="방을 닫았어요. 이야기는 '끝난 방'에서 다시 볼 수 있어요.";document.activeElement&&document.activeElement.blur();renderRooms()}});
  });
  if($("#rmReopen"))$("#rmReopen").onclick=()=>act($("#rmReopen"),m,()=>R(`rooms/list/${id}`).update({closed:null,closedBy:null,summary:null})).then(ok=>{if(ok){roomMsg="방을 다시 열었어요.";renderRooms()}});
  if($("#rmDel"))$("#rmDel").onclick=e=>{const b=e.currentTarget;
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 방과 이야기가 모두 지워져요";return}
    act(b,m,()=>R("rooms").update({[`list/${id}`]:null,[`msgs/${id}`]:null,[`members/${id}`]:null,[`votes/${id}`]:null,[`react/${id}`]:null})).then(ok=>{if(ok){openRoom=null;roomMsg="방을 지웠어요.";renderRooms()}});
  };
  document.querySelectorAll("[data-isort]").forEach(b=>b.onclick=()=>{ideaSort=b.dataset.isort;renderRooms()});
  bindPanel(id);bindMsgs(id);
  const f=$("#rmForm");if(!f)return;
  const ta=$("#rmText");
  ta.oninput=()=>{roomDraft=ta.value;$("#rmCount").textContent=`${ta.value.length}/200 · Enter로 보내요 (줄 바꿈은 Shift+Enter)`};
  ta.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event("submit",{cancelable:true}))}};
  f.querySelectorAll("[data-rtag]").forEach(b=>b.onclick=()=>{roomTag=roomTag===b.dataset.rtag?"":b.dataset.rtag;f.querySelectorAll("[data-rtag]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.rtag===roomTag)));ta.focus()});
  if($("#rmReX"))$("#rmReX").onclick=()=>{roomReply=null;renderRooms();const t=$("#rmText");if(t)t.focus()};
  f.addEventListener("submit",e=>{
    e.preventDefault();const text=ta.value.trim().slice(0,200),cur=rRoom(id);
    if(!text||!cur)return;
    if(role==="student"&&Date.now()-roomLastSend<5000)return m.textContent="조금 천천히! 5초 뒤에 다시 보낼 수 있어요.";
    const side=(rMembers(id)[KEY]||{}).side,mid=R(`rooms/msgs/${id}`).push().key;
    const msg={k:rmK(),text,t:SV.TIMESTAMP,...(roomTag?{tag:roomTag}:{}),...(roomReply?{re:roomReply.id,toK:roomReply.k}:{}),...(cur.type==="vote"&&side?{side}:{})};
    const up={[`msgs/${id}/${mid}`]:msg};
    if(role==="student"&&!rMembers(id)[KEY])up[`members/${id}/${KEY}`]={t:SV.TIMESTAMP};
    const btn=$("#rmGo");
    act(btn,m,()=>R("rooms").update(up)).then(ok=>{
      if(!ok){if(btn){btn.disabled=false;btn.textContent=cur.type==="idea"?"붙이기":"보내기"}return}
      roomLastSend=Date.now();roomDraft="";roomTag="";roomReply=null;
      const L=$("#rmList");if(L)L.scrollTop=L.scrollHeight;
      renderRooms();const N=$("#rmList");if(N&&cur.type!=="idea")N.scrollTop=N.scrollHeight;const t=$("#rmText");if(t)t.focus();
    });
  });
}
function bindPanel(id){
  const m=$("#rmMsg");
  document.querySelectorAll("[data-side]").forEach(b=>b.onclick=()=>{
    const s=b.dataset.side,mem=rMembers(id)[KEY],old=mem&&mem.side;if(old===s)return;
    const up={[`members/${id}/${KEY}/side`]:s};
    if(!mem)up[`members/${id}/${KEY}/t`]=SV.TIMESTAMP;
    if(old)up[`msgs/${id}/${R("rooms/msgs/"+id).push().key}`]={k:KEY,sys:"side",text:`입장을 바꿨어요: ${SIDES[old]} → ${SIDES[s]}`,t:SV.TIMESTAMP};
    act(null,m,()=>R("rooms").update(up)).then(ok=>{if(ok){roomMsg=`내 입장: ${SIDES[s]}`;renderRooms()}});
  });
  document.querySelectorAll("[data-vote]").forEach(b=>b.onclick=()=>{
    const v=b.dataset.vote;if(rVotes(id)[KEY]===v)return;
    const up={[`votes/${id}/${KEY}`]:v};if(!rMembers(id)[KEY])up[`members/${id}/${KEY}`]={t:SV.TIMESTAMP};
    act(null,m,()=>R("rooms").update(up)).then(ok=>{if(ok)renderRooms()});
  });
}
function bindMsgs(id){
  const m=$("#rmMsg");
  document.querySelectorAll("[data-rlike]").forEach(b=>b.onclick=()=>{const mid=b.dataset.rlike,on=b.getAttribute("aria-pressed")==="true";
    act(null,m,()=>R(`rooms/react/${id}/${mid}/${rmK()}`).set(on?null:true)).then(ok=>{if(ok)roomsLive()})});
  document.querySelectorAll("[data-rre]").forEach(b=>b.onclick=()=>{const x=rMsgs(id).find(y=>y.id===b.dataset.rre);if(!x)return;
    const ta=$("#rmText");if(ta)roomDraft=ta.value;roomReply={id:x.id,k:x.k};renderRooms();const t=$("#rmText");if(t)t.focus()});
  if(role!=="teacher")return;
  document.querySelectorAll("[data-rhide]").forEach(b=>b.onclick=()=>{const mid=b.dataset.rhide,x=rMsgs(id).find(y=>y.id===mid);
    act(null,m,()=>R(`rooms/msgs/${id}/${mid}/hid`).set(x&&x.hid?null:true)).then(ok=>{if(ok)renderRooms()})});
  document.querySelectorAll("[data-rdel]").forEach(b=>b.onclick=()=>{
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 지워요";return}
    const mid=b.dataset.rdel;act(b,m,()=>R("rooms").update({[`msgs/${id}/${mid}`]:null,[`react/${id}/${mid}`]:null})).then(ok=>{if(ok)renderRooms()});
  });
  document.querySelectorAll("[data-rmute]").forEach(b=>b.onclick=()=>{const k=b.dataset.rmute,on=rMuted(k),nm=(STUDENTS[k]||{}).name||k;
    act(null,m,()=>R(`rooms/mute/${k}`).set(on?null:true)).then(ok=>{if(ok){roomMsg=on?`${nm}의 말하기 멈춤을 풀었어요.`:`${nm}의 말하기를 멈췄어요. 모든 토의방에서 읽기만 할 수 있어요.`;renderRooms()}})});
}

/* ---------- 알림 (app.js notiList에서 불러요) ---------- */
function roomNoti(add){
  rList().forEach(r=>{
    const ms=rMsgs(r.id),am=r.anon?anonMap(r):null,me=rmK(),title=snip(r.title),go={tab:"rooms",room:r.id};
    ms.forEach(m=>{if(m.toK===me&&m.k!==me&&!m.hid&&!m.sys)add(m.t,"↩️",`토의방 '${title}'에서 ${rName(r,m.k,am)}님이 내 말에 답장했어요: '${snip(m.text)}'`,go)});
    if(role==="student"){
      if(r.k===KEY){const o=ms.filter(m=>m.k!==KEY&&!m.sys&&m.toK!==KEY);if(o.length)add(o[o.length-1].t,"🗣️",`내 토의방 '${title}'에 친구들이 이야기했어요. (모두 ${o.length}개)`,go)}
      if(r.k==="T")add(r.t,"🗣️",`선생님이 새 토의방을 열었어요: '${title}' 참여해 보세요.`,go);
      if(r.closed&&r.closedBy!==KEY&&(r.k===KEY||rMembers(r.id)[KEY]))add(r.closed,"🔒",`토의방이 닫혔어요: '${title}' 정리글을 확인해 보세요.`,go);
    }else if(role==="teacher"){
      if(r.k&&r.k!=="T")add(r.t,"🗣️",`${jo((STUDENTS[r.k]||{}).name||r.k,"이","가")} 새 토의방을 열었어요: '${title}'${r.anon?" (익명방)":""}`,go);
      if(r.k==="T"){const o=ms.filter(m=>m.k!=="T"&&!m.sys&&m.toK!=="T");if(o.length)add(o[o.length-1].t,"🗣️",`선생님 토의방 '${title}'에 학생들이 이야기했어요. (모두 ${o.length}개)`,go)}
    }
  });
}

/* 운영 시간이 바뀌는 순간(예: 16:00) 화면을 새로 그려요 */
let roomOpenPrev=null;
setInterval(()=>{if(!role||current!=="rooms")return;const o=roomHours().open;if(roomOpenPrev!==null&&o!==roomOpenPrev)rerender();roomOpenPrev=o},30000);
