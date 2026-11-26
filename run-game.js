/* =========================================================
   CLASS LAB 달리기 게임 엔진 (run-game.js)
   - 달리기 탭을 처음 열 때 run.js가 불러와요 (assets/run/pixelfx.js 다음).
   - 화면·규칙만 맡고, 티켓·코인·대결 데이터는 run.js의 host가 맡아요.
   - 캐릭터: assets/run/hero.png (Flow 영상에서 뽑은 54장)
   - 효과: pixelfx (Patch, MIT) — github.com/patch-gg/pixelfx
   ========================================================= */
(function(){
"use strict";
// 화면 폭(게임 픽셀): 혼자 연습은 화면이 넓을수록 앞이 더 멀리 보이고, 대결은 모두 같은 폭이라 공평해요.
let W=240;const RACE_W=320,VIEW_SCALE=3.6;
const H=150,GY=126,HX=48,PXM=12;let FIN_M=500,FIN=FIN_M*PXM;   // 대결 거리는 선생님이 정해요 (race/state/len)
let P,FX,host,root,cv,ctx,atlas=null,AT=null,fB,fF,LB,LF,raf=0,mounted=false;
const $=id=>root&&root.querySelector('#'+id);

const CSS=`.rg-game{outline:none;position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line,#e3e0d8);background:#bfe3ff;touch-action:manipulation;user-select:none;-webkit-user-select:none;cursor:pointer;aspect-ratio:240/150;font-family:inherit}
.rg-game canvas{display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}
.rg-hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;pointer-events:none;font-weight:700;font-size:clamp(13px,2.4vw,20px);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.rg-hud .l,.rg-hud .r{display:flex;gap:12px;align-items:center}
.rg-snd{pointer-events:auto;font:inherit;font-size:clamp(13px,2.2vw,18px);line-height:1;min-width:30px;min-height:30px;border:0;border-radius:999px;background:rgba(0,0,0,.22);color:#fff;cursor:pointer;padding:2px 6px;text-shadow:none}
.rg-snd.off{opacity:.45;text-decoration:line-through}.rg-snd:focus-visible{outline:2px solid #fff}
.rg-toast{position:absolute;left:50%;top:40px;transform:translate(-50%,-8px);opacity:0;transition:.25s;background:rgba(20,24,40,.82);color:#fff;font-size:clamp(12px,2.2vw,16px);padding:6px 14px;border-radius:999px;white-space:nowrap;pointer-events:none;z-index:3;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.rg-toast.show{opacity:1;transform:translate(-50%,0)}.rg-toast b{color:#ffd34d}
.rg-panel{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:4%;pointer-events:none}
.rg-box{pointer-events:auto;cursor:default;max-height:92%;overflow:auto;background:rgba(255,255,255,.95);border-radius:16px;padding:clamp(8px,2vw,16px) clamp(10px,2.4vw,22px);text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.18);max-width:64%;color:#1d1d1f}
.rg-box h2{margin:0 0 6px;font-size:clamp(17px,3.2vw,26px)}
.rg-box p{margin:4px 0;font-size:clamp(13px,2.1vw,16px);color:#333}
.rg-box .big{font-size:clamp(22px,4.4vw,36px);font-weight:700;color:var(--accent,#2456e6)}
.rg-box .tip{color:#6b6b70;font-size:clamp(12px,1.9vw,14px);margin-top:8px}
.rg-box .new{color:#d9480f;font-weight:700}
.rg-hidden{display:none!important}
.rg-tickets{display:inline-block;background:#fff4d6;color:#8a5a00;border-radius:999px;padding:1px 10px;font-weight:700;font-size:clamp(12px,2vw,14px);margin:2px 0}
.rg-modes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px}
.rg-modes button{font:inherit;border:2px solid #e3e0d8;background:#fff;border-radius:14px;padding:10px 14px;cursor:pointer;min-width:min(42%,190px);text-align:center;color:#1d1d1f}
.rg-modes button b{display:block;font-size:clamp(15px,2.6vw,20px);margin-bottom:2px}
.rg-modes button span{font-size:clamp(11px,1.8vw,13px);color:#6b6b70}
.rg-modes button:hover{border-color:var(--accent,#2456e6)}.rg-modes button.off{opacity:.55}
.rg-go{font:inherit;font-weight:700;font-size:clamp(13px,2.2vw,16px);border:0;border-radius:10px;padding:8px 14px;background:var(--accent,#2456e6);color:#fff;cursor:pointer;margin:6px 3px 0;min-height:40px}
.rg-go.sub{background:#fff;color:var(--accent,#2456e6);border:1px solid var(--accent,#2456e6)}
.rg-chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0;justify-content:center}
.rg-chip{font-size:clamp(11px,1.8vw,13px);padding:2px 8px;border-radius:10px;color:#fff;font-weight:600}
.rg-rank{width:100%;border-collapse:collapse;font-size:clamp(11px,1.9vw,14px);margin-top:4px}
.rg-rank td{padding:2px 6px;border-bottom:1px solid #eee;white-space:nowrap;text-align:left}
.rg-rank tr.rg-me td{background:#eef3ff;font-weight:700}
.rg-wrongs{text-align:left;font-size:clamp(11px,1.9vw,13px);margin:4px 0;padding-left:16px}.rg-wrongs b{color:#2f9e44}
.rg-track{position:absolute;left:3%;right:3%;top:30px;height:22px;pointer-events:none}
.rg-track .bar{position:absolute;left:0;right:0;top:10px;height:4px;border-radius:2px;background:rgba(255,255,255,.8);box-shadow:0 1px 0 rgba(0,0,0,.15)}
.rg-track .flag{position:absolute;right:-8px;top:0;font-size:14px}
.rg-track .dot{position:absolute;top:4px;width:16px;height:16px;margin-left:-8px;border-radius:50%;border:2px solid #fff;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.rg-track .dot.rg-me{width:20px;height:20px;margin-left:-10px;top:2px;z-index:5;font-size:10px}
.rg-tag{position:absolute;transform:translate(-50%,-100%);font-size:clamp(9px,1.6vw,13px);font-weight:700;color:#fff;padding:1px 6px;border-radius:8px;white-space:nowrap;pointer-events:none}
.rg-prev{margin:0 0 6px;font-size:clamp(11px,1.6vw,13px);font-weight:700;color:#8a5a00;background:#fff3cd;border-radius:999px;padding:3px 10px;display:inline-block}
.rg-quiz .qpen{margin-top:6px;font-size:clamp(13px,2.4vw,18px);font-weight:800;color:#e03131}
.rg-count{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(40px,12vw,110px);font-weight:700;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.3);pointer-events:none}
.rg-quiz{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:min(94%,560px);background:#fff;border-radius:14px;padding:clamp(8px,1.8vw,14px) clamp(10px,2vw,18px);box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:center;z-index:6;cursor:default;color:#1d1d1f}
.rg-quiz .qk{font-size:clamp(11px,1.8vw,13px);color:var(--accent,#2456e6);font-weight:700;margin-bottom:2px}
.rg-quiz .qs{font-size:clamp(14px,2.8vw,22px);font-weight:600;line-height:1.45;word-break:keep-all}
.rg-quiz .qs u{text-decoration:none;display:inline-block;min-width:3.2em;border-bottom:3px solid var(--accent,#2456e6);color:var(--accent,#2456e6)}
.rg-quiz .qo{display:flex;gap:8px;margin-top:8px}
.rg-quiz .qo button{flex:1;font:inherit;font-size:clamp(15px,3vw,22px);font-weight:700;padding:clamp(6px,1.4vw,12px);border-radius:12px;border:2px solid #dfe3ee;background:#f7f9ff;cursor:pointer;color:#1d1d1f}
.rg-quiz .qo.long button{font-size:clamp(13px,2.2vw,17px);word-break:keep-all;line-height:1.35}
.rg-quiz .qo button.ok{background:#e6fcf5;border-color:#20c997}.rg-quiz .qo button.ng{background:#fff5f5;border-color:#ff6b6b}
.rg-quiz .qf{font-size:clamp(12px,2vw,14px);margin-top:6px;min-height:1.3em;color:#333}
.rg-quiz .qh{font-size:11px;color:#6b6b70;margin-top:2px}
@media (max-width:600px){
 .rg-panel{justify-content:center;padding:0 2%}
 .rg-box{max-width:96%;padding:6px 10px;border-radius:12px}
 .rg-box h2{font-size:15px;margin:0 0 2px}.rg-box p{font-size:12px;margin:2px 0}.rg-box .more,.rg-box .tip{display:none}
 .rg-modes{flex-wrap:nowrap;gap:6px;margin-top:4px}.rg-modes button{min-width:0;flex:1;padding:6px 8px}.rg-modes button b{font-size:14px}.rg-modes button span{font-size:10.5px}
 .rg-chip{font-size:10.5px;padding:1px 6px}.rg-go{min-height:34px;padding:5px 10px;font-size:13px;margin-top:3px}
 .rg-rank{font-size:11px}.rg-rank td{padding:1px 4px}.rg-quiz .qh{display:none}
}
`;
const HTML=`<div class="rg-game" id="rgGame" tabindex="0">
  <canvas id="rgC" width="240" height="150"></canvas>
  <div class="rg-track rg-hidden" id="rgTrack"><div class="bar"></div><div class="flag">🏁</div></div>
  <div id="rgTags"></div>
  <div class="rg-toast" id="rgToast"></div>
  <div class="rg-hud"><div class="l"><span id="rgDist">0m</span><span id="rgCoin">🪙 0</span></div><div class="r"><button type="button" class="rg-snd" id="rgSfx" aria-label="효과음 끄기">🔊</button><button type="button" class="rg-snd" id="rgBgm" aria-label="배경 음악 켜기">♪</button><span id="rgHearts">❤️❤️❤️</span></div></div>
  <div class="rg-count rg-hidden" id="rgCount">3</div>
  <div class="rg-quiz rg-hidden" id="rgQuiz"></div>
  <div class="rg-panel" id="rgPanel"><div class="rg-box" id="rgBox"></div></div>
</div>`;

// ── 상태 ──
// mode: solo(혼자 연습) | race(친구들과 대결)
// state: menu | ready | play | over (연습)  /  lobby | count | race | result (대결)
let mode='solo',state='menu',t=0,speed=100,dist=0,coins=0,hearts=3,inv=0,shake=0,overT=0,newBest=false;
const hero={y:GY,vy:0,ground:true,jumps:0,hold:false,f:0,ft:0,key:'idle1',hurtT:9,land:0,hop:0,stun:0,boost:0};
let obs=[],items=[],fxs=[],nextObs=260,nextCoin=1.0,scroll=0,camY=0,gates=[],asking=null,nextGateM=100,qRight=0,qAll=0,wrongs=[],mePen=0,mePw=0,toastT=0,busyEnd=false;
const met=new Set();
// 난이도 (혼자 연습만, 선생님 설정 runDiff). 대결은 언제나 '쉬움' 값으로 그대로예요.
// v0 처음 속도, vMax 가장 빠른 속도, acc 빨라지는 정도(1초마다), gap 장애물 간격 배율, at 새 몬스터가 나오는 거리 배율,
// bat 낮게 나는 박쥐 확률, wild 변칙 움직임 세기(0이면 예전처럼 규칙적). 몬스터는 언제나 한 마리씩, 같은 몬스터가 연달아 나오지 않아요.
const DIFF={
  easy:{name:'쉬움',v0:100,vMax:175,acc:1.8,gap:1,at:1,combo:0.35,comboAt:200,bat:0.35,wild:0,react:0,shots:0,dive:0},
  normal:{name:'보통',v0:112,vMax:200,acc:2.2,gap:0.8,at:0.7,combo:0,comboAt:0,bat:0.6,wild:0.6,react:0.35,shots:2,dive:0.45},
  hard:{name:'어려움',v0:125,vMax:225,acc:2.6,gap:0.68,at:0.5,combo:0,comboAt:0,bat:0.75,wild:0.8,react:0.55,shots:2,dive:0.6},
  crazy:{name:'아주 어려움',v0:135,vMax:250,acc:3,gap:0.56,at:0.35,combo:0,comboAt:0,bat:0.85,wild:1,react:0.75,shots:3,dive:0.75}};
// react: 캐릭터가 점프하는 순간 가까운 몬스터가 따라 뛰어오르거나(땅) 솟구치거나(하늘) 멈칫할 확률 · shots: 해골이 쏘는 불덩이 수 · dive: 해골이 내려올 확률
let DF=DIFF.easy;
function setDiff(){DF=mode==='race'?DIFF.easy:(DIFF[(host&&host.cfg().diff)]||DIFF.normal)}
const baseSpeed=tt=>Math.min(DF.vMax,DF.v0+tt*DF.acc);
function rnd(n){return (Math.random()*n)|0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296}}
function withSeed(seed,fn){const R0=Math.random;Math.random=rng(seed);try{return fn()}finally{Math.random=R0}}

function soloW(){const pe=root&&root.parentElement,cw=Math.min(1320,(pe&&pe.clientWidth)||(root&&root.clientWidth)||880);return Math.max(240,Math.min(400,Math.round(Math.max(cw/VIEW_SCALE,Math.min(300,cw/2.5))/4)*4))}   // 태블릿은 시야를 조금 넓혀요(300)
function setView(w){if(w===W&&fB)return;W=w;cv.width=W;cv.height=H;ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  fB=P.createFrame(W,H+2*FM,0,-FM);fF=P.createFrame(W,H+2*FM,0,-FM);LB=mkLayer();LF=mkLayer();$('rgGame').style.aspectRatio=W+'/'+H;root.style.setProperty('--rg-ar',(W/H).toFixed(3))}
const FM=70;   // 몬스터·코인 그림판은 화면 위아래로 70씩 더 넓어요 (언덕·다리 위에서 위쪽이 잘리지 않게)
function mkLayer(){const c=document.createElement('canvas');c.width=W;c.height=H+2*FM;return{c,x:c.getContext('2d'),d:new ImageData(W,H+2*FM)}}
function clearWorld(){FORKS=[];FORK.req=0;FORK.met=0;FORK.every=mode==='race'?0:(+host.cfg().fork||0);FORK.next=FORK.every?Math.round(FORK.every*0.5):0;setDiff();terReset(mode==='race'?0:host.cfg().hill);setView(mode==='race'?RACE_W:soloW());hero.y=GY;hero.vy=0;hero.ground=true;hero.plat=false;hero.jumps=0;hero.hurtT=9;hero.stun=0;hero.boost=0;hero.hop=0;
  obs=[];items=[];fxs=[];camY=0;inv=0;shake=0;coins=0;dist=0;t=0;met.clear();toastT=0;$('rgToast').classList.remove('show');
  gates=[];asking=null;$('rgQuiz').classList.add('rg-hidden');nextGateM=Math.round(host.cfg().gateEvery*0.8);qRight=0;qAll=0;wrongs=[];mePen=0;mePw=0}
function hud(){
  if(mode==='race'){$('rgDist').textContent='⏱ '+raceT.toFixed(1)+'초'+(mePw?` (벌점 ${mePw}초)`:'');$('rgCoin').textContent='🪙 '+coins;
    $('rgHearts').textContent=meDone?'완주!':'🏁 '+Math.max(0,Math.ceil(FIN_M-dist))+'m';return}
  $('rgDist').textContent=Math.floor(dist)+'m';$('rgCoin').textContent='🪙 '+coins;$('rgHearts').textContent='❤️'.repeat(Math.max(0,hearts))+'🤍'.repeat(Math.max(0,3-Math.max(0,hearts)))}
function fx(mod,o,keep){const e={fx:P.createFx(mod,o),o,keep};fxs.push(e);return e}
function showBox(h){$('rgBox').innerHTML=h;$('rgPanel').classList.remove('rg-hidden')}
function hideBox(){$('rgPanel').classList.add('rg-hidden')}
function toast(h){const el=$('rgToast');el.innerHTML=h;el.classList.add('show');toastT=2.6}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ── 첫 화면: 모드 고르기 ──
function menu(){
  mode='solo';state='menu';clearWorld();raceOff();hearts=3;
  const c=host.cfg(),sb=host.soloBlock(),tl=host.ticketsLeft(),rs=host.race();
  const raceOpen=rs&&(rs.st==='lobby'||rs.st==='run');
  showBox(`${host.preview?`<p class="rg-prev">${esc(host.preview)}</p>`:''}<h2>달려라, ${esc(host.title())}!</h2><p><span class="rg-tickets">🎫 오늘 남은 판 ${tl} / ${c.max}</span></p>
  <div class="rg-modes"><button type="button" id="rgSolo" class="${sb?'off':''}"><b>🏃 혼자 연습</b><span>${sb?esc(sb):`티켓 1장 · 하트 3개 · ${DF.name}<br>내 최고 기록 ${host.best()}m`}</span></button>
  <button type="button" id="rgRace" class="${raceOpen?'':'off'}"><b>👫 친구들과 대결</b><span>${raceOpen?(rs.st==='run'?'대결이 벌써 시작했어요':'선생님이 연 대결!<br>1~5등 코인 보상'):'선생님이 대결을 열면<br>들어갈 수 있어요'}</span></button></div>`);
  $('rgSolo').onclick=e=>{e.stopPropagation();soloReady()};
  $('rgRace').onclick=e=>{e.stopPropagation();if(host.noRace){toast(host.noRace);return}const r=host.race();if(r&&r.st==='lobby')raceLobby();else toast(r&&r.st==='run'?'대결이 이미 시작했어요. 다음 대결을 기다려요!':'선생님이 대결을 열면 들어갈 수 있어요')};
  hud();
}

// ── 혼자 연습 ──
function soloReady(){
  const sb=host.soloBlock();
  if(sb){state='menu';showBox(`<h2>🏃 혼자 연습</h2><p>${esc(sb)}</p>${host.needQuiz()?'<button type="button" class="rg-go" id="rgToQuiz">오늘의 퀴즈 풀러 가기</button>':''}
    <button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);$('rgMenu').onclick=e=>{e.stopPropagation();menu()};
    if($('rgToQuiz'))$('rgToQuiz').onclick=e=>{e.stopPropagation();host.goQuiz()};return}
  mode='solo';state='ready';clearWorld();hearts=3;hud();fitView();
  showBox(`<h2>🏃 혼자 연습</h2><p><span class="rg-tickets">🎫 티켓 1장을 써요 · 남은 판 ${host.ticketsLeft()}</span> <span class="rg-tickets">난이도 ${DF.name}</span></p><p>누르면 점프! 공중에서 한 번 더 누르면 2단 점프! 🪙 먹은 코인만큼 진짜 코인을 받아요.</p><p class="more">난이도: <b>${DF.name}</b></p>
  <p class="more">퀴즈 문을 맞히면 하트 1개 회복! 멀리 갈수록 새 몬스터가 나타나요.</p>
  <p class="tip">화면을 누르거나 스페이스·Enter로 시작 · 최고 기록 ${host.best()}m</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);
  $('rgMenu').onclick=e=>{e.stopPropagation();menu()};
}
let starting=false;
// 게임 화면이 잘려 보이면 화면 안으로 스크롤해요.
function fitView(){const g=$('rgGame');if(!g)return;const r=g.getBoundingClientRect(),vh=innerHeight;if(r.top>=0&&r.bottom<=vh)return;
  try{g.scrollIntoView({block:r.height<=vh?'center':'start',behavior:'smooth'})}catch(_){g.scrollIntoView()}}
async function soloStart(){
  if(starting)return;if(host.soloBlock()){menu();return}
  starting=true;let ok=false;try{ok=await host.useTicket()}catch(e){ok=false}starting=false;
  if(!ok){showBox(`<h2>🏃 혼자 연습</h2><p>티켓을 쓰지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);$('rgMenu').onclick=e=>{e.stopPropagation();menu()};return}
  state='scount';scT=3;clearWorld();speed=100;hearts=3;newBest=false;nextObs=240;nextCoin=0.8;hideBox();hud();
  const cn=$('rgCount');cn.textContent='3';cn.classList.remove('rg-hidden');fitView();sfx('beep');
}
let scT=0,cntHide=0;

// ── 입력 ──
// 점프: 공중에 약 1.1초, 높이 약 52. 짧게 누르면 낮게. 공중에서 한 번 더 = 2단 점프.
const G=330,FALL_G=1.0,JV=-185,JV2=-178,CUT=0.5;
function jump(){
  if(hero.ground){const fb=hero.plat;hero.vy=JV-Math.max(0,SLP(HX))*speed*0.55;hero.ground=false;hero.plat=false;hero.jumps=1;hero.hold=true;sfx('jump');if(!fb)react()}
  else if(hero.jumps<2){hero.vy=JV2;hero.jumps=2;hero.hold=true;hero.dj=0.25;sfx('jump2');fx(FX.burst,{x:HX,y:hero.y+2,seed:7,light:0.5},false)}
}
function press(){
  if(asking)return;
  if(state==='ready'){soloStart();return}
  if(state==='over'){if(overT>1){if(host.soloBlock())menu();else soloReady()}return}
  if(state==='play'||(state==='race'&&!meDone))jump();
}
function release(){if(!hero.hold)return;hero.hold=false;if(hero.vy<0)hero.vy*=CUT}
const JUMP_KEYS=['Space','ArrowUp','KeyW'],START_KEYS=['Enter','NumpadEnter'];
const visible=()=>mounted&&root.isConnected&&!root.closest('[hidden]');
const typingEl=()=>{const a=document.activeElement;return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||a.isContentEditable)};
function onKey(e){if(!visible()||typingEl())return;const c=e.code||e.key;sndUnlock();
  if(asking&&!asking.res){const k={ArrowLeft:0,Digit1:0,KeyA:0,Numpad1:0,ArrowRight:1,Digit2:1,KeyD:1,Numpad2:1}[c];if(k!==undefined){e.preventDefault();answer(k);return}}
  if(asking&&(JUMP_KEYS.includes(c)||e.key===' ')){e.preventDefault();return}
  if(JUMP_KEYS.includes(c)||START_KEYS.includes(c)||e.key===' '){
    if(state==='menu'&&!START_KEYS.includes(c))return; // 첫 화면에서는 스페이스로 스크롤 가능
    e.preventDefault();if(e.repeat)return;
    if(START_KEYS.includes(c)&&(state==='play'||state==='race'))return;press()}}
function onKeyUp(e){if(!visible())return;const c=e.code||e.key;if(JUMP_KEYS.includes(c)||e.key===' ')release()}

// ── 소리 (Web Audio로 직접 만든 8비트 효과음·배경 음악, 파일 없음) ──
// 선생님이 '게임 소리'를 끄면(runSound=false) 반 전체가 조용해요. 학생은 🔊(효과음)·♪(배경 음악) 버튼으로 각자 끄고 켜요.
// 처음에는 효과음 켜짐, 배경 음악 꺼짐. 고른 것은 이 기기에 기억해요.
const SND={ac:null,out:null,bgmOut:null,pref:{s:1,m:0},bgmT:0,step:0,next:0};
try{const p=JSON.parse(localStorage.getItem('rg-snd')||'null');if(p)SND.pref={s:p.s?1:0,m:p.m?1:0}}catch(_){}
const sndOn=()=>!!(host&&host.cfg().sound!==false);
function au(){
  if(!sndOn())return null;
  if(!SND.ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    try{SND.ac=new AC();SND.out=SND.ac.createGain();SND.out.gain.value=0.32;SND.out.connect(SND.ac.destination);
      SND.bgmOut=SND.ac.createGain();SND.bgmOut.gain.value=0.11;SND.bgmOut.connect(SND.ac.destination)}catch(_){SND.ac=null;return null}}
  if(SND.ac.state==='suspended')SND.ac.resume().catch(()=>{});
  return SND.ac;
}
function sndUnlock(){const a=au();if(!a)return;try{const b=a.createBuffer(1,1,22050),s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start(0)}catch(_){}}
function tone(f0,f1,dur,type,vol,delay,dest){
  const a=au();if(!a)return;const t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f0,t0);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol||0.15,t0+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(dest||SND.out);o.start(t0);o.stop(t0+dur+0.02);
}
function noise(dur,vol,freq,delay){
  const a=au();if(!a)return;const t0=a.currentTime+(delay||0),n=Math.max(1,Math.floor(a.sampleRate*dur)),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=freq||1200;g.gain.value=vol||0.2;
  s.connect(f);f.connect(g);g.connect(SND.out);s.start(t0);
}
const SFX={
  jump:()=>tone(300,620,0.11,'square',0.11),
  jump2:()=>tone(520,1040,0.1,'square',0.1),
  coin:()=>{tone(988,988,0.05,'square',0.09);tone(1319,1319,0.13,'square',0.09,0.05)},
  hit:()=>{noise(0.22,0.28,900);tone(220,70,0.26,'sawtooth',0.14)},
  ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,f,0.1,'square',0.09,i*0.07)),
  ng:()=>{tone(330,247,0.16,'square',0.1);tone(247,165,0.26,'square',0.1,0.15)},
  heart:()=>{tone(784,784,0.08,'triangle',0.16);tone(1175,1175,0.16,'triangle',0.16,0.08)},
  gate:()=>{tone(660,660,0.07,'triangle',0.14);tone(880,880,0.12,'triangle',0.14,0.08)},
  beep:()=>tone(440,440,0.12,'square',0.11),
  go:()=>tone(880,880,0.32,'square',0.12),
  fire:()=>{noise(0.3,0.18,600);tone(180,90,0.3,'sawtooth',0.07)},
  dive:()=>tone(900,180,0.35,'sawtooth',0.07),
  over:()=>[523,415,349,262].forEach((f,i)=>tone(f,f*0.98,0.2,'square',0.1,i*0.17)),
  best:()=>[523,659,784,659,784,1047].forEach((f,i)=>tone(f,f,i===5?0.35:0.11,'square',0.1,i*0.1)),
  finish:()=>[784,988,1175,1568].forEach((f,i)=>tone(f,f,0.14,'square',0.1,i*0.09)),
};
function sfx(k){if(SND.pref.s&&SFX[k])try{SFX[k]()}catch(_){}}
// 배경 음악: 직접 지은 짧은 8비트 곡(32박을 되풀이). 달리는 동안에만 나와요.
const BGM_BPM=150,BGM_MEL=[72,0,76,79,0,76,72,0,74,0,77,81,0,77,74,0,76,0,79,84,0,79,76,0,79,77,76,74,72,0,67,0],
  BGM_BAS=[48,48,55,55,48,48,55,55,50,50,57,57,50,50,57,57,52,52,59,59,52,52,59,59,53,53,55,55,48,48,43,43];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function bgmTick(){
  const want=SND.pref.m&&sndOn()&&visible()&&(state==='play'||state==='race'&&!meDone)&&!asking;
  if(!want){SND.next=0;return}
  const a=au();if(!a||a.state!=='running')return;const sp=60/BGM_BPM/2;
  if(!SND.next||SND.next<a.currentTime)SND.next=a.currentTime+0.05;
  while(SND.next<a.currentTime+0.2){const i=SND.step%32,m=BGM_MEL[i],b=BGM_BAS[i],d=SND.next-a.currentTime;
    if(m)tone(mtof(m),mtof(m),sp*0.9,'square',0.5,d,SND.bgmOut);
    if(i%2===0)tone(mtof(b),mtof(b),sp*1.8,'triangle',0.8,d,SND.bgmOut);
    SND.step++;SND.next+=sp}
}
function sndSave(){try{localStorage.setItem('rg-snd',JSON.stringify(SND.pref))}catch(_){}}
function sndUi(){const on=sndOn(),a=$('rgSfx'),b=$('rgBgm');if(!a||!b)return;
  a.classList.toggle('rg-hidden',!on);b.classList.toggle('rg-hidden',!on);
  a.textContent=SND.pref.s?'🔊':'🔇';a.title=a.ariaLabel=SND.pref.s?'효과음 끄기':'효과음 켜기';
  b.textContent='♪';b.classList.toggle('off',!SND.pref.m);b.title=b.ariaLabel=SND.pref.m?'배경 음악 끄기':'배경 음악 켜기'}


// ══ 언덕 ══
// 평지와 비탈을 번갈아 만들어요. TH(x)는 화면 x에서 땅이 기본선(GY)보다 몇 픽셀 높은지(위가 +).
// 몬스터·코인·퀴즈 문·불덩이는 '땅에서 몇 칸 위'로 움직이던 그대로 두고, 그 아래 땅 높이만큼 함께 올려 그려요.
// 혼자 연습: 달린 만큼(scroll) 앞쪽을 그때그때 만들어요. 퀴즈 문은 평평한 곳에서만 나와요.
// 대결: 대결 번호(seed)로 코스 전체를 미리 만들어서 모두 같은 언덕이에요. 출발·퀴즈 문·결승선 근처는 평평해요.
// 단계(선생님 설정 runHill): 0 평평 · 1 완만(약 10°) · 2 보통(약 14°) · 3 가파름(약 19°) · 4 아주 가파름(약 24°)
const TER={lvl:0,segs:[],end:0,h:0,sf:1,race:0};
const TER_LV={0:null,1:{len:9,hi:22,lo:-8,flat:0.55},2:{len:6,hi:32,lo:-12,flat:0.42},3:{len:4.3,hi:40,lo:-14,flat:0.3},4:{len:3.3,hi:46,lo:-14,flat:0.25}};
const terW=sx=>TER.race?meX+(sx-HX):scroll+sx;   // 화면 x → 언덕 지도 위치
function terStep(R,L,limit){   // 다음 한 조각(평지 또는 비탈). limit을 넘지 않아요
  const last=TER.segs[TER.segs.length-1],room=limit-TER.end;
  if(last.a!==last.b||R()<L.flat||room<90){const len=Math.min(room,100+R()*170);TER.segs.push({x0:TER.end,x1:TER.end+len,a:TER.h,b:TER.h});TER.end+=len;return}
  let nh,tries=0;do{nh=Math.round(L.lo+R()*(L.hi-L.lo))}while(Math.abs(nh-TER.h)<10&&++tries<20);
  const maxDh=(room-10)/L.len;if(Math.abs(nh-TER.h)>maxDh)nh=Math.round(TER.h+Math.sign(nh-TER.h)*maxDh);
  if(Math.abs(nh-TER.h)<6){const len=Math.min(room,100+R()*170);TER.segs.push({x0:TER.end,x1:TER.end+len,a:TER.h,b:TER.h});TER.end+=len;return}
  const len=Math.min(room,Math.max(90,Math.abs(nh-TER.h)*L.len)+R()*60);TER.segs.push({x0:TER.end,x1:TER.end+len,a:TER.h,b:nh});TER.end+=len;TER.h=nh}
function terReset(lvl){TER.lvl=lvl|0;TER.race=0;TER.h=0;TER.sf=1;const x=scroll+W+60;TER.segs=[{x0:scroll-2000,x1:x,a:0,b:0}];TER.end=x}
function terGen(upto){const L=TER_LV[TER.lvl];if(!L||TER.race)return;
  while(TER.end<upto){if(FORK.req){const len=FORK_LEN+420;TER.segs.push({x0:TER.end,x1:TER.end+len,a:TER.h,b:TER.h});forkMake(TER.end+200);TER.end+=len;FORK.req=0;FORK.next=dist+FORK.every;continue}terStep(Math.random,L,Infinity)}
  while(TER.segs.length>2&&TER.segs[1].x1<scroll-120)TER.segs.shift()}
function terBuildRace(seed,lvl,gts,every,mons){
  TER.lvl=lvl|0;TER.race=1;TER.h=0;TER.sf=1;const L=TER_LV[TER.lvl];
  // 갈림길 자리: 퀴즈 문(±220)·출발(1500 전)·결승선(앞 900)과 겹치지 않는 곳. 그 구간의 몬스터는 빼고 아랫길 슬라임 2마리를 넣어요.
  FORKS=[];if(every>0){const R2=rng((seed^0x2545f491)>>>0),bl=[[-1e9,1500],...gts.map(g=>[g.x-220,g.x+220]),[FIN-900,1e9]].sort((a,b)=>a[0]-b[0]);let lastS=-1e9;
    for(let i=0;i+1<bl.length;i++){const a=bl[i][1]+200,b=bl[i+1][0]-FORK_LEN-160;if(b<a)continue;   // 퀴즈 문 사이 빈 구간마다 가운데쯤 하나
      const s0=Math.round((a+b)/2+(R2()-0.5)*Math.min(200,b-a));if(s0-lastS<every*PXM*0.75)continue;lastS=s0;
      withSeed((R2()*1e9)|0,()=>forkMake(s0));const f=FORKS[FORKS.length-1];f.gaps=f.gaps.slice(0,1);
      for(let k=mons.length-1;k>=0;k--)if(mons[k].x>s0-260&&mons[k].x<f.e+160)mons.splice(k,1);
      mons.push({x:s0+200,type:'slime',sd:(R2()*1e9)|0,under:1},{x:s0+340,type:'slime',sd:(R2()*1e9)|0,under:1})}
    mons.sort((a,b)=>a.x-b.x)}
  TER.segs=[{x0:-1e6,x1:540,a:0,b:0}];TER.end=540;if(!L){TER.segs[0].x1=1e9;TER.end=1e9;return}
  const R=rng((seed^0x5bd1e995)>>>0),prot=[...gts.map(g=>[g.x-180,g.x+180]),...FORKS.map(f=>[f.s-200,f.e+160]),[FIN-260,FIN+4000]].sort((a,b)=>a[0]-b[0]);
  while(TER.end<FIN+3000){const p=prot.find(([a,b])=>b>TER.end);
    if(p&&p[0]<=TER.end+1){TER.segs.push({x0:TER.end,x1:p[1],a:TER.h,b:TER.h});TER.end=p[1];continue}
    terStep(R,L,p?p[0]:Infinity)}
}
function THb(sx){if(!TER_LV[TER.lvl])return 0;const w=terW(sx);if(!TER.race&&w>TER.end-2)terGen(w+400);
  for(const g of TER.segs)if(w<g.x1){if(w<g.x0)return g.a;const k=(w-g.x0)/(g.x1-g.x0),e=k*k*(3-2*k);return g.a+(g.b-g.a)*e}return TER.h}
const SLP=sx=>(TH(sx+3)-TH(sx-3))/6;   // 오른쪽으로 오르면 +
const flatAt=(sx,r)=>{const h=TH(sx);for(let d=-r;d<=r;d+=20)if(Math.abs(TH(sx+d)-h)>0.5)return false;return true};
// 오르막에서는 느려지고(가파를수록 더) 내리막에서는 빨라져요(최대 1.3배). 비탈 위를 달릴 때만이고, 평지나 공중에서는 곧바로 원래 속도로 돌아와요.
function terSpeed(dt){const sl=hero.ground&&!hero.plat?SLP(HX):0,tf=Math.max(0.55,Math.min(1.3,sl>0?1-0.95*sl:1+0.9*-sl));TER.sf+=(tf-TER.sf)*Math.min(1,dt*(Math.abs(tf-1)<Math.abs(TER.sf-1)?8:3));return TER.sf}   // 비탈을 벗어나면(평지·공중) 0.3초 안에 원래 속도로


// ══ 갈림길 ══
// ⬆⬆ 표지판 뒤에서 2단 점프로 나무다리(윗길)에 오르거나, 그냥 아래로 내려가는 길(아랫길)로 가요. 다리가 끝나기 전에 아랫길이 원래 높이로 올라와 두 길이 만나요.
// 윗길: 코인(혼자 연습)이 있지만 다리에 틈이 있어 떨어지면 아랫길로. 아랫길: 낮은 몬스터 2마리, 다리 밑에서도 한 번 뛸 공간이 있어요.
// 혼자 연습은 선생님이 정한 간격(runFork m)마다, 대결은 대결 번호로 모두 같은 자리에(퀴즈 문·출발·결승선과 겹치지 않게) 나와요.
const BR=62,DIP=48,FORK_LEN=640;   // 다리 높이(한 번 점프(52)로는 안 닿고 2단 점프로만), 아랫길 깊이(다리 밑에서도 한 번 점프할 공간), 갈림길 길이
let FORKS=[],FORK={every:0,next:0,req:0,met:0};
function forkMake(s0){const b0=s0+60,b1=s0+FORK_LEN,n=DF.name==='쉬움'||DF.name==='보통'?1:2,gw=DF.name==='아주 어려움'?52:44,gaps=[];
  for(let i=0;i<n;i++){for(let k=0;k<20;k++){const a=b0+90+Math.random()*(b1-b0-220);if(gaps.every(g=>Math.abs(g[0]-a)>140)){gaps.push([a,a+gw]);break}}}
  FORKS.push({s:s0,b0,b1,e:b1,gaps,sp:0})}
function forkDip(w){let d=0;for(const f of FORKS){const sm=k=>{k=Math.max(0,Math.min(1,k));return k*k*(3-2*k)};
    if(w>f.s-20&&w<f.b1-100)d=Math.max(d,DIP*(w<f.s+120?sm((w-f.s+20)/140):w>f.b1-240?1-sm((w-f.b1+240)/140):1))}return d}
function TH(sx){return THb(sx)-(FORKS.length?forkDip(terW(sx)):0)}
function platY(sx){const w=terW(sx);for(const f of FORKS)if(w>=f.b0&&w<=f.b1&&!f.gaps.some(g=>w>=g[0]&&w<=g[1]))return GY-THb(sx)-BR;return null}
const terS=w=>w-(TER.race?meX-HX:scroll);   // 언덕 지도 위치 → 화면 x
function forkNear(sx,r){const w=terW(sx);return FORKS.some(f=>w>f.s-r-140&&w<f.e+r)}

function forkStep(){
  if(!FORK.every||mode!=='solo')return;
  if(dist>=FORK.next&&!FORK.req){if(TER_LV[TER.lvl])FORK.req=1;else{forkMake(scroll+W+220);FORK.next=dist+FORK.every}}
  FORKS=FORKS.filter(f=>f.e+200>scroll);
  for(const f of FORKS){if(f.sp||f.s-120-scroll>W+40)continue;f.sp=1;
    if(!FORK.met){FORK.met=1;toast('<b>갈림길!</b> ⬆⬆ 2단 점프로 다리에 오르면 윗길(코인·틈 조심), 아니면 아랫길(몬스터)')}
    const at=w=>w-scroll;
    // 아랫길 몬스터 2마리 (다리 밑에서도 피할 수 있는 낮은 몬스터만)
    [f.s+200,f.s+340].forEach((w,i)=>{const k=['slime','snake','iceslime'][(Math.random()*3)|0];const o=addMon(k,0);o.x=at(w);o.under=1;if(DF.wild)wildify(o,DF.wild)});
    // 윗길 코인 (틈 위에서는 높게)
    for(let w=f.b0+40;w<f.b1-20;w+=64){const g=f.gaps.some(q=>w>q[0]-30&&w<q[1]+30);items.push({x:at(w),y:GY-14+19-(g?18:0),br:1,fx:P.createFx(FX.coinSpin,{x:0,y:0,seed:(w|0)%7})})}
    // 아랫길 코인 3개
    for(let i=0;i<3;i++)addCoin(at(f.s+270+i*14),GY-14+19);
  }
}
function drawForks(){
  for(const f of FORKS){
    // 표지판
    const sx=Math.round(terS(f.s-60));if(sx>-20&&sx<W+20){const gy=Math.round(GY-THb(sx));ctx.fillStyle='#6b4423';ctx.fillRect(sx,gy-26,2,26);
      ctx.fillStyle='#ffd34d';ctx.fillRect(sx-11,gy-38,24,14);ctx.fillStyle='#7a4a12';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('⬆⬆',sx+1,gy-27);ctx.textAlign='left'}
    // 다리: 기둥 → 판자 (틈은 비워요)
    const o0=TER.race?meX-HX:scroll;for(let w=Math.max(f.b0,o0-4);w<=Math.min(f.b1,o0+W+4);w++){const x=Math.round(w-o0);if(f.gaps.some(g=>w>=g[0]&&w<=g[1]))continue;
      const top=Math.round(GY-THb(x)-BR);
      if((Math.round(w)-Math.round(f.b0))%40<3){ctx.fillStyle='#5a3a1e';ctx.fillRect(x,top+5,1,Math.round(GY-TH(x))-top-5)}
      ctx.fillStyle='#c08a4a';ctx.fillRect(x,top,1,2);ctx.fillStyle='#8b5a2b';ctx.fillRect(x,top+2,1,3);
      if((Math.round(w)%12)===0){ctx.fillStyle='#6b4423';ctx.fillRect(x,top,1,5)}}
  }
}

// ── 몬스터 ──
const MON={
  slime:{name:'슬라임',at:0,tip:'멈칫하거나 확 달려들어요. 내가 뛰면 따라 뛰기도 해요!',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:3,seed:rnd(99)}),by:GY})},
  bat:{name:'박쥐',at:0,tip:'이리저리 날다가 갑자기 낮게 내려와요. 높으면 그냥 달리고, 낮으면 뛰어넘어요',make:()=>{const sd=rnd(99);return{fx:P.createFx(FX.bat,{x:0,y:0,seed:sd}),ct:batTable(sd),by:GY-90+rnd(6),r:rng((Math.random()*1e9)|0),
    move:batMove}}},
  frog:{name:'개구리',at:80,tip:'폴짝대며 다가와요. 내가 뛰면 같이 뛰어올라요! 한 번 더 눌러 2단 점프!',make:()=>({fx:P.createFx(FX.frog,{x:0,y:0,seed:rnd(99)}),by:GY,vx:38})},
  snake:{name:'뱀',at:160,tip:'길어요! 몸을 떨면 확 달려들고, 내가 뛰면 멈칫해요. 길게 눌러 멀리 뛰어요',make:()=>({fx:P.createFx(FX.snake,{x:0,y:0,seed:rnd(99)}),by:GY,vx:20})},
  bouncy:{name:'통통 슬라임',at:240,tip:'높이 튀어요. 내려왔을 때 넘어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:26,seed:rnd(99),palette:['#1a0a14','#4a1638','#8a2a6a','#c24a9a','#f07ac8','#ffb8e8','#fff0fa']}),by:GY})},
  bird:{name:'새',at:320,tip:'날아오다 높이를 휙 바꾸고, 내가 뛰면 솟구쳐요! 2단 점프로 넘어요',make:()=>{const hi=Math.random()<0.5;return{fx:P.createFx(FX.bird,{x:0,y:0,seed:rnd(99)}),by:hi?GY-84:GY-30,ty:hi?GY-30:GY-84,vx:40,
    move:(o,dt)=>{const target=o.x<175?o.ty:o.by;o.cy=(o.cy??o.by)+(target-(o.cy??o.by))*Math.min(1,dt*5);o.y=o.cy+Math.sin(o.t*6)*3}}}},
  ghost:{name:'유령',at:420,tip:'오르내리다 갑자기 다가와요',make:()=>({fx:P.createFx(FX.ghost,{x:0,y:0,hover:6,seed:rnd(99)}),by:GY,vx:12,ph:Math.random()*6,
    move:(o,dt)=>{   // 닿기 0.55초 전부터는 높이(바닥 또는 높이)와 속도를 정해 둬요
      if(o.lk==null&&tReach(o)>0.55){o.lift=(0.5-0.5*Math.cos(o.t*1.6+o.ph))*62;const dash=(o.t%2.2)>1.6;o.vx=dash?90:12}
      else{if(o.lk==null)o.lk=o.lift>31?62:0;o.lift+=(o.lk-o.lift)*Math.min(1,dt*9)}
      o.y=o.by-o.lift}})},
  butterfly:{name:'나비',at:60,tip:'낮게 팔랑팔랑 날아요. 길게 눌러 높이 뛰어요',make:()=>({fx:P.createFx(FX.butterfly,{x:0,y:0,seed:rnd(99)}),by:GY-20,vx:10,ph:Math.random()*6,
    move:(o,dt)=>{o.y=o.by+Math.sin(o.t*2.2+o.ph)*3}})},
  iceslime:{name:'얼음 슬라임',at:130,tip:'미끄러지듯 빠르게 와요. 일찍 뛰어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:0,seed:rnd(99),palette:['#06131f','#0d3050','#1d5f8f','#3d97c8','#7ccdf0','#c4f0ff','#ffffff']}),by:GY,vx:62})},
  eyeball:{name:'눈알 괴물',at:280,tip:'멈칫 노려보다가 갑자기 돌진해요',make:()=>({fx:P.createFx(FX.eyeball,{x:0,y:0,hover:10,seed:rnd(99)}),by:GY,vx:14,
    move:(o,dt)=>{if(o.x<HX+175&&!o.go){o.wait=(o.wait||0)+dt;o.vx=-8;o.y=o.by+Math.sin(o.t*40)*1.2;if(o.wait>0.45)o.go=1}else if(o.go){o.vx=130;o.y=o.by}}})},
  skull:{name:'불꽃 해골',at:470,tip:'불덩이를 쏘고, 갑자기 낮게 내려와요! 불덩이와 낮게 온 해골은 뛰어넘고, 높이 있을 땐 그 밑에서 뛰지 마요',make:()=>({fx:P.createFx(FX.skull,{x:0,y:0,hover:74,floor:false,seed:rnd(99)}),by:GY,vx:75})},
  fireblob:{name:'불덩이',at:1e9,tip:'해골이 뱉은 불덩이! 뛰어넘어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:5,seed:rnd(99),palette:['#2a0800','#6a1a04','#b83a0c','#f06a1a','#ffa63a','#ffd77a','#fff4c8']}),by:GY,vx:105})},
  fireball:{name:'불덩이',at:1e9,tip:'해골이 나를 겨눠 쏜 불덩이! 날아오는 높이를 보고 피해요',make:()=>({fx:P.createFx(FX.wisp,{x:0,y:0,hover:0,seed:rnd(99),palette:['#4a1712','#8a1f17','#c9281f','#f2561d','#ff8a2a','#ffc23d','#fff3a6']}),by:GY,
    move:(o,dt)=>{o.y=Math.min(GY-5,o.y+(o.vy||0)*dt);if(o.y>=GY-5&&!o.landed){o.landed=1;o.vy=0;o.vx=55}}})},
  wisp:{name:'도깨비불',at:520,tip:'높았다 낮았다, 빨랐다 느렸다 해요',make:()=>({fx:P.createFx(FX.wisp,{x:0,y:0,hover:8,seed:rnd(99)}),by:GY-4,ph:Math.random()*6,
    move:(o,dt)=>{if(o.lk==null&&tReach(o)>0.55){const s=Math.sin(o.t*2.4+o.ph);o.ty=s>0?58:0;o.vx=s>0?20:70}else o.lk=1;   // 닿기 0.55초 전부터는 높이·속도 그대로
      o.y+=((o.by-o.ty)-o.y)*Math.min(1,dt*7)}})},
};

// 박쥐: 0.5~1.1초마다 위·아래·앞·뒤·대각선 중 한 방향을 골라 날아요.
// 높이 나는 상태(서 있으면 머리 위로 지나가요)와 낮게 나는 상태(서 있으면 부딪혀요 → 뛰어넘어요)를 불규칙하게 오가요.
// 높이를 바꾸는 건 캐릭터와 충분히 떨어져 있을 때만이라(HX+230보다 멀 때), 가까이 와서 갑자기 바뀌지는 않아요.
// 방향과 높이는 박쥐마다 정해진 씨앗으로 골라서, 대결에서는 모두 같은 움직임이에요.
const BAT_DIR=[[0,-1],[0,1],[1,0],[-1,0],[1,-1],[1,1],[-1,-1],[-1,1]];
const BAT_BAND={hi:[GY-106,GY-84],lo:[GY-22,GY-18]},BAT_SWITCH=HX+230,BAT_DIVE=170;
function batMove(o,dt){
  if(!o.band){o.band=!o.calm&&o.r()<DF.bat?'lo':'hi'}
  const [top,low]=BAT_BAND[o.band];
  if(!(o.nt>0)){
    const d=BAT_DIR[(o.r()*BAT_DIR.length)|0],sp=26+o.r()*22;o.dvx=d[0]*sp;o.dvy=d[1]*sp*0.8;o.nt=0.5+o.r()*0.6;
    if(o.calm)o.dvx=0;
    else if(o.x>Math.max(BAT_SWITCH,HX+speed*1.35)&&o.r()<0.4)o.band=o.band==='hi'?'lo':'hi';   // 불규칙하게 내려오거나 올라가요
  }
  o.nt-=dt;
  const [t2,l2]=BAT_BAND[o.band];
  if(o.y<t2-1||o.y>l2+1){o.y+=Math.sign((t2+l2)/2-o.y)*Math.min(Math.abs((t2+l2)/2-o.y),BAT_DIVE*dt)}   // 빠르게 내려가거나 올라가요
  else{if(o.y<=t2&&o.dvy<0||o.y>=l2&&o.dvy>0)o.dvy=-o.dvy;o.y=Math.max(t2,Math.min(l2,o.y+o.dvy*dt))}
  if(o.x>W+10&&o.dvx<0)o.dvx=-o.dvx;
  // 낮게 날 때는 뒤로 물러나지 않아요 (머리 위에 오래 머물면 뛰어넘을 수 없으니까요)
  o.vx=o.band==='lo'?Math.max(12,o.dvx):o.dvx;
}
// 박쥐 그림은 자기 칸 안에서 8자로 맴돌아요(가로 ±22, 세로 ±15). 그 맴돌기를 빼서, 박쥐 몸이 게임이 정한 길로만 움직이게 해요.
const BATC={};
function batTable(seed){if(BATC[seed])return BATC[seed];const w=128,h=112,f=P.createFrame(w,h),g=P.createFx(FX.bat,{x:64,y:56,seed}),out=[];
  for(let i=0;i<48;i++){P.clearFrame(f);g.draw(f,'back');g.draw(f,'front');let sx=0,sy=0,n=0;const C=f.color;
    for(let k=0;k<C.length;k++)if((C[k]>>>24)>=250){sx+=k%w;sy+=(k/w)|0;n++}out.push(n?[sx/n-64,sy/n-56]:[0,0]);g.update(2.4/48)}
  return BATC[seed]=out}
function monPos(o){let x=o.x,y=o.y-(o.hy||0)-TH(o.x);   // hy: 따라 뛰기·솟구치기·내려오기로 바뀐 높이
  if(o.ct){const t=((o.fx.t%2.4)+2.4)%2.4,c=o.ct[Math.floor(t/2.4*48)%48];x+=o.fx.options.flip?c[0]:-c[0];y-=c[1]}
  o.fx.options.x=Math.round(x);o.fx.options.y=Math.round(y)}
function addMon(type,dx=0){const m=MON[type],o=Object.assign({type,x:W+30+dx,t:0,vx:0},m.make());o.y=o.by;o.fx.options.flip=true;obs.push(o);   // 모든 몬스터가 캐릭터(왼쪽)를 보도록 좌우를 뒤집어 그려요
  if(!met.has(type)&&m.at>0){met.add(type);toast(`${Math.floor(dist)}m · 새 몬스터 <b>${m.name}</b>! ${m.tip}`)}else met.add(type);return o}
const VX={bat:48,frog:38,snake:20,bird:40,ghost:90,wisp:70,butterfly:10,iceslime:62,eyeball:130,skull:75};
function pickGroup(d,R,prev){
  const A=k=>MON[k].at*DF.at;let pool=Object.keys(MON).filter(k=>A(k)<=d);
  if(prev&&pool.length>1)pool=pool.filter(k=>k!==prev);   // 같은 몬스터가 연달아 나오지 않아요
  const w=pool.map(k=>1+Math.max(0,1.5-(d-A(k))/120));let r=R()*w.reduce((a,b)=>a+b,0),pick=pool[0];
  for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0){pick=pool[i];break}}
  return[[pick,0]];   // 언제나 한 마리씩
}
function gapAfter(d,sp,group,R){const lvl=Math.min(1,d/(700*DF.at)),vxMax=Math.max(0,...group.map(g=>VX[g[0]]||0));
  const g=(Math.max(170,sp*(2.3-lvl*0.7))+R()*(170-lvl*60))*DF.gap;
  return Math.max(g,170,sp*1.15)+vxMax*1.2}   // 점프 한 번(약 1.1초) 뒤 바로 다시 뛸 수 있는 간격은 꼭 남겨요
let lastMon=null;
function spawnObs(){if(FORKS.length&&forkNear(W+30,60)){nextObs=30;return}const g=pickGroup(dist,Math.random,lastMon);lastMon=g[0][0];nextObs=spawnGroup(g,DF.wild)}
function spawnGroup(g,wild){const o=addMon(g[0][0],0);if(wild)wildify(o,wild);
  return gapAfter(dist,speed,g,Math.random)}
// ── 변칙 움직임 (혼자 연습 '보통' 이상: 모든 몬스터) ──
// 캐릭터에게 닿기 0.5초 전까지는 움직임을 바꿀 수 있어요(화면 안에서 실제로 멈칫·돌진해요). 그 뒤로는 바꾸지 않고, 멈추거나 뒷걸음치지도 않아요.
// 땅 몬스터는 바꾸기 직전에 0.18초 부르르 떨어서 알려 줘요. k는 세기(보통 0.6 ~ 아주 어려움 1).
const nearX=()=>HX+Math.max(150,speed*1.05);
const tReach=o=>(o.x-HX-18)/Math.max(60,speed+Math.max(0,o.vx||0));   // 캐릭터에게 닿기까지 남은 시간(초)
const canAct=(o,extra=0)=>tReach(o)>0.5+extra;
function wildify(o,k){o.wk=k;o.bvx=o.vx||0;o.wt=0.05+Math.random()*0.2;o.r=o.r||rng((Math.random()*1e9)|0);
  const t=o.type;
  if(t==='slime'||t==='bouncy'||t==='iceslime'||t==='snake')o.wm='ground';
  else if(t==='frog')o.wm='leap';
  else if(t==='butterfly')o.wm='drift';
  else if(t==='bird'){o.wm='lane';o.move=null;o.lane=o.by;o.y=o.by}
  else if(t==='eyeball'){o.move=null;o.wm='stare';o.trigT=0.75+o.r()*0.35;o.wait=0.15+o.r()*0.3;o.dash=(110+o.r()*60)*(0.7+0.3*k)}
  else if(t==='skull'){o.wm='skull';o.shots=DF.shots||1;o.st=0.1+o.r()*0.25;o.dive=o.r()<(DF.dive||0);o.bvx=20}
  if(o.wm==='ground'&&(t==='slime'||t==='bouncy'))o.bvx=Math.max(o.bvx,Math.round(25*k));   // 슬라임도 가만히 있지 않아요
  if(t==='snake')o.mustLunge=1;   // 뱀은 반드시 한 번 달려들어요
  o.acts=0;
}
function wildStep(o,dt){
  const k=o.wk||1;
  if(o.wm==='ground'){
    if(o.tell!=null){o.tell-=dt;if(o.tell<=0){o.vx=o.nv;o.tell=null;o.acts++;o.wt=0.25+o.r()*0.45}}
    else if(canAct(o,0.12)){o.wt-=dt;
      if(o.wt<=0){o.tell=0.18;const c=o.mustLunge?1:o.r();o.mustLunge=0;
        o.nv=c<0.2?-30:c<0.38?o.bvx*0.2:c<0.58?o.bvx+45*k:o.type==='snake'?o.bvx+150*k:o.bvx+(70+50*o.r())*k}}
    else if(o.vx<o.bvx)o.vx=o.bvx;   // 가까우면 뒷걸음·멈춤 없이
    if(o.type==='snake'&&o.tell==null&&!canAct(o))o.vx=Math.max(o.vx,o.bvx+12*Math.sin(o.t*3));
    o.y=o.by+(o.tell!=null?Math.round(Math.sin(o.t*70)):0);
  }else if(o.wm==='leap'){   // 개구리: 불규칙하게 앞으로 크게 도약
    if(o.lp>0){o.lp-=dt;const q=1-o.lp/0.38;o.vx=o.bvx+150*k;o.y=o.by-Math.sin(q*Math.PI)*16;if(o.lp<=0){o.vx=o.bvx;o.y=o.by;o.acts++;o.wt=0.25+o.r()*0.6}}
    else if(canAct(o,0.15)){o.wt-=dt;if(o.wt<=0)o.lp=0.38}
  }else if(o.wm==='drift'){   // 나비: 앞으로 왔다 뒤로 갔다
    if(canAct(o)){o.wt-=dt;if(o.wt<=0){o.vx=-15+o.r()*70*k;o.acts++;o.wt=0.25+o.r()*0.4}}else if(o.vx<10)o.vx=10;
    o.y=o.by+Math.sin(o.t*2.2)*3;
  }else if(o.wm==='lane'){   // 새: 높이를 여러 번 바꿔요 (닿기 0.9초 전부터는 그 높이 그대로)
    if(canAct(o,0.2)){o.wt-=dt;if(o.wt<=0){const nl=o.r()<0.5?GY-84:GY-30;if(nl!==o.lane)o.acts++;o.lane=nl;o.wt=0.3+o.r()*0.45}}
    o.cy=(o.cy??o.by)+(o.lane-(o.cy??o.by))*Math.min(1,dt*7);o.y=o.cy+Math.sin(o.t*6)*3;o.vx=o.bvx;
  }else if(o.wm==='stare'){  // 눈알: 멈추는 때, 노려보는 시간, 돌진 속도가 매번 달라요
    if(!o.go&&!o.st&&tReach(o)<o.trigT+o.wait)o.st=1;
    if(o.st&&!o.go){o.wait-=dt;o.vx=-8;o.y=o.by+Math.sin(o.t*40)*1.2;if(o.wait<=0){o.go=1;o.acts++}}
    else if(o.go){o.vx=o.dash;o.y=o.by}else o.vx=14;
  }else if(o.wm==='skull'){  // 해골: 화면 오른쪽에 멈춰 떠서 캐릭터를 겨눠 불덩이를 쏘고, 잠깐 쉰 뒤 다가와요. 다가오다 갑자기 낮게 내려와 덮치기도 해요
    if(o.diving){o.dv=Math.min(1,o.dv+dt*2.4);o.hy=-Math.round(SKULL_DROP*(o.dv*o.dv*(3-2*o.dv)));o.vx=o.bvx+25*k}
    else if(o.shots>0||o.rest>0){const tx=W-62;o.vx=-speed+Math.max(-10,Math.min(90,(o.x-tx)*2.2));
      if(o.shots>0){if(o.x<W-26){o.st-=dt;if(o.st<=0){skullFire(o,k);o.shots--;o.st=1.0+o.r()*0.3;o.acts++;if(!o.shots)o.rest=0.85+o.r()*0.3}}}
      else o.rest-=dt}
    else{o.vx=o.bvx;const tr=tReach(o);if(o.dive&&tr<1.75&&tr>0.95){o.diving=1;o.dv=0;o.acts++;sfx('dive');fx(FX.burst,{x:o.x,y:GY-62,light:0.7},false).scroll=1}}
  }
}
// 해골 불덩이: 캐릭터 바로 앞 땅(85~130px 앞)을 겨눠 내리꽂힌 뒤, 땅을 따라 캐릭터 쪽으로 빠르게 굴러와요 → 뛰어넘어요.
// 해골은 다 쏜 뒤 0.85~1.15초 더 떠 있다가 다가와서, 불덩이를 뛰어넘다가 머리 위 해골에 부딪히는 일은 없어요.
const SKULL_DROP=64;
function skullFire(o,k){
  const sx=o.x-8,sy=GY-60,tx=HX+Math.min(sx-HX-40,85+o.r()*45),ty=GY-5,d=Math.hypot(sx-tx,sy-ty);   // 캐릭터 바로 앞 땅을 겨눠요
  const S=speed*1.1+60*k,tf=d/S;
  const b=addMon('fireball',0);b.x=sx;b.y=sy;b.vy=(ty-sy)/tf;b.vx=(sx-tx)/tf-speed;b.fb=1;
  fx(FX.burst,{x:sx,y:sy,light:0.9},false).scroll=1;sfx('fire');
}
// 따라 하기: 캐릭터가 땅에서 뛰는 순간, 곧 닿을 몬스터가 확률(DF.react)로 반응해요. 몬스터마다 한 번만.
//  땅 몬스터(슬라임·개구리·눈알): 따라 뛰어올라요(높이 22~34) → 길게 누르거나 2단 점프로 넘어요
//  뱀·얼음 슬라임: 잠깐 멈칫해요 → 캐릭터가 몬스터 앞에 떨어지니 한 번 더 뛰어요
//  하늘 몬스터(박쥐·새)가 낮게 오고 있으면: 위로 솟구쳐요 → 2단 점프로 더 높이 넘어요 (나비는 따라 뛰어요)
function react(){
  if(mode!=='solo'||!(DF.react>0)||hero.plat)return;
  obs.forEach(o=>{if(!o.wm&&!o.move)return;if(o.reacted||o.dead||o.fb||o.type==='skull')return;const tr=tReach(o);if(tr<0.12||tr>1.15)return;
    o.reacted=1;if(Math.random()>=DF.react)return;
    const t=o.type,k=o.wk||1,dl=0.03+Math.random()*0.12;
    if(t==='snake'||t==='iceslime')o.rx={kind:'brake',d:dl,t:0.32+Math.random()*0.2};
    else if(t==='slime'||t==='bouncy'||t==='frog'||t==='eyeball'||t==='butterfly'&&o.y>GY-26){if(t==='bouncy'||t==='frog'&&Math.random()<0.4)o.rx={kind:'brake',d:dl,t:0.35};else{const h=22+12*k*Math.random();o.rx={kind:'hop',d:dl,v:Math.sqrt(2*700*h)}}}
    else if(t!=='ghost'&&t!=='wisp'&&o.y-(o.hy||0)>GY-58)o.rx={kind:'rise',d:dl,to:22+10*k};   // 유령·도깨비불은 원래 움직임만
    if(o.rx)o.acts=(o.acts||0)+1;
  });
}
function reactStep(o,dt){
  const r=o.rx;if(r.d>0){r.d-=dt;if(r.d<=0&&r.kind==='hop')o.hvy=r.v;return}
  if(r.kind==='hop'){o.hy=(o.hy||0)+o.hvy*dt;o.hvy-=700*dt;if(o.hy<=0){o.hy=0;o.rx=null}}
  else if(r.kind==='brake'){r.t-=dt;o.vx=-28;o.y=o.by+Math.round(Math.sin(o.t*70));if(r.t<=0){o.vx=(o.bvx||o.vx)+30*(o.wk||1);o.rx=null}}
  else if(r.kind==='rise'){o.hy=(o.hy||0)+(r.to-(o.hy||0))*Math.min(1,dt*9);if(o.x<HX-40)r.to=0}
}
// 부딪힘 판정: 몬스터가 실제로 그려진 픽셀이 캐릭터 몸과 겹치면 부딪힌 거예요
let HF;
function pixHit(o,hx0,hy0){
  if(Math.abs(o.x-HX)>90)return false;HF.ox=hx0;HF.oy=Math.round(hy0);P.clearFrame(HF);
  monPos(o);o.fx.draw(HF,'back');o.fx.draw(HF,'front');
  let n=0;for(const c of HF.color)if((c>>>24)>=250&&++n>=7)return true;return false;
}
function coinGroup(x0,R){const n=3+((R()*3)|0),arc=R()<0.5,out=[];
  for(let i=0;i<n;i++){const k=n>1?i/(n-1):0;const vy=arc?GY-22-Math.sin(k*Math.PI)*34:GY-14;out.push([x0+i*14,vy+19])}return out}
function addCoin(x,y){items.push({x,y,fx:P.createFx(FX.coinSpin,{x:0,y:0,seed:(x|0)%7})})}
function spawnCoins(){coinGroup(W+20,Math.random).forEach(([x,y])=>addCoin(x,y));nextCoin=1.4+Math.random()*1.6}
function clearAhead(x){return !obs.some(o=>Math.abs(o.x-x)<36)}

// ══ 퀴즈 문 ══
// 문이 캐릭터 앞에 오면 달리기와 몬스터가 멈추고 문제가 나와요. 대결에서는 내 시계는 계속 흘러요.
function ask(g){
  asking={g,res:null};sfx('gate');const q=g.q;qAll++;
  $('rgQuiz').innerHTML=`<div class="qk">❓ 퀴즈 문${q.review?' · 오답 복습':''} · ${q.kind==='sd'?'속담':q.kind==='hs'?'역사':'맞춤법'}</div>
    <div class="qs">${esc(q.s).replace('___','<u>&nbsp;?&nbsp;</u>')}</div>
    <div class="qo${q.opts.some(o=>String(o).length>10)?' long':''}"><button type="button" id="rgQa0">${esc(q.opts[0])}</button><button type="button" id="rgQa1">${esc(q.opts[1])}</button></div>
    <div class="qf" id="rgQf"></div><div class="qh">키보드: ← / → (또는 1 / 2)</div>`;
  $('rgQuiz').classList.remove('rg-hidden');
  $('rgQa0').onclick=e=>{e.stopPropagation();answer(0)};$('rgQa1').onclick=e=>{e.stopPropagation();answer(1)};
}
function answer(i){
  if(!asking||asking.res)return;const g=asking.g,q=g.q,ok=q.opts[i]===q.ans;asking.res=ok?'ok':'ng';g.ok=ok;
  $('rgQa'+i).classList.add(ok?'ok':'ng');if(!ok)$('rgQa'+(1-i)).classList.add('ok');
  if(ok){qRight++;$('rgQf').innerHTML='정답! '+(mode==='race'?'🚀 잠깐 빨라져요':hearts<3?'❤️ 하트 1개 회복':'🪙 코인 +1');
    const healed=mode!=='race'&&hearts<3;if(mode==='race')hero.boost=1.6;else if(hearts<3)hearts++;else coins++;sfx('ok');if(healed)setTimeout(()=>sfx('heart'),330);
    fx(FX.burst,{x:g.x,y:GY-40,light:0.9},false).scroll=1}
  else{const pen=mode==='race'?host.cfg().pen:0;
    $('rgQf').innerHTML=`땡! 정답은 <b>${esc(q.ans)}</b>${q.e?' — '+q.e:''}`+(pen?`<div class="qpen">⏳ 벌점! <b id="rgPenT">${pen}</b>초 동안 멈춰요</div>`:'');
    if(mode==='race'){mePw+=pen;asking.pen=pen}else wrongs.push(q);sfx('ng')}
  if(mode==='solo')host.markQ(q,ok);
  // 대결 오답: 벌점 시간만큼 문 앞에 멈춰 있어요 (시계는 계속 가요). 화면을 눌러도 풀리지 않아요.
  asking.wait=ok?0.7:Math.max(1.9,asking.pen||0);hud();if(mode==='race')sendNow=true;
}
function gateStep(dt,dx){
  gates.forEach(g=>{g.x-=dx;if(!g.state&&g.x-HX<30){g.state='asked';ask(g)}});gates=gates.filter(g=>g.x>-40);
  if(asking&&asking.res){asking.wait-=dt;if(asking.pen){const e=$('rgPenT');if(e)e.textContent=Math.max(1,Math.ceil(asking.wait))}if(asking.wait<=0){$('rgQuiz').classList.add('rg-hidden');asking.g.state='done';asking=null}}
}
function drawGates(){
  for(const g of gates){const x=Math.round(g.x);if(x<-30||x>W+30)continue;const GY0=GY;{const GY=GY0-Math.round(TH(x));const open=g.state==='done',lift=open?Math.min(18,(g.lift=(g.lift||0)+1.2)):0;
    ctx.fillStyle='#7b5a3a';ctx.fillRect(x-16,GY-50,4,50);ctx.fillRect(x+12,GY-50,4,50);
    ctx.fillStyle=open?(g.ok?'#2f9e44':'#e03131'):'#f08c00';ctx.fillRect(x-18,GY-58-lift,36,12);
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(open?(g.ok?'O':'X'):'?',x,GY-49-lift);ctx.textAlign='left';
    if(!open){ctx.fillStyle='rgba(255,220,120,.35)';ctx.fillRect(x-12,GY-46,24,46)}}}
}

// ══ 친구들과 대결 ══
// 선생님이 연 대결(rid, seed)마다 모두 같은 코스: 같은 몬스터·코인·퀴즈 문(100·200·300·400m)과 같은 문제
function makeCourse(seed){
  const R=rng(seed),mons=[],cns=[],gts=[];let x=540,course_prev=null;
  for(let k=1;k<=4;k++)gts.push({x:Math.round(k*FIN/5),q:host.pickQ(R,false)});   // 퀴즈 문 4개를 고르게
  while(x<FIN-160){
    const d=x/PXM,tt=(-100+Math.sqrt(10000+3.6*x))/1.8,sp=baseSpeed(tt);
    const g=pickGroup(d,R,course_prev);course_prev=g[0][0];g.forEach(([k,dx])=>mons.push({x:x+(dx==='B'?sp*1.5:dx),type:k,sd:(R()*1e9)|0,calm:dx==='B'}));
    const gap=gapAfter(d,sp,g,R);
    R();   // (예전 코인 자리: 순서를 지키려고 남겨 둬요) 대결에는 코인이 없어요
    x+=gap;
  }
  const near=x=>gts.some(g=>x>g.x-170&&x<g.x+150);
  return{mons:mons.filter(m=>!near(m.x)),cns:cns.filter(c=>!near(c[0])),gts};
}
const COLORS=['#e8590c','#2f9e44','#9c36b5','#1098ad','#d6336c','#5c940d','#f08c00','#1c7ed6','#c2255c','#087f5b','#5f3dc4','#e67700'];
let course=null,ci=0,cci=0,gci=0,meX=0,raceT=0,meDone=false,meTime=0,cnt=0,ghosts={},rid=null,startLocal=0,sendT=0,sendNow=false,resultShown=false;
function raceOff(){cntHide=0;$('rgTrack').classList.add('rg-hidden');$('rgTags').innerHTML='';$('rgCount').classList.add('rg-hidden');ghosts={};rid=null}
function raceLobby(){
  const rs=host.race();if(!rs||rs.st!=='lobby'){menu();return}
  mode='race';state='lobby';clearWorld();rid=rs.rid;FIN_M=Math.max(200,+rs.len||500);FIN=FIN_M*PXM;course=makeCourse(rs.seed);terBuildRace(rs.seed,rs.hill,course.gts,rs.fork,course.mons);ci=0;cci=0;gci=0;meX=0;raceT=0;meDone=false;meTime=0;resultShown=false;ghosts={};
  $('rgTrack').classList.remove('rg-hidden');hud();
  host.raceJoin(rid).catch(()=>{toast('대결에 들어가지 못했어요. 새로 고쳐 주세요.')});
  lobbyBox();
}
function lobbyBox(){
  const ps=host.racePlayers(rid),c=host.cfg();
  showBox(`<h2>👫 대결 대기실</h2><p>🏁 ${FIN_M}m 달리기 · 선생님이 "출발"을 누르면 3·2·1 다 같이 시작해요.</p><p><span class="rg-tickets">🏆 ${prizeLine(c.prize)}</span></p>
  <div class="rg-chips" id="rgChips">${ps.map((p,i)=>`<span class="rg-chip" style="background:${p.me?'#2456e6':COLORS[i%COLORS.length]}">${esc(p.me?'나':p.n)}</span>`).join('')}</div>
  <p class="tip">${ps.length}명 들어왔어요 · 기다리는 중…</p><button type="button" class="rg-go sub" id="rgMenu">← 나가기</button>`);
  $('rgMenu').onclick=e=>{e.stopPropagation();host.raceLeave(rid).catch(()=>{});menu()};
}
function prizeLine(pz){const m=['🥇','🥈','🥉','4등','5등'];return pz.map((p,i)=>p?`${m[i]} ${p}`:'').filter(Boolean).join(' · ')||'보상 없음'}
function raceWatch(){
  // 선생님이 바꾼 대결 상태를 따라가요
  const rs=host.race();
  if(state==='lobby'){
    if(!rs||rs.rid!==rid||rs.st==='off'){toast('선생님이 대결을 닫았어요');menu();return}
    if(rs.st==='run'&&rs.at){startLocal=rs.at;hideBox();state='count';$('rgCount').classList.remove('rg-hidden');fitView()}
    else{const n=host.racePlayers(rid).length;if(n!==lobbyN){lobbyN=n;lobbyBox()}}
  }
  if((state==='race'||state==='result'||state==='count')&&(!rs||rs.rid!==rid)){toast('선생님이 대결을 닫았어요');menu()}
}
let lobbyN=0;
function raceSpawn(){
  if(!FORK.met&&FORKS.some(f=>terS(f.s)<W+60)){FORK.met=1;toast('<b>갈림길!</b> ⬆⬆ 2단 점프로 다리에 오르면 윗길(틈 조심), 아니면 아랫길(슬라임)')}
  while(ci<course.mons.length&&course.mons[ci].x-meX<=W+30-HX){const e=course.mons[ci++];const o=withSeed(e.sd,()=>addMon(e.type,(e.x-meX)-(W+30-HX)));if(e.calm)o.calm=1;if(e.under)o.under=1}
  while(cci<course.cns.length&&course.cns[cci][0]-meX<=W+20-HX){const c=course.cns[cci++];addCoin(HX+(c[0]-meX),c[1])}
  while(gci<course.gts.length&&course.gts[gci].x-meX<=W+40-HX){const g=course.gts[gci++];gates.push({x:HX+(g.x-meX),q:g.q})}
}
function raceSend(dt){
  sendT-=dt;if(!sendNow&&sendT>0)return;sendT=0.3;sendNow=false;
  host.raceSend(rid,{x:Math.round(meX),y:Math.round(hero.y),s:hero.stun>0||hero.hurtT<0.6?1:0,q:asking?1:0,pen:mePen,pw:mePw,ok:qRight,...(meDone?{done:true,tm:Math.round(meTime*100)/100}:{})}).catch(()=>{});
}
function meFinish(){meDone=true;meTime=raceT;overT=0;sendNow=true;raceSend(0);sfx('finish');
  const myRec=meTime+mePen,better=host.racePlayers(rid).filter(p=>!p.me&&p.done&&p.tm+(p.pen||0)<myRec).length;newBest=better<3;
  if(newBest){fx(FX.confetti,{x:60,y:GY},false);fx(FX.confetti,{x:180,y:GY,seed:5},false)}
  hud();setTimeout(()=>{if(state==='race')showResult()},1500)}
function showResult(){
  resultShown=true;state='result';const N=course.gts.length,c=host.cfg();
  const ps=host.racePlayers(rid).map(p=>p.me?Object.assign({},p,{done:true,tm:meTime,pen:mePen,pw:mePw,ok:qRight}):p);
  const fin=ps.filter(p=>p.done).map(p=>Object.assign({},p,{rec:p.tm+(p.pen||0)})).sort((a,b)=>a.rec-b.rec),run=ps.filter(p=>!p.done).sort((a,b)=>(b.x||0)-(a.x||0));
  const medal=['🥇','🥈','🥉'],myRank=fin.findIndex(r=>r.me)+1,myPrize=c.prize[myRank-1]||0;
  showBox(`<h2>${myRank}등${myPrize?` · 🪙 +${myPrize}`:''}${run.length?' <span style="font-size:13px;color:#868e96">(친구들이 들어오는 중)</span>':''}</h2>
  <table class="rg-rank"><tr style="color:#868e96"><td></td><td>이름</td><td>기록</td><td>정답</td><td>보상</td></tr>${fin.map((r,i)=>`<tr class="${r.me?'rg-me':''}"><td>${medal[i]||(i+1)+'등'}</td><td>${esc(r.me?'나':r.n)}</td>
    <td>${r.rec.toFixed(1)}초${r.pen?` <span style="color:#e03131;font-size:11px">(+${r.pen})</span>`:''}${r.pw?` <span style="color:#e03131;font-size:11px">(벌점 ${r.pw}초 포함)</span>`:''}</td><td>${r.ok||0}/${N}${(r.ok||0)===N?' 🎯':''}</td><td>${c.prize[i]?'🪙+'+c.prize[i]:''}</td></tr>`).join('')}
    ${run.map(r=>`<tr><td>-</td><td>${esc(r.n)}</td><td>달리는 중</td><td></td><td></td></tr>`).join('')}</table>
  <p class="tip">기록 = 도착 시간 (틀리면 문 앞에서 ${c.pen}초 멈춰요) · 🎯 모두 맞힘 · 보상은 선생님이 대결을 마치면 지갑에 들어가요</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);
  $('rgMenu').onclick=e=>{e.stopPropagation();menu()};
}
let resT=0;

// ── 배경: 달린 거리에 따라 장소가 바뀌어요 (2000m를 넘으면 처음 장소부터 다시) ──
// 학교 0 → 벚꽃 공원 150 → 바닷가 350 → 가을 숲 550 → 밤하늘 800 → 눈 나라 1000 → 사막 1200 → 과자 나라 1400 → 화산 1600 → 우주 1800.
// 바뀔 때 30m 동안 부드럽게 겹쳐요.
const ZONE_LEN=2000,ZONE_FADE=30;
const ZONES=[
  {at:0,name:'🏫 학교',sky:['#9fd3ff','#e6f6ff'],cloud:'#ffffff',draw:bgSchool,ground:['#5cae45','#4a9a38','#caa070','#b68b5c']},
  {at:150,name:'🌸 벚꽃 공원',sky:['#b4d8ff','#fde6f1'],cloud:'#ffffff',draw:bgPark,ground:['#6cc15a','#58a948','#d2a878','#bb9063'],fx:'petal'},
  {at:350,name:'🏖️ 바닷가',sky:['#62bdff','#d6f3ff'],cloud:'#ffffff',draw:bgBeach,ground:['#f3dc9a','#e2c47c','#efd593','#d9bb76'],fx:'gull'},
  {at:550,name:'🍁 가을 숲',sky:['#ff9a66','#ffe1ad'],cloud:'#ffe6d2',draw:bgAutumn,ground:['#c98a3c','#a86c2d','#9b6a40','#84572f'],fx:'leaf'},
  {at:800,name:'🌙 밤하늘',sky:['#0a1431','#28396b'],cloud:null,draw:bgNight,ground:['#2e6638','#23502d','#463628','#372a1f'],fx:'star'},
  {at:1000,name:'❄️ 눈 나라',sky:['#a9c4dc','#e9f1f8'],cloud:'#f4f8fc',draw:bgSnow,ground:['#ffffff','#dbe7f2','#eef4fa','#c9d9e8'],fx:'snow'},
  {at:1200,name:'🌵 사막',sky:['#ffbf5e','#fff0c2'],cloud:null,draw:bgDesert,ground:['#e9b25a','#d39a45','#e6ad5a','#c98f3f'],fx:'heat'},
  {at:1400,name:'🍭 과자 나라',sky:['#f6b8e4','#fff1fb'],cloud:'#ffffff',draw:bgCandy,ground:['#ff8fc3','#ec6fab','#a86b4a','#8b5638'],fx:'sprinkle'},
  {at:1600,name:'🌋 화산',sky:['#3a0f14','#a33a1f'],cloud:null,draw:bgVolcano,ground:['#3b302f','#2a2221','#4a3a35','#ff6a1f'],fx:'ember'},
  {at:1800,name:'🚀 우주',sky:['#05030f','#251446'],cloud:null,draw:bgSpace,ground:['#b8b6c4','#9896a6','#8d8a9c','#6f6c80'],fx:'star'},
];
let bgTop=ZONES[0].sky[0],bgZone=-1;
const loopX=(off,per)=>((off%per)+per)%per;
const BGT=()=>performance.now()/1000;
function zoneIdx(m){let i=0;for(let k=0;k<ZONES.length;k++)if(m>=ZONES[k].at)i=k;return i}
function drawBg(){
  const d=Math.max(0,dist),m=d%ZONE_LEN,i=zoneIdx(m),z=ZONES[i],f=d<ZONE_FADE?1:Math.min(1,(m-z.at)/ZONE_FADE);
  if(f<1){drawZone(ZONES[(i+ZONES.length-1)%ZONES.length]);ctx.globalAlpha=f;drawZone(z);ctx.globalAlpha=1}else drawZone(z);
  bgTop=z.sky[0];
  if(i!==bgZone){if(bgZone>=0&&(state==='play'||state==='race')&&d>=ZONE_FADE)toast(`${z.name}에 들어왔어요!`);bgZone=i}
}
function drawZone(z){
  const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,z.sky[0]);g.addColorStop(1,z.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,-60,W,H+120);
  if(z.cloud){ctx.fillStyle=z.cloud;clouds.forEach((c,i)=>{if(i>=3&&W<300)return;const cx=c[0]*W/240,x=loopX(cx-scroll*0.08,W+60)-40,s=c[2]?1:0.8;
    ctx.fillRect(x,c[1],26*s,6);ctx.fillRect(x+5,c[1]-4,14*s,5);ctx.fillRect(x+3,c[1]+6,20*s,2)})}
  z.draw();
  bgFx(z.fx);
  const [g0,g1,g2,g3]=z.ground;
  if(!TER_LV[TER.lvl]&&!FORKS.length){
  ctx.fillStyle=g0;ctx.fillRect(0,GY,W,4);ctx.fillStyle=g1;ctx.fillRect(0,GY+4,W,1);
  ctx.fillStyle=g2;ctx.fillRect(0,GY+5,W,H-GY-5);ctx.fillStyle=g3;
  const px=loopX(-scroll,24);for(let x=px-24;x<W;x+=24){ctx.fillRect(x,GY+10,3,2);ctx.fillRect(x+12,GY+16,2,2);ctx.fillRect(x+6,GY+20,4,1)}
  }else{   // 언덕: 한 줄씩 땅 높이를 따라 그려요. 땅이 기본선보다 낮은 곳은 뒤쪽 들판(g3)이 보여요.
    ctx.fillStyle=g3;ctx.fillRect(0,GY,W,H+60);
    const tops=new Array(W+1);for(let x=0;x<=W;x++)tops[x]=Math.round(GY-TH(x));
    ctx.fillStyle=g2;for(let x=0;x<W;x++)ctx.fillRect(x,tops[x]+5,1,H+60);
    ctx.fillStyle=g1;for(let x=0;x<W;x++)ctx.fillRect(x,tops[x]+4,1,1);
    ctx.fillStyle=g0;for(let x=0;x<W;x++)ctx.fillRect(x,tops[x],1,4);
    ctx.fillStyle=g3;const px=loopX(-scroll,24);for(let x=px-24;x<W;x+=24)[[0,10,3,2],[12,16,2,2],[6,20,4,1]].forEach(([dx,dy,w,h])=>{const xx=Math.round(x+dx);if(xx>=0&&xx<W)ctx.fillRect(xx,tops[xx]+dy,w,h)});
  }
}
const clouds=[[20,18,1],[110,12,0],[190,24,1],[150,30,0]];
function bgSchool(){
  for(let ox=loopX(-scroll*0.2,320)-80;ox<W;ox+=320){ctx.fillStyle='#d9cdb8';ctx.fillRect(ox,GY-60,96,60);ctx.fillStyle='#c9b99f';ctx.fillRect(ox,GY-60,96,4);
    ctx.fillStyle='#9fc4e0';for(let r=0;r<3;r++)for(let cI=0;cI<7;cI++)ctx.fillRect(ox+6+cI*13,GY-52+r*14,8,8);
    ctx.fillStyle='#b9472f';ctx.fillRect(ox+40,GY-72,16,12);ctx.fillStyle='#fff';ctx.fillRect(ox+44,GY-69,8,6);ctx.fillStyle='#333';ctx.fillRect(ox+47,GY-68,1,3);ctx.fillRect(ox+47,GY-66,3,1)}
  for(let x=loopX(-scroll*0.5,120)-40;x<W;x+=120){ctx.fillStyle='#7b5a3a';ctx.fillRect(x+9,GY-20,4,20);ctx.fillStyle='#4fa04a';ctx.fillRect(x,GY-40,22,22);ctx.fillRect(x+3,GY-46,16,6);ctx.fillStyle='#62b85a';ctx.fillRect(x+3,GY-38,8,6)}
}
function hill(x,w,h,col){ctx.fillStyle=col;for(let i=0;i<w;i++){const k=i/w,y=Math.round(Math.sin(k*Math.PI)*h);ctx.fillRect(x+i,GY-y,1,y)}}
function bgPark(){
  for(let x=loopX(-scroll*0.12,260)-130;x<W;x+=260){hill(x,170,34,'#a9d98f');hill(x+110,150,24,'#95cf7c')}
  for(let x=loopX(-scroll*0.5,110)-50;x<W;x+=110){
    ctx.fillStyle='#7a4f3a';ctx.fillRect(x+12,GY-22,4,22);ctx.fillRect(x+8,GY-28,3,8);ctx.fillRect(x+17,GY-30,3,9);
    ctx.fillStyle='#f4a6c6';ctx.fillRect(x,GY-46,28,18);ctx.fillRect(x+4,GY-52,20,6);ctx.fillRect(x-3,GY-40,34,8);
    ctx.fillStyle='#ffd3e6';ctx.fillRect(x+4,GY-48,8,5);ctx.fillRect(x+17,GY-42,7,4);ctx.fillStyle='#e584ad';ctx.fillRect(x+2,GY-33,10,3);ctx.fillRect(x+18,GY-30,9,2)}
  for(let x=loopX(-scroll*0.5,230)-40;x<W;x+=230){ctx.fillStyle='#8a5a36';ctx.fillRect(x+50,GY-9,22,3);ctx.fillRect(x+50,GY-15,22,2);ctx.fillStyle='#5c3b22';ctx.fillRect(x+52,GY-6,2,6);ctx.fillRect(x+68,GY-6,2,6)}
}
function bgBeach(){
  ctx.fillStyle='#ffe066';ctx.fillRect(W-60,14,16,16);ctx.fillRect(W-63,17,22,10);ctx.fillRect(W-57,11,10,22);
  ctx.fillStyle='#2c8fd6';ctx.fillRect(0,GY-34,W,34);ctx.fillStyle='#4aa9ea';ctx.fillRect(0,GY-34,W,3);ctx.fillStyle='#1f78bd';ctx.fillRect(0,GY-14,W,14);
  const T=BGT();ctx.fillStyle='#e8f7ff';
  for(let x=loopX(-scroll*0.3+T*6,40)-40;x<W;x+=40){ctx.fillRect(x,GY-26,10,1);ctx.fillRect(x+20,GY-18,8,1)}
  for(let x=loopX(-scroll*0.6-T*10,36)-36;x<W;x+=36)ctx.fillRect(x,GY-5+Math.round(Math.sin(T*2+x)*1),14,2);
  for(let x=loopX(-scroll*0.1,300)-60;x<W;x+=300){ctx.fillStyle='#ffffff';ctx.fillRect(x+20,GY-48,2,12);ctx.fillRect(x+13,GY-46,7,9);ctx.fillRect(x+23,GY-44,6,7);ctx.fillStyle='#b3552f';ctx.fillRect(x+11,GY-36,20,3)}
  for(let x=loopX(-scroll*0.5,150)-60;x<W;x+=150){ctx.fillStyle='#8a5b33';
    for(let i=0;i<9;i++)ctx.fillRect(x+10+Math.round(i*i*0.08),GY-4-i*5,4,6);
    const tx=x+16,ty=GY-50;ctx.fillStyle='#2f9e4a';ctx.fillRect(tx-14,ty,30,3);ctx.fillRect(tx-18,ty+2,6,6);ctx.fillRect(tx+12,ty+2,8,6);ctx.fillRect(tx-4,ty-5,10,5);
    ctx.fillStyle='#46c060';ctx.fillRect(tx-10,ty-1,10,2);ctx.fillStyle='#7a4a24';ctx.fillRect(tx-2,ty+3,4,4)}
}
function bgAutumn(){
  for(let x=loopX(-scroll*0.15,220)-110;x<W;x+=220){ctx.fillStyle='#c0706a';for(let i=0;i<120;i++){const h=Math.round(Math.max(0,50-Math.abs(i-60)*0.85));ctx.fillRect(x+i,GY-h,1,h)}
    ctx.fillStyle='#a85d5f';for(let i=0;i<90;i++){const h=Math.round(Math.max(0,36-Math.abs(i-45)*0.8));ctx.fillRect(x+100+i,GY-h,1,h)}}
  const cs=[['#e8642c','#ff9a3c'],['#d63b2f','#f2703f'],['#f0b429','#ffd25a']];
  const t0=Math.ceil(scroll*0.5/95);
  for(let x=loopX(-scroll*0.5,95)-50,k=0;x<W;x+=95,k++){const [a,b]=cs[((t0+k)%3+3)%3];
    ctx.fillStyle='#6b4428';ctx.fillRect(x+10,GY-22,4,22);ctx.fillStyle=a;ctx.fillRect(x,GY-44,24,22);ctx.fillRect(x+4,GY-50,16,6);ctx.fillStyle=b;ctx.fillRect(x+4,GY-42,9,6);ctx.fillRect(x+15,GY-34,6,5)}
}
function bgNight(){
  ctx.fillStyle='#f4f1d0';ctx.fillRect(W-52,12,14,14);ctx.fillRect(W-55,15,20,8);ctx.fillRect(W-49,9,8,20);ctx.fillStyle='#d9d4a8';ctx.fillRect(W-48,16,3,3);ctx.fillRect(W-43,21,2,2);
  // 창문 불빛은 건물마다 정해져 있어요 (움직여도 깜빡이지 않게 화면 위치가 아니라 건물·층·칸 번호로 정해요)
  for(let x=Math.round(loopX(-scroll*0.2,280))-60;x<W;x+=280){
    [[0,46,22],[24,64,18],[44,38,26],[72,56,20],[94,30,24],[120,70,16],[138,44,22]].forEach(([dx,h,w],j)=>{
      ctx.fillStyle='#16224a';ctx.fillRect(x+dx,GY-h,w,h);ctx.fillStyle='#ffd866';
      for(let ri=0,r=GY-h+5;r<GY-6;r+=7,ri++)for(let ci=0,c=x+dx+3;c<x+dx+w-3;c+=6,ci++)if(((ri*7+ci*3+j*11)%5)<2)ctx.fillRect(c,r,2,3)})}
  for(let x=loopX(-scroll*0.5,120)-40;x<W;x+=120){ctx.fillStyle='#3b2a20';ctx.fillRect(x+9,GY-20,4,20);ctx.fillStyle='#1f4a2a';ctx.fillRect(x,GY-40,22,22);ctx.fillRect(x+3,GY-46,16,6)}
}
function bgSnow(){
  for(let x=loopX(-scroll*0.12,240)-120;x<W;x+=240){ctx.fillStyle='#c9d8e8';for(let i=0;i<130;i++){const h=Math.round(Math.max(0,44-Math.abs(i-65)*0.7));ctx.fillRect(x+i,GY-h,1,h)}
    ctx.fillStyle='#ffffff';for(let i=40;i<90;i++){const h=Math.round(Math.max(0,44-Math.abs(i-65)*0.7)),c=Math.min(h,8);ctx.fillRect(x+i,GY-h,1,c)}}
  for(let x=loopX(-scroll*0.5,105)-40,k=0;x<W;x+=105,k++){ctx.fillStyle='#5b3b26';ctx.fillRect(x+10,GY-10,4,10);
    [[0,26,24],[3,18,18],[6,10,12]].forEach(([dx,y,w])=>{ctx.fillStyle='#2f6b4a';ctx.fillRect(x+dx,GY-y-10,w,10);ctx.fillStyle='#ffffff';ctx.fillRect(x+dx,GY-y-10,w,3)})}
  for(let x=loopX(-scroll*0.5,260)+60;x<W+40;x+=260){const b=x-260;ctx.fillStyle='#ffffff';ctx.fillRect(b+4,GY-14,14,14);ctx.fillRect(b+6,GY-24,10,10);
    ctx.fillStyle='#222';ctx.fillRect(b+8,GY-21,2,2);ctx.fillRect(b+12,GY-21,2,2);ctx.fillStyle='#ff7a1a';ctx.fillRect(b+10,GY-19,3,1);ctx.fillStyle='#d63b2f';ctx.fillRect(b+5,GY-15,12,2)}
}
function bgDesert(){
  ctx.fillStyle='#fff6c8';ctx.fillRect(W-70,10,20,20);ctx.fillRect(W-74,14,28,12);ctx.fillRect(W-66,6,12,28);
  for(let x=loopX(-scroll*0.1,330)-80;x<W;x+=330){ctx.fillStyle='#d9a352';for(let i=0;i<60;i++){const h=Math.round(Math.max(0,30-Math.abs(i-30)));ctx.fillRect(x+i,GY-12-h,1,h)}
    ctx.fillStyle='#c48d40';for(let i=30;i<60;i++){const h=Math.round(Math.max(0,30-Math.abs(i-30)));ctx.fillRect(x+i,GY-12-h,1,h)}}
  for(let x=loopX(-scroll*0.2,200)-100;x<W;x+=200){ctx.fillStyle='#efc06e';for(let i=0;i<200;i++){const h=Math.round(10+Math.sin(i/200*Math.PI*2)*6);ctx.fillRect(x+i,GY-h,1,h)}}
  for(let x=loopX(-scroll*0.5,140)-40;x<W;x+=140){ctx.fillStyle='#3f9a4c';ctx.fillRect(x+8,GY-30,7,30);ctx.fillRect(x,GY-22,4,12);ctx.fillRect(x,GY-14,8,3);ctx.fillRect(x+18,GY-26,4,10);ctx.fillRect(x+15,GY-18,7,3);
    ctx.fillStyle='#57b864';ctx.fillRect(x+9,GY-29,2,26);ctx.fillStyle='#ff6fa8';ctx.fillRect(x+10,GY-33,3,3)}
}
function bgCandy(){
  for(let x=loopX(-scroll*0.15,200)-80;x<W;x+=200){ctx.fillStyle='#ffe0ef';ctx.fillRect(x+10,GY-38,40,38);ctx.fillStyle='#ff9ccc';ctx.fillRect(x+6,GY-46,48,10);
    ctx.fillStyle='#fff';for(let i=0;i<48;i+=8)ctx.fillRect(x+6+i,GY-38,4,4);ctx.fillStyle='#b5651d';ctx.fillRect(x+24,GY-16,12,16);ctx.fillStyle='#ff4f9a';ctx.fillRect(x+28,GY-54,4,8)}
  const l0=Math.ceil(scroll*0.5/90);
  for(let x=loopX(-scroll*0.5,90)-40,k=0;x<W;x+=90,k++){const cols=[['#ff5fa2','#ffd23f'],['#5fc8ff','#ff8fc3'],['#8be06b','#ffffff']][((l0+k)%3+3)%3];
    ctx.fillStyle='#ffffff';ctx.fillRect(x+11,GY-26,2,26);ctx.fillStyle=cols[0];ctx.fillRect(x+2,GY-44,20,18);ctx.fillRect(x+5,GY-47,14,24);
    ctx.fillStyle=cols[1];ctx.fillRect(x+6,GY-40,12,3);ctx.fillRect(x+9,GY-34,9,3);ctx.fillRect(x+6,GY-29,6,2)}
  for(let x=loopX(-scroll*0.5,170)+30;x<W+30;x+=170){const b=x-170;ctx.fillStyle='#ffffff';ctx.fillRect(b,GY-22,3,22);ctx.fillRect(b,GY-24,9,3);ctx.fillRect(b+7,GY-22,3,5);
    ctx.fillStyle='#e8344b';for(let y=GY-20;y<GY;y+=5)ctx.fillRect(b,y,3,2);ctx.fillRect(b+3,GY-24,3,3)}
}
function bgVolcano(){
  for(let x=loopX(-scroll*0.1,300)-100;x<W;x+=300){ctx.fillStyle='#2a1416';for(let i=0;i<160;i++){const h=Math.round(Math.max(0,78-Math.abs(i-80)*1.05));ctx.fillRect(x+i,GY-Math.min(h,64),1,Math.min(h,64))}
    const T=BGT();ctx.fillStyle='#ff6a1f';ctx.fillRect(x+66,GY-64,28,3);ctx.fillStyle='#ffb02e';ctx.fillRect(x+72,GY-66,16,2);
    ctx.globalAlpha*=0.8;ctx.fillStyle='#ff6a1f';for(let i=0;i<5;i++){const yy=GY-60+i*12;ctx.fillRect(x+76+Math.round(Math.sin(T+i)*3)-i*3,yy,3,9)}ctx.globalAlpha/=0.8}
  for(let x=loopX(-scroll*0.5,120)-40;x<W;x+=120){ctx.fillStyle='#1d1516';ctx.fillRect(x,GY-14,26,14);ctx.fillRect(x+5,GY-20,14,6);ctx.fillStyle='#ff6a1f';ctx.fillRect(x+8,GY-6,9,1);ctx.fillRect(x+15,GY-11,1,5)}
}
function bgSpace(){
  ctx.fillStyle='#3c7ae0';ctx.fillRect(W-80,14,22,22);ctx.fillRect(W-84,18,30,14);ctx.fillRect(W-76,10,14,30);ctx.fillStyle='#4fc46a';ctx.fillRect(W-78,18,8,7);ctx.fillRect(W-68,27,7,6);ctx.fillRect(W-75,32,5,4);
  for(let x=loopX(-scroll*0.08,360)-80;x<W;x+=360){ctx.fillStyle='#e2a95a';ctx.fillRect(x+20,40,18,18);ctx.fillRect(x+17,43,24,12);ctx.fillStyle='#f4d39a';ctx.fillRect(x+8,48,42,2);ctx.fillStyle='#c98a3c';ctx.fillRect(x+22,46,14,2);
    ctx.fillStyle='#b05ad8';ctx.fillRect(x+150,62,8,8);ctx.fillRect(x+149,64,10,4)}
  for(let x=loopX(-scroll*0.5,150)-40;x<W;x+=150){ctx.fillStyle='#9896a6';ctx.fillRect(x,GY-6,30,6);ctx.fillRect(x+4,GY-9,22,3);ctx.fillStyle='#7a7890';ctx.fillRect(x+8,GY-4,12,2);
    ctx.fillStyle='#d8d8e0';ctx.fillRect(x+60,GY-30,2,30);ctx.fillStyle='#ffd23f';ctx.fillRect(x+62,GY-30,12,8);ctx.fillStyle='#ff8a2a';ctx.fillRect(x+66,GY-27,4,2)}
}
function bgFx(kind){
  if(!kind)return;const T=BGT();
  if(kind==='petal'||kind==='leaf'){
    const cols=kind==='petal'?['#ffc2dc','#ff9ec7','#fff0f7']:['#e8642c','#f0b429','#d63b2f'];
    for(let i=0;i<16;i++){const sp=12+(i%5)*4,x=loopX(i*61-T*(kind==='petal'?14:8)-scroll*0.55,W+20)-10,y=loopX(i*37+T*sp,GY+20)-10;
      ctx.fillStyle=cols[i%3];ctx.fillRect(Math.round(x+Math.sin(T*2+i)*4),Math.round(y),kind==='petal'?2:3,2)}
  }else if(kind==='star'){
    for(let i=0;i<34;i++){const x=loopX(i*53-scroll*0.02,W),y=(i*29)%(GY-50)+4,a=0.4+0.6*Math.abs(Math.sin(T*1.5+i));ctx.globalAlpha*=a;ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x),y,i%7===0?2:1,i%7===0?2:1);ctx.globalAlpha/=a}
    for(let i=0;i<9;i++){const x=loopX(i*47+Math.sin(T*0.7+i)*14-scroll*0.6,W),y=GY-10-((i*13)%26)+Math.sin(T*1.3+i*2)*5,a=0.5+0.5*Math.sin(T*3+i);ctx.globalAlpha*=Math.max(0.05,a);ctx.fillStyle='#e8ff7a';ctx.fillRect(Math.round(x),Math.round(y),2,2);ctx.globalAlpha/=Math.max(0.05,a)}
  }else if(kind==='snow'||kind==='sprinkle'||kind==='ember'){
    const up=kind==='ember',cols=kind==='snow'?['#ffffff']:kind==='ember'?['#ff6a1f','#ffb02e','#ff3d1f']:['#ff5fa2','#5fc8ff','#ffd23f','#8be06b'];
    for(let i=0;i<(kind==='snow'?26:16);i++){const sp=10+(i%5)*4,x=loopX(i*53+Math.sin(T+i)*6-scroll*0.5,W+20)-10,yy=loopX(i*41+T*sp,GY+20)-10,y=up?GY-yy:yy;
      ctx.fillStyle=cols[i%cols.length];ctx.fillRect(Math.round(x),Math.round(y),kind==='sprinkle'?3:2,kind==='sprinkle'?1:2)}
  }else if(kind==='heat'){
    ctx.globalAlpha*=0.25;ctx.fillStyle='#ffffff';for(let i=0;i<6;i++){const y=GY-30+i*4,x=loopX(i*70-T*30,W+60)-30;ctx.fillRect(Math.round(x),y,24,1)}ctx.globalAlpha/=0.25;
  }else if(kind==='gull'){
    for(let i=0;i<3;i++){const x=loopX(i*130-T*18-scroll*0.15,W+40)-20,y=26+i*9+Math.sin(T*2+i)*3,w=Math.sin(T*8+i)>0;ctx.fillStyle='#ffffff';
      ctx.fillRect(Math.round(x),Math.round(y),2,1);ctx.fillRect(Math.round(x)+4,Math.round(y),2,1);ctx.fillRect(Math.round(x)+2,Math.round(y)+(w?-1:1),2,1)}
  }
}



