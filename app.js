/* 맞춤법 100 퀴즈 · 학급 경제 (Firebase 실시간 데이터베이스 + GitHub Pages) */

/* ---------- 화면 뼈대 ---------- */
document.getElementById("app").innerHTML=`
  <header class="top">
    <div>
      <p class="eyebrow">초등 필수 어휘력 · 쓰면서 익히는 맞춤법</p>
      <h1>맞춤법 <em>100</em> 퀴즈</h1>
    </div>
    <div class="me" id="me"></div>
  </header>
  <nav class="tabs" id="tabs" role="tablist" aria-label="메뉴" hidden>
    <button type="button" role="tab" data-tab="quiz" id="tab-quiz">오늘의 퀴즈</button>
    <button type="button" role="tab" data-tab="bank" id="tab-bank">지갑·은행</button>
    <button type="button" role="tab" data-tab="stock" id="tab-stock">주식</button>
    <button type="button" role="tab" data-tab="shop" id="tab-shop">상점</button>
    <button type="button" role="tab" data-tab="class" id="tab-class">우리 반</button>
    <button type="button" role="tab" data-tab="teacher" id="tab-teacher" hidden>선생님</button>
  </nav>
  <section class="view" id="view-login" hidden></section>
  <section class="view" id="view-quiz" hidden>
    <section class="tbanner" id="tbanner" hidden></section>
    <div class="notes" id="notes" hidden></div>
    <main id="stage" aria-live="polite"></main>
  </section>
  <section class="view" id="view-bank" hidden></section>
  <section class="view" id="view-stock" hidden></section>
  <section class="view" id="view-shop" hidden></section>
  <section class="view" id="view-class" hidden></section>
  <section class="view" id="view-teacher" hidden></section>
`;

