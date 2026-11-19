/* ---------- 토의방 사진·동영상 (rooms.js 다음, app.js보다 먼저 불러와요) ----------
   rcover/방id        {k 방장, d 대표 사진(data URL 640×320), t, ok:false = 선생님 확인 전}
   rmeta/방id/말id    {k, kind img|vid, th 작은 그림, w, h, dur 초, mime, size, t, ok:false = 확인 전, fl{학번: 알린 시각}}
   rblob/말id         {k, rid, kind, mime, c{0..9} 원본 조각(base64)}  ← 누를 때만 내려받아요
   rsize/말id         = 저장 크기 (저장 공간 합계용)
   말(rooms/msgs)에는 md=말id, mk=img|vid 가 붙어요. 사진·동영상의 id는 말 id와 같아요.
   config roomPhoto=false 사진 끔 · roomVideo=false 동영상 끔 · roomReview=true 학생 것은 선생님 확인 뒤 보여요

   개인정보 보호
   - 올리기 전에 얼굴·이름표·주소·전화번호를 확인하는 체크를 해야 올라가요.
   - 기기에서 다시 그려 저장해서 위치 정보(GPS) 같은 숨은 정보가 사라져요.
   - 로그인한 우리 반만 볼 수 있고, 주소(링크)로 따로 퍼 갈 수 없어요.
   - 길게 눌러 저장·내려받기 버튼·끌어 옮기기를 막아요. (화면 캡처까지 막을 수는 없어요)
   - 크게 볼 때 '우리 반만 봐요' 표시가 겹쳐 보여요.
   - 선생님 확인 후 공개, 친구가 '선생님께 알리기', 선생님이 가리기·지우기, 끝난 방 한꺼번에 지우기 */
const MD_CAP=500*1024*1024,MD_VMAX=60,MD_CHUNK=600000,MD_CHUNKS=10,MD_TH=60000,MD_IMG=MD_CHUNK;
let RCOVER={},RMETA={},RSIZE={},mdSubs=[],mdKey="",mdRoom=null,mdRef=null,MDA=null,MDCOVER=null,mdBusy=false,mdMsg="";
const MDC=new Map();   // 내려받은 원본 (말id → 주소), 이 화면에서만 써요
const mdCfg=()=>({photo:CFG.roomPhoto!==false,video:CFG.roomVideo!==false,review:CFG.roomReview===true});
const mdMeta=(rid,mid)=>((RMETA[rid]||{})[mid])||null;
const mdUsed=()=>Object.values(RSIZE||{}).reduce((a,b)=>a+(+b||0),0);
const mdMB=n=>(n/1048576).toFixed(n<10485760?1:0)+"MB";
const mdDur=s=>{s=Math.round(+s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
const mdKindTxt=k=>k==="vid"?"동영상":"사진";
const mdHold=()=>!!(MDA||mdBusy);

/* ---------- 데이터 듣기 ---------- */
function mdWatch(){
  const key=(role||"")+":"+(KEY||"");
  // 로그아웃·다시 연결로 듣기가 모두 꺼졌으면(offAll) 다시 들어요
  const alive=mdSubs.length&&typeof subs!=="undefined"&&mdSubs.every(r=>subs.includes(r));
  if(key!==mdKey||!alive){
    if(key!==mdKey){MDA=null;MDCOVER=null}
    mdKey=key;RCOVER={};RMETA={};RSIZE={};mdRoom=null;if(mdRef)try{mdRef.off()}catch(e){}mdRef=null;mdSubs=[];
    if(!role)return;
    const sub=(ref,fn)=>{on(ref,fn);mdSubs.push(subs[subs.length-1])};
    sub(R("rcover"),s=>{RCOVER=s.val()||{};mdLive()});
    sub(R("rsize"),s=>{RSIZE=s.val()||{}});
    if(role==="teacher")sub(R("rmeta"),s=>{RMETA=s.val()||{};if(typeof renderBell==="function")renderBell();mdLive()});
  }
  if(role!=="teacher"){   // 학생은 열어 본 방의 사진·동영상만 받아요
    const want=openRoom||null;
    if(want!==mdRoom){
      if(mdRef)try{mdRef.off()}catch(e){}
      mdRoom=want;RMETA={};mdRef=null;
      if(want){mdRef=R("rmeta/"+want);mdRef.on("value",s=>{if(mdRoom===want){RMETA={[want]:s.val()||{}};mdLive()}},e=>console.warn(e));subs.push(mdRef)}
    }
  }
}
function mdLive(){if(typeof current!=="undefined"&&current==="rooms"&&typeof roomsLive==="function")roomsLive();else if(role==="teacher"&&current==="rooms")rerender()}

/* ---------- 그림 줄이기 ---------- */
function mdLoadImg(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>ok({im,u,w:im.naturalWidth,h:im.naturalHeight});
  im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("이 사진을 열 수 없어요. JPG나 PNG 사진을 골라 주세요."))};im.src=u})}
