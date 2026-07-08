---
title: "위코드 Week 5(Foundation, 후기) - 노드 세션 시작~! , 해야될것, 궁금한것, 모르는 용어~! , TIL쓴거 최종 정리"
date: 2021-09-19 20:32:00 +0900
categories: ["교육(Education)"]
tags: ["5주차", "node", "ORM", "prisma", "SQL", "Wecode", "부트캠프 후기", "빽엔드", "위코드", "질의문"]
source: https://zibu-story.tistory.com/162
post_id: 162
---

## ***Foundation week5🎃(Node.js)***

## ***난위도 : ★★★☆🙄😏***

**빽엔드 : 할꺼는 겁나 많은데 코딩할꺼는 별로 없음**

**프론트엔드 : 할꺼는 정해져있는데 코딩할꺼는 겁나 많음**

![구글링 퍼옴](../images/162/img_01.png)

*구글링 퍼옴*

### ***✔️ 해야될거~!! 겁나 많네 백... ㅠ😣😴***

- **평일에 한것**
  - [x] props, state 복습 및 TIL 작성하기
  - [x] 114에 전화해서 집 인터넷 않되는 이유 물어보기
  - [x] 명정보기술 전화해서 결제하기
  - [x] 노션에 정리한거 TIL 업로드하기
  - [x] Refactoring 관련 TIL 프론트편 작성하기
  - [x] 면접 질문 정리해서 TIL에 업로드하기
  - [ ] 우창님이 슬랙으로 보내주신 책 사기
  - [x] 어제 wrapup 했던 개념 비동기 정리한 개념 찾기 Notion과제 참고
  - [x] node 미션 1 과제하기
  - [x] 우분투 환경에서 mysql 깔기
  - [x] 블로그 TIL 작성하기
  - [ ] 모르는거 개념 찾기
  - [x] 데이터베이스 세션 영상 듣기
  - [x] 깃 설치하기 터미널에서 연동되는지 확인
  - [x] mysql 쿼리문 공부하기
  - [x] 블로그 밀린거 다쓰기
  - [ ] 데이터 형식에 맞게 다시 작성하기
- **주말에 한것**
  - [x] 노션에 정리한거 TIL 업로드하기
  - [x] fetch , 비동기함수 TIL 정리하기
  - [x] 초기세팅 방법 TIL 작성하고 프로젝트때마다 적용하기
  - [x] SQL 질의문 , 문법 관련 TIL 작성하기
  - [x] 1주간 마무리 TIL 작성하기 , 모르는거 포함
  - [ ] TIL 카테고리 한번 정리하기
  - [x] 학점은행 인강 3주차 다듣기
  - [ ] 학점은행 듣는거 자기소계서, 학습계획서 작성하기
  - [ ] 학점은행제 참여센터에 있는 과제하기

### ***✔️5주차에 했던것들~!!!배웠던것***

- 백엔드 프론트엔드 종합적으로 초기세팅할때 해야되는것
- express 를 효율적으로 사용하는 방법
- MVC 모델을 사용하는이유
- Route , Controller, Service, Server, Model(DAO) 에 어떤 코드를 써야되는지
- Require말고 import 구문으로 모듈 가져오는 방법
- Prisma 사용방법, ORM 쓰기
- 터미널 상에서 테이블 생성 및 문법 사용하는 방법
- fetch랑 비동기 함수 사용하는 방법
- 프론트엔드에서 요청한 부분 벡엔드 단에서 처리하는 방법
- await , async 사용하는 방법

### ***✔️🤷‍♂️알게된것들~~ (해답 아래 T스토리 링크 클릭)***

- 우분투는 터미널 상에서 모든것을 설치한다
- 테이블을 만들기전에 먼저 관계를 그려보고 생각해보자
- 먼저 빽이 서버로부터 데이터를 보내주면 프론트가 요청 응답을 한다
- 왠만하면 데이터에서도 변수에 중복을 피하는게 좋다
- 칼럼을 추가하려면 insert into로 쓰는데 터미널에서말고 메모장에 정리후 적용한다.

### ***✔️리엑트 미션 종류***

- [Mission 1] 커피 리스트 및 상세 정보 API
- [Mission 2] 스타벅스 데이터베이스 구축하기
- [Mission 3] | ES6 syntax 사용
- [Mission 4] | Prisma를 활용한 데이터베이스 구축
- [Mission 5] | CRUD - Create & Read
- [Mission 6] Layered Pattern 구현
- [Mission 7] | 암호화
- [Mission 8] | JWT 발행
- [Mission 9] | CRUD - Create & Delete (음료 Like 기능)
- [Mission 10] | CRUD - comments or reviews

### ***✔️질문한것~! 🎎🎏🎏***

- **질문** : 저는 model 단에는 sql 문만 넣어서 처리하도록 생각했었는데 orm을 쓰면 model단이 필요한가요?  
  **RE** : model 단에서 sql 문을 처리하는게 맞음, async자체를 모델단에다가 넣음 그러면 orm도 해도 됨
