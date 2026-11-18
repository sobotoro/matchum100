// 화면 확인 도구: 가짜 Firebase를 끼워 학생·선생님의 모든 메뉴를 휴대폰·태블릿·PC 폭으로 찍어요.
// 사용: node tools/shot.js [이름 필터(정규식)] [출력 폴더]      예) node tools/shot.js 'phone-student'
// 환경 변수: QS="pop=1" (주소에 덧붙일 값), PRE="찍기 전에 화면에서 실행할 자바스크립트", FULL=0 (보이는 부분만 찍기)
const http=require('http'),fs=require('fs'),path=require('path');
let pw;try{pw=require('playwright')}catch(_){pw=require('/opt/npm-tools/node_modules/playwright')}
const {chromium}=pw;
const REPO=path.resolve(__dirname,'..'),FILTER=process.argv[2]||"",OUT=path.resolve(process.argv[3]||path.join(__dirname,'out'));
// 글꼴: tools 폴더에서 `npm i @fontsource/ibm-plex-sans-kr`를 해 두면 실제 글꼴로 찍어요. 없으면 기기 기본 글꼴로 찍어요.
let FONT=null;try{FONT=path.dirname(require.resolve('@fontsource/ibm-plex-sans-kr/package.json'))}catch(_){}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.svg':'image/svg+xml'};
const fontCss=FONT?[400,500,600,700].map(w=>['korean','latin'].map(s=>fs.readFileSync(path.join(FONT,`${s}-${w}.css`),'utf8').replace(/url\(\.\/files\//g,'url(/__font/files/')).join('\n')).join('\n'):'';
const srv=http.createServer((q,s)=>{
  const u=decodeURIComponent(q.url.split('?')[0]);
  const f=FONT&&u.startsWith('/__font/')?path.join(FONT,u.slice(8)):path.join(REPO,u==='/'?'index.html':u);
  if(!f.startsWith(REPO)&&!(FONT&&f.startsWith(FONT))){s.writeHead(403);return s.end()}
  fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('nf')}s.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});s.end(d)});
}).listen(0,async()=>{
  const base=`http://127.0.0.1:${srv.address().port}/`;
  const mock=fs.readFileSync(path.join(__dirname,'mock-firebase.js'),'utf8');
  const chrome='/usr/bin/google-chrome';
  const browser=await chromium.launch(fs.existsSync(chrome)?{executablePath:chrome,args:['--no-sandbox']}:{});
  fs.mkdirSync(OUT,{recursive:true});
  const VP={phone:{width:390,height:844},tablet:{width:820,height:1180},pc:{width:1440,height:900}};
  const jobs=[];
  const S=["quiz","bank","stock","shop","class","board","rooms","me"],T=["teacher","quiz","stock","class","board","rooms"];
  for(const vp of Object.keys(VP)){
    jobs.push({vp,as:"none",tab:"login",scheme:"light"});
    S.forEach(tab=>jobs.push({vp,as:"student",tab,scheme:"light"}));
    T.forEach(tab=>jobs.push({vp,as:"teacher",tab,scheme:"light"}));
  }
  ["quiz","bank","board","rooms"].forEach(tab=>jobs.push({vp:"phone",as:"student",tab,scheme:"dark"}));
  jobs.push({vp:"pc",as:"teacher",tab:"teacher",scheme:"dark"});
  const errs=[];let n=0;
  for(const j of jobs){
    const name=`${j.vp}-${j.as}-${j.tab}${j.scheme==="dark"?"-dark":""}`;
    if(FILTER&&!new RegExp(FILTER).test(name))continue;
    const ctx=await browser.newContext({viewport:VP[j.vp],colorScheme:j.scheme,deviceScaleFactor:1,locale:'ko-KR',timezoneId:'Asia/Seoul'});
    const page=await ctx.newPage();
    page.on('pageerror',e=>errs.push(name+': '+e.message));
    page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_/.test(m.text()))errs.push(name+' console: '+m.text())});
    // 바깥 주소는 모두 막고, Firebase 스크립트 자리에 가짜를 넣어요.
    await page.route('**/*',r=>{const u=r.request().url();
      if(u.startsWith(base))return r.continue();
      if(/firebase-app-compat/.test(u))return r.fulfill({contentType:'text/javascript',body:mock});
      if(/gstatic\.com\/firebasejs/.test(u))return r.fulfill({contentType:'text/javascript',body:''});
      if(/fonts\.googleapis\.com/.test(u))return r.fulfill({contentType:'text/css',body:fontCss});
      return r.abort()});
    await page.goto(`${base}?as=${j.as}${process.env.QS?'&'+process.env.QS:''}#${j.tab==="login"?"":j.tab}`);
    await page.waitForTimeout(500);
    if(process.env.PRE)await page.evaluate(process.env.PRE).catch(e=>errs.push(name+' pre: '+e.message));
    await page.waitForTimeout(250);
    const ov=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    if(ov.sw>ov.cw+1)errs.push(`${name}: 가로 넘침 ${ov.sw}>${ov.cw}`);
    await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:process.env.FULL!=='0'});
    await ctx.close();n++;
  }
  await browser.close();srv.close();
  console.log(`${n}장 찍음 → ${OUT}`);
  console.log(errs.length?errs.join('\n'):'오류 없음');
  process.exitCode=errs.length?1:0;
});
