/* =========================================================
   움직이는 캐릭터 (avatar.js) · features.js 다음, app.js 앞에 불러와요
   - 모든 학생이 같은 캐릭터로 시작 (효과 없음)
   - 레벨이 오르거나 상점에서 효과를 사면 빛 입자 → 연기 → 오라 → 불꽃이 붙음
   - 펫은 상점에서 사야 함께 다님
   - 마이페이지(크게)와 오늘의 퀴즈(작게, 정답·오답·만점 반응)에 나옴
   ========================================================= */
const AV_BASE = "assets/avatar/";
const AV_CHAR = { id: "wolf", name: "늑대귀 검객" };          // 나중에 등급별 복장으로 늘릴 자리
const AV_PETS = [{ id: "cowboy", name: "카우보이 펫" }];
const AV_FX = [
  { id: "spark", name: "빛 입자",   lv: 3 },
  { id: "smoke", name: "발밑 연기", lv: 8 },
  { id: "aura",  name: "푸른 오라", lv: 15 },
  { id: "flame", name: "푸른 불꽃", lv: 25 }
];
const avOn = () => !CFG || CFG.avatarOn !== false;
const avQuizOn = () => avOn() && CFG.avatarQuiz !== false;
const avFxLv = id => {
  const v = CFG && CFG.fxLv && +CFG.fxLv[id];
  return v > 0 ? v : AV_FX.find(f => f.id === id).lv;
};

/* ---------- 학생 상태 ---------- */
function avOwned() {
  const o = { pets: {}, fx: {} };
  (typeof BUYS !== "undefined" ? BUYS : []).forEach(b => {
    if (b.kind === "pet" && b.ref) o.pets[b.ref] = true;
    if (b.kind === "fx" && b.ref) o.fx[b.ref] = true;
  });
  return o;
}
function avState(s) {
  const lv = levelOf(s || {}), own = s ? avOwned() : { pets: {}, fx: {} };
  const fx = {};
  AV_FX.forEach(f => { fx[f.id] = !!s && (lv >= avFxLv(f.id) || !!own.fx[f.id]); });
  const ownedPet = AV_PETS.find(p => own.pets[p.id]);
  const look = (s && s.look) || {};
  const pet = ownedPet && look.pet !== "none" ? ownedPet.id : "";
  return { lv, fx, pet, own };
}

/* ---------- 상점 품목 종류 ---------- */
// it.kind: ""(일반) | "lotto" | "pet:cowboy" | "fx:aura" ...
function avItemKind(it) {
  const k = String((it && it.kind) || "");
  if (k.startsWith("pet:")) return { kind: "pet", ref: k.slice(4) };
  if (k.startsWith("fx:")) return { kind: "fx", ref: k.slice(3) };
  return null;
}
function buyKind(it) {
  const a = avItemKind(it);
  if (a) return { kind: a.kind, ref: a.ref };       // 펫·효과는 바로 생겨서 선생님이 건네줄 필요 없음 (확인증에도 받았어요로 표시)
  return isLotto(it) ? { kind: "lotto" } : {};
}
function avJosa(word, withJong, without) {
  const c = String(word || "").trim().slice(-1).charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? withJong : without;
}
function buyMsg(it, code) {
  const a = avItemKind(it);
  if (a && a.kind === "pet") return `${it.name}${avJosa(it.name, "이", "가")} 생겼어요! 마이페이지와 퀴즈에서 함께 다녀요.`;
  if (a && a.kind === "fx") return `${it.name} 효과가 생겼어요! 마이페이지에서 확인해 보세요.`;
  if (isLotto(it)) return `${it.name}을(를) 샀어요. 아래 '내 구매 확인증'에서 긁어 보세요.`;
  return `${it.name}을(를) 샀어요. 확인 코드 ${code}를 선생님께 보여 주세요.`;
}
const AV_KIND_OPTS = [["", "일반 (선생님이 건네줌)"]]
  .concat(AV_PETS.map(p => ["pet:" + p.id, "펫: " + p.name]))
  .concat(AV_FX.map(f => ["fx:" + f.id, "효과: " + f.name]));
function avKindLabel(k) { const o = AV_KIND_OPTS.find(x => x[0] === (k || "")); return o ? o[1] : ""; }

