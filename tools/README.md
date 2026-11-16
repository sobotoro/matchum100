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
- 가짜 데이터 고치기: `mock-firebase.js` 위쪽의 학생·게시판·토의방 데이터를 고쳐요. 주소 뒤 `?as=student`, `?as=teacher`, `?as=none`으로 역할을 골라요.

## 준비물
- Node와 Playwright, 크롬. (Claude 작업 공간에는 이미 있어요.)
- 실제 글꼴로 찍으려면 이 폴더에서 `npm i @fontsource/ibm-plex-sans-kr`. 없어도 기본 글꼴로 찍혀요.
