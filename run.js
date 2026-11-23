/* =========================================================
   달리기 게임 (run.js) · app.js보다 먼저 불러와요
   - 학생 '달리기' 탭: 혼자 연습(티켓) + 친구들과 대결(선생님이 열 때)
   - 게임 화면은 run-game.js, 효과는 assets/run/pixelfx.js, 캐릭터는 assets/run/hero.png
     (탭을 처음 열 때만 불러와서 사이트가 무거워지지 않아요)

   데이터
   config  runOpen 게임 열기, runMax 하루 최대 판, runQuizT 퀴즈 끝내면 티켓, runPerfT 만점이면 티켓 더,
           runLock 수업 시간 잠금(평일 runFrom~runTo), runCoin 판당 코인, runCoinMax 하루 최대 코인,
           runGate 퀴즈 문 간격(m), runPen 대결 오답 벌점(초, 문 앞에서 멈춰요), runPrize "10,8,6,4,2" 대결 1~5등 코인
   students/학번/run  {d 날짜, used 쓴 판, coin 받은 코인, best 최고 기록(m), wr 틀린 문제 id 목록}
   race/state         {rid, st lobby|run|end|off, seed, at 출발 시각(서버 ms), paid}   ← 선생님만
   race/p/학번         {rid, n 이름, x 위치, y, s 비틀, q 문제 푸는 중, pen 기록에 더할 벌점(예전 방식, 지금은 0), pw 문 앞에서 멈춘 벌점 초, ok 정답 수, done, tm 도착 시간}  ← 학생 자기 것만
   ========================================================= */
const RUN_V="20261123b";
const RUN_ATLAS_KEYS=["idle1","idle2","idle3","idle4","walk1","walk2","walk3","walk4","walk5","walk6","walk7","walk8","walk9","walk10","run1","run2","run3","run4","run5","run6","run7","run8","run9","run10","jump1","jump2","jump3","jump4","jump5","jump6","jump7","hurt1","hurt2","hurt3","hurt4","hurt5","hurt6","hurt7","hurt8","hurt9","hurt10","hurt11","hurt12","stop1","stop2","stop3","stop4","stop5","stop6","stop7","stop8","stop9","stop10","stop11"];
const RUN_DEF={runOpen:true,runMax:3,runQuizT:1,runPerfT:1,runLock:true,runFrom:"09:00",runTo:"12:10",runCoin:2,runCoinMax:5,runGate:120,runPen:3,runPrize:"10,8,6,4,2",runLen:1000,runDiff:"normal"};
let RACE={},RUN_OFF=0,runLoading=null,runStateSig="",runTMsg="";

/* 코인 숫자: 0 이상이면 얼마든지 (소수 둘째 자리까지) */
function runNum(x){const n=+x;return isFinite(n)&&n>0?Math.round(n*100)/100:0}
function runCfg(){
  const c={...RUN_DEF,...CFG};
  return {open:c.runOpen!==false,max:Math.max(1,+c.runMax||3),quizT:Math.max(0,+c.runQuizT||0),perfT:Math.max(0,+c.runPerfT||0),
    lockOn:c.runLock!==false,from:c.runFrom||"09:00",to:c.runTo||"12:10",coin:Math.max(0,+c.runCoin||0),coinMax:Math.max(0,+c.runCoinMax||0),
    gateEvery:Math.max(60,+c.runGate||120),pen:Math.max(0,+c.runPen||0),len:[500,800,1000,1500,2000].includes(+c.runLen)?+c.runLen:1000,diff:["easy","normal","hard","crazy"].includes(c.runDiff)?c.runDiff:"normal",
    prize:String(c.runPrize==null?RUN_DEF.runPrize:c.runPrize).split(",").map(x=>runNum(x)).concat([0,0,0,0,0]).slice(0,5)};
}
const runNow=()=>Date.now()+RUN_OFF;
function runDay(){const r=(ME&&ME.run)||{};return r.d===today()?r:{d:today(),used:0,coin:0}}
function runQuizDone(){const q=ME&&ME.quiz;return !!(q&&q.date===today()&&q.state==="완료")}
function runEarned(){if(!runQuizDone())return 0;const q=ME.quiz,c=runCfg();return c.quizT+(+q.total>0&&+q.right===+q.total?c.perfT:0)}
function runLeft(){const c=runCfg();return Math.max(0,Math.min(c.max,runEarned())-(+runDay().used||0))}
/* 잠금 시간은 학생 기기 시계가 아니라 Firebase 서버 시간(한국 시간)으로 판단해요.
   기기 시계가 틀리거나, 기기에 따라 시각이 '오후 12:58'처럼 표시되어도 잠금이 풀리지 않아요. */