// ── 캐릭터(나) 한 걸음 ──
function heroStep(dt,sp){
  const gy=GY-TH(HX),pl=FORKS.length?platY(HX):null,py=hero.y;hero.dj=Math.max(0,(hero.dj||0)-dt);
  if(hero.ground){if(hero.plat){if(pl!=null)hero.y=pl;else{hero.ground=false;hero.plat=false;hero.vy=0}}else hero.y=gy}   // 땅에 있으면 언덕을 따라가요
  if(!hero.ground){const g=hero.vy<0?G:G*FALL_G;hero.vy+=g*dt;hero.y+=hero.vy*dt;
    if(pl!=null){const bot=pl+5;
      if(hero.vy>=0&&py<=pl+2&&hero.y>=pl){hero.y=pl;hero.vy=0;hero.ground=true;hero.plat=true;hero.jumps=0;hero.hold=false;hero.land=0.09}   // 다리에 내려앉기 (조금 낮아도 올려 줘요)
      else if(hero.vy<0&&hero.y-46<bot&&py-46>=bot-3){hero.y=bot+46;hero.vy=0}}}   // 다리 밑에서 뛰면 머리가 막혀요
  if(hero.y>=gy){hero.plat=false;hero.hold=false;if(!hero.ground){hero.land=0.09;if(hero.vy>120)shake=Math.max(shake,0.05)}hero.y=gy;hero.vy=0;hero.ground=true;hero.jumps=0}
  const rp=Math.max(0.035,0.075-sp/4000);hero.ft+=dt;if(hero.ft>rp){hero.ft=0;hero.f=(hero.f+1)%10}
  hero.hurtT+=dt;hero.land=Math.max(0,hero.land-dt);
  if(!hero.ground)hero.key=hero.dj>0.17?'jump2':hero.vy<-110?'jump3':hero.vy<0?'jump4':hero.vy<140?'jump5':'jump6';
  else if(hero.hurtT<0.6)hero.key='hurt'+(1+Math.min(11,Math.floor(hero.hurtT/0.05)));
  else if(hero.land>0)hero.key='jump7';
  else hero.key='run'+(hero.f+1);
}
function worldStep(dt,dx){
  if(asking){obs.forEach(o=>o.fx.update(dt));items.forEach(c=>c.fx.update(dt));return}
  const hx0=HX-7,hy0=hero.y-46,hy1=hero.y-2;
  obs.forEach(o=>{o.t+=dt;if(o.move)o.move(o,dt);if(o.wm)wildStep(o,dt);if(o.rx)reactStep(o,dt);if(o.follow&&!o.follow.gone&&obs.includes(o.follow))o.vx=o.follow.vx||0;o.x-=dx+(o.vx||0)*dt;o.fx.update(dt);
    if(!o.dead&&inv<=0&&pixHit(o,hx0,hy0)){o.dead=1;hit(o)}});
  obs=obs.filter(o=>o.x>-70&&!o.gone);
  items.forEach(c=>{c.x-=dx;c.fx.update(dt);
    const cy=c.y-19-(c.br?THb(c.x)+BR:TH(c.x));if(!c.got&&Math.abs(c.x-HX)<11&&cy<hy1+4&&cy>hy0-4){c.got=1;coins++;sfx('coin');fx(FX.burst,{x:c.x,y:c.y-10,light:0.8},false);hud()}});
  items=items.filter(c=>c.x>-20&&!c.got);
  inv=Math.max(0,inv-dt);
  fxs.forEach(e=>{if(e.scroll)e.fx.options.x-=dx});
}
const idleKey=()=>'idle'+(1+(Math.floor(performance.now()/200)%4));
function endAnim(dt){
  overT+=dt;hero.y=Math.min(GY,hero.y+dt*80);
  if(hero.y<GY-1)hero.key='jump6';else if(overT<0.8)hero.key='stop'+(1+Math.min(10,Math.floor(overT/0.07)));else hero.key=idleKey();
  hero.hop=newBest&&overT>0.8&&overT<2.6?Math.abs(Math.sin((overT-0.8)*7))*7:0;
}

