---
title: "IAM 권한 모델(Entity·Role·Group·Policy)과 MFA 정책 화면을 구현한 이야기"
date: 2025-09-24 19:00:00 +0900
description: "list/read 권한을 구분하지 못해 생긴 보안 버그를 고치고, Entity 상태 관리와 MFA(Mail·OTP·Policy) 이력 화면까지 붙인 기록"
categories: ["일감"]
tags: ["IAM", "Entity", "Policy", "MFA", "권한모델", "OTP"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
log: 90
draft: false
---

> **TL;DR** — 정책 판단 로직이 경로 패턴만 보고 list(목록 조회)와 read(단건 조회) 권한을 같은 걸로 취급하던 버그를 고치고, Entity를 즉시 삭제하지 않고 상태를 거쳐 스케줄러가 완전 삭제하도록 확장했다. 여기에 MFA(Mail·OTP·Policy) 이력 화면까지 새로 붙였다.

난이도 : ★★★☆☆

1️⃣ `Entity/Role/Group/Policy` 2️⃣ `list vs read` 3️⃣ `MFA`

### ✅ 요구사항

> 선임 : IAM 쪽 정책 판단 로직에 버그가 있음. 특정 경로(`/entities/**`)랑 그 하위 경로(`/entities/logs`)를 같은 권한으로 취급하고 있음  
> 나 : 그러면 list 권한만 준 사용자가 read까지 되는 거 아닌가요?  
> 선임 : 맞음, 그거 먼저 고치고 MFA 쪽 이력 화면도 새로 붙여야 됨  
> 나 : 넵, 권한 판단 로직부터 보고 MFA는 API 문서 보면서 붙일게요

### ✅ 권한 모델은 어떻게 짜여 있었나

- **Entity** — 실제 인증 주체(사람 또는 클라이언트/서비스 계정)
- **Role / Group** — Entity를 묶는 단위. 상위 Role·Group을 가질 수 있는 계층 구조(부모-자식)
- **Policy** — Role·Group 또는 Entity에 직접 붙는 권한 규칙. 경로(path) + 동작(capability: list/read/create/update/delete) 조합으로 정의됨

네 개념이 서로를 참조하는 구조다 보니, 하나를 건드리면 연쇄적으로 문제가 튀어나왔다.

- Entity를 삭제해도 하위 데이터(권한 부여 이력 등)가 남아있던 문제
- Role/Group 로그를 적재할 때 상위 Role/Group 정보가 누락되던 문제
- Policy에 등록된 리소스(Principal) 데이터가 일부 누락되던 문제

권한 모델은 계층이 깊어질수록 "삭제·수정 시 연쇄적으로 뭘 같이 처리해야 하는가"를 놓치기 쉽다는 걸 이 과정에서 계속 확인했다.

### ✅ 왜 list/read를 분리해야 했는가

- 기존 로직: 경로 패턴만 보고 권한을 판단 → `/entities/**` 정책이 있으면 `/entities/logs`도 같은 정책으로 취급
- 문제: GET 방식 호출을 list(목록 조회)와 read(단건 상세 조회)로 나눠야 하는데 동일하게 처리해서, list 권한만 부여받은 사용자도 상세 조회(read)까지 가능해지는 보안 구멍이 생김
- 해결: 정책을 판단하는 쪽(IAM)이 패턴만으로 끝내지 않고, 실제 자원을 가진 서비스에게 "이 경로에서 실제로 지원하는 capability가 뭔지" 물어보는 API를 호출해서 재검증하도록 로직을 추가함

```ts
type Capability = "list" | "read" | "create" | "update" | "delete";

async function resolveCapability(
  path: string,
  method: string,
  serviceClient: ServiceClient,
): Promise<Capability> {
  const supported = await serviceClient.getSupportedCapabilities(path);
  if (method === "GET") {
    return supported.includes("list") ? "list" : "read";
  }
  return methodToCapability(method);
}
```

패턴 매칭만으로 권한을 끝내지 않고, 자원을 실제로 가진 서비스에게 한 번 더 확인받는 구조로 바꾼 뒤로는 같은 유형의 버그가 재발하지 않았다. 권한 판단에서 가장 무서운 실패는 "안 돼야 하는데 되는" 케이스인데, 이건 로그를 아무리 들여다봐도 잘 안 보이고 실제로 권한을 좁혀서 테스트해봐야 드러난다.

### ✅ Entity 상태 관리 — 완전 삭제 스케줄러

Entity를 바로 삭제하는 대신, 상태(비활성 등)를 거친 뒤 일정 기간이 지나면 스케줄러가 완전 삭제하도록 확장했다. 즉시 삭제 대신 상태를 거치게 한 이유는 단순하다 — 실수로 삭제 버튼을 눌렀을 때 되돌릴 여지를 남겨야 하기 때문이다. 권한을 다루는 화면일수록 "삭제"라는 동작 자체가 되돌리기 어려운 결과를 낳기 때문에, 즉시 반영보다 유예 기간을 두는 쪽이 안전하다.

### ✅ MFA Policies·Mail·OTP 이력 화면

Namespace 아래 MFA(Mail / OTP / Policy) 이력 화면이 아예 없었다. API 문서를 보면서 BFF와 화면을 새로 붙였는데, 실제로 붙여보니 디테일이 꽤 많았다.

- Mail과 OTP가 같은 API를 쓰고 `type` 값으로만 구분됨
- MFA 데이터에는 별도의 id가 없어서, 최신 날짜 기준 정렬로 목록을 다뤄야 함
- 붙이고 나서도 실무 피드백이 이어졌다 — 정렬 순서를 오름차순에서 내림차순으로 바꾸고, 정책 항목을 추가하고, OTP 응답 필드(해시 알고리즘, 발급자 정보 등)를 더 받도록 조정하는 과정이 몇 차례 반복됨

```ts
interface MfaLogEntry {
  type: "mail" | "otp";
  createdAt: string;
  // otp 전용 필드
  hashAlgorithm?: string;
  issuer?: string;
}

function sortMfaLogsDesc(logs: MfaLogEntry[]): MfaLogEntry[] {
  return [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
```

id가 없는 리소스를 리스트로 다룰 땐 정렬 기준을 명확히 문서화해두지 않으면, 화면마다 "최신이 위인지 아래인지"가 슬쩍 달라지는 문제가 생긴다는 걸 이번에 배웠다.

### ✅ 전체 진행 순서 요약

1. 정책 판단 로직에서 list/read 권한 분리 (패턴 매칭 → 서비스 재검증)
2. Entity 삭제 시 하위 데이터 정리 + 상태 기반 완전 삭제 스케줄러
3. Role/Group 로그 적재 시 상위 계층 정보 포함
4. MFA(Mail/OTP/Policy) 이력 화면 신규 구현
5. 실무 피드백 반영 (정렬 순서, 정책 추가, 응답 필드 확장)

### ✅ 결과 & 배운 점

| | 이전 | 이후 |
|---|---|---|
| 권한 판단 | 경로 패턴만으로 판단 | 서비스에 실제 capability 재검증 |
| Entity 삭제 | 즉시 삭제 | 상태 경유 후 스케줄러가 완전 삭제 |
| MFA 이력 | 없음 | Mail/OTP/Policy 이력 화면 제공 |

권한 모델은 화면상으로는 CRUD처럼 보이지만, 실제로는 "이 동작이 다른 리소스에 어떤 연쇄 효과를 남기는가"를 매번 따져야 하는 영역이라는 걸 이번 작업에서 확실히 느꼈다.