// 상점 화면: 이미 가진 펫·효과는 '이미 있어요'
function avatarEnhanceShop() {
  if (!ME) return;
  const st = avState(ME);
  shopList().forEach(it => {
    const a = avItemKind(it); if (!a) return;
    const sel = String(it.id).replace(/["\\]/g, "");
    const li = document.querySelector(`[data-buy="${sel}"]`) || document.querySelector(`[data-yes="${sel}"]`);
    const row = li && li.closest(".item"); if (!row) return;
    const name = row.querySelector(".iname");
    if (name && !name.querySelector(".av-badge")) name.insertAdjacentHTML("beforeend", ` <span class="av-badge">${a.kind === "pet" ? "펫" : "효과"}</span>`);
    const has = a.kind === "pet" ? !!st.own.pets[a.ref] : !!st.own.fx[a.ref];
    const already = a.kind === "fx" && st.fx[a.ref] && !st.own.fx[a.ref];   // 레벨로 이미 열림
    if (has || already) {
      const btn = row.querySelector("[data-buy]");
      if (btn) { btn.disabled = true; btn.textContent = has ? "이미 있어요" : "레벨로 이미 열렸어요"; }
    }
  });
}

/* ---------- 무대 만들기 ---------- */
const avReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
function avAlphaWebm() {
  const v = document.createElement("video");
  if (!v.canPlayType || !v.canPlayType('video/webm; codecs="vp9"')) return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua);
  return !(iOS || safari);
}
const AV_MODE = (() => {
  const save = navigator.connection && navigator.connection.saveData;
  if (avReduce.matches || save) return "still";
  return avAlphaWebm() ? "webm" : "webp";
})();
function avMedia(dir, alt) {
  const base = AV_BASE + dir + "/";
  if (AV_MODE === "webm")
    return `<video class="av-media" src="${base}idle.webm" poster="${base}still.webp" autoplay muted loop playsinline webkit-playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-hidden="true"></video>`;
  return `<img class="av-media" src="${base}${AV_MODE === "webp" ? "idle.webp" : "still.webp"}" alt="${esc(alt || "")}" decoding="async" draggable="false">`;
}
function avStageHtml(size) {
  const flames = [[-2,18,36,60,1.7,-.2,-8],[10,40,38,62,1.5,-.9,-6],[24,50,40,56,1.9,-.5,-4],[36,54,40,54,1.6,-1.2,5],[48,46,38,58,1.8,-.3,6],[62,30,36,60,1.45,-1,8],[70,14,34,56,1.7,-.6,9]]
    .map(f => `<span style="--x:${f[0]}%;--b:${f[1]}%;--w:${f[2]}%;--h:${f[3]}%;--d:${f[4]}s;--delay:${f[5]}s;--skew:${f[6]}deg"></span>`).join("");
  const smoke = [[0,2,40,7,-1,""],[26,0,46,8.5,-4,""],[50,4,42,6.5,-2.5,"reverse"],[14,8,32,9,-6,"reverse"],[60,0,36,7.5,-3,""]]
    .map(s => `<span style="--x:${s[0]}%;--y:${s[1]}%;--w:${s[2]}%;--d:${s[3]}s;--delay:${s[4]}s;--dir:${s[5] || "normal"}"></span>`).join("");
  return `<div class="av-stage av-${size}" role="img" aria-label="${esc(AV_CHAR.name)} 캐릭터">
    <div class="av-hero">
      <div class="av-aura" aria-hidden="true"></div>
      <div class="av-flames" aria-hidden="true">${flames}</div>
      <div class="av-shadow" aria-hidden="true"></div>
      <div class="av-body">${avMedia(AV_CHAR.id, AV_CHAR.name)}</div>
      <div class="av-smoke" aria-hidden="true">${smoke}</div>
    </div>
    <div class="av-pet" aria-hidden="true"><div class="av-shadow"></div></div>
    <canvas class="av-particles" aria-hidden="true"></canvas>
    <svg class="av-slash" viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="avSlashG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#e9fbff"/><stop offset="1" stop-color="#6fb6ff" stop-opacity="0"/></linearGradient></defs><path d="M20 150Q100 40 190 66Q110 66 34 162Z" fill="url(#avSlashG)"/><path d="M30 160Q110 66 196 86" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>
    <div class="av-pop" aria-hidden="true"></div>
  </div>`;
}

/* 빛 입자 (캔버스) */
function AvParticles(canvas, count) {
  this.c = canvas; this.x = canvas.getContext && canvas.getContext("2d"); this.n = count; this.items = []; this.on = false;
  this.tick = this.tick.bind(this);
}
AvParticles.prototype.size = function () {
  const r = this.c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  if (!r.width) return false;
  if (this.w === r.width && this.h === r.height) return true;
  this.w = r.width; this.h = r.height; this.c.width = Math.round(r.width * d); this.c.height = Math.round(r.height * d);
  this.x.setTransform(d, 0, 0, d, 0, 0); this.items = [];
  for (let i = 0; i < this.n; i++) this.items.push(this.spawn(true));
  return true;
};
AvParticles.prototype.spawn = function (any) {
  const cols = ["255,255,255", "170,230,255", "255,214,120"];
  return { x: this.w * (0.25 + Math.random() * 0.7), y: any ? this.h * Math.random() : this.h * (0.75 + Math.random() * 0.25),
    r: 0.6 + Math.random() * 1.6, vy: 8 + Math.random() * 20, sw: 5 + Math.random() * 12, ph: Math.random() * 6.3,
    tw: 1.5 + Math.random() * 3, star: Math.random() < 0.12, col: cols[(Math.random() * 3) | 0] };
};
AvParticles.prototype.tick = function (now) {
  if (!this.on) return;
  const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
  if (!this.size()) { requestAnimationFrame(this.tick); return; }
  const g = this.x; g.clearRect(0, 0, this.w, this.h); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < this.items.length; i++) {
    const p = this.items[i]; p.y -= p.vy * dt; p.ph += dt;
    if (p.y < -10) { this.items[i] = this.spawn(false); continue; }
    const x = p.x + Math.sin(p.ph * 1.3) * p.sw, life = Math.max(0, Math.min(1, p.y / (this.h * 0.25)));
    const a = (0.35 + 0.65 * Math.abs(Math.sin(p.ph * p.tw))) * life;
    const gr = g.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
    gr.addColorStop(0, `rgba(${p.col},${a})`); gr.addColorStop(1, `rgba(${p.col},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, p.y, p.r * 4, 0, 6.29); g.fill();
    if (p.star && a > 0.6) { const s = p.r * 6; g.strokeStyle = `rgba(${p.col},${a * 0.8})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x - s, p.y); g.lineTo(x + s, p.y); g.moveTo(x, p.y - s); g.lineTo(x, p.y + s); g.stroke(); }
  }
  requestAnimationFrame(this.tick);
};
AvParticles.prototype.start = function () { if (this.on || avReduce.matches || !this.x) return; this.on = true; this.last = 0; requestAnimationFrame(this.tick); };
AvParticles.prototype.stop = function () { this.on = false; if (this.x && this.w) this.x.clearRect(0, 0, this.w, this.h); };

