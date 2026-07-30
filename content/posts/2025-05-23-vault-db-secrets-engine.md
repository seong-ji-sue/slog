---
title: "Vault DB Secrets Engine 구현기 — 정적 계정 대신 동적 자격증명을 발급한 이유"
date: 2025-05-23 21:30:00 +0900
description: "DB 접속 계정을 고정 비밀번호 대신 TTL이 붙은 동적 자격증명으로 발급·파기하는 구조를 만든 기록"
categories: ["일감"]
tags: ["Vault", "Secrets Engine", "동적자격증명", "DB Credential", "TypeScript", "BFF"]
series: "SSH Key 관리 콘솔"
project: "ssh-key-관리"
difficulty: 3
scope: "company"
log: 88
draft: false
---

> **TL;DR** — DB 접속 계정을 고정 비밀번호로 관리하는 대신, Connection → Role → Credential 계층을 만들어 TTL이 붙은 동적 자격증명을 발급·파기하는 구조를 구현했다. 정적 계정은 패스워드 로테이션만 신경 쓰면 되지만, 동적 계정은 발급부터 만료·파기까지 전체 라이프사이클을 코드로 책임져야 했다.

난이도 : ★★★☆☆

1️⃣ `동적 자격증명` 2️⃣ `Connection/Role 계층` 3️⃣ `Lease TTL`

### ✅ 요구사항

> 선임 : DB Secret 엔진 만들어야 됨. Connection, Role CRUD랑 동적 자격증명 발급·파기까지 다 들어가야 됨  
> 나 : 정적 계정 패스워드 로테이션이랑은 뭐가 다른 건가요?  
> 선임 : 정적은 이미 있는 DB 계정 비밀번호를 주기적으로 바꾸는 거고, 동적은 요청할 때마다 임시 계정을 새로 만들었다가 TTL 지나면 지워버리는 거야  
> 나 : 넵, Connection → Role → Credential 순서로 설계부터 잡아볼게요

요청받은 시나리오는 세 가지였다.

- 루트 자격증명 회전: PasswordPolicy 생성 → DB Connection 생성 → root 계정 자격증명 회전
- 정적 역할 패스워드 회전: Connection 생성 → 정적 Role 생성 → 패스워드 회전
- 동적 역할 자격증명 발급·파기: Connection 생성 → 동적 Role 생성 → 자격증명 발급 → TTL 만료 시 파기

셋 다 결국 같은 화면(DB Secret)에서 나오지만, 내부적으로는 완전히 다른 라이프사이클을 갖는다는 게 처음에 헷갈렸던 부분이다.

### ✅ 왜 동적 자격증명인가

- 정적 계정은 한 번 발급되면 영구적으로 존재한다. 유출돼도 만료 시점이 없어서 위험이 계속 남는다
- 동적 계정은 요청 시점에만 생성되고 TTL이 지나면 자동으로 파기된다. 유출돼도 유효 시간이 짧아서 피해 범위가 제한된다
- 계정 생성 자체가 로그로 남기 때문에 "누가 언제 어떤 계정을 발급받았는지" 추적이 쉬워진다
- 그렇다고 정적 계정이 필요 없는 건 아니다. 애플리케이션 서비스 계정처럼 계속 붙어있어야 하는 경우는 동적 발급이 오히려 번거롭다 — 이런 경우엔 패스워드만 주기적으로 회전시키는 정적 방식이 맞다

결국 기준은 하나였다. **이 계정이 영구적으로 필요한가, 아니면 그 순간에만 쓰고 버려도 되는가.** 이 질문에 대한 답에 따라 정적/동적 Role을 나누는 게 설계의 핵심이었다.

### ❌ 기존 구조

- DB 계정 관리가 전부 수동 — 담당자가 직접 계정을 만들고 접속 정보를 전달
- 계정이 언제 만들어졌고 언제 회수해야 하는지 추적할 방법이 없음
- 패스워드 로테이션 이력도, 동적 발급 이력도 화면에서 확인 불가능

### ✅ 최종 목표

1. Connection(DB 접속 정보) CRUD
2. Role(정적/동적 구분) CRUD + 유효성 검증
3. 정적 역할 패스워드 회전
4. 동적 역할 자격증명 발급·파기(Lease)
5. Root 계정 자격증명 회전
6. 발급·회전 이력을 남기는 로그 화면

### 🛠️ 구현 — Connection/Role 계층 설계

DB Secret은 세 계층으로 나눴다. Connection이 "어디에 접속할지"를 정의하고, Role이 "그 접속 정보로 어떤 방식의 계정을 만들지"를 정의하고, Credential이 실제로 발급된 계정이다.

