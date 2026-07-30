---
title: "IAM 구조의 뼈대 — Entity와 Role을 왜 나눠서 설계했나"
date: 2023-11-06 09:00:00 +0900
description: "권한 관리 콘솔에 IAM을 처음 붙이면서 Entity(신원)와 Role(권한) 페이지를 분리 설계한 초기 결정 기록"
categories: ["일감"]
tags: ["IAM", "권한모델", "EntityRole", "RBAC", "설계"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 87
draft: false
---

> **TL;DR** — IAM을 처음 설계할 때 "누구인가(Entity)"와 "무엇을 할 수 있는가(Role)"를 서로 다른 화면·모델로 분리했다. 이렇게 나눠야 하나의 Entity에 여러 Role을 붙이거나, 여러 Entity가 하나의 Role을 공유하는 구조가 가능해진다.

난이도 : ★★★☆☆

1️⃣ `Entity/Role 분리` 2️⃣ `RBAC` 3️⃣ `선작업 설계`

### ✅ 요구사항

> 사수 : 이번엔 IAM 붙여야 되는데, Entity 페이지랑 Role 페이지 선작업부터 시작하자. 화면 그리고 API 연결할 수 있게 기반만 잡아줘  
> 나 : 넵, Entity랑 Role을 각각 어떤 개념으로 나눌지부터 정리하고 화면 구조 잡아볼게요  
> 사수 : 그래, 나중에 Secret Engine에 접근할 수 있는 권한도 결국 이 Role로 엮일 거니까 처음부터 구조를 잘 잡아야 돼

일감 자체는 "페이지 화면 그리기"와 "API 연결을 위한 선작업"이라는 짧은 요구사항 두 줄이었다. 하지만 이후 Secret Engine 접근 권한 전체가 이 구조 위에 얹히는 구조라, 처음 설계가 두고두고 영향을 미치는 지점이었다.

### ✅ Entity와 Role, 왜 나눠야 하나

- **Entity** — 이 시스템에 접근하는 신원(identity)을 나타낸다. 실제 로그인하는 사용자뿐 아니라, 앱·서비스 간 통신에 쓰이는 서비스 계정까지 포함하는 개념이다
- **Role** — 그 신원이 무엇을 할 수 있는지를 나타낸다. 특정 리소스(Secret Engine 등)에 대한 CRUD 권한, 접근 범위를 정의한 정책 묶음이다

이 둘을 하나의 화면·모델로 합쳐버리면 문제가 생긴다. "권한 A를 가진 사람이 3명"이라고 할 때, Entity와 Role이 분리되지 않으면 3명 모두에게 권한 정보를 개별로 붙여야 하고, 정책이 바뀌면 3곳을 전부 고쳐야 한다.

Entity와 Role을 나누고 그 사이를 다대다(N:M) 매핑으로 연결하면, 정책 변경은 Role 하나만 수정하면 매핑된 모든 Entity에 자동으로 전파된다.

```
Entity ----< binding >---- Role ----< policy >---- Resource
```

### ✅ 화면 구조 선작업에서 잡은 것

당시 이슈는 두 개로 나뉘어 있었다.

- **Entities 페이지 선작업**: Entity 목록·생성·조회 화면 뼈대
- **Role 페이지 선작업**: Role 목록·생성·조회 화면 뼈대

두 화면 모두 이 시점엔 API 연결 전이라 화면 뼈대와 폼 구조만 우선 정리했다. Secret Engine 작업 때 잡았던 "화면 먼저 확정 → API는 다음 단계로 분리"하는 패턴을 IAM에도 그대로 이어간 것이다 — 화면 구조에 대한 리뷰를 먼저 끝내고, 확정된 화면 위에 API를 붙이는 순서로.

### ✅ 설계 시 고려한 것

- Entity - Role은 다대다 관계로 설계 — 중간에 매핑(binding)을 둬서 "이 Entity가 이 Role을 가진다"를 별도로 관리
- Role은 다시 "어떤 리소스에 어떤 액션(read/write/delete)이 허용되는지"를 담은 policy 목록을 가짐 — AWS IAM이나 HashiCorp Vault의 policy 개념과 유사한 형태를 참고해서 잡음
- 이후 Secret Engine 관리 페이지에서 "이 엔진에 role을 붙인다"는 동작은, 결국 이 IAM Role을 참조하는 구조로 이어지도록 설계함 — Secret Engine보다 IAM 착수가 늦었더라도, 처음부터 서로 맞물릴 것을 염두에 두고 구조를 잡았다

```ts
interface Entity {
  id: string;
  type: "user" | "service_account";
  name: string;
}

interface Role {
  id: string;
  name: string;
  policies: Policy[]; // 리소스별 허용 액션 목록
}

interface EntityRoleBinding {
  entityId: string;
  roleId: string;
}
```

### ✅ 결과 & 다음 할 일

이 시점은 선작업 단계라 실제 이슈도 완료 처리되지 않은 상태였다 — 화면 뼈대만 우선 잡고, 실제 API 연결과 상세 정책 UI는 다음 작업으로 이어졌다.

- Entity와 Role을 처음부터 분리해둔 덕분에, 이후 클라우드 엔진이 늘어나도 "이 엔진에 role을 붙인다"는 동작이 항상 같은 패턴으로 반복 가능해짐
- 선작업이었지만 여기서 잡은 Entity/Role 분리 원칙이 이후 IAM 전체 구조의 기준점이 됨
- 다음 단계는 이 화면 뼈대에 실제 API를 붙이고, Role - Secret Engine 간 매핑 UI를 완성하는 것

## 참고한 링크

- [AWS IAM — Users, Roles, Policies 개념](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- [HashiCorp Vault — Identity 개념 문서](https://developer.hashicorp.com/vault/docs/secrets/identity)
