/* 마이페이지 · 캐릭터 · 자유게시판 · 선생님 일괄 작업 (app.js보다 먼저 불러와요) */

/* ---------- 캐릭터 ---------- */
const AV_COLORS=["#f7b2bd","#ffd166","#9ad1a8","#8ecae6","#c3a6e8","#f4a261"];
const AV_FACES=["smile","wink","wow","cool"];
const AV_FACE_NAMES={smile:"웃음",wink:"윙크",wow:"놀람",cool:"늠름"};
const AV_ITEMS=[["none","없음",0],["leaf","새싹",0],["ribbon","리본",100],["glasses","안경",300],["cap","모자",600],["crown","왕관",1000]];
const TITLES=[[0,"새싹 저축가"],[100,"꼬마 저축가"],[300,"알뜰 저축가"],[600,"똑똑한 투자자"],[1000,"코인 부자"],[2000,"맞춤법 경제왕"]];
const totalOf=s=>(+(s&&s.wallet)||0)+(+(s&&s.bank)||0)+valueOf(s);
const titleOf=t=>{let r=TITLES[0][1];for(const [m,n] of TITLES)if(t>=m)r=n;return r};
const nextTitle=t=>TITLES.find(([m])=>m>t);
function avOf(s){
  const a=(s&&s.avatar)||{};
  return {c:AV_COLORS.includes(a.c)?a.c:AV_COLORS[((s&&+s.num)||0)%AV_COLORS.length],f:AV_FACES.includes(a.f)?a.f:"smile",i:AV_ITEMS.some(x=>x[0]===a.i)?a.i:"none"};
}
function avatarSvg(av,size,label){
  size=size||40;
  const eyes={smile:`<circle cx="23" cy="31" r="3"/><circle cx="37" cy="31" r="3"/>`,
    wink:`<circle cx="23" cy="31" r="3"/><path d="M34 31h6" fill="none" stroke-width="2.6" stroke-linecap="round"/>`,
    wow:`<circle cx="23" cy="30" r="3.6"/><circle cx="37" cy="30" r="3.6"/>`,
    cool:`<path d="M19 30h8M33 30h8" fill="none" stroke-width="3" stroke-linecap="round"/>`}[av.f];
  const mouth={smile:`<path d="M25 38q5 5 10 0" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
    wink:`<path d="M26 38q4 4 8 0" fill="none" stroke-width="2.4" stroke-linecap="round"/>`,
    wow:`<ellipse cx="30" cy="40" rx="3" ry="3.6"/>`,
    cool:`<path d="M25 39h10" fill="none" stroke-width="2.4" stroke-linecap="round"/>`}[av.f];
  const item={none:"",
    leaf:`<path d="M30 12c0-6 6-9 11-8-1 6-6 9-11 8z" fill="#5fae6e"/><path d="M30 14v-5" stroke="#3f7d4b" stroke-width="2" stroke-linecap="round"/>`,
    ribbon:`<path d="M38 13l8-5v10zM38 13l-8-5v10z" fill="#e5484d"/><circle cx="38" cy="13" r="2.6" fill="#b4232a"/>`,
    glasses:`<g fill="none" stroke="#1f2d3a" stroke-width="2"><circle cx="23" cy="31" r="6"/><circle cx="37" cy="31" r="6"/><path d="M29 31h2"/></g>`,
    cap:`<path d="M14 21q16-15 32 0z" fill="#3a6fd8"/><path d="M42 20h11" stroke="#3a6fd8" stroke-width="4" stroke-linecap="round"/>`,
    crown:`<path d="M18 17l4-10 8 7 8-7 4 10z" fill="#f2c14e" stroke="#a8700a" stroke-width="1.2" stroke-linejoin="round"/>`}[av.i];
  return `<svg class="av" width="${size}" height="${size}" viewBox="0 0 60 60" role="img" aria-label="${esc(label||"캐릭터")}"><path d="M30 10c14 0 22 10 22 24s-9 20-22 20S8 48 8 34 16 10 30 10z" fill="${av.c}" stroke="#1f2d3a" stroke-opacity=".25" stroke-width="1.5"/><ellipse cx="18" cy="39" rx="4" ry="2.4" fill="#ff8fa3" opacity=".55"/><ellipse cx="42" cy="39" rx="4" ry="2.4" fill="#ff8fa3" opacity=".55"/><g fill="#1f2d3a" stroke="#1f2d3a">${eyes}${mouth}</g>${item}</svg>`;
}

/* ---------- 마이페이지 ---------- */
let meMsg="";
function renderMyPage(){
  const s=ME,av=avOf(s),sv=valueOf(s),total=totalOf(s),nt=nextTitle(total);
  const holds=Object.entries(s.stocks||{}).filter(([,h])=>h.qty>1e-6).map(([k,h])=>{
    const c=k.slice(1),st=STOCKS.find(x=>x[0]===c)||[c,c],v=h.qty*coinPrice(c),cost=+h.cost||0,pl=v-cost;
    return {name:st[1],qty:h.qty,cost,v,pl,pct:cost?pl/cost*100:0};
  }).sort((a,b)=>b.v-a.v);
  const cost=holds.reduce((t,x)=>t+x.cost,0),pl=sv-cost,qz=s.quiz||{};
  const sg=x=>x>=0?"+":"";
  $("#view-me").innerHTML=`<article class="card me-hero">
    <div class="hero-av">${avatarSvg(av,112,s.name)}</div>
    <div class="hero-info">
      <p class="kind">${esc(titleOf(total))}${nt?` · ${fmt(nt[0]-total)}코인 더 모으면 '${esc(nt[1])}'`:""}</p>
      <h2>${esc(s.name)}</h2>
      <p class="t-help">${esc(s.grade)}학년 ${esc(s.cls)}반 ${esc(s.num)}번</p>
      <form class="status-form" id="stForm" novalidate>
        <label class="t-field" for="stIn">상태메시지<input type="text" id="stIn" maxlength="40" value="${esc(s.status||"")}" placeholder="오늘의 기분이나 목표를 적어요"></label>
        <button type="submit" class="secondary" id="stSave">저장</button>
      </form>
      <p class="msg" id="meMsg" role="status">${esc(meMsg)}</p>
    </div>
  </article>
  <article class="card"><h3>내 캐릭터 꾸미기</h3>
    <div class="pick-row"><span class="lbl">색깔</span><div class="pick-opts">${AV_COLORS.map((c,i)=>`<button type="button" class="swatch ${av.c===c?"on":""}" data-av-c="${c}" style="background:${c}" aria-label="색깔 ${i+1}" aria-pressed="${av.c===c}"></button>`).join("")}</div></div>
    <div class="pick-row"><span class="lbl">표정</span><div class="pick-opts">${AV_FACES.map(f=>`<button type="button" class="av-opt ${av.f===f?"on":""}" data-av-f="${f}" aria-pressed="${av.f===f}">${avatarSvg({...av,f,i:"none"},40,AV_FACE_NAMES[f])}<small>${AV_FACE_NAMES[f]}</small></button>`).join("")}</div></div>
    <div class="pick-row"><span class="lbl">꾸미기</span><div class="pick-opts">${AV_ITEMS.map(([i,n,need])=>{const lock=total<need;return `<button type="button" class="av-opt ${av.i===i?"on":""}" data-av-i="${i}" ${lock?"disabled":""} aria-pressed="${av.i===i}">${avatarSvg({...av,i},40,n)}<small>${lock?`${need}코인`:n}</small></button>`}).join("")}</div></div>
    <p class="t-help">꾸미기는 내가 가진 코인(지갑+은행+주식)이 많아질수록 하나씩 열려요.</p>
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
  const saveAv=p=>act(null,m,()=>upd({avatar:{...avOf(ME),...p}}));
  document.querySelectorAll("[data-av-c]").forEach(b=>b.onclick=()=>saveAv({c:b.dataset.avC}));
  document.querySelectorAll("[data-av-f]").forEach(b=>b.onclick=()=>saveAv({f:b.dataset.avF}));
  document.querySelectorAll("[data-av-i]").forEach(b=>b.onclick=()=>saveAv({i:b.dataset.avI}));
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
  const tbl=document.querySelector("#view-teacher .tbl");if(!tbl)return;
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
