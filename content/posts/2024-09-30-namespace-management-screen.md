---
title: "프로젝트 접근관리 콘솔 첫 화면 — Namespace 관리 UI를 밑바닥부터 설계한 이야기"
date: 2024-09-30 21:00:00 +0900
description: "리스트·필터·CRUD 다이얼로그를 하나의 화면 규격으로 묶고, 상태값 하나로 프로비저닝 흐름 전체를 제어한 설계 기록"
categories: ["일감"]
tags: ["React", "상태관리", "다이얼로그", "CRUD", "프로비저닝", "화면설계"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 2
log: 96
draft: false
---

> **TL;DR** — Namespace는 이 콘솔이 관리하는 모든 리소스(계정·애플리케이션)의 최상위 그룹이라, 여기서 잡은 화면 패턴이 이후 나오는 모든 관리 화면의 기준이 됐다. 다이얼로그를 조회/생성/수정 "모드"로 하나만 만들고, 리소스 상태값 하나로 버튼·툴팁·클릭 가능 여부까지 전부 제어하는 방식을 택했다.

난이도 : ★★☆☆☆

1️⃣ `모드 기반 다이얼로그` 2️⃣ `상태 기반 제어 명세표` 3️⃣ `비동기 프로비저닝 UX`

### ✅ 요구사항

> 팀장 : Namespace 관리 화면부터 시작하자. 계정(Entity)이랑 애플리케이션은 전부 Namespace 밑에 묶이니까, 이 구조부터 잡아야 다음 화면들이 편해질 거야
> 나 : 넵. 리스트, 필터, 추가/수정/삭제까지 이번 화면에서 다 만들면 될까요?
> 팀장 : 어. 근데 Namespace는 생성·삭제가 바로 끝나는 게 아니라 백엔드에서 실제 인프라 프로비저닝이 걸리니까, 그 상태도 화면에 나와야 해
> 나 : 아, 그러면 생성 버튼 누른다고 바로 끝나는 게 아니라 "처리중" 상태부터 시작하는 거네요

Namespace는 이 콘솔에서 계정(Entity)과 애플리케이션을 묶는 최상위 단위다. 화면 자체는 흔한 리스트+CRUD처럼 보이지만, 실제로는 "생성/삭제 요청 → 백엔드 프로비저닝 → 완료" 라는 비동기 흐름이 걸려 있어서 단순 CRUD 폼으로 끝나지 않았다.

### ❌ 처음 붙잡았던 구조의 문제

- 조회/생성/수정 다이얼로그를 각각 따로 만들면 필드 정의·유효성 로직이 3벌로 흩어짐
- 상태값(프로비저닝 중/완료/실패 등)에 따라 버튼 활성화, 툴팁 문구, id 클릭 가능 여부가 전부 달라지는데 이걸 컴포넌트 곳곳에 `if` 분기로 흩뿌리면 나중에 상태 하나 추가할 때마다 여러 파일을 뒤져야 함
- 생성/삭제 버튼을 누른 직후 폼을 그대로 두면, 실제로는 아직 아무 일도 안 끝난 상태인데 사용자는 "끝났다"고 착각함

### ✅ 설계 결정 — 다이얼로그는 "모드"로 하나만

가장 먼저 정한 건 조회·생성·수정 다이얼로그를 물리적으로 나누지 않는 것이다. 하나의 다이얼로그 컴포넌트가 `mode` prop(`view` / `create` / `edit`)을 받고, 필드별로 "이 모드에서 보이는지 / 수정 가능한지 / 필수인지"를 정의한 명세표를 따라가게 만들었다.

```jsx
// NamespaceDialog.js
const fieldSpec = {
  name: { view: 'readonly', create: 'editable', edit: 'readonly' },
  description: { view: 'readonly', create: 'editable', edit: 'editable' },
  quota: { view: 'readonly', create: 'editable', edit: 'editable' },
};

function NamespaceDialog({ mode, data }) {
  const fields = Object.entries(fieldSpec).map(([key, rule]) => ({
    key,
    editable: rule[mode] === 'editable',
  }));
  // ...
}
```

이렇게 하면 필드가 늘어나거나 "생성할 때만 막고 수정할 때는 열어준다" 같은 요구사항이 와도 명세표 한 줄만 바꾸면 된다. 실제로 이 프로젝트는 이후에도 요구사항이 계속 바뀌었는데(3편 Entity 편에서 이 패턴이 왜 부족해졌는지 다룬다), 최소한 "다이얼로그 3개를 유지보수하는" 최악의 상황은 피할 수 있었다.

### ✅ 상태 기반 제어 명세표

Namespace는 상태값(예: 정상/프로비저닝중/삭제중/오류)에 따라 리스트 화면의 동작이 크게 달라졌다.

- 프로비저닝 중이면 id를 눌러도 상세로 안 들어가고 진행 로그 다이얼로그가 뜸
- 오류 상태면 재시도 안내 툴팁이 붙음
- 삭제중이면 수정 버튼 자체가 비활성화

이걸 컴포넌트 안에서 상태 문자열을 직접 비교(`if (status === 'PROVISIONING')`)하는 방식으로 짜면, 상태가 하나 늘 때마다 리스트·다이얼로그·툴팁 세 군데를 다 고쳐야 한다. 그래서 "상태 → 허용 동작"을 하나의 제어 명세표 객체로 뽑아내고, 컴포넌트는 이 표를 조회만 하도록 바꿨다.

```js
// namespaceStatusPolicy.js
export const statusPolicy = {
  ACTIVE:       { clickable: true,  editable: true,  tooltip: null },
  PROVISIONING: { clickable: false, editable: false, tooltip: '프로비저닝 진행중' },
  DELETING:     { clickable: false, editable: false, tooltip: '삭제 처리중' },
  ERROR:        { clickable: true,  editable: false, tooltip: '오류 — 로그 확인 필요' },
};
```

```jsx
function NamespaceIdCell({ status, onClick }) {
  const policy = statusPolicy[status] ?? statusPolicy.ACTIVE;
  return (
    <span
      className={policy.clickable ? 'link' : 'disabled'}
      title={policy.tooltip ?? undefined}
      onClick={policy.clickable ? onClick : undefined}
    >
      {/* ... */}
    </span>
  );
}
```

상태를 코드값이 아니라 이 표로만 비교하게 만들어두니, 이후 QA에서 상태 하나가 추가되거나 정책이 바뀌어도(예: 특정 상태에서 삭제 아이콘만 숨기기) 명세표 한 줄만 고치면 리스트·다이얼로그·상세 화면이 한 번에 맞춰졌다.

### ✅ 생성/삭제 직후 — 폼을 닫고 로그창을 연다

가장 헷갈렸던 부분은 생성·삭제 버튼을 누른 다음이었다. 처음엔 "다이얼로그 닫고 리스트 갱신"으로 끝냈는데, 실제로는 그 시점에 프로비저닝이 막 시작된 것이라 리스트를 갱신해도 여전히 "처리중" 상태만 보였다. 그래서 생성/삭제 요청이 성공적으로 접수되면 입력 폼 다이얼로그를 닫고, 곧바로 진행 상황을 보여주는 로그 다이얼로그를 열도록 흐름을 다시 짰다.

```jsx
async function handleSubmit(payload) {
  await createNamespace(payload);
  closeFormDialog();
  openLogDialog({ namespaceId: payload.id }); // 진행 로그를 실시간으로 보여줄 다이얼로그
}
```

이 로그 다이얼로그가 실시간으로 상태를 받아오는 방식은 뒤에서 다룰 별도 주제라 여기서는 "폼 제출 → 로그창 전환"이라는 흐름만 확정했다. 데이터를 어떻게 실시간으로 받아오는지는 다음 편에서 이어진다.

### ✅ 결과 & 배운 점

- 다이얼로그를 모드 기반으로 하나만 두니 필드 정의가 한 곳에 모임
- 상태 기반 제어 명세표 덕분에 상태값 추가/정책 변경이 여러 파일을 건드리지 않고 끝남
- "요청 접수 = 작업 완료"가 아니라는 걸 화면에서부터 인정하고, 폼 제출 이후 흐름을 로그창으로 넘기는 설계가 이후 실시간 로그 기능(다음 편)의 전제 조건이 됐다
- 필터 컴포넌트는 이번엔 Namespace 화면 전용으로 재정의했는데, 이후 다른 리소스 화면에서도 비슷한 필터가 필요해지면서 결국 공통 필터로 통합하게 된다 — 그 이야기는 별도 회고에서 다룰 예정

## 참고한 링크

- [React 공식 문서 — Conditional Rendering](https://react.dev/learn/conditional-rendering)