/* [일차, 번호, 바른 말, 틀린 말, 설명, 문장, (문장 정답), (문장 오답)] */
const A=[
[1,1,"아기","애기","'애기'는 소리 나는 대로 쓴 말이고, 표준어는 '아기'예요.","엄마 품에서 ___가 새근새근 잠들었다."],
[1,1,"창피","챙피","'챙피'가 아니라 '창피'가 표준어예요.","발표하다 말을 더듬어서 ___했다."],
[1,2,"건더기","건데기","국물 속에 든 덩어리는 '건더기'예요. '데'가 아니라 '더'로 써요.","라면 국물만 마시고 ___는 남겼다."],
[1,2,"무더기","무데기","한데 수북이 쌓인 것은 '무더기'예요. 이것도 '더'로 써요.","길가에 낙엽이 한 ___ 쌓여 있다."],
[1,3,"우유갑","우유곽","'갑'은 물건을 담는 작은 상자를 뜻해요. '곽'은 잘못된 말이에요.","다 마신 ___은 씻어서 펼쳐 말린다."],
[1,3,"역할","역활","맡은 일을 뜻하는 말은 '역할'이에요. '활'이 아니라 '할'이에요.","연극에서 내가 맡은 ___은 나무꾼이다."],
[1,4,"양복장이","양복쟁이","그 일을 직업으로 하는 기술자에게는 '-장이'를 붙여요(간판장이처럼).","옷을 맞추러 솜씨 좋은 ___를 찾아갔다."],
[1,4,"욕심쟁이","욕심장이","그런 성질을 많이 가진 사람에게는 '-쟁이'를 붙여요(고집쟁이처럼).","과자를 혼자 다 먹다니 너는 ___구나!"],
[2,5,"베개","베게","잠잘 때 머리를 받치는 물건은 '베개'예요. '게'가 아니라 '개'예요.","푹신한 ___를 베고 누웠다."],
[2,5,"찌개","찌게","'개'와 '게'는 소리가 비슷하지만 '찌개'가 바른 말이에요.","보글보글 끓는 된장___ 냄새가 난다."],
[2,6,"도대체","도데체","'도데체'는 잘못된 말이고 '도대체'가 바른 말이에요.","___ 내 지우개는 어디로 간 걸까?"],
[2,6,"재작년","제작년","'재'는 '다시, 두 번째'라는 뜻이에요. 그래서 지난해의 전 해는 '재작년'이에요.","___에는 1학년이었는데 벌써 3학년이 되었다."],
[2,7,"쓰레기","쓰래기","'쓰래기'가 아니라 '쓰레기'가 바른 말이에요.","운동장에 떨어진 ___를 주웠다."],
[2,7,"건네다","건내다","기본형이 '건네다'라서 지난 일은 '건넸다'로 써요.","친구에게 생일 선물을 ___.","건넸다","건냈다"],
[2,8,"요새","요세","'요사이'가 줄어든 말이라 '요새'예요.","___ 날씨가 부쩍 추워졌다."],
[2,8,"금세","금새","'금시에'가 줄어든 말이라 '금세'예요.","아이스크림이 ___ 녹아 버렸다."],
[3,9,"함부로","함부러","'함부로'의 끝 글자는 '로'예요.","도서관 책에 ___ 낙서하면 안 된다."],
[3,9,"일부러","일부로","'일부러'의 끝 글자는 '러'예요. '함부로'와 헷갈리지 않게 기억해요.","동생을 놀래 주려고 ___ 숨어 있었다."],
[3,10,"삼촌","삼춘","'삼춘'이 아니라 '삼촌'이 표준어예요.","주말에 ___과 낚시를 갔다."],
[3,10,"쌍둥이","쌍동이","'쌍동이'가 아니라 '쌍둥이'가 표준어예요.","옆 반 ___ 형제는 얼굴이 꼭 닮았다."],
[3,11,"수군대다","수근대다","남이 못 듣게 작은 소리로 이야기하는 것은 '수군대다'예요.","친구들이 내 뒤에서 ___ 것 같았다.","수군대는","수근대는"],
[3,11,"핼쑥하다","핼쓱하다","얼굴이 마르고 핏기가 없는 것은 '핼쑥하다'예요.","감기를 앓고 나더니 얼굴이 ___.","핼쑥해졌다","핼쓱해졌다"],
[3,12,"웃어른","윗어른","'위·아래'로 짝이 없는 말 앞에는 '웃-'을 써요. '아랫어른'은 없으니 '웃어른'이에요.","___께는 두 손으로 물건을 드린다."],
[3,12,"윗니","웃니","'아랫니'가 있으니 '위'를 뜻하는 '윗-'을 붙여 '윗니'라고 써요.","흔들리던 ___가 드디어 빠졌다."],
[4,13,"방귀","방구","'방구'라고 많이 말하지만 바른 말은 '방귀'예요.","엘리베이터에서 누가 ___를 뀌었다."],
[4,13,"아귀찜","아구찜","물고기 이름이 '아귀'라서 '아귀찜'으로 써요.","할머니께서 매콤한 ___을 만들어 주셨다."],
[4,14,"뵈다","봬다","'봬'는 '뵈어'가 줄어든 말이에요. 기본형은 '뵈다'라서 '뵈었다'로 써요.","설날에 할아버지를 ___.","뵈었다","봬었다"],
[4,14,"쐬다","쐐다","'쐐'는 '쐬어'가 줄어든 말이에요. 기본형은 '쐬다'라서 '쐬었다'로 써요.","답답해서 밖에 나가 바람을 ___.","쐬었다","쐐었다"],
[4,15,"웬일","왠일","'어찌 된 일'이라는 뜻은 '웬일'이에요. '왠'이 들어간 말은 '왠지'뿐이에요.","늦잠꾸러기 형이 ___로 일찍 일어났다."],
[4,15,"왠지","웬지","'왜인지'가 줄어든 말이라 '왠지'예요.","오늘은 ___ 좋은 일이 생길 것 같다."],
[4,16,"훼손","회손","헐거나 깨뜨려 못 쓰게 만드는 것은 '훼손'이에요.","공원 나무를 ___하면 안 된다."],
[4,16,"당최","당췌","'당초에'가 줄어든 말이라 '당최'예요.","동생이 하는 말을 ___ 알아들을 수가 없다."],
[5,17,"잠그다","잠구다","기본형이 '잠그다'라서 '잠갔다, 잠그고'로 써요.","집을 나서며 현관문을 ___.","잠갔다","잠궜다"],
[5,17,"담그다","담구다","기본형이 '담그다'라서 '담갔다, 담그고'로 써요.","할머니와 함께 김치를 ___.","담갔다","담궜다"],
[5,18,"치르다","치루다","기본형이 '치르다'라서 '치렀다'로 써요.","어제 수학 시험을 ___.","치렀다","치뤘다"],
[5,18,"움츠리다","움추리다","기본형이 '움츠리다'라서 '움츠렸다'로 써요.","찬바람에 어깨를 잔뜩 ___.","움츠렸다","움추렸다"],
[5,19,"십상","쉽상","'십상'은 거의 틀림없다는 뜻이에요. '쉽다'와는 관계가 없어요.","서두르다가는 넘어지기 ___이다."],
[5,19,"두더지","두더쥐","쥐의 한 종류 같지만 '두더지'가 바른 말이에요.","밭에 ___가 굴을 파 놓았다."],
[5,20,"트림","트름","'트름'이 아니라 '트림'이 바른 말이에요.","탄산음료를 마셨더니 ___이 났다."],
[5,20,"어이없다","어의없다","너무 뜻밖이라 기가 막히는 것은 '어이없다'예요.","공을 헛발질해서 ___ 웃음이 나왔다.","어이없는","어의없는"],
[6,21,"승낙","승락","'승락'이 아니라 '승낙'이 바른 말이에요.","엄마께 친구 집에 가도 된다는 ___을 받았다."],
[6,21,"곤란","곤난","'곤난'이 아니라 '곤란'이 바른 말이에요.","갑자기 비가 와서 ___한 상황이 되었다."],
[6,22,"통째","통채","'-째'는 '그대로, 전부'라는 뜻이라 '통째'예요.","사과를 깎지 않고 ___로 먹었다."],
[6,22,"어차피","어짜피","'어짜피'가 아니라 '어차피'가 바른 말이에요.","___ 해야 할 숙제라면 지금 하자."],
[6,23,"덩굴","덩쿨","'덩쿨'은 잘못된 말이에요. '덩굴'이나 '넝쿨'로 써요.","담장을 따라 호박 ___이 뻗어 있다."],
[6,23,"폭발","폭팔","'폭팔'이 아니라 '폭발'이 바른 말이에요.","화산이 ___하는 장면을 영상으로 보았다."],
[6,24,"불현듯","불연듯","갑자기 생각이 떠오르는 모양은 '불현듯'이에요.","___ 집에 두고 온 준비물이 생각났다."],
[6,24,"희한하다","희안하다","매우 드물거나 신기한 것은 '희한하다'예요.","구름 모양이 정말 ___.","희한하다","희안하다"],
[7,25,"오랫동안","오랜동안","'오래'와 '동안'이 합쳐지며 사이시옷이 들어가 '오랫동안'이 돼요.","___ 기다린 소풍날이 드디어 왔다."],
[7,25,"오랜만","오랫만","'오래간만'이 줄어든 말이라 '오랜만'이에요.","___에 사촌 동생을 만났다."],
[7,26,"빨간색","빨강색","'빨강'에 이미 색의 뜻이 있어요. '빨간색'이나 '빨강'으로 써요.","신호등이 ___으로 바뀌었다."],
[7,26,"노란색","노랑색","'노랑'에 이미 색의 뜻이 있어요. '노란색'이나 '노랑'으로 써요.","봄이 되자 ___ 개나리가 피었다."],
[7,27,"숟가락","숫가락","'숟가락'은 받침이 'ㄷ'이에요. '젓가락'과 다르니 조심해요.","국을 ___으로 떠먹었다."],
[7,27,"젓가락","젇가락","'젓가락'은 받침이 'ㅅ'이에요. '숟가락'과 받침이 달라요.","___으로 콩을 집는 연습을 했다."],
[7,28,"오지랖","오지랍","웃옷의 앞자락을 뜻하는 말은 '오지랖'이에요.","남의 일에 참견을 잘하는 사람을 ___이 넓다고 한다."],
[7,28,"갚다","값다","빌린 것을 돌려줄 때는 '갚다'예요. '값'은 물건의 가격이에요.","친구에게 빌린 돈을 ___.","갚았다","값았다"],
[8,29,"꺾다","꺽다","'꺾다'의 받침은 'ㄲ'이에요.","꽃을 함부로 ___ 안 된다.","꺾으면","꺽으면"],
[8,29,"닦달","닥달","'닦달'의 '닦'도 받침이 'ㄲ'이에요.","숙제를 빨리 하라고 형이 ___했다."],
[8,30,"섞다","석다","'섞다'의 받침은 'ㄲ'이에요.","파란색과 노란색 물감을 ___ 초록색이 된다.","섞으면","석으면"],
[8,30,"썩다","썪다","'썩다'의 받침은 'ㄱ' 하나예요.","양치를 안 하면 이가 ___.","썩는다","썪는다"],
[8,31,"묻다","뭍다","땅속에 넣고 흙으로 덮는 것은 '묻다'예요.","화단에 씨앗을 ___.","묻었다","뭍었다"],
[8,31,"숫기","숯기","활발해서 부끄러움을 타지 않는 기운은 '숫기'예요.","동생은 ___가 없어서 낯선 사람 앞에서 말을 못 한다."],
[8,32,"부엌","부억","소리는 [부억]처럼 나도 받침은 'ㅋ'이라 '부엌'이에요.","엄마가 ___에서 요리를 하신다."],
[8,32,"벚꽃","벗꽃","'벚나무의 꽃'이라서 '벚꽃'으로 써요.","봄이면 학교 앞에 ___이 활짝 핀다."],
[9,33,"덥석","덥썩","소리는 [덥썩]이지만 '덥석'으로 써요.","강아지가 간식을 ___ 물었다."],
[9,33,"법석","법썩","소리는 [법썩]이지만 '법석'으로 써요.","생일 파티 준비로 집 안이 ___이었다."],
[9,34,"거꾸로","꺼꾸로","'꺼꾸로'가 아니라 '거꾸로'로 쓰고 읽어요.","그림을 ___ 걸어 놓았다."],
[9,34,"주꾸미","쭈꾸미","'쭈꾸미'가 아니라 '주꾸미'로 쓰고 읽어요.","바닷가 식당에서 ___ 볶음을 먹었다."],
[9,35,"뚝배기","뚝빼기","'뚝배기'에서는 '배'로 써요.","___에 담긴 된장찌개가 보글보글 끓는다."],
[9,35,"곱빼기","곱배기","'곱빼기'에서는 '빼'로 써요. '뚝배기'와 달라요.","배가 고파서 짜장면 ___를 시켰다."],
[9,36,"짭짤하다","짭잘하다","비슷한 소리가 겹치는 말이라 '짭짤하다'로 써요.","감자칩 맛이 ___.","짭짤하다","짭잘하다"],
[9,36,"멋쩍다","멋적다","어색하고 쑥스러운 것은 '멋쩍다'예요.","칭찬을 받으니 ___ 머리를 긁었다.","멋쩍어서","멋적어서"],
[10,37,"며칠","몇일","'몇일'이라고 쓰는 경우는 없어요. 언제나 '며칠'이에요.","방학이 ___ 남았는지 세어 보았다."],
[10,37,"설거지","설겆이","'설겆이'가 아니라 '설거지'가 바른 말이에요.","저녁을 먹고 내가 ___를 했다."],
[10,38,"건드리다","건들이다","'건드리다'가 바른 말이에요.","자는 고양이를 ___ 마.","건드리지","건들이지"],
[10,38,"부리나케","불이나케","몹시 서둘러 급하게라는 뜻은 '부리나케'예요.","늦잠을 자서 ___ 학교로 뛰어갔다."],
[10,39,"깍두기","깍둑이","'깍둑이'가 아니라 '깍두기'예요.","설렁탕에는 ___가 잘 어울린다."],
[10,39,"뻐꾸기","뻐꾹이","'뻐꾹이'가 아니라 '뻐꾸기'예요.","숲속에서 ___ 우는 소리가 들렸다."],
[10,40,"낭떠러지","낭떨어지","'떨어지다'가 떠오르지만 '낭떠러지'로 써요.","___ 근처에서는 조심해야 한다."],
[10,40,"빈털터리","빈털털이","'빈털털이'가 아니라 '빈털터리'로 써요.","용돈을 다 써서 ___가 되었다."],
[11,41,"얼마큼","얼만큼","'얼마만큼'이 줄어든 말이라 '얼마큼'이에요.","학교까지 ___ 더 가야 해?"],
[11,41,"자그마치","자그만치","생각보다 많다는 뜻은 '자그마치'예요.","줄넘기를 ___ 백 번이나 했다."],
[11,42,"기다랗다","길다랗다","'길다'에서 왔지만 '기다랗다'가 바른 말이에요.","기린은 목이 ___.","기다랗다","길다랗다"],
[11,42,"졸리다","졸립다","'졸립다'는 잘못된 말이고 '졸리다'가 바른 말이에요.","점심을 먹고 나니 너무 ___.","졸리다","졸립다"],
[11,43,"설레다","설레이다","'설레이다'처럼 '이'를 넣지 않아요. '설렌다, 설렘'으로 써요.","내일 소풍 갈 생각에 마음이 ___.","설렌다","설레인다"],
[11,43,"데다","데이다","뜨거운 것에 닿아 다치는 것은 '데다'예요. '데었다'로 써요.","뜨거운 냄비에 손을 ___.","데었다","데였다"],
[11,44,"삼가다","삼가하다","'삼가하다'는 잘못된 말이에요. '삼가다, 삼가 주세요'로 써요.","도서관에서는 큰 소리로 떠드는 것을 ___ 주세요.","삼가","삼가해"],
[11,44,"놀래다","놀래키다","남을 놀라게 하는 것은 '놀래다'예요.","문 뒤에 숨어서 동생을 ___ 주었다.","놀래","놀래켜"],
[12,45,"솔직히","솔직이","'솔직하다'처럼 '-하다'가 붙는 말은 '-히'로 써요.","___ 말하면 나도 조금 무서웠어."],
[12,45,"조용히","조용이","'조용하다'처럼 '-하다'가 붙는 말은 '-히'로 써요.","도서관에서는 ___ 걸어야 한다."],
[12,46,"깨끗이","깨끗히","'-하다'가 붙는 말이라도 'ㅅ' 받침 뒤에서는 '-이'로 써요.","밥을 먹기 전에 손을 ___ 씻었다."],
[12,46,"뚜렷이","뚜렷히","'ㅅ' 받침 뒤에서는 '-이'로 써요.","안경을 쓰니 칠판 글씨가 ___ 보인다."],
[12,47,"틈틈이","틈틈히","'틈틈'처럼 같은 말이 겹친 말 뒤에는 '-이'를 붙여요.","쉬는 시간마다 ___ 책을 읽었다."],
[12,47,"낱낱이","낱낱히","'낱낱'처럼 같은 말이 겹친 말 뒤에는 '-이'를 붙여요.","탐정은 사건을 ___ 조사했다."],
[12,48,"가벼이","가벼히","'가볍다'처럼 'ㅂ' 받침이 바뀌는 말은 '-이'로 써요.","친구의 부탁을 ___ 여기지 마라."],
[12,48,"너그러이","너그러히","'너그럽다'처럼 'ㅂ' 받침이 바뀌는 말은 '-이'로 써요.","선생님께서 내 실수를 ___ 용서해 주셨다."],
[13,49,"비율","비률","'률'은 모음이나 'ㄴ' 받침 뒤에서 '율'로 바뀌어요.","우리 반은 남학생 ___이 조금 더 높다."],
[13,49,"할인율","할인률","'인'처럼 'ㄴ' 받침 뒤에서는 '율'로 써요.","이 운동화는 ___이 30%나 된다."],
[13,50,"확률","확율","'ㄴ'이 아닌 받침 뒤에서는 '률'을 그대로 써요.","동전을 던져 앞면이 나올 ___은 절반이다."],
[13,50,"성공률","성공율","'공'처럼 'ㅇ' 받침 뒤에서는 '률'을 그대로 써요.","연습을 많이 할수록 슛 ___이 올라간다."],
[13,51,"나열","나렬","'렬'은 모음이나 'ㄴ' 받침 뒤에서 '열'로 바뀌어요.","좋아하는 과일 이름을 차례로 ___해 보았다."],
[13,51,"진열","진렬","'진'처럼 'ㄴ' 받침 뒤에서는 '열'로 써요.","가게 창문에 새 장난감이 ___되어 있다."],
[13,52,"일렬","일열","'일'처럼 'ㄴ'이 아닌 받침 뒤에서는 '렬'을 그대로 써요.","체육 시간에 ___로 줄을 섰다."],
[13,52,"행렬","행열","'행'처럼 'ㅇ' 받침 뒤에서는 '렬'을 그대로 써요.","축제 날 거리에 긴 ___이 지나갔다."],
[14,53,"비눗방울","비누방울","'비누+방울'은 [비눋빵울]로 소리 나서 사이시옷을 붙여요.","놀이터에서 ___을 불었다."],
[14,53,"나뭇가지","나무가지","'나무+가지'는 [나묻까지]로 소리 나서 사이시옷을 붙여요.","___에 참새 두 마리가 앉아 있다."],
[14,54,"등굣길","등교길","'등교+길'은 [등교낄]로 소리 나서 사이시옷을 붙여요.","___에 친구와 만나 함께 걸었다."],
[14,54,"자릿수","자리수","'자리+수'는 [자릳쑤]로 소리 나서 사이시옷을 붙여요.","곱셈을 할 때는 ___를 잘 맞춰야 한다."],
[14,55,"개수","갯수","두 한자어가 만난 말에는 보통 사이시옷을 쓰지 않아요.","상자에 든 사과의 ___를 세어 보았다."],
[14,55,"대가","댓가","'대(代)+가(價)'는 두 한자어라 사이시옷을 쓰지 않아요.","열심히 노력한 ___로 상을 받았다."],
[14,56,"횟수","회수","'횟수'는 한자어끼리 만났지만 사이시옷을 쓰는 예외예요.","줄넘기 ___가 어제보다 늘었다."],
[14,56,"숫자","수자","'숫자'도 사이시옷을 쓰는 예외 낱말이에요.","내가 가장 좋아하는 ___는 7이다."],
[15,57,"초콜릿","초콜렛","외래어 표기법에 따라 '초콜릿'으로 써요.","밸런타인데이에 ___을 선물했다."],
[15,57,"비스킷","비스켓","외래어 표기법에 따라 '비스킷'으로 써요.","우유에 ___을 찍어 먹었다."],
[15,58,"주스","쥬스","외래어에는 '쥬'를 쓰지 않고 '주'로 써요.","아침마다 오렌지 ___를 마신다."],
[15,58,"텔레비전","텔레비젼","외래어에는 '젼'을 쓰지 않고 '전'으로 써요.","저녁에 가족과 ___을 보았다."],
[15,59,"메시지","메세지","'메'가 아니라 '시'가 들어가 '메시지'예요.","엄마께 문자 ___를 보냈다."],
[15,59,"소시지","소세지","'세'가 아니라 '시'가 들어가 '소시지'예요.","도시락 반찬으로 ___ 볶음이 나왔다."],
[15,60,"에어컨","에어콘","'에어컨디셔너'를 줄인 말이라 '컨'으로 써요.","너무 더워서 ___을 켰다."],
[15,60,"리모컨","리모콘","'리모트 컨트롤'을 줄인 말이라 '컨'으로 써요.","소파 밑에서 ___을 찾았다."]
];

