---
title: "Node.js 백엔드에 TypeScript를 처음 도입한 이야기 — 왜 끝단부터 시작했나"
date: 2023-07-06 18:00:00 +0900
description: "전면 전환 대신 API 호출 로직부터 끝단으로 순차 도입한 TS 마이그레이션 실전 기록"
categories: ["일감"]
tags: ["TypeScript", "Node.js", "Babel", "타입추론", "리팩토링", "마이그레이션"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
scope: "company"
log: 83
draft: false
---

> **TL;DR** — 전체 코드베이스를 한번에 TS로 바꾸는 대신, API 호출 로직처럼 입출력이 명확한 "끝단"부터 순차적으로 타입을 씌웠다. 이후 controller 분리, Common 모듈 타입화까지 단계적으로 확장했다.

난이도 : ★★☆☆☆

1️⃣ `단계적 마이그레이션` 2️⃣ `타입 추론` 3️⃣ `관심사 분리`

### ✅ 요구사항

> 사수 : Node.js 백엔드에 TS를 부분적으로라도 도입해보면 좋겠다  
> 나 : 전체를 한번에 바꾸는 건 리스크가 큰데, 어디서부터 시작하는 게 맞을까요?  
> 사수 : 끝단부터, 그러니까 API 호출하는 부분부터 순차적으로 들어가는 게 안전할 것 같다  
> 나 : 넵, 기본 세팅부터 하고 API 호출 로직 → controller → 공통 모듈 순으로 넓혀볼게요

프로젝트 자체는 이미 JS로 잘 동작하고 있었다. 그래서 "전면 재작성"이 아니라 "부분 도입"이 요구사항이었고, 배포 테스트로 버그를 확인하면서 점진적으로 넓혀가는 방식이 조건이었다.

### ✅ 왜 하필 API 호출 로직부터인가

타입을 어디서부터 씌울지는 생각보다 중요한 결정이다. 나는 이 프로젝트에서 "끝단부터 순차적으로 도입하는 게 맞다"는 결론을 내렸는데, 이유는 단순하다.

- API 요청/응답 데이터는 이미 형태가 고정돼 있어서(스펙이 있어서) 타입을 뽑아내기 가장 쉽다
- 여기서 타입이 확정되면, 그 타입을 위쪽(controller, service)으로 점점 전파시킬 수 있다
- 반대로 내부 로직부터 타입을 씌우면, 아직 정의되지 않은 API 응답 타입 때문에 `any`가 계속 새어 들어온다

즉 "타입이 가장 안정적인 지점부터 시작해서, 안쪽으로 전파한다"는 원칙이었다.

### ❌ 기존 구조

- 전체가 순수 JS — 함수 시그니처만 보고는 뭐가 들어오고 나가는지 알 수 없음
- API 응답 형태가 바뀌어도 컴파일 타임에 잡히지 않고, 실제로 호출되는 시점에야 오류가 드러남
- router 함수 안에 비즈니스 로직이 섞여 있어서, 타입을 씌우려 해도 어디까지가 "요청 처리"고 어디부터가 "로직"인지 애매함

### ✅ 최종 목표

1. TS 기본 세팅 (Babel 포함) — 빌드 파이프라인 자체가 깨지지 않게
2. API 호출 로직의 요청/응답 타입 정의
3. router에서 controller를 분리해서 관심사를 나누고, 응답(res) 타입을 추론 가능하게
4. 여러 앱이 같이 쓰는 Common 모듈까지 타입 확장

### 🛠️ TS 기본 세팅

Node.js 프로젝트에 TS를 얹을 때 제일 먼저 부딪히는 문제는 "빌드 체인을 어떻게 통과시키느냐"다. 이 프로젝트는 이미 Babel 기반 빌드가 돌아가고 있었기 때문에, `tsc`로 완전히 갈아엎기보다는 Babel에 TS 프리셋을 얹는 쪽을 택했다.

```json
// .babelrc
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-typescript"
  ]
}
```

`@babel/preset-typescript`는 타입 체크는 하지 않고 타입 구문만 제거해주는 방식이라, 기존 빌드 속도를 크게 해치지 않으면서 TS 문법을 쓸 수 있게 해준다. 대신 타입 체크 자체는 IDE(에디터)와 별도 `tsc --noEmit` 검증에 맡기는 구조다.

### 🛠️ API 호출 로직 타입화

요청/응답 데이터 형태부터 타입으로 뽑아냈다.

```ts
interface ApiRequestPayload {
  // 요청 시 필요한 필드
}

interface ApiResponseBody<T> {
  data: T;
  message?: string;
}

async function callApi<T>(payload: ApiRequestPayload): Promise<ApiResponseBody<T>> {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}
```

포인트는 응답 타입을 제네릭(`T`)으로 열어둔 것이다. API마다 데이터 형태는 다르지만 감싸는 형태(`data`, `message`)는 동일했기 때문에, 공통 wrapper 타입 하나로 여러 API 호출을 재사용할 수 있었다.

### 🛠️ Controller 분리 + 응답 타입 추론

router 함수 안에 뒤섞여 있던 로직을 controller로 뽑아내면서, 응답 형태를 타입으로 추론할 수 있게 바꿨다.

```ts
// 기존: router 안에서 바로 처리
router.get("/users", async (req, res) => {
  const users = await db.query(...);
  res.json(users); // users의 타입이 뭔지 여기선 알 수 없음
});

// 이후: controller로 분리
async function getUsersController(req: Request): Promise<ApiResponseBody<User[]>> {
  const users = await userService.findAll();
  return { data: users };
}

router.get("/users", async (req, res) => {
  const result = await getUsersController(req);
  res.json(result); // result의 타입이 ApiResponseBody<User[]>로 고정됨
});
```

router는 "요청을 받아서 controller에 넘기고 응답한다"는 역할만 남았고, 실제 처리와 반환 타입은 controller가 책임지게 됐다. 이 분리 덕분에 `res.json()`에 뭘 넣고 있는지가 타입으로 드러나기 시작했다.

### 🛠️ Common 모듈 타입화

여러 앱이 공유하는 Common 모듈까지 타입을 확장했다. 여기서 중요했던 건 "Node.js(백엔드)에서도 이 타입이 그대로 쓰일 수 있는가"를 확인하는 것이었다 — 공유 모듈이라 한쪽에서만 타입이 맞고 다른 쪽에서 깨지면 의미가 없기 때문이다.

Common 모듈은 여러 앱이 동시에 가져다 쓰는 코드라, 타입 하나를 잘못 씌우면 그 여파가 앱 하나가 아니라 이 모듈을 참조하는 모든 앱으로 번진다는 점이 API 호출 로직이나 controller 타입화와는 무게가 달랐다. 예를 들어 Node.js 환경에만 존재하는 타입(파일 시스템, 프로세스 객체 등)을 무심코 노출해버리면, 이 모듈을 가져다 쓰는 브라우저 쪽 코드는 그 타입을 만족시킬 방법이 없어 컴파일이 깨진다. 그래서 여기서도 앞서 세운 "타입이 가장 안정적인 지점부터 시작한다"는 원칙을 그대로 따랐다 — 런타임 환경을 타지 않는 순수 데이터 형태(상수, 에러 코드, 요청/응답 스키마)부터 먼저 타입을 씌우고, 특정 런타임에 종속적인 부분은 그 이후 단계로 미뤄뒀다. 안쪽부터 타입을 씌우면 `any`가 새어 들어온다던 앞서의 문제를, 공유 모듈이라는 조금 더 위험도가 높은 지점에서도 똑같이 피해간 셈이다.

### ✅ 전체 진행 순서 요약

<!-- 이미지 제안: "끝단(API 호출) → controller → Common 모듈" 순으로 타입을 전파해 나간 단계적 마이그레이션 흐름도 -->

1. Babel에 TS 프리셋 추가 — 빌드 체인 유지한 채 TS 문법 사용 가능하게
2. API 호출 로직의 요청/응답 타입 정의 (제네릭 wrapper)
3. router → controller 분리, 응답 타입 추론 가능하게
4. Common 모듈 타입 확장 + 여러 앱에서 사용 가능성 테스트
5. 배포 테스트로 버그 확인 및 수정

#### 🎯 결과

전면 재작성 없이, 타입이 가장 안정적인 지점(API 응답 스펙)부터 시작해서 안쪽으로 넓혀가는 방식으로 리스크를 낮췄다. 이후 이 프로젝트의 다른 모듈들도 같은 순서(끝단 → controller → 공통 모듈)를 그대로 따라가게 됐고, 지금 돌아보면 "타입을 어디서부터 씌울지"에 대한 원칙 하나를 세운 게 이후 작업 전체의 기준점이 됐다.

## 참고한 링크

- [Babel TypeScript Preset](https://babeljs.io/docs/babel-preset-typescript)
