// 속담 데이터(sokdam.js) 검사: 고친 뒤에 `node tools/check-sokdam.js`로 돌려요.
const fs=require('fs'),path=require('path');
const SD=new Function(fs.readFileSync(path.join(__dirname,'..','sokdam.js'),'utf8')+';return SD')();
const errs=[],by=new Map(SD.map(r=>[r[0],r]));
if(SD.length!==100)errs.push(`속담이 ${SD.length}개예요 (100개여야 해요)`);
SD.forEach(([n,p,m,q,a,w,s,x],i)=>{
  if(n!==i+1)errs.push(`${n}: 번호 순서`);
  if((q.match(/___/g)||[]).length!==1||q.replace('___',a)!==p)errs.push(`${n}: 빈칸에 정답을 넣으면 속담과 같아야 해요`);
  if(w.length!==3||new Set([a,...w]).size!==4)errs.push(`${n}: 완성하기 보기는 서로 다른 4개여야 해요`);
  if(s.length!==4||new Set(s).size!==4)errs.push(`${n}: 상황 예시문은 서로 다른 4개여야 해요`);
  x.forEach(y=>{if(!by.has(y)||!by.get(y)[7].includes(n))errs.push(`${n}: 헷갈리는 속담 ${y}번 쪽에도 ${n}번이 있어야 해요`)});
  if(99-x.length<3)errs.push(`${n}: 틀린 보기로 쓸 속담이 모자라요`);
});
[1,2].forEach(k=>{if(new Set(SD.map(r=>r[k])).size!==SD.length)errs.push(k===1?'같은 속담이 두 번 있어요':'같은 뜻풀이가 두 번 있어요')});
const all=SD.flatMap(r=>r[6]);if(new Set(all).size!==all.length)errs.push('같은 예시문이 두 번 있어요');
console.log(errs.length?errs.join('\n'):`오류 없음 (속담 ${SD.length}개, 문제 ${SD.length*2+all.length}개)`);
process.exitCode=errs.length?1:0;
