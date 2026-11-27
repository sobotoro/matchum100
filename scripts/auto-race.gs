/* CLASS LAB 자동 달리기 대결 (구글 Apps Script, "CLASS LAB 주가 갱신" 프로젝트의 두 번째 파일)
   평일 정해진 시각마다 대결 대기실을 저절로 열고, 시각이 되면 출발시키고, 끝나면 1~5등 보상을 넣어요.
   설정은 사이트 선생님 화면 '달리기 → 자동 대결'에서 해요 (Firebase matchum/config의 runAuto·runAutoT·runAutoLead·runAutoMin).
   처음 한 번: 위 메뉴에서 '자동대결_설치'를 골라 ▶ 실행. 그다음은 1분마다 저절로 돌아가요. 멈추려면 '자동대결_멈추기'.

   규칙
   - 평일만. 수업 시간 잠금(runLock, runFrom~runTo)에 걸린 시각은 건너뛰어요. 달리기 탭을 숨겨 두면(runOpen=false) 열지 않아요.
   - 출발 runAutoLead분 전(10·5·3분)에 대기실을 열어요. 그때 선생님이 연 대결(대기실·달리는 중)이 있으면 그 시각은 건너뛰어요.
   - 출발 시각에 runAutoMin명 이상 들어와 있으면 3·2·1 출발, 모자라면 쉬어요(학생 화면에 몇 명이었는지 알려 줘요).
   - 모두 도착하거나 시간이 다 되면(거리 1000m마다 2분 30초 + 1분 30초) 마치고 1~5등에게 runPrize 코인을 넣어요.
     보상은 race/state/paid로 한 번만 줘요(선생님이 '대결 마치기'를 눌러도 두 번 들어가지 않아요). */

const AR_DB = 'https://jumprope-board-default-rtdb.asia-southeast1.firebasedatabase.app/matchum';
const AR_KST = 9 * 3600e3;

/** 1분마다 자동으로 불려요. */
function autoRaceTick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;   // 앞 실행이 출발을 기다리는 중이면 이번은 쉬어요
  try { arTick_(); } finally { lock.releaseLock(); }
}

function arTick_() {
  const now = Date.now(), k = arKst_(now);
  const props = PropertiesService.getScriptProperties();
  const active = props.getProperty('arActive');   // 아직 안 끝난 자동 대결 rid
  if ((k.dow === 0 || k.dow === 6) && !active) return;
  const cfg = arGet_('/config').val || {}, c = arCfg_(cfg);
  const slots = (k.dow === 0 || k.dow === 6 || !c.on || !c.open) ? [] : c.times.filter(t => !arSkip_(c, t)).map(t => arSlot_(k, t));
  const near = slots.filter(s => now >= s.startAt - c.lead * 60e3 - 60e3 && now <= s.startAt + 15 * 60e3);
  if (!near.length && !active) return;

  let st = arGet_('/race/state', true), s = st.val || {};

  // 1) 달리는 중인 자동 대결: 모두 도착했거나 시간이 다 되면 마치고 보상
  if (s.auto && s.st === 'run' && s.rid) {
    const ps = arPlayers_(s.rid), allDone = ps.length > 0 && ps.every(p => p.done);
    if (allDone || now > (+s.at || 0) + arMaxMs_(s.len)) arFinish_(s, c, ps, props);
    return;
  }
  if (s.auto && s.st === 'end' && active) props.deleteProperty('arActive');

  // 2) 열린 자동 대기실: 출발 시각이 되면 (70초 안쪽이면 그때까지 기다렸다가) 출발 또는 쉬기
  if (s.auto && s.st === 'lobby' && s.rid) {
    const wait = (+s.auto.startAt || 0) - Date.now();
    if (wait > 70e3) return;
    if (wait < -10 * 60e3) {   // 스크립트가 한동안 못 돌았어요: 늦게 출발하지 않고 닫아요
      if (arPut_('/race/state', { rid: '', st: 'off' }, st.etag).ok) { arDel_('/race/p'); props.deleteProperty('arActive'); }
      return;
    }
    if (wait > 0) Utilities.sleep(wait);
    st = arGet_('/race/state', true); s = st.val || {};
    if (!(s.auto && s.st === 'lobby' && s.rid)) return;   // 그사이 선생님이 출발시켰거나 닫았어요
    const n = arPlayers_(s.rid).length, min = +s.auto.min || c.min;
    if (n >= min) {
      const go = Object.assign({}, s, { st: 'run', at: Date.now() + 4500 });
      if (arPut_('/race/state', go, st.etag).ok) { props.setProperty('arActive', s.rid); console.log(s.auto.hm + ' 자동 대결 출발 · ' + n + '명'); }
    } else {
      const off = { rid: '', st: 'off', few: { hm: s.auto.hm, n: n, min: min, t: Date.now() } };
      if (arPut_('/race/state', off, st.etag).ok) { arDel_('/race/p'); props.deleteProperty('arActive'); console.log(s.auto.hm + ' 자동 대결 쉼 · ' + n + '/' + min + '명'); }
    }
    return;
  }

  // 3) 대기실 열기: 출발 lead분 전부터 1분 전까지, 대결이 없거나 끝난 상태일 때만
  const open = slots.find(x => Date.now() >= x.startAt - c.lead * 60e3 && Date.now() < x.startAt - 60e3);
  if (!open || props.getProperty('arOpened') === open.id) return;   // 선생님이 닫은 자동 대기실은 다시 열지 않아요
  if (s.rid && (s.st === 'lobby' || s.st === 'run')) { console.log(open.hm + ' 선생님 대결이 열려 있어 건너뜀'); props.setProperty('arOpened', open.id); return; }
  const rid = 'auto' + open.id.replace(/\D/g, '');
  const lobby = { rid: rid, st: 'lobby', seed: Math.floor(Math.random() * 1e9), len: c.len, hill: c.hill, fork: c.fork, t: { '.sv': 'timestamp' },
    auto: { slot: open.id, hm: open.hm, startAt: open.startAt, min: c.min } };
  if (arPut_('/race/state', lobby, st.etag).ok) {
    arDel_('/race/p'); props.setProperty('arOpened', open.id); props.setProperty('arActive', rid);
    console.log(open.hm + ' 자동 대결 대기실 열림 (' + c.lead + '분 전, ' + c.min + '명 이상)');
  }
}

