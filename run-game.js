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
.rg-count{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(40px,12vw,110px);font-weight:700;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.3);pointer-events:none}
.rg-quiz{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:min(94%,560px);background:#fff;border-radius:14px;padding:clamp(8px,1.8vw,14px) clamp(10px,2vw,18px);box-shadow:0 10px 30px rgba(0,0,0,.25);text-align:center;z-index:6;cursor:default;color:#1d1d1f}
.rg-quiz .qk{font-size:clamp(11px,1.8vw,13px);color:var(--accent,#2456e6);font-weight:700;margin-bottom:2px}
.rg-quiz .qs{font-size:clamp(14px,2.8vw,22px);font-weight:600;line-height:1.45;word-break:keep-all}
.rg-quiz .qs u{text-decoration:none;display:inline-block;min-width:3.2em;border-bottom:3px solid var(--accent,#2456e6);color:var(--accent,#2456e6)}
.rg-quiz .qo{display:flex;gap:8px;margin-top:8px}
.rg-quiz .qo button{flex:1;font:inherit;font-size:clamp(15px,3vw,22px);font-weight:700;padding:clamp(6px,1.4vw,12px);border-radius:12px;border:2px solid #dfe3ee;background:#f7f9ff;cursor:pointer;color:#1d1d1f}
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
  <div class="rg-hud"><div class="l"><span id="rgDist">0m</span><span id="rgCoin">🪙 0</span></div><div class="r"><span id="rgHearts">❤️❤️❤️</span></div></div>
  <div class="rg-count rg-hidden" id="rgCount">3</div>
  <div class="rg-quiz rg-hidden" id="rgQuiz"></div>
  <div class="rg-panel" id="rgPanel"><div class="rg-box" id="rgBox"></div></div>
</div>`;

// ── 상태 ──
// mode: solo(혼자 연습) | race(친구들과 대결)
// state: menu | ready | play | over (연습)  /  lobby | count | race | result (대결)
let mode='solo',state='menu',t=0,speed=100,dist=0,coins=0,hearts=3,inv=0,shake=0,overT=0,newBest=false;
const hero={y:GY,vy:0,ground:true,jumps:0,hold:false,f:0,ft:0,key:'idle1',hurtT:9,land:0,hop:0,stun:0,boost:0};
let obs=[],items=[],fxs=[],nextObs=260,nextCoin=1.0,scroll=0,camY=0,gates=[],asking=null,nextGateM=100,qRight=0,qAll=0,wrongs=[],mePen=0,toastT=0,busyEnd=false;
const met=new Set();
const baseSpeed=tt=>Math.min(175,100+tt*1.8);
function rnd(n){return (Math.random()*n)|0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296}}
function withSeed(seed,fn){const R0=Math.random;Math.random=rng(seed);try{return fn()}finally{Math.random=R0}}

function soloW(){const pe=root&&root.parentElement,cw=Math.min(1320,(pe&&pe.clientWidth)||(root&&root.clientWidth)||880);return Math.max(240,Math.min(400,Math.round(cw/VIEW_SCALE/4)*4))}
function setView(w){if(w===W&&fB)return;W=w;cv.width=W;cv.height=H;ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  fB=P.createFrame(W,H);fF=P.createFrame(W,H);LB=mkLayer();LF=mkLayer();$('rgGame').style.aspectRatio=W+'/'+H;root.style.setProperty('--rg-ar',(W/H).toFixed(3))}
function mkLayer(){const c=document.createElement('canvas');c.width=W;c.height=H;return{c,x:c.getContext('2d'),d:new ImageData(W,H)}}
function clearWorld(){setView(mode==='race'?RACE_W:soloW());hero.y=GY;hero.vy=0;hero.ground=true;hero.jumps=0;hero.hurtT=9;hero.stun=0;hero.boost=0;hero.hop=0;
  obs=[];items=[];fxs=[];camY=0;inv=0;shake=0;coins=0;dist=0;t=0;met.clear();toastT=0;$('rgToast').classList.remove('show');
  gates=[];asking=null;$('rgQuiz').classList.add('rg-hidden');nextGateM=Math.round(host.cfg().gateEvery*0.8);qRight=0;qAll=0;wrongs=[];mePen=0}
function hud(){
  if(mode==='race'){$('rgDist').textContent='⏱ '+raceT.toFixed(1)+'초'+(mePen?` +${mePen}`:'');$('rgCoin').textContent='🪙 '+coins;
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
  <div class="rg-modes"><button type="button" id="rgSolo" class="${sb?'off':''}"><b>🏃 혼자 연습</b><span>${sb?esc(sb):`티켓 1장 · 하트 3개<br>내 최고 기록 ${host.best()}m`}</span></button>
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
  showBox(`<h2>🏃 혼자 연습</h2><p><span class="rg-tickets">🎫 티켓 1장을 써요 · 남은 판 ${host.ticketsLeft()}</span></p><p>누르면 점프! 공중에서 한 번 더 누르면 2단 점프! 🪙 먹은 코인만큼 진짜 코인을 받아요.</p>
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
  const cn=$('rgCount');cn.textContent='3';cn.classList.remove('rg-hidden');fitView();
}
let scT=0,cntHide=0;

// ── 입력 ──
// 점프: 공중에 약 1.1초, 높이 약 52. 짧게 누르면 낮게. 공중에서 한 번 더 = 2단 점프.
const G=330,FALL_G=1.0,JV=-185,JV2=-178,CUT=0.5;
function jump(){
  if(hero.ground){hero.vy=JV;hero.ground=false;hero.jumps=1;hero.hold=true}
  else if(hero.jumps<2){hero.vy=JV2;hero.jumps=2;hero.hold=true;hero.dj=0.25;fx(FX.burst,{x:HX,y:hero.y+2,seed:7,light:0.5},false)}
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
function onKey(e){if(!visible()||typingEl())return;const c=e.code||e.key;
  if(asking&&!asking.res){const k={ArrowLeft:0,Digit1:0,KeyA:0,Numpad1:0,ArrowRight:1,Digit2:1,KeyD:1,Numpad2:1}[c];if(k!==undefined){e.preventDefault();answer(k);return}}
  if(asking&&(JUMP_KEYS.includes(c)||e.key===' ')){e.preventDefault();return}
  if(JUMP_KEYS.includes(c)||START_KEYS.includes(c)||e.key===' '){
    if(state==='menu'&&!START_KEYS.includes(c))return; // 첫 화면에서는 스페이스로 스크롤 가능
    e.preventDefault();if(e.repeat)return;
    if(START_KEYS.includes(c)&&(state==='play'||state==='race'))return;press()}}
function onKeyUp(e){if(!visible())return;const c=e.code||e.key;if(JUMP_KEYS.includes(c)||e.key===' ')release()}

// ── 몬스터 ──
const MON={
  slime:{name:'슬라임',at:0,tip:'뛰어넘어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:3,seed:rnd(99)}),by:GY})},
  bat:{name:'박쥐',at:0,tip:'높이 뛰면 부딪혀요',make:()=>({fx:P.createFx(FX.bat,{x:0,y:0,seed:rnd(99)}),by:GY-90+rnd(6)})},
  frog:{name:'개구리',at:80,tip:'폴짝대며 다가와요',make:()=>({fx:P.createFx(FX.frog,{x:0,y:0,seed:rnd(99)}),by:GY,vx:38})},
  snake:{name:'뱀',at:160,tip:'길어요! 길게 눌러 멀리 뛰어요',make:()=>({fx:P.createFx(FX.snake,{x:0,y:0,seed:rnd(99)}),by:GY,vx:20})},
  bouncy:{name:'통통 슬라임',at:240,tip:'높이 튀어요. 내려왔을 때 넘어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:26,seed:rnd(99),palette:['#1a0a14','#4a1638','#8a2a6a','#c24a9a','#f07ac8','#ffb8e8','#fff0fa']}),by:GY})},
  bird:{name:'새',at:320,tip:'날아오다 높이를 휙 바꿔요. 낮으면 뛰고, 높으면 그냥 달려요',make:()=>{const hi=Math.random()<0.5;return{fx:P.createFx(FX.bird,{x:0,y:0,seed:rnd(99)}),by:hi?GY-84:GY-30,ty:hi?GY-30:GY-84,vx:40,
    move:(o,dt)=>{const target=o.x<175?o.ty:o.by;o.cy=(o.cy??o.by)+(target-(o.cy??o.by))*Math.min(1,dt*5);o.y=o.cy+Math.sin(o.t*6)*3}}}},
  ghost:{name:'유령',at:420,tip:'오르내리다 갑자기 다가와요',make:()=>({fx:P.createFx(FX.ghost,{x:0,y:0,hover:6,seed:rnd(99)}),by:GY,vx:12,ph:Math.random()*6,
    move:(o,dt)=>{o.y=o.by-(0.5-0.5*Math.cos(o.t*1.6+o.ph))*62;const dash=(o.t%2.2)>1.6;o.vx=dash?90:12}})},
  butterfly:{name:'나비',at:60,tip:'낮게 팔랑팔랑 날아요. 길게 눌러 높이 뛰어요',make:()=>({fx:P.createFx(FX.butterfly,{x:0,y:0,seed:rnd(99)}),by:GY-20,vx:10,ph:Math.random()*6,
    move:(o,dt)=>{o.y=o.by+Math.sin(o.t*2.2+o.ph)*3}})},
  iceslime:{name:'얼음 슬라임',at:130,tip:'미끄러지듯 빠르게 와요. 일찍 뛰어요',make:()=>({fx:P.createFx(FX.slime,{x:0,y:0,hop:0,seed:rnd(99),palette:['#06131f','#0d3050','#1d5f8f','#3d97c8','#7ccdf0','#c4f0ff','#ffffff']}),by:GY,vx:62})},
  eyeball:{name:'눈알 괴물',at:280,tip:'멈칫 노려보다가 갑자기 돌진해요',make:()=>({fx:P.createFx(FX.eyeball,{x:0,y:0,hover:10,seed:rnd(99)}),by:GY,vx:14,
    move:(o,dt)=>{if(o.x<HX+175&&!o.go){o.wait=(o.wait||0)+dt;o.vx=-8;o.y=o.by+Math.sin(o.t*40)*1.2;if(o.wait>0.45)o.go=1}else if(o.go){o.vx=130;o.y=o.by}}})},
  skull:{name:'불꽃 해골',at:470,tip:'불꽃을 달고 빠르게 날아와요. 뛰지 말고 그냥 달려요',make:()=>({fx:P.createFx(FX.skull,{x:0,y:0,hover:74,floor:false,seed:rnd(99)}),by:GY,vx:75})},
  wisp:{name:'도깨비불',at:520,tip:'높았다 낮았다, 빨랐다 느렸다 해요',make:()=>({fx:P.createFx(FX.wisp,{x:0,y:0,hover:8,seed:rnd(99)}),by:GY-4,ph:Math.random()*6,
    move:(o,dt)=>{const s=Math.sin(o.t*2.4+o.ph);o.ty=s>0?58:0;o.y+=((o.by-o.ty)-o.y)*Math.min(1,dt*7);o.vx=s>0?20:70}})},
};

function addMon(type,dx=0){const m=MON[type],o=Object.assign({type,x:W+30+dx,t:0,vx:0},m.make());o.y=o.by;obs.push(o);
  if(!met.has(type)&&m.at>0){met.add(type);toast(`${Math.floor(dist)}m · 새 몬스터 <b>${m.name}</b>! ${m.tip}`)}else met.add(type);return o}
const VX={frog:38,snake:20,bird:40,ghost:90,wisp:70,butterfly:10,iceslime:62,eyeball:130,skull:75};
function pickGroup(d,R){
  const pool=Object.keys(MON).filter(k=>MON[k].at<=d);
  const w=pool.map(k=>1+Math.max(0,1.5-(d-MON[k].at)/120));let r=R()*w.reduce((a,b)=>a+b,0),pick=pool[0];
  for(let i=0;i<pool.length;i++){r-=w[i];if(r<=0){pick=pool[i];break}}
  if(d>200&&R()<Math.min(0.35,(d-200)/800)){const c=(R()*3)|0;
    if(c===0)return[['slime',0],['bat','B']];if(c===1)return[['slime',0],['slime',32]];return[['frog',0],['frog',70]]}
  return[[pick,0]];
}
function gapAfter(d,sp,group,R){const lvl=Math.min(1,d/700),vxMax=Math.max(0,...group.map(g=>VX[g[0]]||0));
  return Math.max(170,sp*(2.3-lvl*0.7))+R()*(170-lvl*60)+vxMax*1.2}
function spawnObs(){const g=pickGroup(dist,Math.random);g.forEach(([k,dx])=>addMon(k,dx==='B'?speed*1.5:dx));nextObs=gapAfter(dist,speed,g,Math.random)}
// 부딪힘 판정: 몬스터가 실제로 그려진 픽셀이 캐릭터 몸과 겹치면 부딪힌 거예요
let HF;
function pixHit(o,hx0,hy0){
  if(Math.abs(o.x-HX)>90)return false;HF.ox=hx0;HF.oy=Math.round(hy0);P.clearFrame(HF);
  o.fx.options.x=Math.round(o.x);o.fx.options.y=Math.round(o.y);o.fx.draw(HF,'back');o.fx.draw(HF,'front');
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
  asking={g,res:null};const q=g.q;qAll++;
  $('rgQuiz').innerHTML=`<div class="qk">❓ 퀴즈 문${q.review?' · 오답 복습':''} · ${q.kind==='sd'?'속담':'맞춤법'}</div>
    <div class="qs">${esc(q.s).replace('___','<u>&nbsp;?&nbsp;</u>')}</div>
    <div class="qo"><button type="button" id="rgQa0">${esc(q.opts[0])}</button><button type="button" id="rgQa1">${esc(q.opts[1])}</button></div>
    <div class="qf" id="rgQf"></div><div class="qh">키보드: ← / → (또는 1 / 2)</div>`;
  $('rgQuiz').classList.remove('rg-hidden');
  $('rgQa0').onclick=e=>{e.stopPropagation();answer(0)};$('rgQa1').onclick=e=>{e.stopPropagation();answer(1)};
}
function answer(i){
  if(!asking||asking.res)return;const g=asking.g,q=g.q,ok=q.opts[i]===q.ans;asking.res=ok?'ok':'ng';g.ok=ok;
  $('rgQa'+i).classList.add(ok?'ok':'ng');if(!ok)$('rgQa'+(1-i)).classList.add('ok');
  if(ok){qRight++;$('rgQf').innerHTML='정답! '+(mode==='race'?'🚀 잠깐 빨라져요':hearts<3?'❤️ 하트 1개 회복':'🪙 코인 +1');
    if(mode==='race')hero.boost=1.6;else if(hearts<3)hearts++;else coins++;
    fx(FX.burst,{x:g.x,y:GY-40,light:0.9},false).scroll=1}
  else{$('rgQf').innerHTML=`땡! 정답은 <b>${esc(q.ans)}</b>${q.e?' — '+q.e:''}`+(mode==='race'?` <b style="color:#e03131">벌점 +${host.cfg().pen}초</b>`:'');
    if(mode==='race')mePen+=host.cfg().pen;else wrongs.push(q)}
  if(mode==='solo')host.markQ(q,ok);
  asking.wait=ok?0.7:1.9;hud();if(mode==='race')sendNow=true;
}
function gateStep(dt,dx){
  gates.forEach(g=>{g.x-=dx;if(!g.state&&g.x-HX<30){g.state='asked';ask(g)}});gates=gates.filter(g=>g.x>-40);
  if(asking&&asking.res){asking.wait-=dt;if(asking.wait<=0){$('rgQuiz').classList.add('rg-hidden');asking.g.state='done';asking=null}}
}
function drawGates(){
  for(const g of gates){const x=Math.round(g.x);if(x<-30||x>W+30)continue;const open=g.state==='done',lift=open?Math.min(18,(g.lift=(g.lift||0)+1.2)):0;
    ctx.fillStyle='#7b5a3a';ctx.fillRect(x-16,GY-50,4,50);ctx.fillRect(x+12,GY-50,4,50);
    ctx.fillStyle=open?(g.ok?'#2f9e44':'#e03131'):'#f08c00';ctx.fillRect(x-18,GY-58-lift,36,12);
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(open?(g.ok?'O':'X'):'?',x,GY-49-lift);ctx.textAlign='left';
    if(!open){ctx.fillStyle='rgba(255,220,120,.35)';ctx.fillRect(x-12,GY-46,24,46)}}
}

// ══ 친구들과 대결 ══
// 선생님이 연 대결(rid, seed)마다 모두 같은 코스: 같은 몬스터·코인·퀴즈 문(100·200·300·400m)과 같은 문제
function makeCourse(seed){
  const R=rng(seed),mons=[],cns=[],gts=[];let x=540;
  for(let k=1;k<=4;k++)gts.push({x:Math.round(k*FIN/5),q:host.pickQ(R,false)});   // 퀴즈 문 4개를 고르게
  while(x<FIN-160){
    const d=x/PXM,tt=(-100+Math.sqrt(10000+3.6*x))/1.8,sp=baseSpeed(tt);
    const g=pickGroup(d,R);g.forEach(([k,dx])=>mons.push({x:x+(dx==='B'?sp*1.5:dx),type:k,sd:(R()*1e9)|0}));
    const gap=gapAfter(d,sp,g,R);
    if(R()<0.7)coinGroup(x+gap*0.5-30,R).forEach(c=>cns.push(c));
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
  mode='race';state='lobby';clearWorld();rid=rs.rid;FIN_M=Math.max(200,+rs.len||500);FIN=FIN_M*PXM;course=makeCourse(rs.seed);ci=0;cci=0;gci=0;meX=0;raceT=0;meDone=false;meTime=0;resultShown=false;ghosts={};
  $('rgTrack').classList.remove('rg-hidden');hud();
  host.raceJoin(rid).catch(()=>{toast('대결에 들어가지 못했어요. 새로 고쳐 주세요.')});
  lobbyBox();
}
function lobbyBox(){
  const ps=host.racePlayers(rid),c=host.cfg();
  showBox(`<h2>👫 대결 대기실</h2><p>🏁 ${FIN_M}m 달리기 · 선생님이 "출발"을 누르면 3·2·1 다 같이 시작해요. 🪙 코인을 먹으면 잠깐 빨라져요!</p><p><span class="rg-tickets">🏆 ${prizeLine(c.prize)}</span></p>
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
  while(ci<course.mons.length&&course.mons[ci].x-meX<=W+30-HX){const e=course.mons[ci++];withSeed(e.sd,()=>addMon(e.type,(e.x-meX)-(W+30-HX)))}
  while(cci<course.cns.length&&course.cns[cci][0]-meX<=W+20-HX){const c=course.cns[cci++];addCoin(HX+(c[0]-meX),c[1])}
  while(gci<course.gts.length&&course.gts[gci].x-meX<=W+40-HX){const g=course.gts[gci++];gates.push({x:HX+(g.x-meX),q:g.q})}
}
function raceSend(dt){
  sendT-=dt;if(!sendNow&&sendT>0)return;sendT=0.3;sendNow=false;
  host.raceSend(rid,{x:Math.round(meX),y:Math.round(hero.y),s:hero.stun>0||hero.hurtT<0.6?1:0,q:asking?1:0,pen:mePen,ok:qRight,...(meDone?{done:true,tm:Math.round(meTime*100)/100}:{})}).catch(()=>{});
}
function meFinish(){meDone=true;meTime=raceT;overT=0;sendNow=true;raceSend(0);
  const myRec=meTime+mePen,better=host.racePlayers(rid).filter(p=>!p.me&&p.done&&p.tm+(p.pen||0)<myRec).length;newBest=better<3;
  if(newBest){fx(FX.confetti,{x:60,y:GY},false);fx(FX.confetti,{x:180,y:GY,seed:5},false)}
  hud();setTimeout(()=>{if(state==='race')showResult()},1500)}
function showResult(){
  resultShown=true;state='result';const N=course.gts.length,c=host.cfg();
  const ps=host.racePlayers(rid).map(p=>p.me?Object.assign({},p,{done:true,tm:meTime,pen:mePen,ok:qRight}):p);
  const fin=ps.filter(p=>p.done).map(p=>Object.assign({},p,{rec:p.tm+(p.pen||0)})).sort((a,b)=>a.rec-b.rec),run=ps.filter(p=>!p.done).sort((a,b)=>(b.x||0)-(a.x||0));
  const medal=['🥇','🥈','🥉'],myRank=fin.findIndex(r=>r.me)+1,myPrize=c.prize[myRank-1]||0;
  showBox(`<h2>${myRank}등${myPrize?` · 🪙 +${myPrize}`:''}${run.length?' <span style="font-size:13px;color:#868e96">(친구들이 들어오는 중)</span>':''}</h2>
  <table class="rg-rank"><tr style="color:#868e96"><td></td><td>이름</td><td>기록</td><td>정답</td><td>보상</td></tr>${fin.map((r,i)=>`<tr class="${r.me?'rg-me':''}"><td>${medal[i]||(i+1)+'등'}</td><td>${esc(r.me?'나':r.n)}</td>
    <td>${r.rec.toFixed(1)}초${r.pen?` <span style="color:#e03131;font-size:11px">(+${r.pen})</span>`:''}</td><td>${r.ok||0}/${N}${(r.ok||0)===N?' 🎯':''}</td><td>${c.prize[i]?'🪙+'+c.prize[i]:''}</td></tr>`).join('')}
    ${run.map(r=>`<tr><td>-</td><td>${esc(r.n)}</td><td>달리는 중</td><td></td><td></td></tr>`).join('')}</table>
  <p class="tip">기록 = 도착 시간 + 틀린 문제마다 ${c.pen}초 · 🎯 모두 맞힘 · 보상은 선생님이 대결을 마치면 지갑에 들어가요</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);
  $('rgMenu').onclick=e=>{e.stopPropagation();menu()};
}
let resT=0;

// ── 배경 ──
const clouds=[[20,18,1],[110,12,0],[190,24,1],[150,30,0]];
function drawBg(){
  const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#9fd3ff');g.addColorStop(1,'#e6f6ff');ctx.fillStyle=g;ctx.fillRect(0,0,W,GY);
  // 구름
  ctx.fillStyle='#ffffff';clouds.forEach((c,i)=>{if(i>=3&&W<300)return;const cx=c[0]*W/240,x=((cx-scroll*0.08)%(W+60)+W+60)%(W+60)-40;const s=c[2]?1:0.8;
    ctx.fillRect(x,c[1],26*s,6);ctx.fillRect(x+5,c[1]-4,14*s,5);ctx.fillRect(x+3,c[1]+6,20*s,2)});
  // 먼 학교 건물
  const bx=((-scroll*0.2)%320+320)%320-80;
  for(let ox=bx;ox<W;ox+=320){ctx.fillStyle='#d9cdb8';ctx.fillRect(ox,GY-60,96,60);ctx.fillStyle='#c9b99f';ctx.fillRect(ox,GY-60,96,4);
    ctx.fillStyle='#9fc4e0';for(let r=0;r<3;r++)for(let cI=0;cI<7;cI++)ctx.fillRect(ox+6+cI*13,GY-52+r*14,8,8);
    ctx.fillStyle='#b9472f';ctx.fillRect(ox+40,GY-72,16,12);ctx.fillStyle='#fff';ctx.fillRect(ox+44,GY-69,8,6);ctx.fillStyle='#333';ctx.fillRect(ox+47,GY-68,1,3);ctx.fillRect(ox+47,GY-66,3,1)}
  // 나무
  const tx=((-scroll*0.5)%120+120)%120-40;
  for(let k=0;tx+k*120<W;k++){const x=tx+k*120;ctx.fillStyle='#7b5a3a';ctx.fillRect(x+9,GY-20,4,20);ctx.fillStyle='#4fa04a';ctx.fillRect(x,GY-40,22,22);ctx.fillRect(x+3,GY-46,16,6);ctx.fillStyle='#62b85a';ctx.fillRect(x+3,GY-38,8,6)}
  // 땅
  ctx.fillStyle='#5cae45';ctx.fillRect(0,GY,W,4);ctx.fillStyle='#4a9a38';ctx.fillRect(0,GY+4,W,1);
  ctx.fillStyle='#caa070';ctx.fillRect(0,GY+5,W,H-GY-5);ctx.fillStyle='#b68b5c';
  const px=((-scroll)%24+24)%24;for(let x=px-24;x<W;x+=24){ctx.fillRect(x,GY+10,3,2);ctx.fillRect(x+12,GY+16,2,2);ctx.fillRect(x+6,GY+20,4,1)}
}



// ── 캐릭터(나) 한 걸음 ──
function heroStep(dt,sp){
  const g=hero.vy<0?G:G*FALL_G;hero.vy+=g*dt;hero.y+=hero.vy*dt;hero.dj=Math.max(0,(hero.dj||0)-dt);
  if(hero.y>=GY){hero.hold=false;if(!hero.ground){hero.land=0.09;if(hero.vy>120)shake=Math.max(shake,0.05)}hero.y=GY;hero.vy=0;hero.ground=true;hero.jumps=0}
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
  obs.forEach(o=>{o.t+=dt;if(o.move)o.move(o,dt);o.x-=dx+(o.vx||0)*dt;o.fx.update(dt);
    if(!o.dead&&inv<=0&&pixHit(o,hx0,hy0)){o.dead=1;hit(o)}});
  obs=obs.filter(o=>o.x>-70&&!o.gone);
  items.forEach(c=>{c.x-=dx;c.fx.update(dt);
    const cy=c.y-19;if(!c.got&&Math.abs(c.x-HX)<11&&cy<hy1+4&&cy>hy0-4){c.got=1;coins++;hero.boost=Math.max(hero.boost,Math.min(1.2,hero.boost+0.25));fx(FX.burst,{x:c.x,y:c.y-10,light:0.8},false);hud()}});
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
    scT-=dt;hero.key=idleKey();$('rgCount').textContent=scT>0?Math.ceil(scT):'출발!';if(scT<=0){state='play';cntHide=0.7}
  }else if(state==='play'){
    if(cntHide>0){cntHide-=dt;if(cntHide<=0)$('rgCount').classList.add('rg-hidden')}
    if(!asking){t+=dt;hero.boost=Math.max(0,hero.boost-dt)}speed=baseSpeed(t)*(hero.boost>0?1.3:1);const dx=asking?0:speed*dt;scroll+=dx;dist+=dx/PXM;   // 코인을 먹으면 잠깐 빨라져요
    heroStep(dt,asking?0:speed);if(asking&&hero.ground)hero.key=idleKey();
    if(!asking){nextObs-=dx;if(nextObs<=0)spawnObs();
      nextCoin-=dt;if(nextCoin<=0){if(clearAhead(W+40))spawnCoins();else nextCoin=0.3}
      if(dist>=nextGateM&&!obs.some(o=>o.x>W-110)){gates.push({x:W+40,q:host.pickQ(Math.random,true)});nextGateM+=host.cfg().gateEvery;nextObs=Math.max(nextObs,260)}}
    gateStep(dt,dx);worldStep(dt,dx);
    if(Math.floor(dist)%5===0)hud();
  }else if(state==='lobby'){
    hero.key=idleKey();raceWatch();
  }else if(state==='count'){
    const left=(startLocal-host.now())/1000;$('rgCount').textContent=left>3?'준비!':left>0?Math.ceil(left):'출발!';hero.key=idleKey();
    if(left<=0&&state==='count'){state='race';raceT=Math.max(0,-left);sendNow=true}
    raceWatch();
  }else if(state==='race'||state==='result'){
    if(raceT>0.7&&!$('rgCount').classList.contains('rg-hidden'))$('rgCount').classList.add('rg-hidden');
    if(!meDone){
      raceT=Math.max(0,(host.now()-startLocal)/1000);
      speed=asking?0:baseSpeed(raceT)*(hero.stun>0?0.45:1)*(hero.boost>0?(hero.boost>1.25?1.45:1.3):1);const dx=speed*dt;meX+=dx;scroll+=dx;dist=meX/PXM;
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
  camY+=(Math.max(0,74-hero.y)-camY)*Math.min(1,dt*10);
  if(toastT>0){toastT-=dt;if(toastT<=0)$('rgToast').classList.remove('show')}
  shake=Math.max(0,shake-dt);
  fxs.forEach(e=>e.fx.update(dt));fxs=fxs.filter(e=>e.keep||!e.fx.done());
}
function hit(o){
  shake=0.25;hero.hurtT=0;
  fx(FX.blunt,{x:HX+4,y:hero.y-18,height:16,light:0.8},false);
  const p=fx(FX.poof,{x:o.x,y:o.y,light:0.5},false);p.scroll=1;o.gone=1;
  if(mode==='race'){hero.stun=1.0;inv=1.4;sendNow=true;return} // 대결: 탈락 없이 1초 비틀
  hearts--;inv=1.4;hud();if(hearts<=0)gameOver();
}
async function gameOver(){
  state='over';overT=0;cntHide=0;$('rgCount').classList.add('rg-hidden');const d=Math.floor(dist);
  let res={reward:0,best:host.best(),newBest:false,today:0};
  try{res=await host.soloEnd({dist:d,right:qRight,all:qAll,coins})}catch(e){}
  newBest=res.newBest;
  if(newBest){fx(FX.confetti,{x:60,y:GY},false);fx(FX.confetti,{x:180,y:GY,seed:5},false)}
  setTimeout(()=>{if(state!=='over')return;const c=host.cfg(),tl=host.ticketsLeft(),sb=host.soloBlock();
    showBox(`<h2>${newBest?'<span class="new">새 최고 기록!</span>':'수고했어요!'}</h2><p class="big">${d}m</p>
    <p>퀴즈 ${qRight}/${qAll} · 먹은 코인 ${coins}개 → 🪙 +${res.reward} <span style="color:#868e96;font-size:12px">${res.preview?'(학생이라면 받을 코인 · 지갑에는 안 들어가요)':`(오늘 ${res.today}/${c.coinMax})`}</span></p>
    ${res.reward<coins?`<p style="color:#868e96;font-size:12px">${res.why||''}</p>`:''}
    ${wrongs.length?`<p style="font-weight:700;margin-top:6px">📒 다시 보기</p><ul class="rg-wrongs">${wrongs.slice(0,3).map(q=>`<li>${esc(q.s).replace('___',`<b>${esc(q.ans)}</b>`)}</li>`).join('')}</ul>`:qAll?'<p>퀴즈 문을 모두 맞혔어요! 🎯</p>':''}
    <p class="tip">${sb?esc(sb):`남은 판 ${tl} · 화면을 누르거나 스페이스·Enter로 한 판 더`}</p><button type="button" class="rg-go sub" id="rgMenu">← 모드 고르기</button>`);$('rgMenu').onclick=e=>{e.stopPropagation();menu()}},700);
}

// ── 그리기 ──
function drawKey(key,x,y,alpha){
  const i=AT.keys.indexOf(key);if(i<0||!atlas)return;ctx.globalAlpha=alpha;
  ctx.drawImage(atlas,(i%AT.cols)*AT.w,Math.floor(i/AT.cols)*AT.h,AT.w,AT.h,Math.round(x)-42,Math.round(y)-80,AT.w,AT.h);ctx.globalAlpha=1;
}
function drawRunner(r,x,y,alpha,blink){
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x,GY+1-(r.lane||0),Math.max(4,10-(GY-r.y)/8),2.5,0,0,7);ctx.fill();
  if(blink)return;drawKey(r.key,x,y-(r.hop||0)-(r.lane||0),alpha);
}
function drawLines(){
  if(mode!=='race')return;
  for(const [wx,fin] of [[0,false],[FIN,true]]){const sx=Math.round(wx-meX+HX);if(sx<-10||sx>W+10)continue;
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
  ctx.fillStyle='#9fd3ff';ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(sx,sy+Math.round(camY));drawBg();drawLines();drawGates();
  P.clearFrame(fB);P.clearFrame(fF);
  items.forEach(c=>{c.fx.options.x=Math.round(c.x);c.fx.options.y=Math.round(c.y);c.fx.draw(fF,'front')});
  obs.forEach(o=>{o.fx.options.x=Math.round(o.x);o.fx.options.y=Math.round(o.y);o.fx.draw(fB,'back');o.fx.draw(fF,'front')});
  fxs.forEach(e=>{e.fx.draw(fB,'back');e.fx.draw(fF,'front')});
  P.composite(fB,LB.d.data,null);LB.x.putImageData(LB.d,0,0);P.composite(fF,LF.d.data,null);LF.x.putImageData(LF.d,0,0);
  ctx.drawImage(LB.c,0,0);ctx.drawImage(LF.c,0,0);
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
  if(!visible()||!atlas)return;update(dt);render(dt)}

// ── 붙이기 / 떼기 ──
function mount(el,h){
  if(mounted)unmount();
  P=window.PFX;FX=P.fx;host=h;root=el;
  if(!document.getElementById('rgStyle')){const st=document.createElement('style');st.id='rgStyle';st.textContent=CSS;document.head.appendChild(st)}
  el.innerHTML=HTML;cv=$('rgC');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  fB=null;HF=P.createFrame(14,44);
  AT=window.RUN_ATLAS;const im=new Image();im.onload=()=>{atlas=im};im.src=AT.src;
  const gm=$('rgGame');
  gm.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();gm.focus({preventScroll:true});press()});
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
function refresh(){if(!mounted)return;if(state==='menu')menu();else if(state==='lobby')lobbyBox()}
window.RunGame={mount,unmount,refresh,get state(){return state},get mounted(){return mounted&&root&&root.isConnected},
  _t:{answer,press,release,get asking(){return asking},get obs(){return obs},get hero(){return hero},setHearts:v=>hearts=v,get hearts(){return hearts},setT:v=>t=v,setCoins:v=>coins=v,spawn:k=>addMon(k),setDist:v=>dist=v,noSpawn:keepGate=>{nextObs=1e9;nextCoin=1e9;if(!keepGate)nextGateM=1e9},get meX(){return meX}}};
})();
