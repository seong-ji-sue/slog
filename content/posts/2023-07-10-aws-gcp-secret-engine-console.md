---
title: "AWS/GCP Secret Engine 관리 페이지, 관리 → role → API 적용 순서로 만든 이유"
date: 2023-07-10 14:00:00 +0900
description: "AWS Secret Engine 페이지로 다진 패턴을 GCP에 붙이면서 화면과 API 연동 순서를 바꾼 실전 기록"
categories: ["일감"]
tags: ["AWS", "GCP", "SecretEngine", "React", "RESTAPI", "권한관리"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
log: 85
draft: false
---

> **TL;DR** — AWS Secret Engine 관리 페이지를 만들 때는 화면과 API를 한 티켓에서 같이 진행했다. GCP를 붙일 때는 그 경험을 반영해서 화면(레이아웃)을 먼저 확정 짓고 API는 다음 단계로 분리했다 — 리뷰 포인트와 연동 버그를 구분하기 위해서였다.

난이도 : ★★★☆☆

1️⃣ `Secret Engine` 2️⃣ `화면-API 단계 분리` 3️⃣ `멀티클라우드 확장`

### ✅ 요구사항

> 사수 : 시크릿 관리 콘솔에 AWS Secret Engine 연동 화면이 필요해. 먼저 SE 목록 관리 페이지부터 만들고, 그 다음 SE에 할당된 role 관리까지 붙여보자  
> 나 : 넵, SE 페이지 먼저 만들고 필터 추가한 다음, role 목록·수정·삭제까지 이어서 진행할게요

(몇 주 뒤)

> 사수 : AWS 패턴 잘 나왔으니까 이번엔 GCP Secret Engine도 붙여보자. 이번엔 화면 먼저 그려서 리뷰 받고, API는 그 다음에 붙이자  
> 나 : 넵, 화면 먼저 확정해서 컨펌받고 API는 이후 작업으로 분리할게요

### ✅ AWS — 관리 페이지 → role 페이지 순으로 잡은 이유

SE(Secret Engine)와 role은 서로 종속 관계다. role은 "어떤 SE에 접근할 수 있는가"를 정의하는 개념이라, SE 목록이 먼저 있어야 role 화면에서 "어떤 SE의 role인지"를 선택할 수 있다. 그래서 순서 자체가 의존관계를 따라간다.

당시 요구사항을 그대로 옮기면 이렇다.

- **SE 관리 페이지**: AWS SE를 호출해 화면에 출력, SE 필터 추가
- **role 페이지**: SE에 할당된 role 리스트 출력, role 필터 추가, role 수정, role 삭제

### ❌ AWS 때 겪은 문제

- 화면과 API 연동을 사실상 한 티켓 안에서 같이 진행함
- 리뷰 시점에 화면 레이아웃과 API 응답 처리 로직이 뒤섞여 있어서, 리뷰어 입장에서 "이 필드가 화면 문제인지 API 응답 문제인지" 구분하기 어려웠음
- 화면에 대한 의견(레이아웃, 라벨링)과 연동 버그(데이터 형태, 자격증명 발급 로직)가 같은 코멘트 스레드에 섞여서 처리 우선순위를 정하기 애매했음

### ✅ GCP를 붙일 때는 순서를 바꿨다 — 화면 먼저, API는 나중

AWS에서 겪은 문제를 반영해서 GCP는 아예 티켓 자체를 둘로 나눴다.

1. **화면(레이아웃) 티켓** — GCP SE를 호출해 화면에 출력, SE 필터 추가, SE 생성 (GCP role도 동일하게 목록·필터·수정·삭제를 화면 단위로 먼저 구현)
2. **API 적용 티켓** — SE CRUD, Credential(자격 증명) 발급을 화면이 확정된 뒤에 붙임

이렇게 나누니 장점이 명확했다.

- 화면 구조에 대한 리뷰(레이아웃, 라벨, 필터 UX)를 먼저 끝내고, 확정된 화면 위에 API를 붙이니 "화면을 다시 갈아엎는" 일이 없어짐
- API 연동 단계에서는 순수하게 CRUD와 자격증명 발급 로직에만 집중할 수 있어서, 버그가 나도 원인이 API 레이어로 좁혀짐

### 🛠️ AWS/GCP 공통 패턴으로 뽑아낸 것

두 화면(SE 관리, role 관리)이 클라우드 제공자와 무관하게 거의 동일한 뼈대라, 공유 패키지의 테이블 컬럼 정의를 재사용 가능한 형태로 뽑아냈다.

```ts
// packages/client-common/src/column/secretEngineColumns.ts
interface SecretEngineColumnOptions {
  engineType: "aws" | "gcp";
  onEdit: (row: SecretEngineRow) => void;
  onDelete: (row: SecretEngineRow) => void;
}

function createSecretEngineColumns({
  engineType,
  onEdit,
  onDelete,
}: SecretEngineColumnOptions) {
  return [
    { key: "name", label: "엔진 이름" },
    { key: "type", label: "타입", render: () => engineType.toUpperCase() },
    {
      key: "actions",
      render: (row: SecretEngineRow) => (
        <RowActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
      ),
    },
  ];
}
```

`engineType`만 바꿔서 AWS/GCP 양쪽 화면에 같은 컬럼 정의 함수를 재사용했다. 필터 UI, role 테이블도 같은 방식으로 뽑았다.

### 🛠️ API 적용 단계 — CRUD + 자격증명 발급

API 단계에서는 SE CRUD와 Credential 발급을 붙였다. AWS와 GCP는 자격증명 발급 방식 자체는 다르다 — AWS는 STS 기반 임시 자격 증명, GCP는 서비스 계정 키 발급 방식이다. 하지만 화면·API 인터페이스는 "CRUD + 자격증명 발급 엔드포인트 하나"로 동일하게 맞췄다.

```ts
interface SecretEngineApi {
  list(): Promise<SecretEngineRow[]>;
  create(payload: SecretEngineCreatePayload): Promise<SecretEngineRow>;
  update(id: string, payload: SecretEngineUpdatePayload): Promise<SecretEngineRow>;
  remove(id: string): Promise<void>;
  issueCredential(id: string): Promise<CredentialResponse>;
}
```

내부 구현(AWS STS 호출 vs GCP 서비스 계정 키 발급)은 다르지만, 이 인터페이스 하나로 화면 쪽 코드는 클라우드 제공자를 신경 쓰지 않고 붙일 수 있었다.

### ✅ 결과 & 배운 점

- AWS에서 만든 화면·컬럼 정의 패턴을 GCP에 그대로 재사용하면서 개발 속도가 눈에 띄게 빨라짐
- "화면 먼저 확정 → API 나중"으로 순서를 바꾼 덕분에, 리뷰 피드백(화면)과 버그(API)를 분리해서 처리할 수 있었음
- 이후 클라우드 제공자가 추가되더라도 같은 순서(관리 페이지 → role 페이지, 화면 확정 → API 적용)를 그대로 따르면 된다는 패턴이 잡힘

## 참고한 링크

- [AWS Secrets Manager 공식 문서](https://docs.aws.amazon.com/secretsmanager/)
- [GCP Secret Manager 공식 문서](https://cloud.google.com/secret-manager/docs)
- [HashiCorp Vault — Secrets Engines 개념](https://developer.hashicorp.com/vault/docs/secrets)