/* [일차, 번호, 낱말1, 뜻1, 낱말2, 뜻2, [[문장, 정답, 오답], ...]] */
const B=[
[16,61,"가르치다","지식이나 기술을 알려 주다.","가리키다","손가락 등으로 방향이나 대상을 집어 보이다.",[["선생님께서 우리에게 구구단을 ___.","가르쳐 주셨다","가리켜 주셨다"],["동생이 손가락으로 하늘의 무지개를 ___.","가리켰다","가르쳤다"]]],
[16,62,"맞추다","떨어진 부분을 제자리에 맞게 붙이다.","맞히다","문제에 대한 옳은 답을 대다.",[["퍼즐 조각을 하나하나 ___.","맞췄다","맞혔다"],["퀴즈 다섯 문제를 모두 ___.","맞혔다","맞췄다"]]],
[16,63,"이따가","조금 지난 뒤에.","있다가","어느 곳에 머물다가.",[["지금은 바쁘니까 ___ 전화할게.","이따가","있다가"],["집에 ___ 심심해서 공원에 나갔다.","있다가","이따가"]]],
[16,64,"한참","꽤 오랜 시간.","한창","어떤 일이 가장 활발하게 일어나는 때.",[["버스가 오지 않아서 ___ 기다렸다.","한참","한창"],["지금 들판에서는 벼 베기가 ___이다.","한창","한참"]]],
[17,65,"갖다","손에 쥐거나 자기 것으로 하다('가지다'의 준말).","같다","서로 다르지 않고 하나이다.",[["나도 저런 자전거를 ___ 싶다.","갖고","같고"],["나와 짝꿍은 좋아하는 색이 ___.","같다","갖다"]]],
[17,66,"낫다","병이나 상처가 고쳐져 없어지다.","낳다","아이나 새끼, 알을 몸 밖으로 내놓다.",[["약을 먹었더니 감기가 금방 ___.","나았다","낳았다"],["우리 집 고양이가 새끼를 세 마리 ___.","낳았다","나았다"]]],
[17,67,"업다","사람이나 동물을 등에 대고 붙잡다.","엎다","물건을 거꾸로 돌려 위가 밑을 향하게 하다.",[["아빠가 잠든 동생을 등에 ___.","업었다","엎었다"],["실수로 물컵을 ___ 바닥이 젖었다.","엎어서","업어서"]]],
[17,68,"짓다","재료를 들여 밥, 옷, 집 등을 만들다.","짖다","개나 까치 등이 크게 소리를 내다.",[["할아버지께서 시골에 새집을 ___.","지으셨다","짖으셨다"],["옆집 강아지가 밤새 멍멍 ___.","짖었다","지었다"]]],
[18,69,"안다","두 팔로 가슴 쪽으로 끌어당겨 품다.","앉다","엉덩이를 바닥이나 의자에 붙이고 몸을 올려놓다.",[["곰 인형을 꼭 ___ 잠이 들었다.","안고","앉고"],["의자에 바르게 ___ 책을 읽었다.","앉아서","안아서"]]],
[18,70,"잃어버리다","갖고 있던 물건이 없어져 더 이상 갖지 못하다.","잊어버리다","알던 것을 기억하지 못하다.",[["놀이터에서 장갑 한 짝을 ___.","잃어버렸다","잊어버렸다"],["준비물을 챙기는 것을 깜빡 ___.","잊어버렸다","잃어버렸다"]]],
[18,71,"집다","손가락이나 도구로 물건을 잡아서 들다.","짚다","바닥이나 벽, 지팡이 등에 몸을 기대다.",[["젓가락으로 콩을 하나씩 ___.","집었다","짚었다"],["할머니께서 지팡이를 ___ 걸으신다.","짚고","집고"]]],
[18,72,"찢다","물체를 잡아당겨 갈라지게 하다.","찧다","곡식을 빻거나, 어디에 세게 부딪치다.",[["쓰지 않는 종이를 잘게 ___.","찢었다","찧었다"],["문틀에 이마를 ___ 혹이 났다.","찧어서","찢어서"]]],
[19,73,"거치다","오가는 길에 어디를 지나거나 들르다.","걷히다","구름이나 안개가 흩어져 없어지다.",[["학교에 가는 길에 문구점을 ___ 갔다.","거쳐","걷혀"],["해가 뜨자 안개가 ___.","걷혔다","거쳤다"]]],
[19,74,"다치다","부딪치거나 맞아서 몸에 상처가 생기다.","닫히다","열린 문이나 뚜껑이 다시 제자리로 가다.",[["축구를 하다 넘어져서 무릎을 ___.","다쳤다","닫혔다"],["바람이 불어 창문이 쾅 ___.","닫혔다","다쳤다"]]],
[19,75,"부치다","편지나 물건을 일정한 방법으로 상대에게 보내다.","붙이다","맞닿아서 떨어지지 않게 하다.",[["우체국에서 할머니께 소포를 ___.","부쳤다","붙였다"],["공책 표지에 이름표를 ___.","붙였다","부쳤다"]]],
[19,76,"시키다","어떤 일이나 행동을 하게 하다.","식히다","더운 기운을 없애다.",[["엄마가 나에게 방 청소를 ___.","시키셨다","식히셨다"],["뜨거운 국을 후후 불어서 ___.","식혔다","시켰다"]]],
[20,77,"드러내다","가려 있거나 보이지 않던 것을 보이게 하다.","들어내다","안에 있던 물건을 들어서 밖으로 옮기다.",[["강아지가 이빨을 ___ 으르렁거렸다.","드러내며","들어내며"],["이사하려고 방에서 책상을 ___.","들어냈다","드러냈다"]]],
[20,78,"무난하다","별로 어려움이 없거나 흠잡을 데가 없다.","문안하다","웃어른께 안부를 여쭙다.",[["시험이 어렵지 않아서 ___ 통과했다.","무난하게","문안하게"],["아버지는 주말마다 할머니께 전화로 ___.","문안하신다","무난하신다"]]],
[20,79,"반드시","틀림없이 꼭.","반듯이","비뚤어지지 않고 바르게.",[["약속 시간은 ___ 지켜야 한다.","반드시","반듯이"],["사진을 찍을 때 허리를 ___ 펴고 앉았다.","반듯이","반드시"]]],
[20,80,"저리다","피가 잘 통하지 못해 감각이 둔하고 아리다.","절이다","채소나 생선에 소금 등이 배어들게 하다.",[["오래 꿇어앉았더니 다리가 ___.","저렸다","절였다"],["김장을 하려고 배추를 소금에 ___.","절였다","저렸다"]]],
[21,81,"매다","끈이나 줄의 두 끝을 엇걸어 풀어지지 않게 묶다.","메다","물건을 어깨에 걸치거나 올려놓다.",[["운동화 끈을 단단히 ___.","맸다","멨다"],["책가방을 어깨에 ___ 집을 나섰다.","메고","매고"]]],
[21,82,"배다","냄새나 물기가 스며들다.","베다","날이 있는 도구로 자르거나 상처를 내다.",[["고기를 구웠더니 옷에 냄새가 ___.","배었다","베었다"],["종이에 손가락을 ___ 피가 났다.","베어서","배어서"]]],
[21,83,"새다","기체나 액체가 틈이나 구멍으로 빠져나가다.","세다","힘이나 기세가 보통보다 강하다.",[["물병 뚜껑이 헐거워서 물이 ___.","샜다","셌다"],["바람이 너무 ___ 우산이 뒤집혔다.","세서","새서"]]],
[21,84,"해치다","상하게 하거나 해를 입히다.","헤치다","앞을 가로막는 것을 좌우로 밀며 지나가다.",[["단 음식을 너무 많이 먹으면 건강을 ___.","해친다","헤친다"],["탐험대가 우거진 풀숲을 ___ 나아갔다.","헤치고","해치고"]]],
[22,85,"들르다","지나는 길에 잠깐 들어가 머무르다.","들리다","소리가 귀를 통해 알아차려지다.",[["집에 오는 길에 빵집에 ___.","들렀다","들렸다"],["창밖에서 새소리가 ___.","들린다","들른다"]]],
[22,86,"바라다","생각대로 어떤 일이 이루어지기를 원하다.","바래다","햇볕이나 습기를 받아 색이 변하다.",[["할머니의 건강을 ___ 마음으로 편지를 썼다.","바라는","바래는"],["오래된 사진이 누렇게 ___.","바랬다","바랐다"]]],
[22,87,"부수다","단단한 물체를 깨뜨려 여러 조각이 나게 하다.","부시다","빛이나 색이 강해서 마주 보기 어렵다.",[["공사장에서 낡은 담장을 ___.","부쉈다","부셨다"],["햇빛에 눈이 ___ 손으로 가렸다.","부셔서","부숴서"]]],
[22,88,"이루다","어떤 결과를 생기게 하거나 뜻한 대로 되게 하다.","이르다","어떤 장소에 도착하거나 어떤 때가 되다.",[["열심히 노력해서 꼭 꿈을 ___ 거야.","이룰","이를"],["한참을 걸어 마침내 산꼭대기에 ___.","이르렀다","이루었다"]]],
[23,89,"나르다","물건을 한 곳에서 다른 곳으로 옮기다.","날다","공중에 뜬 상태로 움직이다.",[["친구들과 함께 의자를 교실로 ___.","날랐다","날았다"],["제비가 하늘 높이 ___.","날아갔다","날라갔다"]]],
[23,90,"늘리다","크기나 수, 분량을 원래보다 많아지게 하다.","늘이다","길이를 원래보다 더 길어지게 하다.",[["도서관이 책상 수를 두 배로 ___.","늘렸다","늘였다"],["고무줄을 잡아당겨 길게 ___.","늘였다","늘렸다"]]],
[23,91,"벌리다","둘 사이를 넓히거나 열다.","벌이다","일을 계획하여 시작하거나 펼쳐 놓다.",[["치과에서 입을 크게 ___.","벌렸다","벌였다"],["운동장에서 줄다리기 시합을 ___.","벌였다","벌렸다"]]],
[23,92,"싸이다","물건이 보이지 않게 씌워져 가려지다.","쌓이다","여러 물건이 겹겹이 포개어 놓이다.",[["선물이 예쁜 포장지에 ___ 있었다.","싸여","쌓여"],["밤새 내린 눈이 마당에 소복이 ___.","쌓였다","싸였다"]]],
[24,93,"껍데기","달걀이나 조개처럼 겉을 싸고 있는 단단한 것.","껍질","물체의 겉을 싸고 있는 단단하지 않은 것.",[["바닷가에서 조개 ___ 여러 개를 주웠다.","껍데기","껍질"],["귤 ___ 벗기는 일은 내가 맡았다.","껍질","껍데기"]]],
[24,94,"다르다","비교하는 두 대상이 서로 같지 않다.","틀리다","셈이나 답, 사실이 그르게 되거나 어긋나다.",[["나와 언니는 좋아하는 음식이 ___.","다르다","틀리다"],["계산을 잘못해서 답이 ___.","틀렸다","달랐다"]]],
[24,95,"두껍다","두께가 보통보다 크다.","두텁다","믿음, 관계, 인정 등이 굳고 깊다.",[["겨울이라 ___ 외투를 꺼내 입었다.","두꺼운","두터운"],["두 사람은 오랜 친구라 우정이 ___.","두텁다","두껍다"]]],
[24,96,"작다","길이나 넓이, 부피가 기준에 미치지 못하다.","적다","수나 양이 기준에 미치지 못하다.",[["작년에 산 신발이 이제 발에 ___.","작다","적다"],["오늘은 급식 반찬의 양이 ___.","적다","작다"]]],
[25,97,"너머","높이나 경계로 가로막은 것의 저쪽.","넘어","높은 곳이나 경계를 지나서.",[["산 ___ 마을에 할머니 댁이 있다.","너머","넘어"],["고양이가 담을 ___ 도망갔다.","넘어","너머"]]],
[25,98,"대개","거의 전부, 또는 보통의 경우에.","되게","아주 몹시.",[["우리 반 친구들은 ___ 걸어서 학교에 온다.","대개","되게"],["오늘 급식 떡볶이가 ___ 맛있었다.","되게","대개"]]],
[25,99,"로서","어떤 지위나 신분, 자격을 나타냄.","로써","어떤 일의 재료나 수단, 도구를 나타냄.",[["나는 반장___ 친구들을 도왔다.","으로서","으로써"],["대화___ 오해를 풀었다.","로써","로서"]]],
[25,100,"어떡해","'어떻게 해'가 줄어든 말.","어떻게","어떤 방법으로, 어떤 모양으로.",[["아이스크림을 떨어뜨렸어. 이제 ___!","어떡해","어떻게"],["이 문제는 ___ 풀어야 할까?","어떻게","어떡해"]]]
];



/* ---------- 문제 은행 ---------- */
const ALL=[];
A.forEach(([d,n,r,w,e,s,ok,ng])=>{
  ALL.push({id:`s-${n}-${r}`,d,n,type:"spell",kind:"바른 말 고르기",prompt:"바르게 쓴 낱말은 무엇일까요?",opts:[r,w],ans:r,e});
  ALL.push({id:`t-${n}-${r}`,d,n,type:"sent",kind:"문장 빈칸 채우기",sent:s,opts:[ok||r,ng||w],ans:ok||r,e});
});
B.forEach(([d,n,a,am,b,bm,ss])=>{
  const e=`<b>${a}</b>: ${am}<br><b>${b}</b>: ${bm}`;
  ALL.push({id:`m-${n}-${a}`,d,n,type:"spell",kind:"뜻 보고 고르기",mean:am,prompt:"이런 뜻을 가진 낱말은?",opts:[a,b],ans:a,e});
  ALL.push({id:`m-${n}-${b}`,d,n,type:"spell",kind:"뜻 보고 고르기",mean:bm,prompt:"이런 뜻을 가진 낱말은?",opts:[b,a],ans:b,e});
  ss.forEach(([s,ok,ng],i)=>ALL.push({id:`t-${n}-${i}`,d,n,type:"sent",kind:"문장 빈칸 채우기",sent:s,opts:[ok,ng],ans:ok,e}));
});
const BY_ID=Object.fromEntries(ALL.map(q=>[q.id,q]));

