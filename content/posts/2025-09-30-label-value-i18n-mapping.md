---
title: "라벨과 API 필드명을 한 쌍으로 관리한 이유 — 리소스명 다국어 매핑기"
date: 2025-09-30 22:00:00 +0900
description: "화면 라벨과 실제 API 응답값을 value-label 쌍으로 분리하고 다국어 사전을 계층 구조로 잡은 실전 기록"
categories: ["일감"]
tags: ["React", "i18n", "react-i18next", "다국어", "타입설계"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
scope: "company"
log: 107
draft: false
---

> **TL;DR** — 다국어를 적용하려니 화면 곳곳에 있던 상수 문자열(errorMessages, placeholderMessages)부터 걷어내야 했다. 해법은 API 필드명(value)과 화면 문구(label)를 분리해서, 라벨은 "번역 키"만 들고 실제 문자열은 계층형 사전(common.json)에 몰아넣는 것이었다.

난이도 : ★★☆☆☆

1️⃣ `value-label 분리` 2️⃣ `계층형 다국어 사전` 3️⃣ `useMemo 캡슐화`

### ✅ 상황

> 팀장 : Confirm이랑 Alert 메세지가 코드 여기저기 상수 파일에 흩어져있어. 다국어 작업 들어가려면 먼저 한 곳에 모아야 될 것 같은데  
> 나 : 지금은 `errorMessages`, `placeholderMessages` 같은 상수 객체를 컴포넌트에서 바로 import해서 쓰고 있어서, 그대로 두면 언어 분기를 컴포넌트마다 따로 넣어야 돼요  
> 팀장 : 그럼 문구부터 다 취합해서 사전으로 만들고, 그다음에 코드에서 이 사전을 참조하게 바꾸자

다국어 작업은 번역보다 "문구를 어디서 어떻게 관리할지" 구조를 먼저 잡는 게 절반이었다.

### ✅ 왜 문구 취합부터 했나

번역을 맡기려면 번역자가 볼 수 있는 문서가 필요했다. 코드에 흩어진 상수를 그대로 번역팀에 넘길 수 없어서, 화면에 쓰이는 문구를 전부 뽑아 목록화하는 작업을 먼저 했다. 이 작업이 없었으면 "코드에서 다국어 훅을 적용"하는 다음 단계에서 어떤 키를 어떻게 나눠야 할지 기준이 없었을 것이다.

### ❌ 기존 구조

```ts
import {
  errorMessages,
  placeholderMessages,
} from '@client-common/message';

// ...
loginErrorFunc({e, message: errorMessages.fail.login.default});
placeholder={placeholderMessages.input(lNamespace.label)}
```

문제는 두 가지였다.

- 문구가 JS 상수 객체 안에 한국어로 고정되어 있어서 언어를 바꿀 방법이 없음
- `lNamespace.label`처럼 라벨 자체가 이미 사람이 읽는 문자열이라, 이걸 그대로 다른 언어로 바꾸려면 라벨 정의 자체를 언어별로 따로 둬야 함

### ✅ value-label 쌍으로 분리

가장 먼저 바꾼 건 라벨의 정체였다. "라벨은 사람이 읽는 문자열이 아니라 번역 키"로 재정의했다.

```ts
export const lId: tValueLabel = {value: 'id', label: 'label.id'};
export const lNamespace: tValueLabel = {value: 'namespace', label: 'label.namespace'};
export const lPassword: tValueLabel = {value: 'password', label: 'label.password'};
```

- `value` — API 요청/응답에서 실제로 쓰이는 필드명. 언어와 무관하게 고정
- `label` — 다국어 사전(common.json)에서 이 필드를 어떻게 부를지 찾는 키

이렇게 나눠두면 `t(lNamespace.label)`을 호출하는 순간 언어에 맞는 문자열이 나온다. 필드가 테이블 칼럼이든, 폼 라벨이든, 로그 상세 항목이든 같은 `lXxx` 객체 하나로 어디서나 재사용됐다 — 이 라벨-값 쌍은 원래 공통 Table·Column 컴포넌트를 설계할 때 잡아둔 구조였는데, 다국어 작업에서 그대로 재사용된 셈이다.

### 🛠️ 메시지 사전 — 계층 구조로 몰아넣기

Confirm/Alert/Error 메시지는 라벨보다 종류가 훨씬 많았다. 평평한 목록으로 두면 찾기도 어렵고 재사용도 안 돼서, 카테고리별로 계층을 나눴다.

```json
// apps/client/public/locales/ko/common.json
"message": {
  "error": {
    "fail": {
      "default": "{{value}}을(를) 실패하였습니다.",
      "read": "조회를 실패하였습니다.",
      "login": {
        "default": "로그인을 실패하였습니다. 정보을 다시 확인하여 주세요.",
        "expired": "세션이 만료되었습니다. 처음부터 다시 시도하여 주세요."
      }
    },
    "duplicated": {
      "default": "중복된 데이터가 이미 존재합니다.",
      "detail": "동일한 {{value}}이(가) 이미 존재합니다."
    }
  }
}
```

`{{value}}` 자리에 앞서 만든 라벨의 번역 결과(`t(lNamespace.label)` 같은)를 그대로 꽂아 넣을 수 있게 설계했다. 그래서 "중복된 네임스페이스가 이미 존재합니다"처럼 리소스 종류가 다른 메시지를, 문구마다 새로 안 만들고 `duplicated.detail` 하나로 전부 처리했다.

코드 쪽은 상수 참조에서 훅 호출로 바뀌었다.

```tsx
// before
loginErrorFunc({e, message: errorMessages.fail.login.default});

// after
const {t} = useTranslation();
loginErrorFunc({e, message: t('message.error.fail.login.default')});
```

### 🛠️ useMemo — 반복 호출을 한 곳에 캡슐화

라벨-값 매핑과 메시지 사전을 분리하고 나니, 폼 하나에서도 `t()` 호출이 여러 번 반복됐다. placeholder 세 개, 체크박스 문구 두 개 — 컴포넌트 렌더 로직 안에 이 호출이 흩어지니 어떤 문구가 어떤 키를 쓰는지 코드만 봐서는 한눈에 안 들어왔다.

```tsx
const locales = useMemo(
  () => ({
    input: {
      namespace: t('input.textbox.placeholder.default', {
        value: t(lNamespace.label),
      }),
      id: t('input.textbox.placeholder.default', {value: t(lId.label)}),
      password: t('input.textbox.placeholder.default', {
        value: t(lPassword.label),
      }),
    },
    namespace: t(lNamespace.label),
    id: t(lId.label),
  }),
  [t],
);
```

`t`가 바뀔 때(언어 전환 시)만 다시 계산되도록 `useMemo`로 묶고, JSX에서는 `locales.input.namespace`처럼 계산된 값만 참조하게 정리했다. 렌더 성능보다는 "이 컴포넌트가 쓰는 문구 전체를 한곳에서 볼 수 있게" 가독성을 잡으려는 목적이 컸다.

### ✅ 전체 흐름 요약

1. 코드에 흩어진 문구를 전부 취합해 번역 대상 목록 작성
2. 필드마다 `{value, label}` 쌍 정의 — API 값과 번역 키를 분리
3. Confirm/Alert/Error 메시지를 카테고리별 계층 구조(common.json)로 재구성, `{{value}}` 보간 처리
4. 컴포넌트에서 흩어져 있던 `t()` 호출을 `useMemo`로 한곳에 모음

### 🎯 결과

value와 label을 분리해둔 덕분에 서버 응답 필드가 바뀌어도 번역 키는 그대로 두고 value만 갱신하면 됐고, 반대로 문구를 다듬을 때도 API 쪽은 전혀 안 건드렸다. 새 언어를 추가할 때도 `common.json` 파일 하나만 늘리면 되는 구조라, 이후 항목이 늘어날 때마다(로그 필드, 정책 Action 등) 같은 패턴을 계속 따라가게 됐다.

## 참고한 링크

- [react-i18next 공식 문서](https://react.i18next.com/)