/* 무대는 슬롯마다 하나만 만들어 두고, 화면이 다시 그려져도 옮겨 붙여요 (영상이 다시 로딩되지 않게) */
const AV_STAGES = {};
function avCreate(slot, size) {
  const t = document.createElement("div"); t.innerHTML = avStageHtml(size);
  const el = t.firstElementChild;
  const st = { el, size, parts: new AvParticles(el.querySelector(".av-particles"), size === "lg" ? 40 : 18), visible: true, fx: {} };
  avPrepMedia(el);
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { st.visible = es[0].isIntersecting; avSync(st); }, { threshold: 0.05 }).observe(el);
  AV_STAGES[slot] = st;
  return st;
}
function avPrepMedia(root) {
  root.querySelectorAll("img.av-media,video.av-media").forEach(m => {
    if (m.dataset.prep) return; m.dataset.prep = "1";
    const done = () => m.classList.add("ready");
    if (m.tagName === "VIDEO") { m.muted = true; m.defaultMuted = true; m.playsInline = true; m.addEventListener("loadeddata", done, { once: true }); }
    else m.addEventListener("load", done, { once: true });
    m.addEventListener("error", () => {
      if (m.tagName === "IMG" && /still\.webp$/.test(m.src)) {   // 정지 그림도 없으면(파일을 아직 안 올렸을 때) 캐릭터 자리를 숨김
        const st = m.closest(".av-stage"), h = st && st.parentNode; if (h && h.dataset) h.hidden = true;
        return;
      }
      const dir = m.closest(".av-pet") ? "pet-" + AV_PETS[0].id : AV_CHAR.id;   // 영상이 안 되면 정지 그림으로
      const img = document.createElement("img"); img.className = "av-media"; img.alt = ""; img.src = AV_BASE + dir + "/still.webp";
      m.replaceWith(img); avPrepMedia(img.parentNode);
    }, { once: true });
  });
}
function avSync(st) {
  const on = st.visible && !document.hidden && document.contains(st.el);
  st.el.classList.toggle("is-paused", !on);
  st.el.querySelectorAll("video.av-media").forEach(v => {
    if (on && !(v.closest(".av-pet") && !st.el.classList.contains("has-pet"))) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    else v.pause();
  });
  if (on && st.fx.spark) st.parts.start(); else st.parts.stop();
}
document.addEventListener("visibilitychange", () => Object.values(AV_STAGES).forEach(avSync));