- **질문** : 라우터단에는 경로 분기만 하는게 좋나요? 아니면 유효성 검사까지 하는게 좋은건가요?  
  **RE** : 경로 분기만 하고 나머지는 Controller에서 하는게 나음
- **질문** : 혹시 미들웨어에서 권한을 알려준다고 했고 서비스단에 권한에따라서 실행해주는 함수를 정한다고했는데 그러면 그 권한여부 은 서비스단에서 import해서 가져와야되는건가요?   
  **RE** : 미들웨어에서 req res 를 받을수있음 req에 헤더에서 추출하면됨 req로 값을 넣어주면 Controller가 가져가서 서비스로 넘겨서 사용

### ***✔️몰랐던 용어 개념 총정리하기~!!! 😍  따로 URL 들어가서 공부하기***

- **nest.js 란 뭐임???** : <https://velog.io/@zoeyul/nestjs>
- **콜스택 이란???** : <https://new93helloworld.tistory.com/358>
- **실행컨텍스트** : <https://poiemaweb.com/js-execution-context>
- **제너레이터** : <https://ko.javascript.info/generators>
- **에크마스크립트** : <https://wormwlrm.github.io/2018/10/03/What-is-the-difference-between-javascript-and-ecmascript.html>
- **udemy(강의)** : <https://www.udemy.com/>

### ***✔️진실 농도 100% 위코드 Pre-course 1주차 후기~!😲***

우왕~! 드디어 Node 의 계절이 왔다. 프론트를 꾸역 꾸역 끝냈지만(아직 Webucks에서 Like 버튼 완전 구현 못함...)

복습 하기도 전에 바로 내 머리속에 express 와 Prisma 라는 이상한 문법을 주입시켰다

솔직하게 프론트는 개념? 보다는 코드를 쓰고 공식문서를 보면서 오류를 고쳐가면서 알아갔는데

빽엔드는 오히려 개념을 어느정도 잡고 가야지 코딩을 할수있다. 왜냐하면 서버와 DB를 구동해야되고 처음보는 문법이

막 다가오기 때문이다.

SQL은 기본이고 자바스크립트 중급정도 끝내는게 더 좋다.

그리고 프로젝트 하는거 대비해서 나처럼 초기세팅 하는법을 따로 정리하는게 좋다.

그래도 Java에서 MVC 모델을 해봐서 기본적인 구조는 이해되지만 문법은 좀더 공부해야될것같다~!

그래도 나는 추석 한주가 껴있어서 개꿀~~~!!

### ***✔️🎃참고한 링크 목록emf***

**1. 초기세팅 가이드( 빽 + 프론트)**

<https://zibu-story.tistory.com/164>

**2. 브라우저, URL, Port, JSON 등 기본 빽 개념**

<https://zibu-story.tistory.com/126>

[🔗 9.18 위코드 Week5(Foundation, Node)- 웹브라우저의 구동 원리, URL등 용어 개념,JSON , AJAX --> 졸지마라 여](https://zibu-story.tistory.com/126) — 난위도 : ★★★☆ 1. 서버랑 브라우저간의 상호작용(request,response) 2. 서버로부터 응답받을때 데이터 타입 3. URL의 구조 4. AJAX란? 5. JSON은 뭥미? 6. 응답에 대한 결과 --> 상태코드~! # 웹이란..

**3. 데이터 베이스 기본 개념 용어 총 정리**

<https://zibu-story.tistory.com/159>

[🔗 9.17 위코드 Week5(Foundation, Node) - 데이터베이스란 뭐지?? 관계형 ?? 비관계형??? , PK FK 는 뭥미?? 1대](https://zibu-story.tistory.com/159) — 🎀난위도: ★★★😁  🎈학습 목표~! (wecode notion 참고)🧨 데이터베이스(Database)의 개념을 이해합니다. 관계형 데이터베이스 (RDBMS)가 무엇이며, 왜 사용하는지 이해합니다. 테이블(Table)이 무엇

**4, 비동기 함수 + fetch + async + Response, Request 등**

<https://zibu-story.tistory.com/127>

[🔗 9.15 위코드 Week5(Foundation, Node) - 비동기 함수란? fetch 함수, req ?? res ?? , Promise객체란? , .then메소드](https://zibu-story.tistory.com/127) — 난위도 : ★★★★☆ 웹브라우저의 이해 필요~! 웹브라우저 구동 방식 ( request,response) 자바스크립트 모든 부분 이해 필요 웹브라우저 개발자 도구 활용방법 알아야됨 여기부터 공부하기 https://zib

**5, 질의문 종류 + SQL 쿼리문 문법 총 정리~!**

<https://zibu-story.tistory.com/165>

[🔗 9.19 위코드 Week5(Foundation, SQL) - SQL이란??? , 쿼리문 종류 뜻, SELECT 구문 문법 종류 (GROUP BY, CAST 등](https://zibu-story.tistory.com/165) — 난위도 : ★★★★★★ 1. 데이터베이스를 생성할수있다 2. 테이블을 생성할때 형식을 지정할수있고 삭제할수있다. 3. 테이블에서 칼럼을 추가할수있다. 4. 내가 원하는 칼럼들만 뽑아서 조건에