function runKST(){const d=new Date(runNow()+9*3600e3),p=n=>String(n).padStart(2,"0");return {dow:d.getUTCDay(),hm:p(d.getUTCHours())+":"+p(d.getUTCMinutes())}}
const runHM=v=>{const m=String(v||"").match(/^(\d{1,2}):(\d{2})/);return m?m[1].padStart(2,"0")+":"+m[2]:""};
function runLocked(){const c=runCfg();if(!c.lockOn)return false;const k=runKST();if(k.dow===0||k.dow===6)return false;
  const f=runHM(c.from)||"09:00",t=runHM(c.to)||"12:10";return k.hm>=f&&k.hm<t}
function runBlock(){
  const c=runCfg();
  if(!c.open)return "선생님이 게임을 닫아 두었어요.";
  if(runLocked())return `수업 시간(${c.from}~${c.to})에는 게임을 쉬어요.`;
  if(!runQuizDone())return "오늘의 퀴즈를 끝내면 티켓이 생겨요!";
  if(runLeft()<=0){const used=+runDay().used||0,q=ME.quiz;
    if(used>=c.max)return "오늘은 다 달렸어요. 내일 또 만나요!";
    return "티켓을 다 썼어요."+(c.perfT&&!(+q.total>0&&+q.right===+q.total)?" 퀴즈 만점이면 1장 더 받아요!":"")}
  return "";
}

/* 퀴즈 문 문제: 오늘의 퀴즈와 같은 과목·범위에서 내요 (문장 빈칸 + 속담 빈칸, 보기 2개) */
let RUN_POOL=null,RUN_POOL_SIG="";
function runPool(){
  const c=cfg(),sig=[c.subj,c.days.join(","),c.sdays.join(",")].join("|");
  if(RUN_POOL&&RUN_POOL_SIG===sig)return RUN_POOL;
  const ds=new Set(c.days),ss=new Set(c.sdays),sent=[],sd=[];
  if(c.subj!=="속담")ALL.forEach(q=>{if(q.type==="sent"&&ds.has(q.d))sent.push({id:q.id,kind:"sent",s:q.sent,ans:q.opts[0],ng:q.opts[1],e:q.e||""})});
  if(c.subj!=="맞춤법"&&typeof SD!=="undefined")SD.forEach(r=>{const d=Math.ceil(r[0]/4);if(ss.has(d)&&r[3]&&r[4]&&r[5]&&r[5][0])sd.push({id:"sd-"+r[0],kind:"sd",s:r[3],ans:r[4],ng:r[5][0],e:`'${esc(r[1])}'`})});
  let pool=sent.concat(sd);
  if(!pool.length)ALL.forEach(q=>{if(q.type==="sent")pool.push({id:q.id,kind:"sent",s:q.sent,ans:q.opts[0],ng:q.opts[1],e:q.e||""})});
  RUN_POOL=pool;RUN_POOL_SIG=sig;return pool;
}
function runPickQ(R,review){
  const pool=runPool();let b=null,rev=false;
  if(review){const wr=((ME&&ME.run&&ME.run.wr)||[]).map(id=>pool.find(p=>p.id===id)).filter(Boolean);if(wr.length&&R()<0.5){b=wr[(R()*wr.length)|0];rev=true}}
  if(!b)b=pool[(R()*pool.length)|0];
  const flip=R()<0.5;return {id:b.id,kind:b.kind,s:b.s,ans:b.ans,opts:flip?[b.ng,b.ans]:[b.ans,b.ng],e:b.e,review:rev};
}
function runMarkQ(q,ok){
  if(!ME||!KEY)return;let wr=((ME.run&&ME.run.wr)||[]).filter(id=>id!==q.id);if(!ok)wr.unshift(q.id);wr=wr.slice(0,30);
  ME.run={...(ME.run||{}),wr};R(`students/${KEY}/run/wr`).set(wr).catch(()=>{});
}
async function runUseTicket(){
  if(runBlock())return false;const c=runCfg(),lim=Math.min(c.max,runEarned());let ok=false;
  const r=await R(`students/${KEY}/run`).transaction(cur=>{cur=cur||{};const day=cur.d===today()?cur:{...cur,d:today(),used:0,coin:0};
    if((+day.used||0)>=lim){ok=false;return}ok=true;return {...day,used:(+day.used||0)+1}});
  return !!(r&&r.committed&&ok);
}
/* 혼자 연습 보상: 먹은 게임 코인 그대로. 한 판 최대(runCoin)·하루 최대(runCoinMax)까지 */
function runReward(coins,todaySoFar){const c=runCfg(),n=Math.max(0,Math.floor(+coins||0));
  const left=Math.max(0,c.coinMax-(+todaySoFar||0)),r=Math.min(n,c.coin,left);
  const why=r<n?(left<=Math.min(n,c.coin)?`오늘 받을 수 있는 코인(${c.coinMax}개)을 다 채웠어요.`:`한 판에 ${c.coin}코인까지 받아요.`):"";
  return {r,why}}
