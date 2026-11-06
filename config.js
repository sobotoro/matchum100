// Firebase 연결 설정 (스포츠클럽주간 jumprope-board 프로젝트를 함께 씁니다. 퀴즈 기록은 matchum 칸에 따로 저장돼요)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDNT4DW7NyoE1eUd_N-V5F7HhglitUt66I",
  authDomain: "jumprope-board.firebaseapp.com",
  databaseURL: "https://jumprope-board-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jumprope-board",
  storageBucket: "jumprope-board.firebasestorage.app",
  messagingSenderId: "862136223761",
  appId: "1:862136223761:web:70335fdf7a9b3230fd89b0"
};

// 선생님 계정 이메일 (이 계정으로 로그인하면 선생님 탭이 보여요)
window.EDITOR_EMAIL = "teacher@jumprope.board";

// 주가: GitHub Actions가 prices 브랜치에 올리는 파일
window.PRICES_URL = "https://raw.githubusercontent.com/sobotoro/matchum100/prices/market.json";
