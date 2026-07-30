---
title: "여러 앱에서 반복되는 Table·Modal·Field, 왜 공통 패키지로 뽑았나"
date: 2025-09-10 21:30:00 +0900
description: "iam·kms·vault·fabric 네 개 앱에서 같은 버그가 반복적으로 올라오는 걸 보고 공통 컴포넌트 패키지로 뽑아낸 실전 기록"
categories: ["일감"]
tags: ["React", "공통컴포넌트", "디자인시스템", "리팩토링", "모노레포", "TanStack Table"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 106
draft: false
---

> **TL;DR** — 같은 버그(테이블 고정 컬럼, 팝업 스타일 깨짐, ESC 닫기)가 앱마다 따로 보고되는 걸 보고서야 "앱 4개가 Table·Modal을 각자 구현하고 있었다"는 걸 깨달았다. 공통 패키지로 뽑으면서 기준을 세운 건 하나 — API 응답 필드명(value)과 화면 라벨(label)을 쌍으로 관리하고, 그 위에 Cell·Column·Page 템플릿을 쌓는 것.

난이도 : ★★★☆☆

1️⃣ `공통 컴포넌트 패키지` 2️⃣ `value-label 쌍` 3️⃣ `페이지 템플릿화`

### ✅ 상황

> QA : Vault > SSH CA 리스트에서 가로 스크롤하면 체크박스 칼럼이 사라져요  
> 나 : 아 그거 확인해서 고정할게요  
> QA : 근데 이거 Vault > DB Credential 상세에서도 Action 칼럼이 똑같이 사라지는데요?  
> 나 : ...거기도요? 같은 버그가 왜 두 군데서 따로 나죠

처음엔 단순 버그 리포트로 받았다. 그런데 고치려고 들어가 보니 IAM, KMS, Vault, Fabric 네 개 앱이 Table을 각자 폴더에서 따로 구현하고 있었다. 한쪽을 고쳐도 다른 세 곳은 그대로 남는 구조였다.

### ✅ 왜 반복됐나

- 네 앱은 처음엔 별도 화면으로 시작했고, 리스트·상세·다이얼로그 같은 뼈대를 각자 필요할 때마다 복붙해서 만들었다
- 겉보기엔 다른 도메인(IAM Policy, Vault SSH CA)이지만 실제 화면 구조는 "테이블 + 필터 + 다이얼로그 폼"으로 거의 동일했다
- 그래서 팝업 스타일이 디바이스마다 깨지는 문제, 알림창에서 ESC로 안 닫히는 문제, 테이블 가로 스크롤 시 고정 칼럼이 없는 문제가 앱마다 개별 이슈로 올라왔다 — 사실은 같은 컴포넌트의 부재였다

### ❌ 기존 구조

- `apps/iam`, `apps/kms`, `apps/vault`, `apps/fabric` 각각에 Table·Modal·Field 관련 코드가 중복 구현됨
- 화면 필드가 늘어날 때마다 "API 응답 키"와 "화면에 보여줄 라벨"을 각 컴포넌트 안에서 직접 매핑함
- 공통 버그를 고치려면 네 곳을 전부 찾아 고쳐야 함

<!-- 이미지 제안: apps/iam·kms·vault·fabric이 각자 Table·Modal을 구현하던 기존 구조 vs packages/client-common을 공유하는 이후 구조를 비교하는 아키텍처 다이어그램 -->

### ✅ 무엇을 공통 패키지로 뽑을지 — 설계 기준

패키지를 나눌 때 잡은 기준은 세 가지였다.

1. **API 필드명(value)과 화면 라벨(label)을 쌍으로 관리한다** — 어느 화면이든 "이 데이터는 뭘 뜻하는 값이고, 화면엔 뭐라고 보여줄지"를 하나의 단위로 선언
2. **Cell·Column을 조합해서 테이블 스펙을 선언적으로 짠다** — 각 앱은 어떤 칼럼을 쓸지 배열만 조립하면 되게
3. **리스트·생성·수정·상세 페이지까지 템플릿으로 올린다** — 네 앱의 CRUD 화면 구조가 사실상 동일했기 때문

```ts
// packages/client-common/src/label/index.ts
export const lCreator: tValueLabel = {
  value: 'creator',
  label: 'label.create.actor',
};
export const lCreatedTime: tValueLabel = {
  value: 'createdTime',
  label: 'label.create.time',
};
```

```ts
// packages/client-common/src/field/index.ts
export const creatorField = {name: lCreator.value, label: lCreator.label};
export const createdTimeField = {
  name: lCreatedTime.value,
  label: lCreatedTime.label,
  func: dateTimeConvertor,
};

export const createFields = [creatorField, createdTimeField];
```

`value`는 서버 응답 필드명 그대로, `label`은 다국어 사전 키다. 이렇게 나눠두면 API 필드명이 바뀌어도 화면 라벨 키는 안 건드리고, 반대로 문구를 바꿀 때도 API를 안 건드린다. 이 쌍을 Column·Cell·Field 어디서든 그대로 재사용할 수 있게 만든 게 이후 작업의 뼈대가 됐다.

### 🛠️ Column — 앱마다 배열만 조립

```ts
// packages/client-common/src/column/index.tsx
export const OPERATION_LOG_COLS: tColumn[] = [
  cResourceId,
  cUrl,
  cRequestId,
  {...cRequestTime, filter: {type: filterTypes.dateRange, default: true}},
  cActor,
  cRequestIp,
  cRequestDataSize,
  cResponseTime,
  cResponseStatus,
  cResponseDataSize,
];
```

IAM·KMS·Vault·Fabric 각각의 Operation 로그 화면은 옵션값(`OperationType`)만 다르고 칼럼 구조는 동일했다. 공통 Column 배열을 만들어두니 새 로그 화면을 추가할 때 배열 순서만 바꾸면 됐다.

### 🛠️ Modal — ESC 닫기를 한 곳에서

알림창(Confirm/Alert)이 열려 있을 때 ESC로 닫히는 기능도 앱마다 따로 요청이 들어왔다. 공통 `ConfirmDialogBox`에 한 번만 넣었다.

```tsx
// packages/client-common/src/components/components/DialogBox/ConfirmDialogBox/index.tsx
useEffect(() => {
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') setIsOpened(false);
  };

  if (isOpened) window.addEventListener('keydown', handleEscapeKey);
  return () => window.removeEventListener('keydown', handleEscapeKey);
}, [isOpened, setIsOpened]);
```

`window` 객체에 직접 keydown 이벤트를 붙이고 다이얼로그가 열려 있을 때만 리스너를 등록하는 방식이다. 이 코드 하나로 네 앱의 모든 Confirm/Alert 창에 ESC 닫기가 동시에 적용됐다.

### 🛠️ Page 템플릿 — CRUD 뼈대까지 공통화

```ts
export {default as FindAllPage} from './components/FindAllPage';
export {default as CreatePage} from './components/CreatePage';
export {default as UpdatePage} from './components/UpdatePage';
export {default as FindByIdPage} from './components/FindByIdPage';
```

리스트(FindAllPage), 생성(CreatePage), 수정(UpdatePage), 상세(FindByIdPage) 네 종류 페이지 골격까지 패키지로 올렸다. 각 앱은 Column 배열과 Field 정의만 넘기면 되고, 테이블 고정 칼럼·필터바·다운로드 버튼 같은 공통 기능은 패키지 쪽에서 한 번만 구현하면 됐다.

### ✅ 실제로 효과가 있었나

공통화 이후 들어온 요청들은 패키지 한 군데만 고치면 됐다.

```
2025-08-14  Table에서 가로 스크롤 시 체크박스와 액션 컬럼 고정
2025-08-21  스타일 단위 px 에서 rem 으로 변경(반응형 대비)
2025-09-02  Confirm 박스 열려있을 때 ESC 누르면 닫히는 기능 구현
2025-09-26  리스트 페이지 데이터 목록 다운로드 기능 구현 (Excel, PDF)
2025-11-28  리스트 페이지 다운로드 기능에 CSV, HTML 추가
2025-12-26  IAM, KMS, Fabric, Vault Log 에 Operation 페이지 추가
```

특히 마지막 두 개가 체감이 컸다. 다운로드 기능이나 새 로그 페이지는 원래대로면 앱 4개에 각각 붙여야 했을 텐데, 공통 패키지에 훅(`useExport`)과 페이지 템플릿을 하나 추가하는 것으로 끝났다.

### 🎯 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| Table·Modal 구현 | iam·kms·vault·fabric 4개 앱이 각자 구현 | `packages/client-common` 하나를 4개 앱이 공유 |
| 버그 수정 범위 | 같은 버그를 앱마다 따로 찾아 고침 | 패키지 한 곳만 고치면 4개 앱에 동시 반영 |
| 신규 기능(다운로드, Operation 로그 페이지) | 앱 4개에 각각 붙여야 함 | 패키지에 훅·템플릿 하나 추가로 끝 |
| API 필드명 ↔ 화면 라벨 | 컴포넌트마다 직접 매핑 | value-label 쌍으로 한 곳에서 관리 |

Table·Modal·Field를 공통 패키지로 뽑으면서 얻은 건 코드 중복 제거보다는 "버그가 한 곳에서만 발생하고 한 곳에서만 고쳐진다"는 확신이었다. value-label 쌍으로 데이터와 화면 문구를 분리해둔 게 이후 다국어 작업(다음 글)까지 자연스럽게 이어지는 기반이 됐다.

## 참고한 링크

- [TanStack Table](https://tanstack.com/table/latest)
