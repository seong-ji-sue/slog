---
title: "위코드 Week 7 회고 — Foundation 마지막 주, RESTful API와 에러 핸들링 정리"
date: 2021-10-02 19:31:00 +0900
description: "위코드 부트캠프 Foundation 마지막 주 회고. 한 것, 질문한 것, 알게 된 것을 정리함"
categories: ["회고"]
tags: ["위코드", "부트캠프", "Foundation", "회고", "RESTful API", "에러핸들링"]
series: "위코드 부트캠프 회고"
difficulty: 1
log: 38
slug: "wecode-week7-foundation-final"
source: https://zibu-story.tistory.com/172
draft: false
---

> **TL;DR** — 위코드 Foundation 마지막 주. 위벅스 백엔드 미션과 암호화, 에러 핸들링을 정리하며 1차 프로젝트를 앞둔 마지막 학습 주간을 보냈다.

난이도 : ★☆☆☆☆

## ✅ 상황 (Situation)

위코드 부트캠프 Foundation 마지막 주다. 다음 주부터 바로 1차 프로젝트가 시작되는데, 팀원들은 벌써 컴포넌트를 만들고 있다는 소식이 들려왔다. TIL은 밀려 있고 할 일은 산더미인데 주말은 끝나가는, 전형적인 부트캠프 막바지 주간이었다.

## ✅ 목표와 내 역할 (Task)

이번 주 목표는 두 가지였다.

- 위벅스 백엔드 미션 6까지 마무리 (Product 단위로 쿼리를 짜고 에러 처리까지)
- 세션에서 배운 암호화를 적용해 미션 7까지 끝내기

## ✅ 한 것 (Action)

- 위벅스 백엔드 미션을 Product 단위로 분류해 쿼리를 짜고 에러 처리를 붙였다.
- 세션에서 다룬 암호화(bcrypt)를 미션 7에 적용했다.
- 데이터베이스 모델링을 ERD로 정리했다.
- RestAPI 관련 TIL을 마무리하고, 밀린 TIL을 전체적으로 한 번 정리했다.

멘토·팀원과 나눈 질의응답 중 실무적으로 남는 부분들이다.

- **DB 조회 횟수** — DB는 한 번만 갔다 오는 게 좋다고 배웠는데, `queryRaw`로 한 번에 데이터를 가져온 뒤 자바스크립트 코드로 나누는 게 나은지 물었다. 답은 "상황에 따라 다르다"였다. join도 자원을 쓰기 때문에 상황에 따라 `queryRaw`를 따로 쓰기도 하고, 한 번에 join해서 가져오는 게 낫다면 그럴 만한 이유가 있어야 한다.
- **테이블 조인을 SQL에서 할지 서비스 레이어에서 할지** — SQL에서도 가능하지만, 되도록 서비스 레이어에서 하는 게 낫다. 모델 레이어에서 SQL로 처리하면 나중에 두 테이블을 따로 가져오고 싶을 때 비효율적이기 때문이다.
- **에러 체크 모듈화** — 비동기 오류를 처리하는 wrapper 모듈을 만들어서 모든 에러를 상단 에러 미들웨어로 분기 처리하기로 했다.

```javascript
function wrapAsync(fn) {
  return function (req, res, next) {
    // 모든 오류를 catch로 잡아 다음 미들웨어(에러 핸들러)로 넘긴다
    fn(req, res, next).catch(next);
  };
}
```

- `.env` 값을 불러오는 `dotenv` 설정과 JWT 토큰 발행 코드를 정리했다.

```javascript
// app.js
import dotenv from 'dotenv';
dotenv.config();

// 토큰 생성
import jwt from 'jsonwebtoken';

const { KEY } = process.env;

const issue = async (id) => {
  return jwt.sign({ id }, KEY, { expiresIn: '1h' });
};
```

- express의 `router`를 체이닝해서 쓰는 방법도 정리했다.

```javascript
router
  .get(/* ... */)
  .get(/* ... */)
  .post(/* ... */);
```

## ✅ 결과 (Result)

- 위벅스 백엔드 미션 6까지, 암호화를 포함한 미션 7까지 완료했다.
- ERD로 데이터베이스 모델링을 정리했다.
- Router → Controller → Service → Model 계층을 역할별로 명확히 구분해서 이해했다: Router는 경로 분기만, Controller는 req/res 처리와 에러 핸들링만, Service가 비즈니스 로직(토큰·비밀번호 암호화 포함)을, Model은 쿼리 작업만 담당한다.

## ✅ 배운 점 / 아쉬운 점

**잘한 것**

- 에러 처리를 wrapper 모듈로 분리해서 반복 코드를 줄인 것
- 계층별 책임을 명확히 나눠서 이해한 것 — Router/Controller/Service/Model이 각자 뭘 해야 하는지 헷갈리지 않게 됐다

**아쉬운 것**

- TIL이 계속 밀리는 습관을 이번 주에도 못 고쳤다. "병맛 TIL로 변질 중"이라고 스스로 적어놨을 정도다.
- 쿠키와 세션의 차이, HTTP 상태 코드별 처리 기준 등 아직 안 풀린 질문이 많이 남았다.

다음 주부터 1차 프로젝트인데, 팀원들이 이미 컴포넌트를 만들고 있다는 소식에 마음이 급해졌다.

![주말인데 팀원들은 이미 컴포넌트를 만들고 있다는 소식을 들었을 때의 감정](/images/172/img_01.jpg)

## 참고한 링크

- [Node.js 에러 핸들링](https://jeonghwan-kim.github.io/node/2017/08/17/express-error-handling.html)
- [MySQL 여러 컬럼을 JSON으로 변환하기](https://stackoverflow.com/questions/41167025/mysql-convert-multiple-columns-into-json)
- [Tistory 백업 익스트랙터](https://github.com/doortts/tistory-backup-extractor)