async function runSoloEnd({dist,right,all,coins}){
  const c=runCfg();let reward=0,best=0,newBest=false,todayCoin=0,why="";
  const r=await R("students/"+KEY).transaction(cur=>{
    if(!cur)return cur;const run=cur.run||{},day=run.d===today()?run:{...run,d:today(),used:0,coin:0};
    const rw=runReward(coins,day.coin);reward=rw.r;why=rw.why;
    best=Math.max(+run.best||0,dist);newBest=dist>(+run.best||0)&&dist>0;todayCoin=(+day.coin||0)+reward;
    return {...cur,wallet:r2((+cur.wallet||0)+reward),run:{...day,coin:todayCoin,best}};
  });
  if(r&&r.committed&&reward>0)await log(`달리기 연습 ${dist}m · 코인 ${coins}개 먹음 (퀴즈 ${right}/${all})`,reward).catch(()=>{});
  return {reward,best,newBest,today:todayCoin,why};
}
function runPlayers(rid){
  const p=(RACE&&RACE.p)||{};
  return Object.entries(p).filter(([k,v])=>v&&v.rid===rid).map(([k,v])=>({k,n:v.n||((STUDENTS[k]||{}).name)||k,x:+v.x||0,y:+v.y||126,s:!!v.s,q:!!v.q,pen:+v.pen||0,pw:+v.pw||0,ok:+v.ok||0,done:!!v.done,tm:+v.tm||0,j:+v.j||0,me:k===KEY}))
    .sort((a,b)=>(a.j||0)-(b.j||0));
}
function runRaceState(){const s=RACE&&RACE.state;if(!s||!s.rid)return null;return {rid:s.rid,st:s.st||"off",seed:+s.seed||1,at:+s.at||0,len:+s.len||500}}
const RUN_HOST={
  title:()=>ME&&ME.grade&&ME.cls?`${ME.grade}학년 ${ME.cls}반`:(CFG.className||"우리 반"),
  cfg:runCfg,soloBlock:runBlock,ticketsLeft:runLeft,needQuiz:()=>!runQuizDone()&&runCfg().open&&!runLocked(),
  goQuiz:()=>{if(location.hash!=="#quiz")location.hash="quiz";else showTab("quiz");window.scrollTo({top:0})},
  best:()=>+((ME&&ME.run&&ME.run.best)||0),useTicket:runUseTicket,soloEnd:runSoloEnd,pickQ:runPickQ,markQ:runMarkQ,
  race:runRaceState,now:runNow,racePlayers:runPlayers,
  raceJoin:rid=>R(`race/p/${KEY}`).set({rid,n:(ME&&ME.name)||KEY,x:0,y:126,pen:0,ok:0,j:SV.TIMESTAMP}),
  raceSend:(rid,o)=>R(`race/p/${KEY}`).update({...o,rid}),
  raceLeave:rid=>R(`race/p/${KEY}`).remove()
};

