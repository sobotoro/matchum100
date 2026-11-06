# 맞춤법 100 퀴즈 · 학급 경제

초등 필수 어휘력 맞춤법 100 교재로 하루 한 번 퀴즈를 풀고, 받은 코인으로 저금·주식·상점을 경험하는 학급 경제 활동 페이지예요.

- 학생 주소: https://sobotoro.github.io/matchum100/
- 기록 저장: Firebase 실시간 데이터베이스 (스포츠클럽주간 `jumprope-board` 프로젝트의 `matchum` 칸)
- 선생님: 페이지에서 `선생님 로그인` → teacher@jumprope.board 계정으로 들어가면 선생님 탭이 보여요.
- 주가: GitHub Actions(`.github/workflows/prices.yml`)가 평일 장중 10분마다, 장 마감 뒤 한 번 더 네이버 시세를 가져와 `prices` 브랜치의 `market.json`에 올려요.

## 파일
| 파일 | 하는 일 |
|---|---|
| `index.html`, `style.css`, `app.js` | 화면과 동작 |
| `config.js` | Firebase 연결 설정, 선생님 이메일, 주가 파일 주소 |
| `scripts/prices.py` | 네이버 시세를 가져와 market.json을 만듦 |
| `firebase-rules.json` | Firebase 실시간 데이터베이스 규칙 (콘솔 > Realtime Database > 규칙에 적용된 내용) |

## 알아 두기
- 학생 비밀번호를 잊으면 선생님 탭 > 학생 > `비밀번호 초기화`를 눌러요. 코인 기록은 남고, 학생이 다음에 들어올 때 새 비밀번호를 정해요.
- GitHub는 60일 동안 저장소에 변화가 없으면 예약 작업(주가 갱신)을 멈춰요. 멈추면 Actions 탭에서 다시 켜 주세요.
- 학급 활동용이라 아주 능숙한 학생이 개발자 도구로 자기 코인을 고치는 것까지 완전히 막지는 못해요.