```ts
interface DbConnection {
  connectionName: string;
  dbType: "mysql" | "mariadb";
  connectionUrl: string;
  tlsMode: "disable" | "require" | "verify-full";
}

interface DbRole {
  roleName: string;
  connectionName: string;
  roleType: "static" | "dynamic";
  ttl: number; // 초 단위, dynamic 일 때만 사용
  creationStatement: string; // dynamic 역할일 때 실행할 계정 생성 구문
}
```

여기서 까다로웠던 부분은 DBMS 버전별로 계정 생성·비밀번호 변경 SQL 구문이 다르다는 점이었다. MySQL은 8.0 미만이면 `SET PASSWORD` 구문을, 8.0부터는 `ALTER USER` 구문을 써야 했고, 역할(ROLE) 기능 자체도 MySQL 8.0과 MariaDB 10.1 이상에서만 지원됐다. 사전에 버전별 지원 여부를 표로 정리해두고, Role 생성 시점에 Connection의 DB 타입·버전을 보고 분기하도록 했다.

```ts
function buildRotateStatement(
  dbType: "mysql" | "mariadb",
  majorVersion: number,
  username: string,
): string {
  const isLegacyMysql = dbType === "mysql" && majorVersion < 8;
  if (isLegacyMysql) {
    return `SET PASSWORD FOR '${username}'@'%' = PASSWORD(?);`;
  }
  return `ALTER USER '${username}'@'%' IDENTIFIED BY ?;`;
}
```

패스워드 값 자체는 바인딩 파라미터로 넘기고, 문자열에는 구문만 담는 방식으로 짰다. SQL 구문 자체를 문자열 연결로 완성해버리면 인젝션 위험이 생기기 때문에, 여기서 갈리는 건 어디까지나 "어떤 구문을 쓸지"이지 값 자체는 아니다.

### 🛠️ 구현 — 동적 자격증명 발급·파기(Lease)

동적 역할에서 자격증명을 발급하면 TTL이 붙은 Lease가 하나 생긴다. TTL이 지나면 스케줄러가 해당 계정을 DB에서 실제로 `DROP` 하고 Lease 상태를 파기로 바꾼다.

```ts
interface DbCredentialLease {
  leaseId: string;
  roleName: string;
  username: string;
  issuedAt: string;
  ttl: number;
  status: "active" | "expired" | "revoked";
}

async function issueDynamicCredential(role: DbRole): Promise<DbCredentialLease> {
  const username = generateUsername(role.roleName);
  const password = generateStrongPassword();
  await executeCreationStatement(role.creationStatement, username, password);
  return createLease(role.roleName, username, role.ttl);
}
```

발급·파기 흐름을 붙이면서 실제로 겪은 문제는 "발급하거나 파기한 직후 화면이 자동으로 갱신되지 않는" 현상이었다. 목록을 다시 불러오는 훅이 Lease 상태 변경까지는 감지하지 못해서, 발급·파기 액션 이후에는 별도로 커스텀 리프레시 로직을 넣어서 해결했다.

### ✅ 전체 진행 순서 요약

1. Connection CRUD 구현 (임시 API로 우선 연결)
2. Role(정적/동적) CRUD + 유효성 검증
3. 정적 역할 패스워드 회전 API 연결
4. 동적 역할 자격증명 발급·파기(Lease) API 연결 + 발급 직후 안내 모달
5. Root 계정 자격증명 회전
6. DBMS 버전별 SQL 분기 처리
7. Connection/Role Rotate 로그 화면 구현

### ✅ 결과 & 배운 점

| | 이전 | 이후 |
|---|---|---|
| 계정 발급 | 담당자가 수동으로 생성 | Role 기준으로 API 발급/파기 |
| 유효기간 | 없음(영구) | TTL 기반 자동 파기 |
| 이력 추적 | 불가능 | 발급·회전·파기 로그 화면 제공 |

동적 자격증명이라는 개념은 알고 있었지만, TTL이 지난 계정을 실제로 스케줄러가 지우고 화면 상태까지 맞추는 전체 라이프사이클을 코드로 직접 다뤄본 건 이번이 처음이었다. "발급"보다 "파기가 확실히 되는가"를 검증하는 데 더 많은 시간을 썼다는 게 이 작업의 핵심 배움이다.

## 참고한 링크

- [HashiCorp Vault — Database Secrets Engine](https://developer.hashicorp.com/vault/docs/secrets/databases) (동적 시크릿 개념 참고)