/* 선생님 미리보기: 학생 화면 그대로, 티켓·잠금 없이 몇 번이든. 코인·기록·오답은 저장하지 않아요 */
let RUN_T_BEST=0;
const RUN_HOST_T={...RUN_HOST,
  preview:"👀 선생님 미리보기 · 학생 화면과 같아요. 티켓·코인·기록은 저장되지 않아요.",
  title:()=>{const x=Object.values(STUDENTS||{}).find(v=>v&&v.grade&&v.cls);return x?`${x.grade}학년 ${x.cls}반`:(CFG.className||"우리 반")},
  soloBlock:()=>"",ticketsLeft:()=>runCfg().max,needQuiz:()=>false,best:()=>RUN_T_BEST,
  useTicket:async()=>true,markQ:()=>{},
  soloEnd:async({dist,coins})=>{const rw=runReward(coins,0),reward=rw.r,why=rw.why,newBest=dist>RUN_T_BEST&&dist>0;RUN_T_BEST=Math.max(RUN_T_BEST,dist);return {reward,best:RUN_T_BEST,newBest,today:reward,why,preview:true}},
  noRace:"대결은 학생만 참여해요. 위의 '친구들과 대결' 칸에서 열고 출발시켜 주세요.",
  raceJoin:()=>Promise.reject(new Error("teacher")),raceSend:()=>Promise.resolve(),raceLeave:()=>Promise.resolve()
};

/* 필요할 때만 게임 파일 불러오기 */
function runLoad(){
  if(window.RunGame&&window.PFX)return Promise.resolve();
  if(runLoading)return runLoading;
  const add=src=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("load"));document.head.appendChild(s)});
  window.RUN_ATLAS={src:`assets/run/hero.png?v=${RUN_V}`,w:84,h:84,cols:10,keys:RUN_ATLAS_KEYS};
  runLoading=add(`assets/run/pixelfx.js?v=${RUN_V}`).then(()=>add(`run-game.js?v=${RUN_V}`)).catch(e=>{runLoading=null;throw e});
  return runLoading;
}

/* ---------- 학생: 달리기 탭 ---------- */
function renderRun(){
  const v=$("#view-run");if(!v)return;
  if(role==="teacher"){
    const w=$("#runTWrap");
    if(w&&window.RunGame&&RunGame.mounted&&v.querySelector(".rg-game")){w.innerHTML=runTeacherHtml();runTeacherBind();RunGame.refresh();return}
    v.innerHTML=`<div id="runTWrap">${runTeacherHtml()}</div>
    <article class="card run-card">
      <div class="t-head"><h2>학생 화면으로 연습해 보기</h2><span class="rstate">미리보기</span></div>
      <p class="t-help">학생이 보는 달리기 화면과 똑같아요. 선생님은 티켓·수업 시간 잠금 없이 몇 번이든 해 볼 수 있고, 코인·기록은 저장되지 않아요. 퀴즈 문은 지금 정한 오늘의 퀴즈 범위에서 나와요.</p>
      <div id="runMount"><p class="empty">게임을 불러오는 중…</p></div>
      <p class="run-credit">효과: pixelfx (Patch, MIT License)</p>
    </article>`;
    runTeacherBind();
    runLoad().then(()=>{const m=$("#runMount");if(m&&!m.querySelector(".rg-game"))RunGame.mount(m,RUN_HOST_T)})
      .catch(()=>{const m=$("#runMount");if(m)m.innerHTML=`<p class="empty">게임을 불러오지 못했어요. 새로 고쳐 주세요.</p>`});
    return;
  }
  if(window.RunGame&&RunGame.mounted&&v.querySelector(".rg-game")){RunGame.refresh();return}
  v.innerHTML=`<article class="card run-card">
    <div class="t-head"><h2>달리기</h2><span class="rstate on">🎫 오늘 남은 판 ${runLeft()} / ${runCfg().max}</span></div>
    <div id="runMount"><p class="empty">게임을 불러오는 중…</p></div>
    <p class="t-help">오늘의 퀴즈를 끝내면 티켓이 생겨요. 달리다 나오는 퀴즈 문도 꼭 맞혀 보세요! 조작: 화면 누르기 또는 스페이스·↑·W = 점프 (길게 = 높이, 공중에서 한 번 더 = 2단 점프), 퀴즈는 ← / →.</p>
    <p class="run-credit">효과: pixelfx (Patch, MIT License)</p>
  </article>`;
  runLoad().then(()=>{const m=$("#runMount");if(m&&!m.querySelector(".rg-game"))RunGame.mount(m,RUN_HOST)})
    .catch(()=>{const m=$("#runMount");if(m)m.innerHTML=`<p class="empty">게임을 불러오지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.</p>`});
}
/* 대결 데이터가 바뀔 때: 첫 화면·대기실만 새로 그리고, 선생님 화면은 실시간 칸만 바꿔요 */
function runRaceLive(){
  const sig=JSON.stringify((RACE&&RACE.state)||{});
  const changed=sig!==runStateSig;runStateSig=sig;
  if(role==="student"){if(changed&&window.RunGame&&RunGame.mounted)RunGame.refresh();const b=$("#view-run .rstate");if(b)b.textContent=`🎫 오늘 남은 판 ${runLeft()} / ${runCfg().max}`}
  if(role==="teacher"&&current==="run"){if(changed)rerender();else runTeacherLive()}
}

