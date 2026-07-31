---
title: "반복되는 폼 검증 테스트, jest 멀티 테스트케이스 제너레이터를 직접 만든 이유"
date: 2023-10-09 14:00:00 +0900
description: "엔진마다 반복되는 CRUD 폼 검증 테스트를 자동 생성하기 위해 Form 조사 → 크로스브라우저 테스트 → jest 테스트케이스 제너레이터로 이어진 과정"
categories: ["일감"]
tags: ["Jest", "테스트자동화", "테스트케이스제너레이터", "크로스브라우저테스트", "폼검증"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 86
draft: false
---

> **TL;DR** — AWS/GCP 등 엔진마다 SE·role CRUD 폼 검증 테스트가 거의 똑같이 반복돼서, 테스트 코드를 매번 새로 짜는 대신 "케이스를 데이터로 정의하고 제너레이터가 읽어서 테스트를 찍어내는" 방식으로 바꿨다.

난이도 : ★★★☆☆

1️⃣ `테스트케이스 제너레이터` 2️⃣ `크로스브라우저 테스트` 3️⃣ `데이터 기반 테스트`

### ✅ 요구사항

> 사수 : 단건 테스트 코드는 다 짜놨는데, 엔진마다 SE 만들고 role 만드는 폼이 다 비슷하잖아. 이거 매번 새로 테스트 코드 짜지 말고 다건으로 한번에 돌릴 방법을 찾아보자  
> 나 : 넵, 일단 반복되는 폼 필드·검증 규칙부터 조사해보고, 케이스를 파일로 뽑아서 읽게 만드는 방향으로 가볼게요

(얼마 뒤)

> 사수 : 그리고 지금까지 테스트가 다 맥 크롬에서만 돌아갔던데, 다른 브라우저·OS에서도 한번 확인해봐야 될 것 같다  
> 나 : 넵, 크로스브라우저 확인부터 먼저 하고 제너레이터는 이어서 진행할게요

### ✅ Form 조사 — 왜 "다건 케이스"가 필요했나

각 클라우드 엔진(AWS SE, GCP SE 등)마다 CRUD 폼이 있는데, 하나씩 뜯어보면 필드 이름과 개수만 다르고 검증 규칙 패턴은 거의 동일했다.

- 필수값 검증
- 최대 길이 검증
- 이름 규칙 정규식 패턴 검증
- 중복 이름 검증

조사에서 잡은 방향은 명확했다. "각 테스트당 다건의 케이스를 파일로 작성 → 그 파일을 테스트 코드가 읽어서 실행 가능한지 확인." 즉 테스트 코드 자체를 늘리는 대신, 케이스 데이터만 늘리고 실행 로직은 공용화하는 방향이다.

### ✅ 브라우저별 기능 테스트 — 제너레이터보다 먼저 짚은 이유

지금까지 테스트는 macOS + Chrome 조합에서만 진행되고 있었다. 실사용자는 Edge, Firefox, Safari, Opera, Windows 등 다양한 조합으로 접근하는데, 이 차이를 미리 확인해두지 않으면 제너레이터가 찍어낼 테스트 케이스에 브라우저별 예외를 반영할 수 없다.

그래서 순서를 이렇게 잡았다.

1. 브라우저·OS 조합별로 수동 기능 테스트 진행 (Chrome·Edge·Firefox·Opera·Safari × macOS·Windows)
2. 브라우저별로 다르게 동작하는 지점(예: input 이벤트 타이밍, 날짜 picker 동작) 별도 기록
3. 그 예외 케이스를 이후 제너레이터의 케이스 정의에 반영

크로스브라우저 확인을 먼저 끝내지 않고 제너레이터부터 만들었다면, "케이스는 다 도는데 실제 브라우저에서는 깨지는" 상황을 뒤늦게 발견했을 것이다.

### ✅ 왜 제너레이터를 직접 만들었나

여러 대안을 두고 저울질했다.

- **대안 1: 엔진마다 테스트 파일을 복붙해서 필드명만 바꾸기** — 필드가 하나 늘거나 검증 규칙이 바뀌면 복사본을 하나하나 다시 고쳐야 함
- **대안 2: `test.each`만으로 파라미터화** — 케이스 몇 개면 충분하지만, "SE 생성·수정·삭제 + role 생성·수정·삭제"처럼 대상(target)과 액션의 조합이 늘어나면 배열 자체가 비대해지고 가독성이 떨어짐
- **최종: 엔진별 케이스 정의 파일 + 그 파일을 읽어 테스트 스위트를 동적으로 생성하는 제너레이터**

<!-- 이미지 제안: 케이스 정의 파일(*.cases.ts) → createFormTestSuite 제너레이터 → 실행되는 테스트 스위트로 이어지는 데이터 흐름도 -->

```ts
// testcases/aws-se.cases.ts
export const awsSeCases: FormTestCase[] = [
  { field: "engineName", value: "", expect: "required" },
  { field: "engineName", value: "a".repeat(65), expect: "maxLength" },
  { field: "engineName", value: "invalid name!", expect: "pattern" },
];
```

```ts
// generator/createFormTestSuite.ts
interface FormTestCase {
  field: string;
  value: string;
  expect: "required" | "maxLength" | "pattern" | "duplicate";
}

function createFormTestSuite(
  suiteName: string,
  cases: FormTestCase[],
  runCase: (testCase: FormTestCase) => void,
) {
  describe(suiteName, () => {
    cases.forEach((testCase) => {
      test(`${testCase.field} - ${testCase.expect}`, () => runCase(testCase));
    });
  });
}
```

```ts
// aws-se.test.ts
createFormTestSuite("AWS SE 폼 검증", awsSeCases, (testCase) => {
  const result = validateSecretEngineField(testCase.field, testCase.value);
  expect(result.errorType).toBe(testCase.expect);
});
```

`createFormTestSuite`는 케이스 배열을 받아 `describe`로 스위트 하나를 감싸고, 케이스마다 `test`를 개별로 등록하는 얇은 래퍼다. 케이스 하나하나가 독립된 `test`로 등록되기 때문에, 특정 필드 하나(`engineName - pattern` 같은)만 실패해도 리포트에서 어떤 케이스가 깨졌는지 바로 식별할 수 있다는 게 `test.each` 배열 하나로 뭉뚱그리는 것보다 나은 지점이었다. `runCase` 콜백을 별도 인자로 받게 한 이유도 있다 — 실제 검증 대상 함수(`validateSecretEngineField`)는 엔진마다 달라질 수 있는데, 실행 로직(`describe`/`test` 등록)은 고정하고 "무엇을 검증할지"만 호출부에서 주입받는 형태로 나누면 엔진이 늘어도 제너레이터 자체는 손댈 일이 없기 때문이다.

케이스 파일(`*.cases.ts`)만 새로 정의하면, 실행 로직(`createFormTestSuite`)은 그대로 재사용된다. GCP나 이후 추가되는 엔진도 케이스 파일 하나 추가로 커버 가능해졌다.

### ✅ 결과 & 배운 점

- 엔진별 SE·role CRUD 검증 테스트를 케이스 파일 추가만으로 확장 가능해짐 — 새 엔진이 붙어도 케이스 파일만 새로 정의하면 됨
- 크로스브라우저 확인을 먼저 해둔 덕분에, 제너레이터가 만든 케이스에 브라우저별 예외까지 포함시킬 수 있었음
- "테스트 코드를 늘리지 말고 테스트 데이터를 늘리자"는 원칙이, 이후 엔진이 추가될 때마다 반복 작업량을 크게 줄여줌

## 참고한 링크

- [Jest — `test.each` 공식 문서](https://jestjs.io/docs/api#testeachtablename-fn-timeout)
- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