// ── 업데이트 ──
function update(dt){
  if(state==='scount'){
    const pc=Math.ceil(scT);scT-=dt;hero.key=idleKey();$('rgCount').textContent=scT>0?Math.ceil(scT):'출발!';if(Math.ceil(scT)!==pc)sfx(scT>0?'beep':'go');if(scT<=0){state='play';cntHide=0.7}
  }else if(state==='play'){
    if(cntHide>0){cntHide-=dt;if(cntHide<=0)$('rgCount').classList.add('rg-hidden')}
    if(!asking)t+=dt;speed=baseSpeed(t)*terSpeed(dt);const dx=asking?0:speed*dt;scroll+=dx;dist+=dx/PXM;   // 코인을 먹으면 잠깐 빨라져요
    heroStep(dt,asking?0:speed);if(asking&&hero.ground)hero.key=idleKey();
    if(!asking){forkStep();nextObs-=dx;if(nextObs<=0)spawnObs();
      nextCoin-=dt;if(nextCoin<=0){if(clearAhead(W+40))spawnCoins();else nextCoin=0.3}
      if(dist>=nextGateM&&!forkNear(W+40,150)&&flatAt(W+40,110)&&!obs.some(o=>o.x>W-110)&&!gates.some(g=>g.state!=='done')){gates.push({x:W+40,q:host.pickQ(Math.random,true)});nextGateM=Math.max(nextGateM,dist)+host.cfg().gateEvery;nextObs=Math.max(nextObs,260)}}
    gateStep(dt,dx);worldStep(dt,dx);
    if(Math.floor(dist)%5===0)hud();
  }else if(state==='lobby'){
    hero.key=idleKey();raceWatch();
  }else if(state==='count'){
    const left=(startLocal-host.now())/1000;$('rgCount').textContent=left>3?'준비!':left>0?Math.ceil(left):'출발!';hero.key=idleKey();
    {const c=left>3?9:left>0?Math.ceil(left):0;if(SND.cd!==c){if(SND.cd!=null&&c<=3)sfx(c?'beep':'go');SND.cd=c}}
    if(left<=0&&state==='count'){state='race';raceT=Math.max(0,-left);sendNow=true}
    raceWatch();
  }else if(state==='race'||state==='result'){
    if(raceT>0.7&&!$('rgCount').classList.contains('rg-hidden'))$('rgCount').classList.add('rg-hidden');
    if(!meDone){
      raceT=Math.max(0,(host.now()-startLocal)/1000);
      speed=asking?0:baseSpeed(raceT)*terSpeed(dt)*(hero.stun>0?0.45:1)*(hero.boost>0?(hero.boost>1.25?1.45:1.3):1);const dx=speed*dt;meX+=dx;scroll+=dx;dist=meX/PXM;
      hero.stun=Math.max(0,hero.stun-dt);if(!asking)hero.boost=Math.max(0,hero.boost-dt);
      raceSpawn();heroStep(dt,speed);if(asking&&hero.ground)hero.key=idleKey();gateStep(dt,dx);worldStep(dt,dx);
      if(meX>=FIN)meFinish();
      hud();
    }else{endAnim(dt);worldStep(dt,0);if(state==='result'){resT-=dt;if(resT<=0){resT=1;showResult()}}}
    raceSend(dt);raceWatch();
  }else{
    if(state==='ready'||state==='menu')hero.key=idleKey();
    if(state==='over'){endAnim(dt);obs.forEach(o=>o.fx.update(dt));items.forEach(c=>c.fx.update(dt))}
  }
  camY+=((hero.y<74?74-hero.y:hero.y>GY+6?GY+6-hero.y:0)-camY)*Math.min(1,dt*10);
  if(toastT>0){toastT-=dt;if(toastT<=0)$('rgToast').classList.remove('show')}
  shake=Math.max(0,shake-dt);
  fxs.forEach(e=>e.fx.update(dt));fxs=fxs.filter(e=>e.keep||!e.fx.done());
}
function hit(o){
  shake=0.25;sfx('hit');hero.hurtT=0;
  fx(FX.blunt,{x:HX+4,y:hero.y-18,height:16,light:0.8},false);
  const p=fx(FX.poof,{x:o.x,y:o.y,light:0.5},false);p.scroll=1;o.gone=1;
  if(mode==='race'){hero.stun=1.0;inv=1.4;sendNow=true;return} // 대결: 탈락 없이 1초 비틀
  hearts--;inv=1.4;hud();if(hearts<=0)gameOver();
}
async function gameOver(){
  state='over';overT=0;cntHide=0;$('rgCount').classList.add('rg-hidden');const d=Math.floor(dist);
  let res={reward:0,best:host.best(),newBest:false,today:0};
  try{res=await host.soloEnd({dist:d,right:qRight,all:qAll,coins})}catch(e){}
  newBest=res.newBest;sfx(newBest?'best':'over');
  if(newBest){fx(FX.confetti,{x:60,y:GY},false);fx(FX.confetti,{x:180,y:GY,seed:5},false)}
  setTimeout(()=>{if(state!=='over')return;const c=host.cfg(),tl=host.ticketsLeft(),sb=host.soloBlock();
    showBox(`<h2>${newBest?'<span class="new">새 최고 기록!</span>':'수고했어요!'}</h2><p class="big">${d}m</p>
    <p>퀴즈 ${qRight}/${qAll} · 먹은 코인 ${coins}개 → 🪙 +${res.reward} <span style="color:#868e96;font-size:12px">${res.preview?'(학생이라면 받을 코인 · 지갑에는 안 들어가요)':`(오늘 ${res.today}/${c.coinMax})`}</span></p>
    ${res.reward<coins?`<p style="color:#868e96;font-size:12px">${res.why||''}</p>`:''}
    ${wrongs.length?`<p style="font-weight:700;margin-top:6px">📒 다시 보기</p><ul class="rg-wrongs">${wrongs.slice(0,3).map(q=>`<li>${q.s.includes('___')?esc(q.s).replace('___',`<b>${esc(q.ans)}</b>`):`${esc(q.s)} → <b>${esc(q.ans)}</b>`}</li>`).join('')}</ul>`:qAll?'<p>퀴즈 문을 모두 맞혔어요! 🎯</p>':''}
    <p class="tip">${sb?esc(sb):`남은 판 ${tl} · 화면을 누르거나 스페이스·Enter로 한 판 더`}</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);$('rgMenu').onclick=e=>{e.stopPropagation();menu()}},700);
}

// ── 그리기 ──
function drawKey(key,x,y,alpha){
  const i=AT.keys.indexOf(key);if(i<0||!atlas)return;ctx.globalAlpha=alpha;
  ctx.drawImage(atlas,(i%AT.cols)*AT.w,Math.floor(i/AT.cols)*AT.h,AT.w,AT.h,Math.round(x)-42,Math.round(y)-80,AT.w,AT.h);ctx.globalAlpha=1;
}
function drawRunner(r,x,y,alpha,blink){
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x,(r===hero&&hero.plat?platY(x)??GY-TH(x):GY-TH(x))+1-(r.lane||0),Math.max(4,10-(GY-TH(x)-r.y)/8),2.5,0,0,7);ctx.fill();
  if(blink)return;drawKey(r.key,x,y-(r.hop||0)-(r.lane||0),alpha);
}
function drawLines(){const GY0L=GY;
  if(mode!=='race')return;
  for(const [wx,fin] of [[0,false],[FIN,true]]){const sx=Math.round(wx-meX+HX);if(sx<-10||sx>W+10)continue;const GY=Math.round(GY0L-TH(sx));
    if(!fin){ctx.fillStyle='#fff';ctx.fillRect(sx,GY,2,H-GY)}else{for(let y=GY;y<H;y+=3)for(let i=0;i<2;i++){ctx.fillStyle=((y/3+i)%2)?'#222':'#fff';ctx.fillRect(sx+i*3,y,3,3)}
      ctx.fillStyle='#7b5a3a';ctx.fillRect(sx-1,GY-50,2,50);ctx.fillStyle='#e03131';ctx.fillRect(sx+1,GY-50,14,9);ctx.fillStyle='#fff';ctx.fillRect(sx+4,GY-48,8,1)}}
}
// 친구들: 0.3초마다 오는 위치를 부드럽게 이어서 보여 줘요
function ghostStep(dt){
  if(mode!=='race'||!rid)return[];
  const ps=host.racePlayers(rid).filter(p=>!p.me),out=[];
  ps.forEach((p,i)=>{let g=ghosts[p.k];if(!g){g=ghosts[p.k]={x:p.x||0,y:GY,f:i,ft:0,lane:3+(i%3)*5,ox:((i*13)%60)-30,color:COLORS[i%COLORS.length]}}
    const tx=p.done?FIN+30:(p.x||0);g.x+=(tx-g.x)*Math.min(1,dt*6);if(!p.done&&!p.q&&state==='race')g.x+=baseSpeed(raceT)*dt*0.6;if(g.x>tx+40)g.x=tx+40;
    g.y+=((p.y||GY)-g.y)*Math.min(1,dt*12);g.ft+=dt;if(g.ft>0.05){g.ft=0;g.f=(g.f+1)%10}
    g.key=p.done?idleKey():p.q?idleKey():p.s?'hurt'+(1+(g.f%12)):g.y<GY-2?'jump4':(state==='race'||state==='result')?'run'+(g.f+1):idleKey();
    g.n=p.n;g.done=p.done;out.push(g)});
  return out;
}
function render(dt){
  const sx=shake>0?Math.round((Math.random()-.5)*4):0,sy=shake>0?Math.round((Math.random()-.5)*3):0;
  ctx.fillStyle=bgTop;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(sx,sy+Math.round(camY));drawBg();drawForks();drawLines();drawGates();
  P.clearFrame(fB);P.clearFrame(fF);
  items.forEach(c=>{c.fx.options.x=Math.round(c.x);c.fx.options.y=Math.round(c.y-(c.br?THb(c.x)+BR:TH(c.x)));c.fx.draw(fF,'front')});
  obs.forEach(o=>{monPos(o);o.fx.draw(fB,'back');o.fx.draw(fF,'front')});
  fxs.forEach(e=>{e.fx.draw(fB,'back');e.fx.draw(fF,'front')});
  P.composite(fB,LB.d.data,null);LB.x.putImageData(LB.d,0,0);P.composite(fF,LF.d.data,null);LF.x.putImageData(LF.d,0,0);
  ctx.drawImage(LB.c,0,-FM);ctx.drawImage(LF.c,0,-FM);
  const gs=ghostStep(dt),tags=[];
  for(const g of [...gs].sort((a,b)=>b.lane-a.lane)){const x=HX+(g.x-meX)+g.ox;if(x<-30||x>W+30)continue;drawRunner(g,x,g.y,0.5);tags.push([g,x])}
  drawRunner(hero,HX,hero.y,1,(state==='play'||state==='race')&&inv>0&&hero.hurtT>0.6&&Math.floor(inv*14)%2===0);
  ctx.restore();
  if(mode==='race'){
    let h='';for(const [g,x] of tags)h+=`<div class="rg-tag" style="left:${x/W*100}%;top:${(g.y-g.lane-66+camY)/H*100}%;background:${g.color}">${esc(g.n)}</div>`;$('rgTags').innerHTML=h;
    let d='';for(const g of gs){const p=Math.max(0,Math.min(1,g.x/FIN))*100;d+=`<div class="dot" style="left:${p}%;background:${g.color}">${esc((g.n||'?')[0])}</div>`}
    d+=`<div class="dot rg-me" style="left:${Math.max(0,Math.min(1,meX/FIN))*100}%;background:#2456e6">나</div>`;
    $('rgTrack').querySelectorAll('.dot').forEach(n=>n.remove());$('rgTrack').insertAdjacentHTML('beforeend',d);
  }
}
let last=0;
function loop(ts){raf=requestAnimationFrame(loop);const dt=Math.min(0.033,(ts-(last||ts))/1000);last=ts;
  bgmTick();if(!visible()||!atlas)return;update(dt);render(dt)}

// ── 붙이기 / 떼기 ──
function mount(el,h){
  if(mounted)unmount();
  P=window.PFX;FX=P.fx;host=h;root=el;
  if(!document.getElementById('rgStyle')){const st=document.createElement('style');st.id='rgStyle';st.textContent=CSS;document.head.appendChild(st)}
  el.innerHTML=HTML;cv=$('rgC');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  fB=null;HF=P.createFrame(14,44);
  AT=window.RUN_ATLAS;const im=new Image();im.onload=()=>{atlas=im};im.src=AT.src;
  const gm=$('rgGame');
  gm.addEventListener('pointerdown',e=>{sndUnlock();if(e.target.closest('button'))return;e.preventDefault();gm.focus({preventScroll:true});press()});
  gm.addEventListener('touchend',sndUnlock,{passive:true});
  const sb=(id,k)=>{const b=$(id);b.addEventListener('pointerdown',e=>e.stopPropagation());b.onclick=e=>{e.stopPropagation();SND.pref[k]=SND.pref[k]?0:1;sndSave();sndUi();if(k==='s'&&SND.pref.s)sfx('coin');gm.focus({preventScroll:true})}};
  sb('rgSfx','s');sb('rgBgm','m');sndUi();
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);window.addEventListener('resize',onResize);
  mounted=true;menu();last=0;raf=requestAnimationFrame(loop);
}
function unmount(){
  mounted=false;cancelAnimationFrame(raf);
  window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);
  window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('resize',onResize);
}
// 창 크기가 바뀌면 게임 중이 아닐 때만 혼자 연습 화면 폭을 다시 맞춰요.
let rzT=0;function onResize(){clearTimeout(rzT);rzT=setTimeout(()=>{if(mounted&&mode==='solo'&&(state==='menu'||state==='ready'))setView(soloW())},200)}
// 바깥(설정·대결 상태)이 바뀌면 첫 화면을 새로 그려요. 게임 중에는 건드리지 않아요.
function refresh(){if(!mounted)return;sndUi();if(state==='menu')menu();else if(state==='lobby')lobbyBox()}
window.RunGame={mount,unmount,refresh,get state(){return state},get mounted(){return mounted&&root&&root.isConnected},
  _t:{answer,press,release,get asking(){return asking},get gates(){return gates},get speed(){return speed},get obs(){return obs},get hero(){return hero},setHearts:v=>hearts=v,get hearts(){return hearts},setT:v=>t=v,setCoins:v=>coins=v,group:(g,w)=>spawnGroup(g,w),get bgZone(){return bgZone},spawn:k=>addMon(k),setDist:v=>dist=v,noSpawn:keepGate=>{nextObs=1e9;nextCoin=1e9;if(!keepGate)nextGateM=1e9},get meX(){return meX},get DF(){return DF},TH:x=>TH(x),get TER(){return TER},get FORKS(){return FORKS},get onBridge(){return !!hero.plat},forkS:()=>{const w=terW(HX);const f=FORKS.find(f=>f.s>w-120);return f?w-f.s:null},gap:()=>{const w=terW(HX)+18;let m=null;for(const f of FORKS)for(const g of f.gaps){const d=g[0]-w;if(d>-5&&(m==null||d<m))m=d}return m}}};
})();