/** 화면에 있는 [data-avatar-slot="이름"] 자리에 캐릭터를 붙여요. s = 학생 기록(없으면 효과 없는 기본) */
function avatarMount(slot, s) {
  const holder = document.querySelector(`[data-avatar-slot="${slot}"]`);
  if (!holder) return null;
  if (!avOn() || (slot !== "me" && !avQuizOn())) { holder.hidden = true; return null; }
  const size = holder.dataset.size || "lg";
  const st = AV_STAGES[slot] || avCreate(slot, size);
  const state = avState(s);
  st.fx = state.fx;
  AV_FX.forEach(f => st.el.classList.toggle("fx-" + f.id, !!state.fx[f.id]));
  st.el.classList.toggle("has-pet", !!state.pet);
  const petBox = st.el.querySelector(".av-pet");
  if (state.pet && !petBox.querySelector(".av-media")) { petBox.insertAdjacentHTML("beforeend", avMedia("pet-" + state.pet, "")); avPrepMedia(petBox); }
  holder.hidden = false;
  if (st.el.parentNode !== holder) holder.appendChild(st.el);
  avSync(st);
  return st;
}

/** 퀴즈 반응: "right" | "wrong" | "win" */
function avatarReact(kind, coins) {
  const st = AV_STAGES.quiz;
  if (!st || !document.contains(st.el) || avReduce.matches) return;
  const el = st.el;
  el.classList.remove("re-right", "re-wrong", "re-win"); void el.offsetWidth;
  el.classList.add("re-" + kind);
  if (kind === "right" && coins) { const p = el.querySelector(".av-pop"); p.textContent = "+" + coins; }
  clearTimeout(st.rt); st.rt = setTimeout(() => el.classList.remove("re-" + kind), kind === "win" ? 2000 : 900);
}

/* ---------- 마이페이지 카드 ---------- */
function avatarCardHtml(s) {
  const st = avState(s), lv = st.lv, into = (+s.qRight || 0) % XP_PER, nextJob = JOBS.find(([m]) => m > lv);
  const fxRows = AV_FX.map(f => {
    const on = st.fx[f.id], need = avFxLv(f.id), byShop = st.own.fx[f.id] && lv < need;
    return `<li class="${on ? "on" : ""}"><span class="dot dot-${f.id}" aria-hidden="true"></span><b>${esc(f.name)}</b><small title="${on ? "" : `Lv.${need}에 열려요`}">${on ? (byShop ? "상점" : "열림") : `Lv.${need}`}</small></li>`;
  }).join("");
  const pet = AV_PETS[0], hasPet = !!st.own.pets[pet.id];
  return `<article class="card me-hero av-card">
    <div class="av-slot-wrap" data-avatar-slot="me" data-size="lg"></div>
    <div class="hero-info">
      <p class="kind">Lv.${lv} ${esc(jobOf(lv))}${nextJob ? ` · Lv.${nextJob[0]}${ga(nextJob[0])} 되면 '${esc(nextJob[1])}'` : ""}</p>
      <h2>${esc(s.name)}</h2>
      <p class="t-help">${esc(s.grade)}학년 ${esc(s.cls)}반 ${esc(s.num)}번</p>
      <div class="xp" role="progressbar" aria-label="다음 레벨까지" aria-valuemin="0" aria-valuemax="${XP_PER}" aria-valuenow="${into}"><i style="width:${into / XP_PER * 100}%"></i></div>
      <p class="t-help">퀴즈에서 ${XP_PER - into}문제 더 맞히면 Lv.${lv + 1}${ga(lv + 1)} 돼요. 레벨이 오르면 캐릭터에 효과가 붙어요.</p>
      <ul class="av-fx">${fxRows}</ul>
      <div class="av-petrow">${hasPet
        ? `<button type="button" class="ghost" id="avPetBtn" aria-pressed="${st.pet ? "true" : "false"}">${st.pet ? `${esc(pet.name)} 쉬게 하기` : `${esc(pet.name)} 데리고 다니기`}</button>`
        : `<span class="t-help">펫은 상점에서 살 수 있어요.</span>`}</div>
      <form class="status-form" id="stForm" novalidate>
        <label class="t-field" for="stIn">상태메시지<input type="text" id="stIn" maxlength="40" value="${esc(s.status || "")}" placeholder="오늘의 기분이나 목표를 적어요"></label>
        <button type="submit" class="secondary" id="stSave">저장</button>
      </form>
      <p class="msg" id="meMsg" role="status">${esc(meMsg)}</p>
    </div>
  </article>`;
}
function avatarBindCard(s, msgEl) {
  avatarMount("me", s);
  const b = document.getElementById("avPetBtn");
  if (b) b.onclick = () => {
    const show = b.getAttribute("aria-pressed") !== "true";
    act(b, msgEl, () => upd({ look: { ...((ME && ME.look) || {}), pet: show ? AV_PETS[0].id : "none" } })).then(ok => { if (ok) renderMyPage(); });
  };
}

