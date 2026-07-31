---
title: "위코드 Week 7(Foundation, 마지막 후기) - 1주동안 한것들~~~!!, 질문한것들~!!, 알게된것들~!, 후기~!!! , 참고한것들~!"
date: 2021-10-02 19:31:00 +0900
categories: ["교육(Education)"]
tags: ["FOUNDATION", "Wecode", "week7", "부트캠프", "알게된거", "위코드", "질의응답", "한것들", "후기"]
source: https://zibu-story.tistory.com/172
post_id: 172
---

### ***난위도 : ★★😁😊😋***

**병맛 TIL로 변질중~.....?**

**한거는 겁나 많은데 TIL 쓴거는 별로 없다.**

**그 이유는 아직 못쓴 TIL이 많기 때문이다~!**

**아직 주말이 안끝났고 프로젝트 주도 아닌데**

**다들 컴포넌트 만드는중....ㅠ**

**그만해~!!!!!!**

![흐으에에에엥ㅇ에에에](../images/172/img_01.jpg)

*흐으에에에엥ㅇ에에에*

### ***✔️마지막 Foundation 빽 한것들~! (예고편 :다음주 1차 프로젝트때는 죽어날듯,...ㅠ)***

- **평일**
  - [x] 위벅스 백 미션 6까지 product로 분류하고 쿼리문 쓰고 에러처리까지하기
  - [x] 외장하드 고치는데 연락해서 언제 처리되는지 확인하기
  - [x] 학점은행제 4주차 강의 남은거 마저 듣기
  - [x] 세션때 했던 암호화 듣고 미션 7 끝내기
  - [x] 외장하드 고치는데 연락해서 이메일 잘못왔다고하기
  - [x] 노트북 화면 닦고 필름 붙이기
  - [x] 마이그레이션 파일 이름 설정하는거 팀원한테 물어보
  - [x] TIL 전체적으로 한번 싹 정리하기ㄴ
- **주말**
  - [ ] 개인노션에 궁금한것들 정리한거 다 완료하고 따로 정리해놓기
  - [ ] 토요일부터 초심을 잃지않는마음으로 회고록 쓰기 ex) 운동꼭해야되는이유 , 사람들이랑 소통할때, 코딩에대한 나의 마음가짐, 겸손한 마음을 갖어야되는 이유, 책을 읽어야되는이유, 코딩에 흥미를 갖는 방법
  - [ ] 개인 노션에 정리한거 싹다TIL에 업로드하기
  - [x] RestAPI TIL 마무리하기
  - [ ] Node.js TIL마무리하기
  - [ ] express TIL 마무리하기
  - [ ] Node.js강의 익스프레스 까지 듣기
  - [ ] 취업지원제도 활동 하기
  - [x] 데이터 베이스 모델링 ERD로 작성하기
  - [x] 이미지로 쓸만한 사이트 찾기

### ***✔️질의 응답~! 개많이 물어봄~!😆😄***

- **질문** : 그럼 혹시 전에 DB는 한번만 갔다오는게 좋다고 하셨는데 그러면 qeryRaw로 한번에 데이터를 다가지고와서 리뷰랑 상품 데이터를 자바스크립트 코드로￣ 나눈ｑ다음 URI를 따로 줘서 프론트단으로 넘겨줘야되나요?  
  **Re**: 상황에따라 다른데 통상적으로 join하는도 자원이 들기때문에 따로 queryRaw쓰는데 내가 한번에 join해서 가져오는게 더 낫다고하면 그만한 이유가 있어야
