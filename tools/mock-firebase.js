/* 화면 확인용 가짜 Firebase: 진짜 서버 대신 메모리 안의 가짜 학생 데이터로 동작해요. 실제 사이트는 이 파일을 불러오지 않아요. */
(function(){
  const AS=new URLSearchParams(location.search).get("as")||"none";
  const now=Date.now(),H=3600e3;
  const kst=new Date(now).toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
  const names=["강민준","김서연","김하늘","박지호","이도윤","이수아","정예린","최현우","한지민","홍길동","윤서준","장하은"];
  const students={};
  names.forEach((nm,i)=>{const n=i+5,k=`5-2-${n}`;students[k]={grade:5,cls:2,num:n,name:nm,uid:"u"+n,wallet:300+i*137,bank:1000+i*211,lastPaid:kst,stocks:i%2?{c005930:{qty:0.004+i*0.001,cost:600+i*90}}:null,qCount:12+i,qRight:9+i}});
  Object.assign(students["5-2-7"],{wallet:1250,bank:3400,stocks:{c005930:{qty:0.006,cost:1250},c000660:{qty:0.0006,cost:820}},bagReq:{r1:{name:"칭찬 카드 1개",n:1,t:now-H}}});
  students["5-2-5"].meal={d:kst,t:now-0.5*H,c:250};students["5-2-6"].meal={d:kst,t:now-0.4*H,c:250};
  students["5-2-6"].mealSeen={d:kst,k:{"5-2-5":1}};
  const DBROOT={matchum:{
    config:{siteName:"CLASS LAB",tagline:"우리 반 실험실",board:"전체",roomWeekend:true,roomFrom:"00:00",roomTo:"23:59",mealFrom:"00:00",mealTo:"23:59"},
    students,
    logs:{"5-2-7":{l1:{t:now-30*H,text:"오늘의 도전 8문제 맞힘",amount:80},l2:{t:now-28*H,text:"은행에 저금",amount:-500},l3:{t:now-5*H,text:"은행 이자",amount:12.5},l4:{t:now-2*H,text:"선생님이 준 코인: 발표 잘했어요",amount:100}}},
    purchases:{"5-2-7":{p1:{t:now-50*H,name:"칭찬 카드 1개",price:100,code:"4821",used:true,usedAt:now-40*H},p2:{t:now-20*H,name:"칭찬 카드 2개",price:190,code:"7730",used:false},p3:{t:now-3*H,name:"코인 복권",price:50,code:"1193",used:false,kind:"lotto"}},
               "5-2-8":{p4:{t:now-6*H,name:"칭찬 카드 1개",price:100,code:"5521",used:false}}},
    board:{posts:{b1:{k:"T",name:"선생님",text:"이번 주 금요일은 현장 체험 학습이에요. 도시락을 꼭 챙겨 오세요!",t:now-26*H,notice:true},b2:{k:"5-2-7",name:"김하늘",text:"오늘 급식 진짜 맛있었다. 다들 완식했어?",t:now-4*H},b3:{k:"5-2-9",name:"이도윤",text:"주식 삼성전자 올랐어요!! 저금보다 좋은 것 같아요",t:now-2*H}},
      comments:{b2:{c1:{k:"5-2-8",name:"박지호",text:"나도 다 먹었어!",t:now-3.5*H},c2:{k:"5-2-7",name:"김하늘",text:"오 대단해",t:now-3.4*H,re:"c1",to:"5-2-8",toName:"박지호"},c3:{k:"T",name:"선생님",text:"모두 잘 먹었어요. 칭찬해요.",t:now-3*H}}},
      likes:{b2:{"5-2-8":true,"5-2-9":true,"5-2-7":true},b1:{"5-2-7":true}}},
    rooms:{list:{r1:{k:"5-2-7",title:"쉬는 시간에 교실에서 공놀이를 해도 될까?",q:"다칠 수도 있지만 재미있어요. 여러분 생각은 어때요?",type:"vote",t:now-3*H},r2:{k:"T",title:"학급 장기 자랑 아이디어 모으기",q:"12월 장기 자랑에서 하고 싶은 것을 적어 주세요.",type:"idea",t:now-5*H},r3:{k:"5-2-9",title:"체육 시간에 하고 싶은 종목",q:"하나만 골라 주세요.",type:"poll",opts:{o1:"피구",o2:"축구",o3:"줄넘기"},t:now-8*H},r4:{k:"5-2-8",title:"책 추천해 주세요",q:"재미있게 읽은 책을 알려 주세요.",type:"talk",anon:true,t:now-30*H,closed:now-20*H,closedBy:"5-2-8",summary:"해리 포터와 푸른 사자 와니니가 가장 많이 추천됐어요."}},
      msgs:{r1:{m1:{k:"5-2-7",text:"저는 찬성이에요. 말랑한 공으로 하면 안전해요.",t:now-2.9*H,tag:"의견"},m2:{k:"5-2-8",text:"반대예요. 책상에 부딪히면 다쳐요.",t:now-2.8*H,tag:"반대"},m3:{k:"T",text:"두 의견 모두 근거가 있어서 좋아요. 규칙을 정하면 어떨까요?",t:now-2.5*H},m4:{k:"5-2-9",text:"그럼 창가 쪽에서만 하기로 해요!",t:now-2.2*H,tag:"질문",re:"m3"}},
            r2:{m5:{k:"5-2-7",text:"반 전체 합창",t:now-4*H},m6:{k:"5-2-10",text:"마술 쇼",t:now-3.8*H},m7:{k:"5-2-11",text:"태권도 시범",t:now-3.5*H}}},
      members:{r1:{"5-2-7":{t:now-3*H,side:"pro"},"5-2-8":{t:now-2.9*H,side:"con"},"5-2-9":{t:now-2.3*H,side:"mid"}},r2:{"5-2-7":{t:now-4*H},"5-2-10":{t:now-3.8*H},"5-2-11":{t:now-3.5*H}}},
      votes:{r3:{"5-2-7":"o1","5-2-8":"o1","5-2-9":"o2"}},react:{r1:{m1:{"5-2-8":true,"5-2-9":true}}}},
    market:null
  }};
  const parts=p=>String(p).split("/").filter(Boolean);
  const clone=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
  const get=p=>{let o=DBROOT;for(const k of parts(p)){if(o==null||typeof o!=="object")return null;o=o[k]}return o===undefined?null:o};
  const clean=v=>{if(v&&typeof v==="object"){for(const k of Object.keys(v)){if(v[k]===null||v[k]===undefined)delete v[k];else clean(v[k])}}return v};
  const setp=(p,v)=>{const ks=parts(p);let o=DBROOT;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=="object")o[ks[i]]={};o=o[ks[i]]}
    if(v===null||v===undefined)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=clean(clone(v))};
  const subs=[];let pend=false;
  const snap=(p,lim)=>{let v=clone(get(p));if(lim&&v&&typeof v==="object"){const ks=Object.keys(v).slice(-lim),o={};ks.forEach(k=>o[k]=v[k]);v=o}
    if(v&&typeof v==="object"&&!Object.keys(v).length)v=null;return {val:()=>v,exists:()=>v!==null,key:parts(p).pop()}};
  const notify=()=>{if(pend)return;pend=true;setTimeout(()=>{pend=false;subs.slice().forEach(s=>{try{s.fn(snap(s.p,s.lim))}catch(e){console.error("mock listener",e)}})},0)};
  let seq=0;
  function ref(p,lim){
    const r={key:parts(p).pop(),
      on(ev,fn){const s={r,p,lim,fn};subs.push(s);setTimeout(()=>fn(snap(p,lim)),0)},
      off(){for(let i=subs.length-1;i>=0;i--)if(subs[i].r===r)subs.splice(i,1)},
      once(){return Promise.resolve(snap(p,lim))},
      set(v){setp(p,v);notify();return Promise.resolve()},
      update(o){Object.entries(o).forEach(([k,v])=>setp(p+"/"+k,v));notify();return Promise.resolve()},
      remove(){setp(p,null);notify();return Promise.resolve()},
      transaction(fn){const out=fn(clone(get(p)));if(out===undefined)return Promise.resolve({committed:false,snapshot:snap(p)});setp(p,out);notify();return Promise.resolve({committed:true,snapshot:snap(p)})},
      limitToLast(n){return ref(p,n)},
      child(c){return ref(p+"/"+c)},
      push(v){const k="k"+(Date.now()+(seq++));const c=ref(p+"/"+k);if(v!==undefined){setp(p+"/"+k,v);notify()}
        const t=Object.create(c);t.then=(res,rej)=>Promise.resolve(c).then(res,rej);return t}};
    return r;
  }
  const user=AS==="teacher"?{email:"teacher@jumprope.board",uid:"T"}:AS==="student"?{email:"s5-2-7-0@matchum100.class",uid:"u7"}:null;
  let authCb=null,cur=user;
  const auth={get currentUser(){return cur},onAuthStateChanged(cb){authCb=cb;setTimeout(()=>cb(cur),0)},signOut(){cur=null;authCb&&authCb(null);return Promise.resolve()},
    signInWithEmailAndPassword(){return Promise.reject({code:"auth/invalid-credential"})},createUserWithEmailAndPassword(){return Promise.reject({code:"auth/operation-not-allowed"})}};
  const database=()=>({ref:p=>ref(p||"")});database.ServerValue={TIMESTAMP:Date.now()};
  window.firebase={initializeApp(){},database,auth:()=>auth};
  window.__DB=DBROOT;
})();
