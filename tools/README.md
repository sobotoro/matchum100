# 화면 확인 도구

로그인 뒤 화면은 비밀번호 없이는 볼 수 없어서, **가짜 학생 데이터**로 사이트를 띄워 화면을 찍어 확인하는 도구예요.
실제 사이트(`index.html`)는 이 폴더의 파일을 불러오지 않아요. 실제 학생 정보도 들어 있지 않아요.

## 쓰는 법
```
node tools/shot.js                      # 모든 화면 (50장쯤, 2~3분)
node tools/shot.js 'phone-student'      # 이름에 맞는 화면만
node tools/shot.js '' /tmp/shots        # 저장할 폴더 정하기 (기본: tools/out)
```
- 사진 이름: `기기-역할-메뉴[-dark].png` (예: `phone-student-quiz.png`, `pc-teacher-teacher-dark.png`)
- 기기 폭: phone 390, tablet 820, pc 1440
- 끝나면 자바스크립트 오류와 가로로 넘치는 화면을 알려 줘요. 없으면 `오류 없음`이라고 나와요.

## 더 자세히 보기
- 누른 뒤의 화면: `PRE="document.querySelector('#goBtn').click()" node tools/shot.js 'phone-student-quiz$'`
- 내린 뒤의 화면(따라오는 메뉴): `FULL=0 PRE="window.scrollTo(0,650)" node tools/shot.js 'phone-student-board$'`
- 선생님 알림 팝업이 떠 있는 상태로 찍기: `QS=pop=1 node tools/shot.js 'phone-student-quiz$'`
- 가짜 데이터 고치기: `mock-firebase.js` 위쪽의 학생·게시판·토의방 데이터를 고쳐요. 주소 뒤 `?as=student`, `?as=teacher`, `?as=none`으로 역할을 골라요.

## 준비물
- Node와 Playwright, 크롬. (Claude 작업 공간에는 이미 있어요.)
- 실제 글꼴로 찍으려면 이 폴더에서 `npm i @fontsource/ibm-plex-sans-kr`. 없어도 기본 글꼴로 찍혀요.

## 속담 자료 검사
```
node tools/check-sokdam.js
```
`sokdam.js`를 고친 뒤에 돌려요. 빈칸에 정답을 넣으면 속담이 되는지, 보기와 예시문이 겹치지 않는지, 헷갈리는 속담 묶음이 양쪽에 다 적혀 있는지 봐요.

- 속담 문제 화면 보기: `PRE="CFG={...CFG,subject:'속담'};startPractice([BY_ID['pm-1'],BY_ID['ps-1'],BY_ID['pc-1']])" node tools/shot.js 'phone-student-quiz$'`
- 문제 이름: `pc-번호`(완성하기), `pm-번호`(뜻 고르기), `ps-번호`(상황에 맞는 속담 고르기)