- **질문** : 상품정보의 프로퍼티로 영양정보테이블을 묶는거 sql에서 할수있는지????  
  **Re**: 가능한데 이거는 되도록이면 service단에서 하는게 좋다. 그리고 sql에서 하는 방법 찾았는데 어찌됬든 모델단 형식에 맞게 테이블을 수정해서 가져오면 나중에 상품정보랑 영양정보테이블을 따로 가지고 오고싶은 경우가 생길수 있기 때문에 비효율적이다  
  **참고** : <https://stackoverflow.com/questions/41167025/mysql-convert-multiple-columns-into-json>  

  ```javascript
  {
              "id": 12,
              "category": "콜드브루커피",
              "koreanName": "콜드 브루 플로트",
              "englishName": "Cold Brew Float",
              "imageUrl": "https://image.istarbucks.co.kr/upload/store/skuimg/2021/02/[9200000001635]_20210225092236754.jpg",
              "content": "[리저브 전용음료] 리저브 콜드 브루 위에 녹아 내리는 한 스쿱의 바닐라 아이스크림",
              "nutrition": {
                  "servingSize": "Tall(톨) / 755ml (12 fl oz)",
                  "caffeine": 135,
                  "fat": 1,
                  "kcal": 5,
                  "natrium": 4,
                  "protein": 22,
                  "sugar": 0,
                  "triggers": "알레르기 유발요인 : 우유"
              }
          }
  ```
- **질문** : 카테코리의 프로퍼티로 상품정보객체를 묶어서 주는 거는 어떤지 그리고 두번째 카테고리의 첫번째 상품정보는 어찌됬든 첫번째 카테고리의 마직막 상품정보의 id를 이어 받는데 이 id 값을 수정해도 되는지?   
  **Re** :데이터 고유의 값은 수정안하는게 좋고 이렇게 service단에서 프론트가 원하는 형식데로 묶어주는거는 좋은거임  

  ```javascript
  {//위에 category.id 가 1인 JSON 객체 위에있음
              "id": 2,
              "category": "브루드 커피",
              "count": 2,
              "product": [
                  {
                      "id": 14,
                      "category": "브루드 커피",
                      "koreanName": "아이스 커피",
                      "imageUrl": "https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[106509]_20210430111852999.jpg"
                  },
                  {
                      "id": 15,
                      "category": "브루드 커피",
                      "koreanName": "오늘의 커피",
                      "imageUrl": "https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[2]_20210430111934246.jpg"
                  }
              ]
          }​
  ```
- **질문** : 에러체크하는 모듈을 따로 만들어서 관리하려고 하는데 어떻게 해야됨??   
  **Re** : 에러를 체크하는 wrapper모듈을 만든다음 아래 코드를 넣고 모든 에러는 여기로 분기처리해서 상단 에러 미들 웨어에서 처리하겠음 하기  
  **참고** : <https://jeonghwan-kim.github.io/node/2017/08/17/express-error-handling.html>   

  ```javascript
  function wrapAsync(fn) {
    return function (req, res, next) {
      // 모든 오류를 .catch() 처리하고 체인의 next() 미들웨어에 전달하세요
      // (이 경우에는 오류 처리기)
      fn(req, res, next).catch(next)
    }
  }
  ```

### ***🤷‍♂️알게된것들~~ (해답 아래 T스토리 링크 클릭)😋😎***

- 서비스 단에서 자바스크립트 코드로 데이터를 정돈하는것보다는  모델단에서 쿼리로 정리해와서 한번에 가져오는게 유리함
- RestFul의 단점을 보안하기위해 페이스북에서 GrapSQL을 출시함(객체형식으로 되있음, REST는 필요한 것보다 더 많거나 적게 받아오는 오버페칭·언더페칭 문제가 있는데 이를 해결하려고 나온것)
- Router 단은 진심 경로 분기만하고 Controller에는 진심 req, res에대한 처리+try~catch로 인한 에러핸들링만 하고 Service단에서 비지니스 로직을 다 처리하면 됨(토큰과 비밀번호 암호화하는거는 Service단에서) 모델단에는 데이터베이스 꺼내오는 쿼리작업만하기 , 에러 핸들링이 반복되면 wrapper모듈로 진심 에러만 다루는 로직을 짜면됨(자세한내용 공식문서 참고)
- T스토리에 있는 게시글을 깃허브 TIL에 옮기려면 마이그레이션을 이용하면 됨   
  참고 : <https://github.com/doortts/tistory-backup-extractor>