function mdJpeg(src,sw,sh,max,q,crop){
  let w,h,sx=0,sy=0,cw=sw,ch=sh;
  if(crop){const [tw,th]=crop,s=Math.max(tw/sw,th/sh);cw=tw/s;ch=th/s;sx=(sw-cw)/2;sy=(sh-ch)/2;w=tw;h=th}
  else{const s=Math.min(1,max/Math.max(sw,sh));w=Math.max(1,Math.round(sw*s));h=Math.max(1,Math.round(sh*s))}
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");
  x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(src,sx,sy,cw,ch,0,0,w,h);   // 다시 그리면 위치 정보 같은 숨은 정보가 사라져요
  return {d:c.toDataURL("image/jpeg",q),w,h};
}
function mdFit(src,sw,sh,max,lim,crop){
  let q=0.82,r;
  for(let i=0;i<8;i++){r=mdJpeg(src,sw,sh,max,q,crop);if(r.d.length<=lim)return r;q-=0.12;if(q<0.4){max=Math.round(max*0.8);if(crop)crop=[Math.round(crop[0]*0.8),Math.round(crop[1]*0.8)];q=0.7}}
  return r;
}
const mdB64=d=>d.slice(d.indexOf(",")+1);
function mdBlobB64(b){return new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(mdB64(fr.result));fr.onerror=()=>no(new Error("파일을 읽지 못했어요."));fr.readAsDataURL(b)})}

/* ---------- 동영상 줄이기: 기기에서 다시 녹화해요 (최대 1분, 긴 쪽 640px) ---------- */
const mdCanVideo=()=>!!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream);
function mdVidEl(file){return new Promise((ok,no)=>{const v=document.createElement("video"),u=URL.createObjectURL(file);
  v.preload="auto";v.playsInline=true;v.setAttribute("playsinline","");v.muted=false;
  v.style.cssText="position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";v.setAttribute("aria-hidden","true");document.body.appendChild(v);
  v.onloadedmetadata=()=>ok({v,u});v.onerror=()=>{URL.revokeObjectURL(u);v.remove();no(new Error("이 동영상을 열 수 없어요. 휴대폰으로 찍은 MP4·MOV 영상을 골라 주세요."))};v.src=u})}
function mdSeek(v,t){return new Promise(ok=>{const f=()=>{v.removeEventListener("seeked",f);ok()};v.addEventListener("seeked",f);v.currentTime=t;setTimeout(f,3000)})}
async function mdShrink(v,dur,onp){
  const sc=Math.min(1,640/Math.max(v.videoWidth||640,v.videoHeight||360));
  const W=Math.max(2,Math.round((v.videoWidth||640)*sc/2)*2),H=Math.max(2,Math.round((v.videoHeight||360)*sc/2)*2);
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,W,H);
  const vs=c.captureStream(24),tracks=[...vs.getVideoTracks()];
  let ac=null;
  try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();const src=ac.createMediaElementSource(v),dst=ac.createMediaStreamDestination();src.connect(dst);tracks.push(...dst.stream.getAudioTracks());ac.resume&&ac.resume()}catch(e){ac=null}
  const types=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4;codecs=avc1,mp4a.40.2","video/mp4","video/webm;codecs=vp8,opus","video/webm"];
  const mime=types.find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}})||"";
  const vbps=Math.max(200000,Math.min(380000,Math.floor(3.1e6*8/Math.max(dur,1))-48000));
  const rec=new MediaRecorder(new MediaStream(tracks),{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:vbps,audioBitsPerSecond:48000});
  const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  const done=new Promise(ok=>rec.onstop=ok);
  await mdSeek(v,0);
  let stop=false,last=-1;
  const draw=()=>{if(stop)return;x.drawImage(v,0,0,W,H);const t=v.currentTime;if(t!==last){last=t;onp&&onp(Math.min(99,Math.round(t/dur*100)))}
    if(t>=dur-0.05||v.ended){finish();return}
    if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(draw);else requestAnimationFrame(draw)};
  const finish=()=>{if(stop)return;stop=true;try{v.pause()}catch(e){}setTimeout(()=>{try{rec.stop()}catch(e){}},120)};
  v.onended=finish;
  rec.start(1000);
  try{await v.play()}catch(e){stop=true;try{rec.stop()}catch(_){}if(ac)ac.close();throw new Error("동영상을 재생하지 못했어요. 화면을 한 번 누르고 다시 올려 주세요.")}
  draw();
  await done;if(ac)try{ac.close()}catch(e){}
  const type=(rec.mimeType||mime||"video/webm").split(";")[0];
  return {blob:new Blob(parts,{type}),mime:type,w:W,h:H};
}