/* ---------- 선생님: 설정 + 대결 진행 ---------- */
function runRanking(rid){
  return runPlayers(rid).filter(p=>p.done).map(p=>({...p,rec:Math.round((p.tm+p.pen)*100)/100})).sort((a,b)=>a.rec-b.rec);
}
function runLiveHtml(){
  const s=runRaceState();if(!s||s.st==="off")return `<p class="empty">열린 대결이 없어요.</p>`;
  const ps=runPlayers(s.rid),c=runCfg(),N=4;
  if(s.st==="lobby")return `<p class="t-status">대기실에 <b>${ps.length}명</b> 들어왔어요.</p><p class="run-names">${ps.map(p=>esc(p.n)).join(", ")||"아직 아무도 없어요"}</p>`;
  const fin=runRanking(s.rid),run=ps.filter(p=>!p.done).sort((a,b)=>b.x-a.x),medal=["🥇","🥈","🥉"];
  return `<p class="t-status">${s.st==="end"?"끝난 대결":"달리는 중"} · 완주 ${fin.length} / ${ps.length}명</p>
    <table class="run-tbl"><thead><tr><th>순위</th><th>이름</th><th>기록</th><th>정답</th><th>보상</th></tr></thead><tbody>
    ${fin.map((p,i)=>`<tr><td>${medal[i]||(i+1)+"등"}</td><td>${esc(p.n)}</td><td>${p.rec.toFixed(1)}초${p.pen?` <small>(+${p.pen})</small>`:""}${p.pw?` <small>(벌점 ${p.pw}초 포함)</small>`:""}</td><td>${p.ok}/${N}${p.ok===N?" 🎯":""}</td><td>${c.prize[i]?"🪙"+c.prize[i]:""}</td></tr>`).join("")}
    ${run.map(p=>`<tr class="run-going"><td>-</td><td>${esc(p.n)}</td><td>${Math.min(s.len,Math.round(p.x/12))}m ${p.q?"(문제 푸는 중)":""}</td><td>${p.ok}</td><td></td></tr>`).join("")}
    </tbody></table>${s.st==="end"&&RACE.state.paid?`<p class="t-status">보상을 지갑에 넣었어요.</p>`:""}`;
}
function runTeacherLive(){const el=$("#runLive");if(el)el.innerHTML=runLiveHtml()}
function runTeacherHtml(){
  const c=runCfg(),s=runRaceState(),st=s?s.st:"off",n=s?runPlayers(s.rid).length:0;
  const ck=(id,v,l)=>`<label class="t-check"><input type="checkbox" id="${id}" ${v?"checked":""}> ${l}</label>`;
  const opt=(id,v,list)=>`<select id="${id}">${list.map(([a,b])=>`<option value="${a}" ${String(v)===String(a)?"selected":""}>${b}</option>`).join("")}</select>`;
  return `<article class="card" id="runCard">
    <div class="t-head"><h2>달리기 게임</h2>${c.open?`<span class="rstate on">달리기 탭 보임</span>`:`<span class="rstate">달리기 탭 숨김</span>`}</div>
    <p class="t-help">학생은 오늘의 퀴즈를 끝내야 티켓을 받아 혼자 연습을 할 수 있어요. 대결은 선생님이 열 때만 들어갈 수 있고, 기록은 <b>도착 시간</b>으로 매기고, 퀴즈 문을 틀리면 그 자리에서 <b>벌점 시간만큼 멈춰요</b>.</p>
    <h3 class="run-h">🎮 달리기 탭 (게임 전체)</h3>
    <div class="run-open ${c.open?"on":""}">
      <p>${c.open?"학생 메뉴에 <b>달리기</b> 탭이 보여요. 혼자 연습과 대결 모두 할 수 있어요.":"학생 메뉴에서 <b>달리기</b> 탭이 숨겨져 있어요. 학생은 게임을 아예 볼 수 없어요."}</p>
      <button type="button" class="${c.open?"ghost":"primary"}" id="runTabTg">${c.open?"달리기 탭 숨기기":"달리기 탭 보이기"}</button>
    </div>
    <h3 class="run-h">🏁 친구들과 대결 (대결방)</h3>
    <p class="t-help">대결방만 열고 닫아요. 닫아도 혼자 연습은 그대로 할 수 있어요.${c.open?"":" 지금은 달리기 탭이 숨겨져 있어서, 대결을 열면 탭도 함께 보이게 돼요."}</p>
    <div class="actions">
      ${st==="off"||st==="end"?`<button type="button" class="primary" id="runOpenRace">대결 열기</button>`:""}
      ${st==="lobby"?`<button type="button" class="primary" id="runGo" ${n?"":"disabled"}>출발! (${n}명)</button>`:""}
      ${st==="run"?`<button type="button" class="primary" id="runFinish">대결 마치고 1~5등 보상 주기</button>`:""}
      ${st!=="off"?`<button type="button" class="ghost" id="runClose">${st==="end"?"결과 닫기":"대결 닫기 (보상 없음)"}</button>`:""}
    </div>
    <div id="runLive">${runLiveHtml()}</div>
    <h3 class="run-h">⚙️ 설정</h3>
    <div class="run-set">
      ${ck("runLockIn",c.lockOn,"수업 시간에는 잠금 (평일)")}
      <label class="t-field">잠금 시작<input type="time" id="runFromIn" value="${esc(c.from)}"></label>
      <label class="t-field">잠금 끝<input type="time" id="runToIn" value="${esc(c.to)}"></label>
      <label class="t-field">하루 최대 판수${opt("runMaxIn",c.max,[[1,"1판"],[2,"2판"],[3,"3판"],[4,"4판"],[5,"5판"]])}</label>
      <label class="t-field">퀴즈를 끝내면 티켓${opt("runQuizTIn",c.quizT,[[1,"1장"],[2,"2장"],[3,"3장"]])}</label>
      <label class="t-field">만점이면 티켓 더${opt("runPerfTIn",c.perfT,[[0,"없음"],[1,"1장"],[2,"2장"]])}</label>
      <label class="t-field">혼자 연습 한 판 최대 코인 <small>(먹은 코인만큼 받아요)</small><input type="number" inputmode="decimal" min="0" step="any" id="runCoinIn" value="${c.coin}"></label>
      <label class="t-field">혼자 연습 하루 최대 코인<input type="number" inputmode="decimal" min="0" step="any" id="runCoinMaxIn" value="${c.coinMax}"></label>
      <label class="t-field">혼자 연습 난이도${opt("runDiffIn",c.diff,[["easy","쉬움 (예전과 같아요)"],["normal","보통"],["hard","어려움"],["crazy","아주 어려움"]])}</label>
      <label class="t-field">퀴즈 문 간격 (혼자 연습)${opt("runGateIn",c.gateEvery,[[80,"80m마다"],[120,"120m마다"],[200,"200m마다"]])}</label>
      <label class="t-field">대결 오답 벌점 <small>(문 앞에서 멈추는 시간)</small>${opt("runPenIn",c.pen,[[0,"없음"],[2,"2초"],[3,"3초"],[5,"5초"]])}</label>
      <label class="t-field">대결 거리${opt("runLenIn",c.len,[[500,"500m (약 1분)"],[800,"800m"],[1000,"1000m (약 1분 40초)"],[1500,"1500m"],[2000,"2000m (약 3분)"]])}</label>
      <label class="t-field run-wide">대결 1~5등 보상 (코인)<span class="run-prize">${c.prize.map((p,i)=>`<input type="number" inputmode="decimal" min="0" step="any" id="runPz${i}" value="${p}" aria-label="${i+1}등 코인">`).join("")}</span></label>
    </div>
    <div class="actions"><button type="button" class="primary" id="runSave">설정 저장</button></div>
    <p class="msg" id="runMsg" role="status">${esc(runTMsg)}</p>
  </article>`;
}
function runTeacherBind(){
  const m=$("#runMsg");if(!m)return;
  const say=t=>{runTMsg=t;m.textContent=t};
  $("#runSave").onclick=()=>{runTMsg="";
    const v={runLock:$("#runLockIn").checked,runFrom:$("#runFromIn").value||"09:00",runTo:$("#runToIn").value||"12:10",
      runMax:+$("#runMaxIn").value,runQuizT:+$("#runQuizTIn").value,runPerfT:+$("#runPerfTIn").value,runCoin:runNum($("#runCoinIn").value),runCoinMax:runNum($("#runCoinMaxIn").value),
      runGate:+$("#runGateIn").value,runPen:+$("#runPenIn").value,runLen:+$("#runLenIn").value,runDiff:$("#runDiffIn").value,runPrize:[0,1,2,3,4].map(i=>runNum($("#runPz"+i).value)).join(",")};
    act($("#runSave"),m,()=>R("config").update(v)).then(ok=>{if(ok){say("달리기 설정을 저장했어요.");renderRun()}})};
  const b=id=>$("#"+id);
  if(b("runTabTg"))b("runTabTg").onclick=()=>{const on=!runCfg().open;
    if(!on&&runRaceState()&&runRaceState().st!=="off"&&!confirm("대결방이 열려 있어요. 달리기 탭을 숨기면 학생들이 게임 화면에서 나가요. 숨길까요?"))return;
    act(b("runTabTg"),m,()=>R("config").update({runOpen:on})).then(ok=>{if(ok){say(on?"학생 메뉴에 달리기 탭이 보여요.":"달리기 탭을 숨겼어요.");renderRun()}})};
  if(b("runOpenRace"))b("runOpenRace").onclick=()=>act(b("runOpenRace"),m,async()=>{
    if(!runCfg().open)await R("config").update({runOpen:true});
    const rid=R("race/state").push().key;await R("race").set({state:{rid,st:"lobby",seed:(Math.random()*1e9)|0,len:runCfg().len,t:SV.TIMESTAMP}});
  }).then(ok=>{if(ok){say("대결을 열었어요. 학생들이 '달리기 → 친구들과 대결'로 들어오면 '출발!'을 눌러 주세요.");renderRun()}});
  if(b("runGo"))b("runGo").onclick=()=>act(b("runGo"),m,()=>R("race/state").update({st:"run",at:runNow()+4500}))
    .then(ok=>{if(ok){say("출발! 3·2·1 뒤에 다 같이 달려요.");renderRun()}});
  if(b("runClose"))b("runClose").onclick=()=>{if(!confirm("대결을 닫을까요? 들어와 있던 학생들은 첫 화면으로 돌아가요."))return;
    act(b("runClose"),m,()=>R("race").set({state:{rid:"",st:"off"}})).then(ok=>{if(ok){say("대결을 닫았어요.");renderRun()}})};
  if(b("runFinish"))b("runFinish").onclick=()=>{
    const s=runRaceState();if(!s)return;const fin=runRanking(s.rid),c=runCfg(),run=runPlayers(s.rid).filter(p=>!p.done).length;
    if(!confirm(`${run?`아직 ${run}명이 달리는 중이에요. `:""}대결을 마치고 완주한 학생 중 1~5등에게 보상을 줄까요?`))return;
    act(b("runFinish"),m,async()=>{
      // 보상은 한 번만: paid를 먼저 잡아요
      const lock=await R("race/state/paid").transaction(v=>v?undefined:true);if(!lock.committed)throw new Error("이미 보상을 줬어요.");
      for(let i=0;i<Math.min(5,fin.length);i++){const p=fin[i],coin=c.prize[i];if(!coin)continue;
        const r=await R("students/"+p.k).transaction(cur=>cur?{...cur,wallet:r2((+cur.wallet||0)+coin)}:cur);
        if(r&&r.committed)await R("logs/"+p.k).push({t:SV.TIMESTAMP,text:`달리기 대결 ${i+1}등 (${p.rec.toFixed(1)}초)`,amount:coin})}
      await R("race/state/st").set("end");
    }).then(ok=>{if(ok){say(`대결을 마쳤어요. 1~${Math.min(5,fin.length)}등에게 보상을 넣었어요.`);renderRun()}});
  };
}