- dotenv 는 .env 파일에 있는 부분을 가져올때 사용한다  

  ```javascript
  //app.js
  import dotenv from 'dotenv';

  dotenv.config();

  //토큰 생성하는곳
  import jwt from 'jsonwebtoken';

  const { KEY } = process.env;

  const issue = async id => {
    return jwt.sign({ id: id }, KEY, { expiresIn: '1h' });
  };

  //.env 
  KEY = 'ZiBucks'​
  ```

- express에서 router를 패싱해서 사용 가능하다(하나의 router 객체에 메소드를 체이닝해서 코드를 간결하게 묶을 수 있음)  

  ```javascript
  router
    .get(~~)
    .get(~~)
    .post(~~)
  ```

### ***✔️아직 안풀린 궁금한 의문점들~! 누가좀 알려줭~~~!!🤨🤔***

- [ ] 쿼리문 에러체크 하는거는 Service에서 하는거?? 아님 Model단에서 바로하는거??
- [x] 다수의 모듈을 하나로 묶어서 router로 처리하는 방법
- [ ] Multiple Opțional filtering in mysql????
- [ ] 터미널에서 나의 아이피 확인 방법~!!
- [x] 나라에서 무료로 지원해주는 공용 API 찾아보기
- [x] 네이버 지도나 카카오 로그인 오픈소스 하는방법찾기
- [x] 나라에서 하는 공모전 뭐 있는지 찾아보기
- [ ] 에러랑 예외의 차이점은??
- [ ] 각각의 상태코드를 어떠한 상황에서 처리해야됨??
- [ ] gitIgnore를 깃에 추가하지 않는 방법
- [ ] 이즈베리파이 가 토큰으로 사용자인지 검증하는거라고 했는건데 어떻게씀?
- [ ] 쿠키랑 세션의 차이점은 뭐임?? 관희님이 공유해준 슬랙   
  링크 : <https://interconnection.tistory.com/74> <https://stackoverflow.com/questions/6253633/cookies-vs-sessions>
- [ ] sql에서 하나의 테이블을 다른하나의 테이블의 프로퍼티값으로 넣는방법 써보기 <https://stackoverflow.com/questions/41167025/mysql-convert-multiple-columns-into-json>
- [ ] 마이그레이션 파일 이름 어떻게 바꿈?

### ***✔️진실 농도 100% 위코드 후기~!😲***

**\* 회고록 쓰면서 후기까지 같이 쓰겠음 밑에 링크~**

### ***✔️🎃참고한 링크 목록emf***

<https://zibu-story.tistory.com/171>

[🔗 10.02 위코드 Week 7(Foundation, RestAPI) - CRUD란 뭐임???, RestAPI란 뭐임???, HTTP 메소드 종류~! (아직 .... 지](https://zibu-story.tistory.com/171) — 난위도 : ★★★🧨✨🎉 빽단에서 서버로 보낼때 RestAPI 규칙을 참고해서 보내야되고 URI도 형식에 맞춰야된다. (급박하게 쓴 글이라서 나중에 수정할 생각~!) 🎈# CRUD는 뭐임???? 꼭알아야됨~!!!

<https://zibu-story.tistory.com/127>

[🔗 9.10 위코드 Week4(Foundation, React) - 비동기 함수란? fetch 함수, req ?? res ?? , Promise객체란? , .then메소드](https://zibu-story.tistory.com/127) — 난위도 : ★★★★☆ 웹브라우저의 이해 필요~! 웹브라우저 구동 방식 ( request,response) 자바스크립트 모든 부분 이해 필요 웹브라우저 개발자 도구 활용방법 알아야됨 여기부터 공부하기 https://zib

![필독.png](../images/172/img_02.png)