/* ---------- 고르기 ---------- */
async function mdPick(file,kind){
  if(!file||mdBusy)return;mdMsg="";if(MDA)mdClear();
  const C=mdCfg();
  if(kind==="img"&&!/^image\//.test(file.type||"image/"))return mdErr("사진 파일을 골라 주세요.");
  if(kind==="vid"&&!/^video\//.test(file.type||"video/"))return mdErr("동영상 파일을 골라 주세요.");
  if(kind==="img"&&!C.photo&&role!=="teacher")return mdErr("선생님이 사진 올리기를 꺼 두었어요.");
  if(kind==="vid"&&!C.video&&role!=="teacher")return mdErr("선생님이 동영상 올리기를 꺼 두었어요.");
  if(file.size>(kind==="vid"?400:40)*1048576)return mdErr(kind==="vid"?"동영상 파일이 너무 커요 (400MB까지).":"사진 파일이 너무 커요 (40MB까지).");
  if(kind==="vid"&&!mdCanVideo())return mdErr("이 기기에서는 동영상을 줄일 수 없어요. 크롬이나 사파리 최신 버전에서 올려 주세요.");
  MDA={kind,file,step:"prep",ok:false};mdRedraw();
  try{
    if(kind==="img"){
      const {im,u,w,h}=await mdLoadImg(file);
      const th=mdFit(im,w,h,360,MD_TH);URL.revokeObjectURL(u);
      MDA={kind,file,th:th.d,w,h,step:"pick",ok:false};
    }else{
      const {v,u}=await mdVidEl(file);
      let dur=v.duration;if(!isFinite(dur)||dur<=0){await mdSeek(v,1e6);dur=v.currentTime||MD_VMAX;await mdSeek(v,0)}
      await mdSeek(v,Math.min(0.5,dur/2));
      const th=mdFit(v,v.videoWidth||640,v.videoHeight||360,360,MD_TH);
      MDA={kind,file,v,u,th:th.d,dur:Math.min(dur,MD_VMAX),full:dur,step:"pick",ok:false};
    }
  }catch(e){MDA=null;return mdErr(e.message||"파일을 열지 못했어요.")}
  mdRedraw();
}
function mdErr(t){mdMsg=t;MDA=null;mdRedraw()}
function mdClear(){if(MDA){if(MDA.v)try{MDA.v.pause();MDA.v.remove()}catch(e){}if(MDA.u)try{URL.revokeObjectURL(MDA.u)}catch(e){}}MDA=null;mdBusy=false}
function mdRedraw(){const b=$("#mdBox");if(b){b.outerHTML=mdBoxHtml(openRoom&&rRoom(openRoom));mdBindBox()}else if(typeof renderRooms==="function")renderRooms();const tx=$("#rmText");if(tx)tx.placeholder=MDA?"사진·동영상 설명 (안 써도 돼요)":"고운 말로 내 생각을 적어요";const g=$("#rmGo");if(g&&!mdBusy)g.textContent=MDA?"올리기":(rRoom(openRoom)||{}).type==="idea"?"붙이기":"보내기"}

/* ---------- 보내기 ---------- */
async function mdUpload(rid,kind,b64,mime,meta){
  const mid=R(`rooms/msgs/${rid}`).push().key,k=rmK(),c={};
  for(let i=0;i*MD_CHUNK<b64.length;i++)c[i]=b64.slice(i*MD_CHUNK,(i+1)*MD_CHUNK);
  if(Object.keys(c).length>MD_CHUNKS)throw new Error(kind==="vid"?"동영상이 너무 커요. 더 짧은 영상을 골라 주세요.":"사진이 너무 커요.");
  const size=b64.length+(meta.th||"").length;
  if(mdUsed()+size>MD_CAP)throw new Error("사진·동영상 저장 공간이 꽉 찼어요. 선생님께 알려 주세요.");
  await R("rblob/"+mid).set({k,rid,kind,mime,c});
  const rv=role!=="teacher"&&mdCfg().review;
  await R(`rmeta/${rid}/${mid}`).set({k,kind,mime,size,t:SV.TIMESTAMP,...meta,...(rv?{ok:false}:{})});
  await R("rsize/"+mid).set(size);
  return mid;
}
/* rooms.js의 보내기에서 불러요. 말(글)과 함께 올려요 */
async function mdSend(rid,makeMsg){
  const a=MDA,st=$("#mdState");if(!a||a.step!=="pick"||mdBusy)return;
  if(!a.ok){if(st)st.textContent="위의 약속을 확인하고 '모두 확인했어요'에 표시해 주세요.";const c=$("#mdOk");if(c)c.focus();return}
  const say=t=>{const s=$("#mdState");if(s)s.textContent=t};
  mdBusy=true;a.step="work";const g=$("#rmGo");if(g){g.disabled=true;g.textContent="올리는 중…"}
  try{
    let mid;
    if(a.kind==="img"){
      say("사진을 알맞은 크기로 줄이는 중…");
      const {im,u,w,h}=await mdLoadImg(a.file);const full=mdFit(im,w,h,1280,MD_IMG);URL.revokeObjectURL(u);
      say("올리는 중…");
      mid=await mdUpload(rid,"img",mdB64(full.d),"image/jpeg",{th:a.th,w:full.w,h:full.h});
    }else{
      say(`동영상을 작게 줄이는 중… 0% · 다 될 때까지 이 화면을 켜 두세요${a.full>MD_VMAX?" (앞 1분만 올라가요)":""}`);
      const out=await mdShrink(a.v,a.dur,p=>{a.pct=p;say(`동영상을 작게 줄이는 중… ${p}% · 다 될 때까지 이 화면을 켜 두세요`)});
      if(!out.blob.size)throw new Error("동영상을 줄이지 못했어요. 다른 영상으로 해 볼까요?");
      say("올리는 중…");
      mid=await mdUpload(rid,"vid",await mdBlobB64(out.blob),out.mime,{th:a.th,w:out.w,h:out.h,dur:Math.round(a.dur)});
    }
    await makeMsg(mid,a.kind);
    mdClear();return true;
  }catch(e){
    mdBusy=false;if(MDA)MDA.step="pick";const m=e&&e.code?(typeof authMsg==="function"?authMsg(e):e.message):(e&&e.message)||"올리지 못했어요.";
    say(m);const b=$("#rmGo");if(b){b.disabled=false;b.textContent="올리기"}return false;
  }
}

/* ---------- 화면 조각 ---------- */
function mdTools(r){   // 보내기 칸 위 버튼
  const C=mdCfg(),T=role==="teacher",ph=T||C.photo,vd=T||C.video;
  if(!ph&&!vd)return "";
  return `<div class="md-tools">
    ${ph?`<button type="button" class="ghost md-add" data-mdpick="img" ${MDA?"disabled":""}>📷 사진</button>`:""}
    ${vd?`<button type="button" class="ghost md-add" data-mdpick="vid" ${MDA?"disabled":""}>🎬 동영상 <small>(1분까지)</small></button>`:""}
    <input type="file" id="mdFileImg" accept="image/*" hidden><input type="file" id="mdFileVid" accept="video/*" hidden>
  </div>`;
}
function mdBoxHtml(r){
  const a=MDA,C=mdCfg();
  if(!a)return `<div id="mdBox">${mdMsg?`<p class="msg md-err" role="alert">${esc(mdMsg)}</p>`:""}</div>`;
  if(a.step==="prep")return `<div id="mdBox" class="md-att"><p class="md-state">${a.kind==="vid"?"동영상":"사진"}을 여는 중…</p></div>`;
  const work=a.step==="work";
  return `<div id="mdBox" class="md-att">
    <div class="md-prev"><img src="${esc(a.th)}" alt="고른 ${mdKindTxt(a.kind)} 미리 보기" draggable="false">${a.kind==="vid"?`<span class="md-play">▶ ${mdDur(a.dur)}</span>`:""}</div>
    <div class="md-check">
      <b>🔒 올리기 전에 확인해요</b>
      <ul>
        <li>얼굴이 크게 나오지 않나요? 친구가 나오면 꼭 먼저 허락을 받아요.</li>
        <li>이름표, 학교 이름, 집 주소, 전화번호, 차 번호판이 보이지 않나요?</li>
        <li>우리 반만 보는 곳이지만, 밖으로 퍼지면 곤란한 것은 올리지 않아요.</li>
      </ul>
      <label class="inline md-okl" for="mdOk"><input type="checkbox" id="mdOk" ${a.ok?"checked":""} ${work?"disabled":""}> 모두 확인했어요</label>
      <small>위치 정보 같은 숨은 정보는 자동으로 지워져요.${a.kind==="vid"&&a.full>MD_VMAX?" 1분이 넘는 영상은 앞 1분만 올라가요.":""}${role!=="teacher"&&C.review?" 선생님이 확인한 뒤에 친구들에게 보여요.":""} 아래 칸에 설명을 적어도 돼요.</small>
      <p class="md-state" id="mdState" role="status">${work&&a.pct!=null?`동영상을 작게 줄이는 중… ${a.pct}%`:work?"올리는 중…":""}</p>
      ${work?"":`<button type="button" class="link" id="mdX">빼기</button>`}
    </div>
  </div>`;
}
function mdMsgHtml(r,m){
  if(!m.md)return "";
  const x=mdMeta(r.id,m.md),T=role==="teacher";
  if(!x)return `<div class="rm-media none">${m.mk==="vid"?"🎬":"📷"} ${RMETA[r.id]?`지워진 ${mdKindTxt(m.mk)}이에요.`:"불러오는 중…"}</div>`;
  const mine=x.k===rmK(),fl=Object.keys(x.fl||{}).length,wait=x.ok===false,vid=x.kind==="vid";
  if(wait&&!T&&!mine)return `<div class="rm-media none">🔒 선생님이 확인하고 있는 ${mdKindTxt(x.kind)}이에요.</div>`;
  return `<div class="rm-media ${wait?"wait":""}">
    <button type="button" class="rm-thumb" data-mdopen="${esc(m.md)}" aria-label="${vid?`동영상 보기 (${mdDur(x.dur)})`:"사진 크게 보기"}"><img src="${esc(x.th||"")}" alt="" draggable="false">${vid?`<span class="md-play">▶ ${mdDur(x.dur)}</span>`:""}</button>
    ${wait?`<small class="md-note">${T?"🔒 학생이 올린 것이에요. 확인하고 보이게 해 주세요.":"🔒 선생님이 확인하면 친구들에게 보여요."}</small>`:""}
    <div class="md-acts">
      ${T&&wait?`<button type="button" class="link" data-mdok="${esc(r.id)}|${esc(m.md)}">확인했어요 · 보이기</button>`:""}
      ${T&&fl?`<span class="rchip c-con">⚑ 알림 ${fl}</span><button type="button" class="link" data-mdflx="${esc(r.id)}|${esc(m.md)}">알림 지우기</button>`:""}
      ${!T&&!mine&&!wait?(x.fl&&x.fl[KEY]?`<span class="lbl">⚑ 선생님께 알렸어요</span>`:`<button type="button" class="link" data-mdfl="${esc(r.id)}|${esc(m.md)}">⚑ 선생님께 알리기</button>`):""}
    </div>
  </div>`;
}
function mdCoverOk(c){return c&&c.d&&(c.ok!==false||role==="teacher"||c.k===rmK())}
function mdCardCover(r){const c=RCOVER[r.id];if(!mdCoverOk(c))return "";
  return `<span class="rc-cover"><img src="${esc(c.d)}" alt="" draggable="false" loading="lazy">${c.ok===false?`<em>🔒 선생님 확인 중</em>`:""}</span>`}
function mdHeadCover(r){
  const c=RCOVER[r.id],T=role==="teacher",own=r.k===rmK(),C=mdCfg(),can=!r.closed&&(T||(own&&C.photo));
  const img=mdCoverOk(c)?`<div class="rm-cover"><img src="${esc(c.d)}" alt="" draggable="false">${c.ok===false?`<em>🔒 선생님 확인 중</em>`:""}</div>`:"";
  return `${img}${can||(T&&c)?`<div class="actions md-cv">
    ${can?`<button type="button" class="ghost" id="mdCvPick">${c?"대표 사진 바꾸기":"🖼️ 대표 사진 올리기"}</button><input type="file" id="mdCvFile" accept="image/*" hidden>`:""}
    ${c&&(T||own)?`<button type="button" class="link" id="mdCvDel">대표 사진 빼기</button>`:""}
    ${T&&c&&c.ok===false?`<button type="button" class="link" id="mdCvOk">확인했어요 · 보이기</button>`:""}
  </div>`:""}`;
}
function mdMakeHtml(){   // 방 만들기 칸
  const C=mdCfg();if(role!=="teacher"&&!C.photo)return "";
  return `<div class="md-mkcv"><span class="lbl">대표 사진 (안 골라도 돼요)</span>
    <div class="md-mkrow">${MDCOVER?`<img src="${esc(MDCOVER)}" alt="고른 대표 사진" draggable="false">`:""}
    <button type="button" class="ghost" id="mdMkPick">${MDCOVER?"다른 사진":"🖼️ 사진 고르기"}</button>${MDCOVER?`<button type="button" class="link" id="mdMkX">빼기</button>`:""}
    <input type="file" id="mdMkFile" accept="image/*" hidden></div>
    <small class="t-help">얼굴·이름표·주소가 보이지 않는 사진을 골라요. 숨은 위치 정보는 자동으로 지워져요.</small></div>`;
}
async function mdCoverData(file){const {im,u,w,h}=await mdLoadImg(file);const r=mdFit(im,w,h,0,90000,[640,320]);URL.revokeObjectURL(u);return r.d}
function mdCoverSave(rid,d){
  const rv=role!=="teacher"&&mdCfg().review;
  return R("rcover/"+rid).set({k:rmK(),d,t:SV.TIMESTAMP,...(rv?{ok:false}:{})});
}

/* ---------- 선생님: 사진·동영상 관리 ---------- */
function mdAll(){const out=[];Object.entries(RMETA||{}).forEach(([rid,ms])=>Object.entries(ms||{}).forEach(([mid,x])=>{if(x&&x.kind)out.push({rid,mid,...x})}));return out}
function mdTeacherHtml(){
  if(role!=="teacher")return "";
  const C=mdCfg(),all=mdAll(),used=mdUsed(),pct=Math.min(100,Math.round(used/MD_CAP*100));
  const wait=all.filter(x=>x.ok===false),flag=all.filter(x=>x.fl&&Object.keys(x.fl).length);
  const cw=Object.entries(RCOVER||{}).filter(([,c])=>c&&c.ok===false);
  const closedIds=new Set(rList().filter(r=>r.closed).map(r=>r.id)),old=all.filter(x=>closedIds.has(x.rid)),oldSize=old.reduce((a,x)=>a+(+RSIZE[x.mid]||0),0);
  const item=x=>{const r=rRoom(x.rid);return `<li class="md-it">
    <button type="button" class="rm-thumb" data-mdopen="${esc(x.mid)}" data-mdrid="${esc(x.rid)}" aria-label="${mdKindTxt(x.kind)} 보기"><img src="${esc(x.th||"")}" alt="" draggable="false">${x.kind==="vid"?`<span class="md-play">▶ ${mdDur(x.dur)}</span>`:""}</button>
    <div><b>${esc(x.k==="T"?"선생님":(STUDENTS[x.k]||{}).name||x.k)}</b> · ${esc(r?snip(r.title):"지운 방")}<br><small>${rTime(x.t)}${x.fl?` · ⚑ 알림 ${Object.keys(x.fl).length}`:""}</small>
    <div class="md-acts">${x.ok===false?`<button type="button" class="link" data-mdok="${esc(x.rid)}|${esc(x.mid)}">보이기</button>`:""}${x.fl?`<button type="button" class="link" data-mdflx="${esc(x.rid)}|${esc(x.mid)}">알림 지우기</button>`:""}<button type="button" class="link" data-mddel="${esc(x.rid)}|${esc(x.mid)}">지우기</button>${r?`<button type="button" class="link" data-mdgo="${esc(x.rid)}">방으로</button>`:""}</div></div></li>`};
  const list=[...new Map([...flag,...wait].map(x=>[x.mid,x])).values()].sort((a,b)=>(b.t||0)-(a.t||0));
  return `<article class="card room-set md-set">
    <div class="t-head"><h3>사진·동영상</h3><span class="rstate ${pct>=80?"":"on"}">저장 공간 ${mdMB(used)} / ${mdMB(MD_CAP)}</span></div>
    <div class="md-meter" role="img" aria-label="저장 공간 ${pct}% 사용"><span style="width:${pct}%"></span></div>
    <div class="rs-row">
      <label class="inline" for="mdOnP"><input type="checkbox" id="mdOnP" ${C.photo?"checked":""}> 사진 올리기 켜기</label>
      <label class="inline" for="mdOnV"><input type="checkbox" id="mdOnV" ${C.video?"checked":""}> 동영상 올리기 켜기</label>
      <label class="inline" for="mdRev"><input type="checkbox" id="mdRev" ${C.review?"checked":""}> 학생 것은 선생님이 확인한 뒤 보이기</label>
      <button type="button" class="secondary" id="mdSave">저장</button>
    </div>
    <p class="t-help">🔒 개인정보 보호: 올리기 전 얼굴·이름표·주소 확인 · 위치 정보 자동 삭제 · 로그인한 우리 반만 보기 · 저장·내려받기 막기 · 친구가 '선생님께 알리기' · 선생님 가리기·지우기. 화면 캡처까지 막을 수는 없어서 수업 때 함께 약속해 주세요.</p>
    ${list.length||cw.length?`<h4 class="md-h">확인할 것 ${list.length+cw.length}개</h4><ul class="md-list">${list.map(item).join("")}${cw.map(([rid,c])=>{const r=rRoom(rid);return `<li class="md-it"><span class="rm-thumb cv"><img src="${esc(c.d)}" alt="" draggable="false"></span><div><b>대표 사진</b> · ${esc((STUDENTS[c.k]||{}).name||c.k)} · ${esc(r?snip(r.title):"지운 방")}<div class="md-acts"><button type="button" class="link" data-mdcvok="${esc(rid)}">보이기</button><button type="button" class="link" data-mdcvdel="${esc(rid)}">지우기</button></div></div></li>`}).join("")}</ul>`:`<p class="t-help">확인할 사진·동영상이 없어요. (모두 ${all.length}개)</p>`}
    ${old.length?`<div class="actions"><button type="button" class="ghost" id="mdClean">끝난 방의 사진·동영상 지우기 (${old.length}개 · ${mdMB(oldSize)})</button></div>`:""}
    <p class="msg" id="mdTMsg" role="status"></p>
  </article>`;
}
/* 지우기: 말·공감·사진 정보·원본·크기를 함께 지워요 */
function mdDelPaths(rid,mid,up){up=up||{};Object.assign(up,{[`rooms/msgs/${rid}/${mid}`]:null,[`rooms/react/${rid}/${mid}`]:null,[`rmeta/${rid}/${mid}`]:null,[`rblob/${mid}`]:null,[`rsize/${mid}`]:null});return up}
function mdRoomDelPaths(rid,up){up=up||{};Object.keys((RMETA||{})[rid]||{}).forEach(mid=>{up[`rblob/${mid}`]=null;up[`rsize/${mid}`]=null});up[`rmeta/${rid}`]=null;up[`rcover/${rid}`]=null;return up}

/* ---------- 크게 보기 (저장 막기 + 우리 반만 봐요 표시) ---------- */
async function mdGetUrl(mid){
  if(MDC.has(mid))return MDC.get(mid);
  const s=await R(`rblob/${mid}`).once("value"),b=s.val();if(!b||!b.c)throw new Error("지워진 파일이에요.");
  const arr=Array.isArray(b.c)?b.c:Object.keys(b.c).sort((a,c)=>a-c).map(i=>b.c[i]);
  const bin=atob(arr.join("")),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u8],{type:b.mime||(b.kind==="vid"?"video/mp4":"image/jpeg")}));MDC.set(mid,url);return url;
}
function mdView(rid,mid){
  const x=mdMeta(rid,mid);if(!x)return;
  const prev=document.activeElement,wrap=document.createElement("div");
  wrap.className="md-lb";wrap.setAttribute("role","dialog");wrap.setAttribute("aria-modal","true");wrap.setAttribute("aria-label",mdKindTxt(x.kind)+" 크게 보기");
  wrap.innerHTML=`<div class="md-lbin"><button type="button" class="md-lbx" aria-label="닫기">✕</button><div class="md-lbc"><p class="md-state">불러오는 중…</p></div><span class="md-wm" aria-hidden="true">CLASS LAB · 우리 반만 봐요</span></div>`;
  const close=()=>{document.removeEventListener("keydown",key);const v=wrap.querySelector("video");if(v)try{v.pause()}catch(e){}wrap.remove();if(prev&&prev.focus)prev.focus()};
  const key=e=>{if(e.key==="Escape")close()};
  wrap.addEventListener("click",e=>{if(e.target===wrap)close()});
  wrap.addEventListener("contextmenu",e=>e.preventDefault());wrap.addEventListener("dragstart",e=>e.preventDefault());
  wrap.querySelector(".md-lbx").onclick=close;document.addEventListener("keydown",key);
  document.body.appendChild(wrap);wrap.querySelector(".md-lbx").focus();
  mdGetUrl(mid).then(url=>{const c=wrap.querySelector(".md-lbc");if(!c)return;
    if(x.kind==="vid"){c.innerHTML=`<video controls playsinline controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback preload="auto"></video>`;
      const v=c.querySelector("video");v.onerror=()=>{c.innerHTML=`<p class="md-state">이 기기에서는 재생할 수 없는 형식이에요. 다른 기기(크롬)로 열어 보세요.</p>`};v.src=url;v.play().catch(()=>{})}
    else c.innerHTML=`<img src="${url}" alt="" draggable="false">`;
  }).catch(e=>{const c=wrap.querySelector(".md-lbc");if(c)c.innerHTML=`<p class="md-state">${esc(e.message||"불러오지 못했어요.")}</p>`});
}