/** 마치기: 보상은 paid를 먼저 잡은 쪽만 줘요 */
function arFinish_(s, c, ps, props) {
  const pd = arGet_('/race/state/paid', true);
  let paid = false;
  if (!pd.val && arPut_('/race/state/paid', true, pd.etag).ok) paid = true;
  if (paid) {
    const fin = ps.filter(p => p.done).map(p => Object.assign({}, p, { rec: Math.round((p.tm + p.pen) * 100) / 100 })).sort((a, b) => a.rec - b.rec);
    for (let i = 0; i < Math.min(5, fin.length); i++) {
      const coin = c.prize[i], p = fin[i];
      if (!coin) continue;
      if (arAddWallet_(p.k, coin)) arPost_('/logs/' + p.k, { t: { '.sv': 'timestamp' }, text: '달리기 자동 대결 ' + (i + 1) + '등 (' + p.rec.toFixed(1) + '초)', amount: coin });
    }
    console.log((s.auto && s.auto.hm) + ' 자동 대결 마침 · 완주 ' + fin.length + '/' + ps.length + '명 · 보상 ' + Math.min(5, fin.length) + '명');
  }
  const cur = arGet_('/race/state', true);
  if (cur.val && cur.val.rid === s.rid && cur.val.st === 'run') arPut_('/race/state', Object.assign({}, cur.val, { st: 'end' }), cur.etag);
  props.deleteProperty('arActive');
}

/** 지갑에 코인 더하기 (학생이 같은 때 지갑을 바꿔도 덮어쓰지 않게 ETag로) */
function arAddWallet_(k, coin) {
  for (let i = 0; i < 6; i++) {
    const w = arGet_('/students/' + k + '/wallet', true);
    if (w.val === null || w.val === undefined) { if (!arGet_('/students/' + k + '/uid').val) return false; }
    const v = Math.round(((+w.val || 0) + coin) * 100) / 100;
    if (arPut_('/students/' + k + '/wallet', v, w.etag).ok) return true;
    Utilities.sleep(300);
  }
  return false;
}

function arPlayers_(rid) {
  const p = arGet_('/race/p').val || {};
  return Object.keys(p).filter(k => p[k] && p[k].rid === rid).map(k => ({ k: k, done: !!p[k].done, tm: +p[k].tm || 0, pen: +p[k].pen || 0 }));
}
function arMaxMs_(len) { return (Math.max(200, +len || 1000) / 1000) * 150e3 + 90e3; }