/* 2026년 11월 3일 시가총액 기준 코스피·코스닥 상위 10개(우선주 제외). 순위가 바뀌어도 그대로 둡니다. */
const STOCKS=[
["005930","삼성전자","KOSPI","반도체·스마트폰"],["000660","SK하이닉스","KOSPI","반도체 메모리"],["402340","SK스퀘어","KOSPI","투자회사"],
["009150","삼성전기","KOSPI","전자 부품"],["373220","LG에너지솔루션","KOSPI","전기차 배터리"],["207940","삼성바이오로직스","KOSPI","바이오 의약품"],
["005380","현대차","KOSPI","자동차"],["105560","KB금융","KOSPI","은행·금융"],["032830","삼성생명","KOSPI","보험"],["028260","삼성물산","KOSPI","건설·무역"],
["196170","알테오젠","KOSDAQ","바이오 기술"],["086520","에코프로","KOSDAQ","배터리 소재"],["247540","에코프로비엠","KOSDAQ","배터리 양극재"],
["036930","주성엔지니어링","KOSDAQ","반도체 장비"],["277810","레인보우로보틱스","KOSDAQ","로봇"],["028300","HLB","KOSDAQ","바이오 신약"],
["039030","이오테크닉스","KOSDAQ","레이저 장비"],["222800","심텍","KOSDAQ","반도체 기판"],["240810","원익IPS","KOSDAQ","반도체 장비"],["058470","리노공업","KOSDAQ","반도체 검사 부품"]
];
const SEED_MARKET={label:"11월 4일 종가",prices:{"005930":[218000,219500],"000660":[1322000,1398000],"402340":[899000,899000],"009150":[1105000,1105000],"373220":[339500,338000],"207940":[1495000,1452000],"005380":[283500,277500],"105560":[151400,151400],"032830":[260000,261500],"028260":[299500,309500],"196170":[201500,213500],"086520":[69900,70200],"247540":[87600,87600],"036930":[163000,155100],"277810":[347000,348000],"028300":[33300,40700],"039030":[363500,358000],"222800":[120800,112300],"240810":[84500,84500],"058470":[54700,53500]}};
const DEF_CFG={rate:3,coinPer:10,bonus:50,count:10,range:"1-25",random:false,type:"둘다",note:"",board:"상위5",boardName:"이름",className:"우리 반"};
const DEF_SHOP={p1:{name:"칭찬 카드 1개",price:100,desc:"선생님께 칭찬 카드 1장을 받아요.",on:true},p2:{name:"칭찬 카드 2개",price:190,desc:"칭찬 카드 2장 묶음이에요.",on:true},p3:{name:"칭찬 카드 3개",price:270,desc:"칭찬 카드 3장 묶음이에요.",on:true}};