/* ---------- 연결 ---------- */
function mdBindBox(){
  const ok=$("#mdOk");if(ok)ok.onchange=()=>{if(MDA)MDA.ok=ok.checked;const s=$("#mdState");if(s&&ok.checked)s.textContent=""};
  const x=$("#mdX");if(x)x.onclick=()=>{mdClear();mdMsg="";mdRedraw()};
}
function mdBindRoom(id){
  const m=$("#rmMsg");
  document.querySelectorAll("[data-mdpick]").forEach(b=>b.onclick=()=>{const k=b.dataset.mdpick,inp=$(k==="vid"?"#mdFileVid":"#mdFileImg");if(inp){inp.value="";inp.click()}});
  [["#mdFileImg","img"],["#mdFileVid","vid"]].forEach(([s,k])=>{const inp=$(s);if(inp)inp.onchange=()=>{const t=$("#rmText");if(t)roomDraft=t.value;mdPick(inp.files&&inp.files[0],k)}});
  mdBindBox();
  const cp=$("#mdCvPick"),cf=$("#mdCvFile");
  if(cp&&cf){cp.onclick=()=>{cf.value="";cf.click()};cf.onchange=async()=>{const f=cf.files&&cf.files[0];if(!f)return;
    if(!confirm("대표 사진에 얼굴·이름표·주소·전화번호가 보이지 않나요? 확인했으면 '확인'을 눌러 주세요."))return;
    try{const d=await mdCoverData(f);act(cp,m,()=>mdCoverSave(id,d)).then(ok=>{if(ok){roomMsg=role!=="teacher"&&mdCfg().review?"대표 사진을 올렸어요. 선생님이 확인하면 친구들에게 보여요.":"대표 사진을 바꿨어요.";renderRooms()}})}
    catch(e){if(m)m.textContent=e.message}}}
  if($("#mdCvDel"))$("#mdCvDel").onclick=()=>act($("#mdCvDel"),m,()=>R("rcover/"+id).remove()).then(ok=>{if(ok){roomMsg="대표 사진을 뺐어요.";renderRooms()}});
  if($("#mdCvOk"))$("#mdCvOk").onclick=()=>act($("#mdCvOk"),m,()=>R(`rcover/${id}/ok`).remove()).then(ok=>{if(ok){roomMsg="대표 사진이 친구들에게 보여요.";renderRooms()}});
  mdBindCommon(m);
}
function mdBindCommon(m){
  document.querySelectorAll("[data-mdopen]").forEach(b=>b.onclick=()=>mdView(b.dataset.mdrid||openRoom,b.dataset.mdopen));
  const sp=v=>v.split("|");
  document.querySelectorAll("[data-mdfl]").forEach(b=>b.onclick=()=>{const [rid,mid]=sp(b.dataset.mdfl);
    if(!confirm("이 "+mdKindTxt((mdMeta(rid,mid)||{}).kind)+"을 선생님께 알릴까요? 개인정보가 보이거나 불편한 내용일 때 알려 주세요."))return;
    act(null,m,()=>R(`rmeta/${rid}/${mid}/fl/${KEY}`).set(SV.TIMESTAMP)).then(ok=>{if(ok){roomMsg="선생님께 알렸어요. 고마워요.";renderRooms()}})});
  if(role!=="teacher")return;
  document.querySelectorAll("[data-mdok]").forEach(b=>b.onclick=()=>{const [rid,mid]=sp(b.dataset.mdok);act(null,m,()=>R(`rmeta/${rid}/${mid}/ok`).remove()).then(ok=>{if(ok)rerender()})});
  document.querySelectorAll("[data-mdflx]").forEach(b=>b.onclick=()=>{const [rid,mid]=sp(b.dataset.mdflx);act(null,m,()=>R(`rmeta/${rid}/${mid}/fl`).remove()).then(ok=>{if(ok)rerender()})});
  document.querySelectorAll("[data-mddel]").forEach(b=>b.onclick=()=>{
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 지워요";return}
    const [rid,mid]=sp(b.dataset.mddel);act(b,m,()=>R("").update(mdDelPaths(rid,mid))).then(ok=>{if(ok)rerender()})});
  document.querySelectorAll("[data-mdgo]").forEach(b=>b.onclick=()=>{openRoom=b.dataset.mdgo;roomReply=null;roomDraft="";renderRooms();window.scrollTo({top:0})});
  document.querySelectorAll("[data-mdcvok]").forEach(b=>b.onclick=()=>act(null,m,()=>R(`rcover/${b.dataset.mdcvok}/ok`).remove()).then(ok=>{if(ok)rerender()}));
  document.querySelectorAll("[data-mdcvdel]").forEach(b=>b.onclick=()=>act(null,m,()=>R(`rcover/${b.dataset.mdcvdel}`).remove()).then(ok=>{if(ok)rerender()}));
}
function mdBindList(){
  const m=$("#mdTMsg")||$("#rmMsg");
  if($("#mdSave"))$("#mdSave").onclick=()=>act($("#mdSave"),m,()=>R("config").update({roomPhoto:$("#mdOnP").checked,roomVideo:$("#mdOnV").checked,roomReview:$("#mdRev").checked})).then(ok=>{if(ok){roomMsg="사진·동영상 설정을 저장했어요.";renderRooms()}});
  if($("#mdClean"))$("#mdClean").onclick=e=>{const b=e.currentTarget;
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 끝난 방의 사진·동영상이 모두 지워져요";return}
    const closed=rList().filter(r=>r.closed).map(r=>r.id),up={};
    closed.forEach(rid=>Object.keys((RMETA||{})[rid]||{}).forEach(mid=>mdDelPaths(rid,mid,up)));
    act(b,m,()=>R("").update(up)).then(ok=>{if(ok){roomMsg="끝난 방의 사진·동영상을 지웠어요.";renderRooms()}})};
  // 방 만들기의 대표 사진
  const mp=$("#mdMkPick"),mf=$("#mdMkFile");
  if(mp&&mf){mp.onclick=()=>{mf.value="";mf.click()};mf.onchange=async()=>{const f=mf.files&&mf.files[0];if(!f)return;
    try{MDCOVER=await mdCoverData(f);const box=$(".md-mkcv");if(box){box.outerHTML=mdMakeHtml();mdBindList()}}catch(e){const mm=$("#rmMsg");if(mm)mm.textContent=e.message}}}
  if($("#mdMkX"))$("#mdMkX").onclick=()=>{MDCOVER=null;const box=$(".md-mkcv");if(box){box.outerHTML=mdMakeHtml();mdBindList()}};
  mdBindCommon(m);
}

/* ---------- 알림 (선생님) ---------- */
function mdNoti(add){
  if(role!=="teacher")return;mdWatch();
  mdAll().forEach(x=>{const r=rRoom(x.rid);if(!r)return;const go={tab:"rooms",room:x.rid},nm=(STUDENTS[x.k]||{}).name||x.k,title=snip(r.title);
    if(x.ok===false)add(x.t,"🖼️",`${jo(nm,"이","가")} 토의방 '${title}'에 ${mdKindTxt(x.kind)}을 올렸어요. 확인하고 보이게 해 주세요.`,go);
    Object.entries(x.fl||{}).forEach(([k,t])=>add(+t||x.t,"⚑",`${jo((STUDENTS[k]||{}).name||k,"이","가")} 토의방 '${title}'의 ${mdKindTxt(x.kind)}을 선생님께 알렸어요.`,go));
  });
  Object.entries(RCOVER||{}).forEach(([rid,c])=>{const r=rRoom(rid);if(r&&c&&c.ok===false)add(c.t,"🖼️",`토의방 '${snip(r.title)}'에 대표 사진이 올라왔어요. 확인하고 보이게 해 주세요.`,{tab:"rooms",room:rid})});
}