function arCfg_(c) {
  const hm = v => { const m = String(v || '').match(/^(\d{1,2}):(\d{2})$/); return m && +m[1] < 24 && +m[2] < 60 ? ('0' + m[1]).slice(-2) + ':' + m[2] : ''; };
  const times = String(c.runAutoT == null ? '08:45,12:45,15:00,18:00' : c.runAutoT).split(/[,\s]+/).map(hm).filter(Boolean);
  const prize = String(c.runPrize == null ? '10,8,6,4,2' : c.runPrize).split(',').map(x => { const n = +x; return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0; }).concat([0, 0, 0, 0, 0]).slice(0, 5);
  return {
    on: c.runAuto !== false, open: c.runOpen !== false, times: times.filter((t, i) => times.indexOf(t) === i).sort(),
    lead: [10, 5, 3].indexOf(+c.runAutoLead) >= 0 ? +c.runAutoLead : 10, min: Math.max(2, Math.min(30, Math.round(+c.runAutoMin || 5))),
    lockOn: c.runLock !== false, from: hm(c.runFrom) || '09:00', to: hm(c.runTo) || '12:10',
    len: [500, 800, 1000, 1500, 2000].indexOf(+c.runLen) >= 0 ? +c.runLen : 1000,
    hill: [0, 1, 2, 3, 4].indexOf(+c.runHill) >= 0 ? +c.runHill : 3, fork: [0, 120, 250].indexOf(+c.runFork) >= 0 ? +c.runFork : 250, prize: prize
  };
}
function arSkip_(c, t) { return c.lockOn && t >= c.from && t < c.to; }
function arKst_(ms) { const d = new Date(ms + AR_KST); return { dow: d.getUTCDay(), y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; }
function arSlot_(k, hm) {
  const h = +hm.slice(0, 2), mi = +hm.slice(3, 5), startAt = Date.UTC(k.y, k.m, k.d, h, mi) - AR_KST;
  return { id: k.y + '-' + ('0' + (k.m + 1)).slice(-2) + '-' + ('0' + k.d).slice(-2) + ' ' + hm, hm: hm, startAt: startAt };
}

/* ---------- Firebase (선생님 구글 계정 권한) ---------- */
function arFetch_(path, method, body, etag, ifMatch) {
  const h = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  if (etag) h['X-Firebase-ETag'] = 'true';
  if (ifMatch) h['if-match'] = ifMatch;
  const o = { method: method, headers: h, muteHttpExceptions: true };
  if (body !== undefined) { o.contentType = 'application/json'; o.payload = JSON.stringify(body); }
  return UrlFetchApp.fetch(AR_DB + path + '.json', o);
}
function arEtag_(r) { const h = r.getHeaders() || {}; return h.ETag || h.Etag || h.etag || ''; }
function arGet_(path, withEtag) {
  const r = arFetch_(path, 'get', undefined, withEtag);
  if (r.getResponseCode() !== 200) throw new Error('읽기 실패 ' + path + ': ' + r.getContentText());
  return { val: JSON.parse(r.getContentText()), etag: withEtag ? arEtag_(r) : '' };
}
/** etag를 주면 그사이 아무도 안 바꿨을 때만 써요 (바뀌었으면 ok:false) */
function arPut_(path, body, etag) {
  const r = arFetch_(path, 'put', body, false, etag || '');
  if (r.getResponseCode() === 412) return { ok: false };
  if (r.getResponseCode() !== 200) throw new Error('쓰기 실패 ' + path + ': ' + r.getContentText());
  return { ok: true };
}
function arPost_(path, body) { arFetch_(path, 'post', body); }
function arDel_(path) { arFetch_(path, 'delete'); }

/** 처음 한 번만 실행: 1분마다 자동 실행을 걸어요. */
function 자동대결_설치() {
  ScriptApp.getProjectTriggers().filter(tr => tr.getHandlerFunction() === 'autoRaceTick').forEach(tr => ScriptApp.deleteTrigger(tr));
  ScriptApp.newTrigger('autoRaceTick').timeBased().everyMinutes(1).create();
  autoRaceTick();
}
/** 자동 대결을 멈추고 싶을 때 (사이트에서 '자동 대결' 체크를 꺼도 돼요) */
function 자동대결_멈추기() {
  ScriptApp.getProjectTriggers().filter(tr => tr.getHandlerFunction() === 'autoRaceTick').forEach(tr => ScriptApp.deleteTrigger(tr));
}