/* ---------- 도구 ---------- */
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(_){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const page=d=>5+(d-1)*2;
const pad=n=>String(n).padStart(2,"0");
const r2=n=>Math.round(n*100)/100;
const fmt=n=>r2(+n||0).toLocaleString("ko-KR",{maximumFractionDigits:2});
const fmtQ=n=>(Math.round(n*10000)/10000).toLocaleString("ko-KR",{maximumFractionDigits:4});
const today=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Asia/Seoul"});
const addDays=(ds,n)=>{const d=new Date(ds+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const md=ds=>{const [,m,d]=String(ds).split("-");return `${+m}월 ${+d}일`};
const whenKST=t=>new Date(t).toLocaleString("ko-KR",{timeZone:"Asia/Seoul",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
function parseDays(s){
  const out=new Set();
  String(s||"1-25").split(/[,\s]+/).forEach(p=>{const m=p.match(/^(\d+)(?:-(\d+))?$/);if(!m)return;const a=+m[1],b=m[2]?+m[2]:a;for(let d=Math.min(a,b);d<=Math.max(a,b);d++)if(d>=1&&d<=25)out.add(d)});
  return out.size?[...out].sort((x,y)=>x-y):Array.from({length:25},(_,i)=>i+1);
}
function rangeText(days){
  if(!days||!days.length) return "선택 없음";
  const s=[...days].sort((a,b)=>a-b),out=[];let st=s[0],pv=s[0];
  for(let i=1;i<=s.length;i++){if(s[i]===pv+1){pv=s[i];continue}out.push(st===pv?`${st}`:`${st}~${pv}`);st=pv=s[i]}
  return out.join(", ")+"일차";
}
const sk=c=>"c"+c; // 주식 코드 키 (숫자 키가 배열로 바뀌지 않게)

/* ---------- Firebase ---------- */
let db=null,auth=null,SV=null;
const R=p=>db.ref("matchum/"+p);
let CFG={...DEF_CFG},SHOP={...DEF_SHOP},MARKET=SEED_MARKET,STUDENTS={},ME=null,KEY=null,LOGS=[],BUYS=[],ALLBUYS={};
let role=null; // "student" | "teacher"
let subs=[];
function on(ref,fn){ref.on("value",fn,err=>console.warn(err));subs.push(ref)}
function offAll(){subs.forEach(r=>r.off());subs=[]}
const TEACHER=()=>(window.EDITOR_EMAIL||"").toLowerCase();
const emailOf=(g,c,n,gen)=>`s${+g}-${+c}-${+n}-${+gen||0}@matchum100.class`;
const keyOfEmail=e=>{const m=String(e||"").match(/^s(\d+)-(\d+)-(\d+)-\d+@/);return m?`${+m[1]}-${+m[2]}-${+m[3]}`:null};
const cfg=()=>({...CFG,days:parseDays(CFG.range),spell:CFG.type!=="빈칸",sent:CFG.type!=="고르기"});
const shopList=()=>Object.entries(SHOP||{}).filter(([,it])=>it&&it.name&&it.on!==false).map(([id,it])=>({id,...it,price:Math.max(0,Math.round(+it.price||0))}));

function authMsg(e){
  const c=e&&e.code||"";
  if(/network/.test(c))return "인터넷 연결을 확인하고 다시 눌러 주세요.";
  if(/too-many-requests/.test(c))return "너무 여러 번 시도했어요. 잠시 뒤에 다시 해 주세요.";
  if(/operation-not-allowed/.test(c))return "선생님, Firebase에서 이메일 로그인이 꺼져 있어요.";
  if(/PERMISSION_DENIED|permission/i.test(String(e&&e.message||c)))return "저장 권한이 없어요. 선생님께 말씀드려요.";
  return e&&e.message?e.message:"잠시 뒤에 다시 해 주세요.";
}
async function studentLogin(g,c,n,name,pin){
  const key=`${g}-${c}-${n}`;
  const gen=(await db.ref("matchum/gens/"+key).once("value")).val()||0;
  const email=emailOf(g,c,n,gen),pw="mc100-"+pin;
  let created=false;
  try{await auth.signInWithEmailAndPassword(email,pw)}
  catch(e){
    if(!/invalid-credential|user-not-found|wrong-password|invalid-login|INVALID_LOGIN/.test(e.code||e.message||""))throw new Error(authMsg(e));
    if(!name)throw new Error("비밀번호가 맞지 않아요. 처음 왔다면 이름도 적어 주세요.");
    try{await auth.createUserWithEmailAndPassword(email,pw);created=true}
    catch(e2){if(/email-already-in-use/.test(e2.code||""))throw new Error("비밀번호가 맞지 않아요. 잊어버렸다면 선생님께 말씀드려요.");throw new Error(authMsg(e2))}
  }
  const uid=auth.currentUser.uid;
  const ref=R("students/"+key),snap=(await ref.once("value")).val();
  if(!snap){
    await ref.set({uid,grade:+g,cls:+c,num:+n,name:(name||`${n}번`).slice(0,20),wallet:0,bank:0,lastPaid:"",qCount:0,qRight:0,joined:SV.TIMESTAMP,seen:SV.TIMESTAMP});
  }else if(!snap.uid||snap.uid!==uid){
    await ref.update({uid,seen:SV.TIMESTAMP,...(name?{name:name.slice(0,20)}:{})});
  }else{
    await ref.update({seen:SV.TIMESTAMP});
  }
  return created;
}

/* ---------- 학생 기록 쓰기 ---------- */
async function upd(fields){await R("students/"+KEY).update(fields)}
async function log(text,amount){await R("logs/"+KEY).push({t:SV.TIMESTAMP,text,amount:r2(amount)})}
async function payInterest(){
  if(!ME||!ME.lastPaid)return;
  let last=ME.lastPaid,bank=+ME.bank||0;const t=today(),rate=Math.max(0,+CFG.rate||0),logs=[];let g=0;
  while(addDays(last,7)<=t&&g++<520){last=addDays(last,7);const it=r2(bank*rate/100);if(it>0){bank=r2(bank+it);logs.push(it)}}
  if(last===ME.lastPaid)return;
  await upd({bank,lastPaid:last});
  for(const it of logs)await log(`은행 이자 (1주일 ${rate}%)`,it);
}

/* ---------- 시세 ---------- */
async function loadMarket(){
  const url=window.PRICES_URL;if(!url)return;
  try{const r=await fetch(url+"?t="+Math.floor(Date.now()/60000),{cache:"no-store"});if(!r.ok)return;const j=await r.json();
    if(j&&j.prices&&Object.keys(j.prices).length){MARKET=j;renderMe();if(!busy&&!typing()){if(current==="stock")renderStock();if(current==="class")renderClass()}}}catch(_){}
}
const typing=()=>document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
const priceOf=c=>{const p=MARKET.prices[c];return p?+p[0]||0:0};
const prevOf=c=>{const p=MARKET.prices[c];return p&&+p[1]?+p[1]:priceOf(c)};
const coinPrice=c=>priceOf(c)/1000;
const valueOf=st=>Object.entries((st&&st.stocks)||{}).reduce((s,[k,h])=>s+(+h.qty||0)*coinPrice(k.slice(1)),0);

/* ---------- 공통 ---------- */
let busy=false;
async function act(btn,msgEl,fn){
  if(busy)return;busy=true;
  const label=btn?btn.textContent:"";
  if(btn){btn.disabled=true;btn.textContent="저장하는 중…"}
  try{await fn();busy=false;return true}
  catch(e){busy=false;if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent=label}const m=e instanceof Error&&!e.code?e.message:authMsg(e);if(msgEl)msgEl.textContent=m;return false}
}
function renderMe(){
  if(role==="teacher"){$("#me").innerHTML=`<div class="me-id"><b>선생님</b><span>${esc(TEACHER())}</span><button type="button" class="link" id="logoutBtn">로그아웃</button></div>`;$("#logoutBtn").onclick=()=>auth.signOut();return}
  if(!ME){$("#me").innerHTML="";return}
  const v=valueOf(ME),total=(+ME.wallet||0)+(+ME.bank||0)+v;
  $("#me").innerHTML=`<div class="me-id"><span>${esc(ME.grade)}학년 ${esc(ME.cls)}반 ${esc(ME.num)}번</span><b>${esc(ME.name)}</b><button type="button" class="link" id="logoutBtn">로그아웃</button></div>
    <div class="bal">
      <span class="pill"><i>지갑</i><b>${fmt(ME.wallet)}</b></span>
      <span class="pill"><i>은행</i><b>${fmt(ME.bank)}</b></span>
      <span class="pill"><i>주식</i><b>${fmt(v)}</b></span>
      <span class="pill total"><i>모두 (코인)</i><b>${fmt(total)}</b></span>
    </div>`;
  $("#logoutBtn").onclick=()=>auth.signOut();
}

/* ---------- 로그인 화면 ---------- */
const VIEWS=["login","quiz","bank","stock","shop","class","teacher"];
let loginMode="student";
function showLogin(msg){
  $("#tabs").hidden=true;VIEWS.forEach(x=>$("#view-"+x).hidden=x!=="login");
  const last=store.get("mc100-last",{});
  if(loginMode==="teacher"){
    $("#view-login").innerHTML=`<article class="card">
      <p class="kind">선생님 로그인</p><h2>선생님 계정으로 들어가요</h2>
      <form class="ob" id="tForm" novalidate>
        <label class="t-field full" for="tEmail">이메일<input type="email" id="tEmail" value="${esc(TEACHER())}" autocomplete="username"></label>
        <label class="t-field full" for="tPw">비밀번호<input type="password" id="tPw" autocomplete="current-password"></label>
        <p class="msg full" id="tMsg" role="status">${esc(msg||"")}</p>
        <div class="actions"><button type="submit" class="primary" id="tGo">들어가기</button><button type="button" class="ghost" id="toStudent">학생 로그인으로</button></div>
      </form></article>`;
    $("#toStudent").onclick=()=>{loginMode="student";showLogin()};
    $("#tForm").addEventListener("submit",e=>{e.preventDefault();const m=$("#tMsg");
      act($("#tGo"),m,async()=>{try{await auth.signInWithEmailAndPassword($("#tEmail").value.trim(),$("#tPw").value)}catch(e){throw new Error(/invalid|wrong|not-found/.test(e.code||"")?"이메일이나 비밀번호가 맞지 않아요.":authMsg(e))}})});
    return;
  }
  $("#view-login").innerHTML=`<article class="card">
    <p class="kind">들어가기</p>
    <h2>학년·반·번호와 비밀번호를 적어요</h2>
    <p class="t-help">처음이면 이름과 비밀번호 4자리를 새로 정해요. 다음부터는 비밀번호만 있으면 돼요. 기록은 선생님 서버에 저장돼서 어느 기기에서 들어와도 이어져요.</p>
    <form class="ob" id="obForm" novalidate>
      <label class="t-field" for="obGrade">학년<select id="obGrade">${[1,2,3,4,5,6].map(g=>`<option value="${g}" ${(+last.grade||5)===g?"selected":""}>${g}학년</option>`).join("")}</select></label>
      <label class="t-field" for="obCls">반<input type="number" id="obCls" min="1" max="30" inputmode="numeric" value="${esc(last.cls||"")}"></label>
      <label class="t-field" for="obNum">번호<input type="number" id="obNum" min="1" max="60" inputmode="numeric" value="${esc(last.num||"")}"></label>
      <label class="t-field full" for="obName">이름 (처음 한 번만)<input type="text" id="obName" maxlength="20" autocomplete="off"></label>
      <label class="t-field full" for="obPin">비밀번호 4자리<input type="password" id="obPin" inputmode="numeric" maxlength="4" autocomplete="off"></label>
      <p class="msg full" id="obMsg" role="status">${esc(msg||"")}</p>
      <div class="actions"><button type="submit" class="primary" id="obGo">들어가기</button></div>
    </form>
    <p class="t-help">비밀번호를 잊었다면 선생님께 말씀드려요. 선생님이 초기화해 주면 새 비밀번호를 정할 수 있어요.</p>
    <p class="t-help"><button type="button" class="link" id="toTeacher">선생님 로그인</button></p>
  </article>`;
  $("#toTeacher").onclick=()=>{loginMode="teacher";showLogin()};
  $("#obForm").addEventListener("submit",e=>{
    e.preventDefault();
    const g=+$("#obGrade").value,c=parseInt($("#obCls").value,10),n=parseInt($("#obNum").value,10),name=$("#obName").value.trim(),pin=$("#obPin").value.trim();
    const m=$("#obMsg");
    if(!(c>=1))return m.textContent="반을 숫자로 적어 주세요.";
    if(!(n>=1))return m.textContent="번호를 숫자로 적어 주세요.";
    if(!/^\d{4}$/.test(pin))return m.textContent="비밀번호는 숫자 4자리로 적어 주세요.";
    store.set("mc100-last",{grade:g,cls:c,num:n});
    act($("#obGo"),m,()=>studentLogin(g,c,n,name,pin));
  });
}

/* ---------- 탭 ---------- */
const TABS=["quiz","bank","stock","shop","class","teacher"];
let current="quiz";
function allowedTabs(){return role==="teacher"?["quiz","stock","class","teacher"]:["quiz","bank","stock","shop","class"]}
function showTab(t){
  if(!role){showLogin();return}
  if(role==="student"&&!ME)return;
  const ok=allowedTabs();
  if(!ok.includes(t))t=role==="teacher"?"teacher":"quiz";
  current=t;$("#tabs").hidden=false;
  TABS.forEach(x=>{$("#tab-"+x).hidden=!ok.includes(x);$("#tab-"+x).setAttribute("aria-selected",String(x===t))});
  VIEWS.forEach(x=>$("#view-"+x).hidden=x!==t);
  ({quiz:renderQuizTab,bank:renderBank,stock:renderStock,shop:renderShop,class:renderClass,teacher:renderTeacher})[t]();
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{
  const t=b.dataset.tab;if(location.hash!=="#"+t)location.hash=t;else showTab(t);
}));
window.addEventListener("hashchange",()=>{if(role)showTab(location.hash.slice(1))});
function rerender(){if(busy||typing())return;if(role&&!$("#view-"+current).hidden)showTab(current)}

/* ---------- 오늘의 퀴즈 ---------- */
let wrongNote=store.get("mc100-wrong",{});
let Q=null;
function pool(){
  const c=cfg(),ds=new Set(c.random?Array.from({length:25},(_,i)=>i+1):c.days);
  return ALL.filter(q=>ds.has(q.d)&&((q.type==="spell"&&c.spell)||(q.type==="sent"&&c.sent)));
}
const takeN=()=>{const n=pool().length,k=+CFG.count||0;return k&&k<n?k:n};
function applyBanner(){
  const tb=$("#tbanner"),c=cfg();
  tb.hidden=false;
  tb.innerHTML=`<span class="tb-label">선생님이 정한 오늘의 퀴즈</span><strong>${esc(c.random?"전체 무작위":rangeText(c.days))} · ${takeN()}문제</strong>${CFG.note?`<p>${esc(CFG.note)}</p>`:""}`;
}
function renderNotes(){
  const ids=Object.keys(wrongNote).filter(id=>BY_ID[id]);
  const el=$("#notes");
  el.hidden=!ids.length||!!(Q&&!Q.finished);
  if(el.hidden){el.innerHTML="";return}
  el.innerHTML=`<span>오답 노트에 <b>${ids.length}문제</b>가 있어요. 연습은 코인 없이 몇 번이든 할 수 있어요.</span>
    <button type="button" class="ghost" id="noteRun">오답 연습하기</button>
    <button type="button" class="ghost" id="noteClear">비우기</button>`;
  $("#noteRun").onclick=()=>startPractice(ids.map(i=>BY_ID[i]));
  $("#noteClear").onclick=()=>{wrongNote={};store.set("mc100-wrong",wrongNote);renderNotes()};
}
function renderQuizTab(){
  applyBanner();
  if(Q&&!Q.finished){if(!$("#stage .opts"))renderQ();renderNotes();return}
  if(Q&&Q.finished){renderEnd();renderNotes();return}
  if(role==="teacher"){
    $("#stage").innerHTML=`<article class="card"><p class="kind">선생님 미리보기</p><h2>지금 설정으로 ${takeN()}문제 풀어 보기</h2><p class="t-help">선생님 화면에서는 코인이 쌓이지 않아요.</p><div class="actions"><button type="button" class="primary" id="tryBtn">미리 풀어 보기</button></div></article>`;
    $("#tryBtn").onclick=()=>startPractice(shuffle(pool()).slice(0,takeN()));renderNotes();return;
  }
  const qz=ME.quiz||{};
  if(qz.date===today()&&qz.state==="시작"&&qz.qids){resumeChallenge(qz);renderNotes();return}
  if(qz.date===today()&&qz.state==="완료"){renderDoneOnly(qz);renderNotes();return}
  renderStart();renderNotes();
}
function renderStart(){
  const n=takeN();
  $("#stage").innerHTML=`<article class="card">
    <p class="kind">오늘의 도전 · ${md(today())}</p>
    <h2>맞춤법 퀴즈 ${n}문제</h2>
    <p class="t-help">하루에 한 번만 도전할 수 있어요. 시작하면 끝까지 풀어야 해요.</p>
    <ul class="rules"><li>맞힌 문제마다 <b>${fmt(CFG.coinPer)}코인</b></li><li>모두 맞히면 보너스 <b>${fmt(CFG.bonus)}코인</b></li><li>받은 코인은 지갑에 들어가요. 저금하거나 주식을 사거나 상점에서 쓸 수 있어요.</li></ul>
    <p class="msg" id="startMsg" role="status"></p>
    <div class="actions"><button type="button" class="primary" id="goBtn" ${n?"":"disabled"}>도전 시작</button></div>
  </article>`;
  $("#goBtn").onclick=()=>{
    const qs=shuffle(pool()).slice(0,takeN());
    const qz={date:today(),state:"시작",qids:qs.map(q=>q.id),shown:qs.map(q=>shuffle(q.opts)),picks:[]};
    act($("#goBtn"),$("#startMsg"),async()=>{
      const cur=(await R(`students/${KEY}/quiz`).once("value")).val()||{};
      if(cur.date===today())throw new Error("오늘의 도전은 이미 시작했어요.");
      await upd({quiz:qz});ME.quiz=qz;
    }).then(ok=>{if(ok){resumeChallenge(qz);renderNotes()}else setTimeout(renderQuizTab,1200)});
  };
}
function renderDoneOnly(qz){
  $("#stage").innerHTML=`<article class="card">
    <p class="kind">오늘의 도전 · ${md(today())}</p>
    <h2>오늘 도전은 끝났어요</h2>
    <p class="t-help">${qz.total?`${qz.total}문제 중 ${qz.right}문제를 맞혀서 ${fmt(qz.coins)}코인을 받았어요. `:""}내일 또 도전할 수 있어요. 그동안 오답 노트로 연습해 보세요.</p>
  </article>`;
}
function resumeChallenge(qz){
  const picks=qz.picks?Object.values(qz.picks):[];
  const qs=qz.qids.map((id,i)=>BY_ID[id]?{...BY_ID[id],shown:qz.shown[i]}:null).filter(Boolean);
  Q={mode:"challenge",qz,qs,picks,i:Math.min(picks.length,qs.length),res:picks.slice(0,qs.length).map((p,i)=>({q:qs[i],picked:p,ok:p===qs[i].ans})),locked:false,finished:false};
  if(Q.i>=Q.qs.length){finishChallenge();return}
  renderQ();
}
function startPractice(list){
  Q={mode:"practice",qs:shuffle(list).map(q=>({...q,shown:shuffle(q.opts)})),i:0,res:[],locked:false,finished:false};
  if(current!=="quiz"){location.hash="quiz";return}
  renderQ();renderNotes();
}
const boxes=w=>`<span class="boxes">${[...w].map(c=>c===" "?`<span class="box sp"></span>`:`<span class="box">${esc(c)}</span>`).join("")}</span>`;
const CIRCLE=`<svg class="mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" vector-effect="non-scaling-stroke" d="M52 5 C82 4 98 24 96 50 C94 80 72 97 46 95 C18 93 2 73 5 46 C8 22 28 7 60 8"/></svg>`;
const SLASH=`<svg class="mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" vector-effect="non-scaling-stroke" d="M12 88 L88 12"/></svg>`;
function qText(q,filled){
  if(q.sent){const blank=filled?`<span class="blank filled">${esc(q.ans)}</span>`:`<span class="blank">?</span>`;return esc(q.sent).replace("___",blank)}
  if(q.mean) return `<span class="mean">‘${esc(q.mean)}’</span>${esc(q.prompt)}`;
  return esc(q.prompt);
}
function renderQ(){
  const q=Q.qs[Q.i];Q.locked=false;
  const lab=Q.mode==="challenge"?"오늘의 도전":"연습 · 코인 없음";
  $("#stage").innerHTML=`<article class="card">
    <div class="meta"><span class="prog">${Q.i+1} / ${Q.qs.length}</span>
      <span class="tag">${lab}</span>
      <span class="tag">${q.d}일차 · ${pad(q.n)}번 · 교재 ${page(q.d)}쪽</span>
      <div class="bar"><i style="width:${(Q.i/Q.qs.length)*100}%"></i></div></div>
    <p class="kind">${q.kind}</p>
    <p class="q" id="qText">${qText(q,false)}</p>
    <div class="opts">${q.shown.map((o,k)=>`<button type="button" class="opt" id="opt-${k}" data-k="${k}"><span class="key">${k+1}번</span>${boxes(o)}</button>`).join("")}</div>
    <div class="feedback" id="fb" hidden></div>
  </article>`;
  document.querySelectorAll(".opt").forEach(b=>b.addEventListener("click",()=>choose(+b.dataset.k)));
}
const YES=["딩동댕!","정답이에요!","잘했어요!","완벽해요!"],NO=["아깝다!","다시 한번 볼까요?","헷갈렸구나!"];
function choose(k){
  if(!Q||Q.locked||Q.finished)return;Q.locked=true;
  const q=Q.qs[Q.i],picked=q.shown[k],ok=picked===q.ans;
  Q.res.push({q,picked,ok});
  if(Q.mode==="challenge"){Q.picks.push(picked);R(`students/${KEY}/quiz/picks/${Q.picks.length-1}`).set(picked).catch(()=>{})}
  if(ok)delete wrongNote[q.id];else wrongNote[q.id]=(wrongNote[q.id]||0)+1;
  store.set("mc100-wrong",wrongNote);
  document.querySelectorAll(".opt").forEach(b=>{
    b.disabled=true;const o=q.shown[+b.dataset.k];
    if(o===q.ans){b.classList.add("right");b.insertAdjacentHTML("beforeend",CIRCLE)}
    else if(+b.dataset.k===k){b.classList.add("wrong");b.insertAdjacentHTML("beforeend",SLASH)}
  });
  if(q.sent)$("#qText").innerHTML=qText(q,true);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const last=Q.i===Q.qs.length-1;
  const fb=$("#fb");fb.hidden=false;
  const gain=Q.mode==="challenge"&&ok?` +${fmt(CFG.coinPer)}코인`:"";
  fb.innerHTML=`<p class="verdict ${ok?"":"no"}">${ok?pick(YES)+gain:pick(NO)+` 정답은 ‘${esc(q.ans)}’`}</p>
    <p class="why">${q.e}</p>
    <div class="next-row"><button type="button" class="primary" id="nextBtn">${last?"채점 결과 보기":"다음 문제 →"}</button></div>`;
  $("#nextBtn").addEventListener("click",next);$("#nextBtn").focus({preventScroll:true});
}
function next(){
  if(!Q||!Q.locked)return;
  if(Q.i<Q.qs.length-1){Q.i++;renderQ();$("#stage").scrollIntoView({block:"nearest"})}
  else if(Q.mode==="challenge")finishChallenge();
  else{Q.finished=true;renderEnd();renderNotes()}
}
function finishChallenge(){
  const right=Q.res.filter(r=>r.ok).length,total=Q.res.length;
  $("#stage").innerHTML=`<article class="card"><p class="kind">채점하는 중</p><h2>코인을 지갑에 넣고 있어요…</h2><p class="msg" id="doneMsg" role="status"></p><div class="actions"><button type="button" class="primary" id="doneBtn" hidden>다시 보내기</button></div></article>`;
  const send=()=>act(null,$("#doneMsg"),async()=>{
    const cur=(await R("students/"+KEY).once("value")).val()||{};
    const qz=cur.quiz||{};
    if(qz.state==="완료"){Q.coins=qz.coins||0;return}
    const coins=right*(+CFG.coinPer||0)+(right===total&&total>0?(+CFG.bonus||0):0);
    await upd({wallet:r2((+cur.wallet||0)+coins),qCount:(+cur.qCount||0)+1,qRight:(+cur.qRight||0)+right,
      quiz:{date:qz.date||today(),state:"완료",right,total,coins}});
    if(coins>0)await log(`오늘의 퀴즈 (${total}문제 중 ${right}문제)`,coins);
    Q.coins=coins;
  }).then(ok=>{if(ok){Q.finished=true;renderEnd();renderNotes()}else if($("#doneBtn")){$("#doneBtn").hidden=false}});
  $("#doneBtn").onclick=send;send();
}
function renderEnd(){
  const total=Q.res.length,right=Q.res.filter(r=>r.ok).length,score=total?Math.round(right/total*100):0;
  const wrong=Q.res.filter(r=>!r.ok),ch=Q.mode==="challenge";
  const list=wrong.length?`<ul class="review">${wrong.map(({q,picked})=>`<li>
      <span class="tag" style="align-self:flex-start">${q.d}일차 · ${pad(q.n)}번 · 교재 ${page(q.d)}쪽</span>
      <p class="rq">${q.sent?qText(q,true):(q.mean?`‘${esc(q.mean)}’ → <span class="blank filled">${esc(q.ans)}</span>`:`바른 말: <span class="blank filled">${esc(q.ans)}</span>`)}</p>
      <p class="rmine">내가 고른 답: <s>${esc(picked)}</s></p>
      <p class="rwhy">${q.e}</p></li>`).join("")}</ul>`:`<p class="allright">하나도 안 틀렸어요! 맞춤법 박사네요.</p>`;
  $("#stage").innerHTML=`<article class="card">
    <p class="kind">${ch?`오늘의 도전 결과 · ${md(today())}`:"연습 결과 · 코인 없음"}</p>
    <div class="score"><div class="score-num">${score}점${score>=80?CIRCLE.replace('class="mark"','class=""'):""}</div>
      <div class="score-txt"><strong>${total}문제 중 ${right}문제 맞혔어요</strong>
      ${ch?`<p class="earned">+${fmt(Q.coins||0)}코인을 지갑에 넣었어요</p><span class="empty">내일 또 도전할 수 있어요.</span>`:""}</div></div>
    ${wrong.length?`<p class="kind">다시 보기</p>`:""}
    ${list}
    <div class="actions">
      ${wrong.length?`<button type="button" class="primary" id="retryBtn">틀린 문제 연습하기 (코인 없음)</button>`:""}
      ${ch?`<button type="button" class="secondary" id="toBank">지갑·은행 가기</button>`:`<button type="button" class="secondary" id="backToday">오늘의 퀴즈로 돌아가기</button>`}
    </div></article>`;
  if(wrong.length)$("#retryBtn").onclick=()=>startPractice(wrong.map(r=>r.q));
  if($("#toBank"))$("#toBank").onclick=()=>{Q=null;location.hash="bank"};
  if($("#backToday"))$("#backToday").onclick=()=>{Q=null;renderQuizTab()};
}
document.addEventListener("keydown",e=>{
  if(current!=="quiz"||!Q||Q.finished||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(!Q.locked&&(e.key==="1"||e.key==="2")){choose(+e.key-1)}
  else if(Q.locked&&(e.key==="Enter"||e.key==="ArrowRight")&&e.target.id!=="nextBtn"){e.preventDefault();next()}
});

/* ---------- 지갑·은행 ---------- */
let bankMsg="";
function renderBank(){
  const rate=+CFG.rate||0,nextPay=ME.lastPaid?addDays(ME.lastPaid,7):null,expect=r2((+ME.bank||0)*rate/100);
  $("#view-bank").innerHTML=`<article class="card">
    <h2>지갑과 은행</h2>
    <div class="acct">
      <div class="acct-box"><span class="lbl">지갑</span><b>${fmt(ME.wallet)}</b><small>바로 쓸 수 있는 코인</small></div>
      <div class="acct-box"><span class="lbl">은행 저금</span><b>${fmt(ME.bank)}</b>
        <small>금리: 1주일에 ${fmt(rate)}%${nextPay?` · 다음 이자 ${md(nextPay)} (예상 +${fmt(expect)}코인)`:" · 저금하면 7일마다 이자가 붙어요"}</small></div>
    </div>
    <div class="field">
      <label class="label" for="bankAmt">옮길 코인</label>
      <div class="amt-row">
        <input class="num-in" type="number" id="bankAmt" min="1" step="1" inputmode="numeric" placeholder="코인">
        <button type="button" class="ghost" data-fill="10">10</button>
        <button type="button" class="ghost" data-fill="50">50</button>
        <button type="button" class="ghost" data-fill="100">100</button>
        <button type="button" class="ghost" data-fill="wallet">지갑 전부</button>
        <button type="button" class="ghost" data-fill="bank">저금 전부</button>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="depBtn">저금하기</button>
        <button type="button" class="secondary" id="wdBtn">찾기</button>
      </div>
      <p class="msg" id="bankMsg" role="status">${esc(bankMsg)}</p>
    </div>
    <p class="t-help">한국은행 기준금리를 우리 반에서는 1주일 이율로 써요. 100코인을 저금하면 1주일 뒤 ${fmt(rate)}코인이 붙고, 이자에도 다시 이자가 붙어요. 금리는 선생님이 정해요.</p>
  </article>
  <article class="card">
    <h3>최근 기록</h3>
    ${LOGS.length?`<ul class="log">${LOGS.map(l=>`<li><span>${esc(l.text)}<span class="when">${whenKST(l.t)}</span></span><span class="amt ${l.amount>=0?"up":"down"}">${l.amount>=0?"+":""}${fmt(l.amount)}</span></li>`).join("")}</ul>`:`<p class="empty">아직 기록이 없어요. 오늘의 퀴즈를 풀면 첫 코인이 들어와요.</p>`}
  </article>`;
  bankMsg="";
  const amtIn=$("#bankAmt");
  document.querySelectorAll("[data-fill]").forEach(x=>x.onclick=()=>{const f=x.dataset.fill;amtIn.value=f==="wallet"?r2(ME.wallet):f==="bank"?r2(ME.bank):f});
  const amt=()=>r2(parseFloat(amtIn.value));
  const m=$("#bankMsg");
  $("#depBtn").onclick=()=>{const a=amt();if(!(a>0))return m.textContent="옮길 코인을 적어 주세요.";
    act($("#depBtn"),m,async()=>{
      if(a>(+ME.wallet||0)+1e-9)throw new Error(`지갑에 ${fmt(ME.wallet)}코인밖에 없어요.`);
      await upd({wallet:r2(ME.wallet-a),bank:r2((+ME.bank||0)+a),...(ME.lastPaid?{}:{lastPaid:today()})});
      await log("은행에 저금",-a);bankMsg=`${fmt(a)}코인을 저금했어요.`;
    }).then(ok=>ok&&renderBank())};
  $("#wdBtn").onclick=()=>{const a=amt();if(!(a>0))return m.textContent="찾을 코인을 적어 주세요.";
    act($("#wdBtn"),m,async()=>{
      if(a>(+ME.bank||0)+1e-9)throw new Error(`저금한 코인은 ${fmt(ME.bank)}코인이에요.`);
      await upd({bank:r2(ME.bank-a),wallet:r2((+ME.wallet||0)+a)});
      await log("은행에서 찾기",a);bankMsg=`${fmt(a)}코인을 지갑으로 옮겼어요.`;
    }).then(ok=>ok&&renderBank())};
}

/* ---------- 주식 ---------- */
let stockFilter="KOSPI",openCode=null,tradeMsg="";
function renderStock(){
  const mine=(ME&&ME.stocks)||{};
  const holds=Object.entries(mine).filter(([,h])=>h.qty>1e-6);
  const val=valueOf(ME),cost=holds.reduce((s,[,h])=>s+(+h.cost||0),0),pl=val-cost;
  const list=stockFilter==="MINE"?STOCKS.filter(s=>(mine[sk(s[0])]?.qty||0)>1e-6):STOCKS.filter(s=>s[2]===stockFilter);
  const plTxt=cost?`${pl>=0?"+":""}${fmt(pl)}코인 (${pl>=0?"+":""}${(pl/cost*100).toFixed(1)}%)`:"아직 산 주식이 없어요";
  $("#view-stock").innerHTML=`<article class="card">
    ${ME?`<div class="mkt-sum">
      <div><span class="lbl">내 주식 평가액</span><br><b class="big">${fmt(val)}</b> 코인 <span class="${cost?(pl>=0?"up":"down"):"empty"}">${plTxt}</span></div>
      <span class="lbl">지갑 ${fmt(ME.wallet)}코인</span>
    </div>`:`<h2>주식 시세</h2>`}
    <p class="mkt-note">시세: ${esc(MARKET.label||"정보 없음")} (평일 장중 10분마다 바뀌어요, 약 20분 지연) · 1코인 = 1,000원 · 소수점 단위로 살 수 있어요. 빨간색은 오름, 파란색은 내림이에요.</p>
    <div class="seg" role="tablist" aria-label="시장">
      ${[["KOSPI","코스피 10"],["KOSDAQ","코스닥 10"]].concat(ME?[["MINE","내 주식"]]:[]).map(([k,l])=>`<label><input type="radio" name="mkt" id="mkt-${k}" value="${k}" ${stockFilter===k?"checked":""}>${l}</label>`).join("")}
    </div>
    <ul class="stocks">${list.length?list.map(rowHtml).join(""):`<li class="empty" style="padding:12px 4px">아직 가진 주식이 없어요. 코스피나 코스닥에서 종목을 눌러 사 보세요.</li>`}</ul>
  </article>`;
  document.querySelectorAll("input[name=mkt]").forEach(r=>r.onchange=()=>{stockFilter=r.value;openCode=null;renderStock()});
  if(ME)document.querySelectorAll(".sbtn").forEach(b=>b.onclick=()=>{openCode=openCode===b.dataset.code?null:b.dataset.code;tradeMsg="";renderStock()});
  if(ME&&openCode&&$("#tradeAmt"))bindTrade(openCode);
}
function rowHtml(s){
  const [c,name,mkt,sector]=s,p=priceOf(c),pv=prevOf(c),ch=pv?(p-pv)/pv*100:0,h=ME&&ME.stocks&&ME.stocks[sk(c)];
  const cls=ch>0.0001?"up":ch<-0.0001?"down":"";
  const arrow=cls==="up"?"▲":cls==="down"?"▼":"–";
  return `<li class="srow ${openCode===c?"open":""}">
    <button type="button" class="sbtn" data-code="${c}" aria-expanded="${openCode===c}">
      <span class="sname"><b>${esc(name)}${h&&h.qty>1e-6?`<span class="mine">보유</span>`:""}</b><small>${mkt==="KOSPI"?"코스피":"코스닥"} · ${esc(sector)}</small></span>
      <span class="sprice"><b>${p?p.toLocaleString("ko-KR")+"원":"-"}</b><small class="${cls}">${arrow} ${Math.abs(ch).toFixed(2)}%</small></span>
    </button>
    ${openCode===c&&ME?tradeHtml(c):""}
  </li>`;
}
function tradeHtml(c){
  const cp=coinPrice(c),h=(ME.stocks||{})[sk(c)]||{qty:0,cost:0},v=h.qty*cp,pl=v-h.cost;
  return `<div class="trade">
    <p class="tline">1주 = <b>${fmt(cp)}</b>코인${h.qty>1e-6?` · 가진 주식 ${fmtQ(h.qty)}주 (지금 ${fmt(v)}코인, <span class="${pl>=0?"up":"down"}">${pl>=0?"+":""}${fmt(pl)}</span>)`:""}</p>
    <div class="amt-row">
      <input class="num-in" type="number" id="tradeAmt" min="1" step="1" inputmode="numeric" placeholder="코인">
      <span class="lbl">코인어치</span>
      <button type="button" class="ghost" data-tfill="10">10</button>
      <button type="button" class="ghost" data-tfill="50">50</button>
      <button type="button" class="ghost" data-tfill="wallet">지갑 전부</button>
    </div>
    <div class="actions">
      <button type="button" class="primary" id="buyBtn" ${cp?"":"disabled"}>사기</button>
      <button type="button" class="secondary" id="sellBtn" ${h.qty>1e-6?"":"disabled"}>팔기</button>
      <button type="button" class="ghost" id="sellAllBtn" ${h.qty>1e-6?"":"disabled"}>전부 팔기</button>
    </div>
    <p class="msg" id="tradeMsg" role="status">${esc(tradeMsg)}</p>
  </div>`;
}
function bindTrade(c){
  const inp=$("#tradeAmt"),m=$("#tradeMsg"),name=STOCKS.find(s=>s[0]===c)[1],k=sk(c);
  document.querySelectorAll("[data-tfill]").forEach(x=>x.onclick=()=>{inp.value=x.dataset.tfill==="wallet"?r2(ME.wallet):x.dataset.tfill});
  const done=ok=>{if(ok)renderStock()};
  $("#buyBtn").onclick=()=>{const a=r2(parseFloat(inp.value)),cp=coinPrice(c);if(!(a>0))return m.textContent="살 만큼의 코인을 적어 주세요.";
    act($("#buyBtn"),m,async()=>{
      if(a>(+ME.wallet||0)+1e-9)throw new Error(`지갑에 ${fmt(ME.wallet)}코인밖에 없어요.`);
      const qty=Math.round(a/cp*1e6)/1e6,h=(ME.stocks||{})[k]||{qty:0,cost:0};
      await upd({wallet:r2(ME.wallet-a),[`stocks/${k}`]:{qty:Math.round((h.qty+qty)*1e6)/1e6,cost:r2(h.cost+a)}});
      await log(`${name} ${fmtQ(qty)}주 사기`,-a);tradeMsg=`${name} ${fmtQ(qty)}주를 ${fmt(a)}코인에 샀어요.`;
    }).then(done)};
  const sell=qty=>act(null,m,async()=>{
    const h=(ME.stocks||{})[k],cp=coinPrice(c);if(!h||h.qty<=1e-6)throw new Error("가진 주식이 없어요.");
    qty=Math.min(qty,h.qty);
    const money=r2(qty*cp),costPart=r2(h.cost*qty/h.qty),left=Math.round((h.qty-qty)*1e6)/1e6;
    await upd({wallet:r2((+ME.wallet||0)+money),[`stocks/${k}`]:left>1e-6?{qty:left,cost:r2(h.cost-costPart)}:null});
    await log(`${name} ${fmtQ(qty)}주 팔기`,money);tradeMsg=`${name} ${fmtQ(qty)}주를 팔아서 ${fmt(money)}코인을 받았어요.`;
  }).then(done);
  $("#sellBtn").onclick=()=>{const a=r2(parseFloat(inp.value)),cp=coinPrice(c),h=(ME.stocks||{})[k];if(!(a>0))return m.textContent="팔 만큼의 코인을 적어 주세요.";
    if(!h)return;if(a>h.qty*cp+0.01)return m.textContent=`가진 주식은 지금 ${fmt(h.qty*cp)}코인어치예요.`;sell(a/cp)};
  $("#sellAllBtn").onclick=()=>{const h=(ME.stocks||{})[k];if(h)sell(h.qty)};
}

/* ---------- 상점 ---------- */
let confirmId=null,shopMsg="";
function renderShop(){
  const items=shopList();
  $("#view-shop").innerHTML=`<article class="card">
    <div class="mkt-sum"><h2>상점</h2><span class="lbl">지갑 <b style="color:var(--coin)">${fmt(ME.wallet)}</b>코인</span></div>
    ${items.length?`<ul class="shop">${items.map(it=>{
      const p=it.price,lack=(+ME.wallet||0)+1e-9<p;
      return `<li class="item"><span class="iname">${esc(it.name)}</span><span class="idesc">${esc(it.desc||"")}</span><span class="iprice">${fmt(p)}코인</span>
        ${confirmId===it.id?`<div class="confirm"><span>지갑 ${fmt(ME.wallet)} → ${fmt(ME.wallet-p)}코인이 돼요.</span><div class="actions"><button type="button" class="primary" data-yes="${esc(it.id)}">살게요</button><button type="button" class="ghost" data-no="1">취소</button></div></div>`
        :`<button type="button" class="primary" data-buy="${esc(it.id)}" ${lack?"disabled":""}>${lack?`${fmt(p-ME.wallet)}코인이 모자라요`:"사기"}</button>`}
      </li>`}).join("")}</ul>`:`<p class="empty">지금은 파는 물건이 없어요.</p>`}
    <p class="msg" id="shopMsg" role="status">${esc(shopMsg)}</p>
  </article>
  <article class="card">
    <h3>내 구매 확인증</h3>
    <p class="t-help">산 물건은 선생님께 확인 코드를 보여 주고 받아요. 선생님이 건네주면 '받았어요'로 바뀌어요.</p>
    ${BUYS.length?`<ul class="receipts">${BUYS.map(r=>`<li class="${r.used?"used":""}">
      <span class="rinfo"><b>${esc(r.name)}</b><small>${whenKST(r.t)} · ${fmt(r.price)}코인</small></span>
      <span class="rcode" aria-label="확인 코드">${esc(r.code)}</span>
      <span class="donetag">${r.used?"받았어요 ✓":"선생님 확인 전"}</span>
    </li>`).join("")}</ul>`:`<p class="empty">아직 산 물건이 없어요.</p>`}
  </article>`;
  shopMsg="";
  document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{confirmId=b.dataset.buy;renderShop()});
  document.querySelectorAll("[data-no]").forEach(b=>b.onclick=()=>{confirmId=null;renderShop()});
  document.querySelectorAll("[data-yes]").forEach(b=>b.onclick=()=>{
    const it=shopList().find(x=>x.id===b.dataset.yes);
    act(b,$("#shopMsg"),async()=>{
      if(!it)throw new Error("지금은 팔지 않는 물건이에요.");
      if((+ME.wallet||0)+1e-9<it.price)throw new Error("코인이 모자라요.");
      const AZ="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="";for(let i=0;i<4;i++)code+=AZ[Math.floor(Math.random()*AZ.length)];
      await upd({wallet:r2(ME.wallet-it.price)});
      await R("purchases/"+KEY).push({t:SV.TIMESTAMP,name:it.name,price:it.price,code,used:false});
      await log(`상점: ${it.name}`,-it.price);
      shopMsg=`${it.name}을(를) 샀어요. 확인 코드 ${code}를 선생님께 보여 주세요.`;
    }).then(ok=>{confirmId=null;if(ok)renderShop()});
  });
}

/* ---------- 우리 반 ---------- */
function boardData(){
  const list=Object.entries(STUDENTS||{}).map(([k,s])=>({k,name:CFG.boardName==="번호"?`${s.num}번`:String(s.name||""),total:r2((+s.wallet||0)+(+s.bank||0)+valueOf(s)),bank:r2(+s.bank||0),quiz:+s.qCount||0}));
  return {list,classTotal:r2(list.reduce((t,x)=>t+x.total,0)),classBank:r2(list.reduce((t,x)=>t+x.bank,0))};
}
function renderClass(){
  const b=boardData(),mode=CFG.board||"상위5",lim=mode==="상위5"?5:mode==="상위10"?10:999;
  const rows=(arr,val,unit)=>arr&&arr.length?`<ol class="rank">${arr.map((x,i)=>`<li><span class="rk">${i+1}</span><span class="rn">${esc(x.name)}</span><span class="rv">${val(x)}${unit}</span></li>`).join("")}</ol>`:`<p class="empty">아직 기록이 없어요.</p>`;
  const top=b.list.slice().sort((x,y)=>y.total-x.total).slice(0,lim);
  const savers=b.list.filter(x=>x.bank>0).sort((x,y)=>y.bank-x.bank).slice(0,Math.min(lim,5));
  const quizzers=b.list.filter(x=>x.quiz>0).sort((x,y)=>y.quiz-x.quiz).slice(0,Math.min(lim,5));
  $("#view-class").innerHTML=`<article class="card">
    <h2>${esc(CFG.className||"우리 반")}이 함께 모은 코인</h2>
    <div class="acct">
      <div class="acct-box"><span class="lbl">모두 합친 코인 (${b.list.length}명)</span><b>${fmt(b.classTotal)}</b></div>
      <div class="acct-box"><span class="lbl">은행에 함께 저금한 코인</span><b>${fmt(b.classBank)}</b></div>
    </div>
  </article>
  ${mode==="숨김"&&role!=="teacher"?"":`<article class="card"><h3>코인 부자 ${mode==="전체"||mode==="숨김"?"":mode.replace("상위","상위 ")}</h3>${rows(top,x=>fmt(x.total),"코인")}</article>
  <div class="two">
    <article class="card"><h3>저축왕</h3>${rows(savers,x=>fmt(x.bank),"코인")}</article>
    <article class="card"><h3>꾸준히 도전왕</h3>${rows(quizzers,x=>x.quiz,"번")}</article>
  </div>`}
  <p class="mkt-note">친구들 기록은 실시간으로 바뀌어요. 주식은 지금 시세로 계산해요.${mode==="숨김"&&role==="teacher"?" (학생 화면에서는 순위가 숨겨져 있어요.)":""}</p>`;
}

/* ---------- 선생님 ---------- */
let TSHOP=null,tMsgTxt="";
function renderTeacher(){
  const c=CFG;
  if(!TSHOP)TSHOP=Object.entries(SHOP||{}).map(([id,it])=>({id,...it}));
  const studs=Object.entries(STUDENTS||{}).sort((a,b)=>(a[1].grade-b[1].grade)||(a[1].cls-b[1].cls)||(a[1].num-b[1].num));
  const pend=[];Object.entries(ALLBUYS||{}).forEach(([k,ps])=>Object.entries(ps||{}).forEach(([id,p])=>{if(!p.used)pend.push({k,id,...p,who:STUDENTS[k]?STUDENTS[k].name:k})}));
  pend.sort((a,b)=>a.t-b.t);
  const sel=(id,opts,v)=>`<select id="${id}">${opts.map(o=>`<option value="${esc(o[0])}" ${String(v)===String(o[0])?"selected":""}>${esc(o[1])}</option>`).join("")}</select>`;
  $("#view-teacher").innerHTML=`<article class="card">
    <div class="t-head"><h2>선생님 설정</h2><span class="t-only">선생님 계정에만 보여요</span></div>
    <p class="t-help">'저장'을 누르면 모든 학생 화면에 바로 반영돼요.</p>
    <div class="t-sec"><h3>오늘의 퀴즈</h3>
      <div class="row2">
        <label class="t-field" for="cRange">범위 (일차)<input type="text" id="cRange" value="${esc(c.range)}" placeholder="예: 1-5 또는 1,3,6-8"></label>
        <label class="t-field" for="cCount">하루 문제 수${sel("cCount",[[10,"10문제"],[20,"20문제"],[30,"30문제"],[0,"범위 안 모든 문제"]],c.count)}</label>
        <label class="t-field" for="cType">문제 유형${sel("cType",[["둘다","고르기 + 빈칸"],["고르기","바른 말·뜻 고르기만"],["빈칸","문장 빈칸만"]],c.type)}</label>
        <label class="t-field" for="cRandom">출제 방식${sel("cRandom",[["0","범위 안에서"],["1","100개 낱말 전체에서 무작위"]],c.random?1:0)}</label>
      </div>
      <label class="t-field" for="cNote">학생에게 보여 줄 안내 문구<input type="text" id="cNote" maxlength="80" value="${esc(c.note)}" placeholder="예: 이번 주는 5~7일차예요."></label>
    </div>
    <div class="t-sec"><h3>코인과 은행</h3>
      <div class="row2">
        <label class="t-field" for="cPer">맞힌 문제당 코인<input type="number" id="cPer" min="0" step="1" value="${esc(c.coinPer)}"></label>
        <label class="t-field" for="cBonus">만점 보너스 코인<input type="number" id="cBonus" min="0" step="1" value="${esc(c.bonus)}"></label>
        <label class="t-field" for="cRate">은행 금리 (1주일 이율 %)<input type="number" id="cRate" min="0" max="50" step="0.05" value="${esc(c.rate)}"></label>
      </div>
      <p class="t-help">한국은행 기준금리는 연 3.00%예요(2026년 10월 22일 동결, 다음 결정 11월 26일). 바뀌면 숫자만 고쳐 저장하세요.</p>
    </div>
    <div class="t-sec"><h3>우리 반 순위표</h3>
      <div class="row2">
        <label class="t-field" for="cClass">반 이름<input type="text" id="cClass" maxlength="20" value="${esc(c.className)}"></label>
        <label class="t-field" for="cBoard">순위 보여 주기${sel("cBoard",[["상위5","상위 5명"],["상위10","상위 10명"],["전체","전체"],["숨김","숨김 (합계만)"]],c.board)}</label>
        <label class="t-field" for="cBName">순위표 이름${sel("cBName",[["이름","이름"],["번호","번호만"]],c.boardName)}</label>
      </div>
    </div>
    <div class="apply-bar"><button type="button" class="primary" id="cSave">설정 저장</button><p class="msg" id="cMsg" role="status">${esc(tMsgTxt)}</p></div>
  </article>

  <article class="card">
    <h3>상점 품목</h3>
    <div class="shop-edit" id="tShop">${TSHOP.map((it,i)=>`<div class="shop-row">
      <label class="t-field" for="ts-name-${i}">품목 이름<input type="text" id="ts-name-${i}" maxlength="30" value="${esc(it.name)}"></label>
      <label class="t-field" for="ts-price-${i}">가격(코인)<input type="number" id="ts-price-${i}" min="0" step="1" value="${esc(it.price)}"></label>
      <label class="t-field sr-desc" for="ts-desc-${i}">설명<input type="text" id="ts-desc-${i}" maxlength="60" value="${esc(it.desc||"")}"></label>
      <button type="button" class="ghost" data-del="${i}">삭제</button>
    </div>`).join("")||`<p class="empty">품목이 없어요.</p>`}</div>
    <div class="actions"><button type="button" class="ghost" id="tAdd">품목 추가</button><button type="button" class="primary" id="tShopSave">상점 저장</button></div>
    <p class="msg" id="tShopMsg" role="status"></p>
  </article>

  <article class="card">
    <h3>건네줄 물건 (${pend.length})</h3>
    ${pend.length?`<ul class="receipts">${pend.map(p=>`<li><span class="rinfo"><b>${esc(p.who)} · ${esc(p.name)}</b><small>${whenKST(p.t)} · ${fmt(p.price)}코인</small></span><span class="rcode">${esc(p.code)}</span><button type="button" class="ghost" data-give="${esc(p.k)}|${esc(p.id)}">건네줬어요</button></li>`).join("")}</ul>`:`<p class="empty">아직 건네줄 물건이 없어요.</p>`}
  </article>

  <article class="card">
    <h3>학생 (${studs.length}명)</h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>학번</th><th>이름</th><th>지갑</th><th>은행</th><th>주식</th><th>퀴즈</th><th>오늘</th><th></th></tr></thead><tbody>
    ${studs.map(([k,s])=>`<tr><td>${esc(k)}</td><td>${esc(s.name)}</td><td>${fmt(s.wallet)}</td><td>${fmt(s.bank)}</td><td>${fmt(valueOf(s))}</td><td>${+s.qCount||0}회</td><td>${s.quiz&&s.quiz.date===today()?(s.quiz.state==="완료"?`${s.quiz.right}/${s.quiz.total}`:"푸는 중"):"-"}</td><td><button type="button" class="link" data-reset="${esc(k)}">비밀번호 초기화</button></td></tr>`).join("")||`<tr><td colspan="8" class="empty">아직 들어온 학생이 없어요.</td></tr>`}
    </tbody></table></div>
    <div class="t-sec"><h3>코인 직접 주기·빼기</h3>
      <div class="row2">
        <label class="t-field" for="gWho">학생${sel("gWho",studs.map(([k,s])=>[k,`${k} ${s.name}`]),"")}</label>
        <label class="t-field" for="gAmt">코인 (빼려면 -)<input type="number" id="gAmt" step="1" placeholder="예: 30 또는 -20"></label>
        <label class="t-field" for="gWhy">이유<input type="text" id="gWhy" maxlength="30" placeholder="예: 발표 칭찬"></label>
      </div>
      <div class="actions"><button type="button" class="primary" id="gGo" ${studs.length?"":"disabled"}>지갑에 반영</button></div>
      <p class="msg" id="gMsg" role="status"></p>
    </div>
    <p class="t-help">비밀번호 초기화를 누르면 그 학생은 다음에 들어올 때 새 비밀번호를 정해요. 코인 기록은 그대로 남아요.</p>
  </article>
  <article class="card"><h3>주가</h3><p class="t-help">지금 시세: ${esc(MARKET.label||"정보 없음")}. GitHub가 평일 장중 10분마다, 장 마감 뒤 한 번 더 네이버 시세를 가져와요. 선생님 컴퓨터가 꺼져 있어도 돌아가요.</p></article>`;
  tMsgTxt="";
  $("#cSave").onclick=()=>{
    const v={range:$("#cRange").value.trim()||"1-25",count:+$("#cCount").value,type:$("#cType").value,random:$("#cRandom").value==="1",note:$("#cNote").value.trim().slice(0,80),
      coinPer:Math.max(0,Math.round(+$("#cPer").value||0)),bonus:Math.max(0,Math.round(+$("#cBonus").value||0)),rate:Math.max(0,Math.min(50,r2(+$("#cRate").value||0))),
      className:$("#cClass").value.trim()||"우리 반",board:$("#cBoard").value,boardName:$("#cBName").value};
    act($("#cSave"),$("#cMsg"),async()=>{await R("config").set(v);tMsgTxt=`저장했어요. 퀴즈 범위: ${rangeText(parseDays(v.range))}`}).then(ok=>ok&&renderTeacher());
  };
  const syncShop=()=>TSHOP.forEach((it,i)=>{it.name=$("#ts-name-"+i).value;it.price=Math.max(0,Math.round(+$("#ts-price-"+i).value||0));it.desc=$("#ts-desc-"+i).value});
  $("#tAdd").onclick=()=>{syncShop();TSHOP.push({id:"p"+Date.now().toString(36),name:"",price:100,desc:"",on:true});renderTeacher();$("#ts-name-"+(TSHOP.length-1)).focus()};
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{syncShop();TSHOP.splice(+b.dataset.del,1);renderTeacher()});
  $("#tShopSave").onclick=()=>{syncShop();const obj={};TSHOP.filter(it=>it.name.trim()).forEach(it=>obj[it.id]={name:it.name.trim().slice(0,30),price:it.price,desc:(it.desc||"").trim().slice(0,60),on:true});
    act($("#tShopSave"),$("#tShopMsg"),async()=>{await R("shop").set(obj);TSHOP=null}).then(ok=>{if(ok){renderTeacher();$("#tShopMsg").textContent="상점을 저장했어요."}})};
  document.querySelectorAll("[data-give]").forEach(b=>b.onclick=()=>{const [k,id]=b.dataset.give.split("|");act(b,null,()=>R(`purchases/${k}/${id}/used`).set(true))});
  document.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.reset;
    if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="한 번 더 누르면 초기화";return}
    act(b,null,async()=>{const g=(await db.ref("matchum/gens/"+k).once("value")).val()||0;await db.ref("matchum/gens/"+k).set(g+1);await R(`students/${k}/uid`).remove()}).then(ok=>{if(ok)b.textContent="초기화했어요"});
  });
  $("#gGo").onclick=()=>{const k=$("#gWho").value,a=r2(+$("#gAmt").value||0),why=$("#gWhy").value.trim()||"선생님";
    if(!k||!a)return $("#gMsg").textContent="학생과 코인을 정해 주세요.";
    act($("#gGo"),$("#gMsg"),async()=>{const cur=(await R(`students/${k}/wallet`).once("value")).val()||0;
      await R(`students/${k}/wallet`).set(r2(Math.max(0,cur+a)));await R("logs/"+k).push({t:SV.TIMESTAMP,text:`선생님: ${why}`,amount:a});
      tMsgTxt="";}).then(ok=>{if(ok){$("#gAmt").value="";$("#gMsg").textContent=`${k}에게 ${a>0?"+":""}${fmt(a)}코인을 반영했어요.`}})};
}