/* ---------- 얼굴 아이콘 (순위·게시판) ---------- */
function avatarFace(size, label) {
  if (!avOn()) return "";
  return `<img class="av ${size >= 32 ? "" : "sm"} av-face" src="${AV_BASE}${AV_CHAR.id}/face.webp" width="${size}" height="${size}" alt="" loading="lazy" decoding="async" title="${esc(label || "")}">`;
}

/* ---------- 선생님 설정 카드 ---------- */
let avTMsg = "";
function avatarTeacherCard() {
  const v = document.getElementById("view-teacher"); if (!v) return;
  const c = CFG, lvs = AV_FX.map(f => `<label class="t-field" for="avLv-${f.id}">${esc(f.name)} (레벨)<input type="number" id="avLv-${f.id}" min="1" max="200" step="1" value="${avFxLv(f.id)}"></label>`).join("");
  const card = document.createElement("article"); card.className = "card"; card.id = "avTeacherCard";
  card.innerHTML = `<h3>캐릭터</h3>
    <p class="t-help">모든 학생이 같은 캐릭터로 시작해요. 레벨이 오르면 아래 효과가 차례로 붙고, 상점에서 '종류'를 펫이나 효과로 정한 품목을 사면 바로 생겨요. 레벨은 맞힌 문제 ${XP_PER}개마다 1씩 올라요.</p>
    <div class="row2">
      <label class="t-field" for="avOnSel">캐릭터 보이기<select id="avOnSel"><option value="1" ${avOn() ? "selected" : ""}>보이기</option><option value="0" ${avOn() ? "" : "selected"}>숨기기</option></select></label>
      <label class="t-field" for="avQuizSel">퀴즈 화면 반응<select id="avQuizSel"><option value="1" ${c.avatarQuiz !== false ? "selected" : ""}>보이기</option><option value="0" ${c.avatarQuiz !== false ? "" : "selected"}>마이페이지에만</option></select></label>
    </div>
    <div class="row2">${lvs}</div>
    <div class="actions"><button type="button" class="primary" id="avSave">캐릭터 설정 저장</button></div>
    <p class="msg" id="avMsg" role="status">${esc(avTMsg)}</p>`;
  avTMsg = "";
  const old = document.getElementById("avTeacherCard"); if (old) old.remove();
  const first = v.querySelector("article.card"); if (first && first.nextSibling) v.insertBefore(card, first.nextSibling); else v.appendChild(card);
  card.querySelector("#avSave").onclick = () => {
    const fxLv = {}; AV_FX.forEach(f => { fxLv[f.id] = Math.max(1, Math.round(+card.querySelector("#avLv-" + f.id).value || f.lv)); });
    act(card.querySelector("#avSave"), card.querySelector("#avMsg"), () => R("config").update({ avatarOn: card.querySelector("#avOnSel").value === "1", avatarQuiz: card.querySelector("#avQuizSel").value === "1", fxLv }))
      .then(ok => { if (ok) { avTMsg = "캐릭터 설정을 저장했어요."; const m = document.getElementById("avMsg"); if (m) m.textContent = avTMsg; } });
  };
}