/* ---------- 시작 ---------- */
function setupData(user){
  offAll();
  on(R("config"),s=>{CFG={...DEF_CFG,...(s.val()||{})};rerender()});
  on(R("shop"),s=>{SHOP=s.exists()?s.val():DEF_SHOP;if(role==="teacher"&&current==="teacher"&&!typing())TSHOP=null;rerender()});
  on(R("students"),s=>{STUDENTS=s.val()||{};if(role==="student"){const mine=STUDENTS[KEY];if(mine){const first=!ME;ME=mine;renderMe();if(first){payInterest();showTab(location.hash.slice(1)||"quiz")}else rerender()}}else rerender()});
  if(role==="student"){
    on(R("logs/"+KEY).limitToLast(25),s=>{LOGS=Object.values(s.val()||{}).sort((a,b)=>b.t-a.t);if(current==="bank")rerender()});
    on(R("purchases/"+KEY),s=>{BUYS=Object.values(s.val()||{}).sort((a,b)=>b.t-a.t);if(current==="shop")rerender()});
  }else{
    on(R("purchases"),s=>{ALLBUYS=s.val()||{};if(current==="teacher")rerender()});
  }
}
function boot(){
  const fc=window.FIREBASE_CONFIG;
  if(!window.firebase||!fc||!fc.apiKey){$("#view-login").hidden=false;$("#view-login").innerHTML=`<article class="card"><p class="kind">연결 오류</p><h2>서버에 연결하지 못했어요</h2><p class="t-help">인터넷 연결을 확인하고 새로 고쳐 주세요.</p></article>`;return}
  firebase.initializeApp(fc);db=firebase.database();auth=firebase.auth();SV=firebase.database.ServerValue;
  $("#view-login").hidden=false;$("#view-login").innerHTML=`<article class="card"><p class="kind">불러오는 중</p><h2>우리 반 기록을 가져오고 있어요…</h2></article>`;
  auth.onAuthStateChanged(user=>{
    offAll();ME=null;Q=null;STUDENTS={};LOGS=[];BUYS=[];TSHOP=null;
    if(!user){role=null;KEY=null;renderMe();showLogin();return}
    if((user.email||"").toLowerCase()===TEACHER()){role="teacher";KEY=null;renderMe();setupData(user);showTab(location.hash.slice(1)||"teacher");return}
    const k=keyOfEmail(user.email);
    if(!k){auth.signOut();return}
    role="student";KEY=k;setupData(user);
  });
  loadMarket();setInterval(loadMarket,120000);
}
boot();
