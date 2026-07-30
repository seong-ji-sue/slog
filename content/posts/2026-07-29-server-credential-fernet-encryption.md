---
title: "서버 자격증명을 안전하게 저장하기 — PEM에서 Fernet 암호화까지"
date: 2026-07-29 21:00:00 +0900
description: "서버 접속 비밀번호를 평문 컬럼·환경변수로 흩어 관리하다 Fernet 대칭키 암호화로 전환하고, AI 코드리뷰가 지적한 CRITICAL/HIGH 취약점을 반영해 모든 진입점에 일관 적용한 기록"
categories: ["일감"]
tags: ["보안", "Fernet", "암호화", "코드리뷰", "FastAPI", "RPA"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 4
scope: "company"
log: 117
draft: false
---

> **TL;DR** — 서버 접속 자격증명을 평문 DB 컬럼과 환경변수로 관리하던 걸 Fernet 대칭키 암호화로 전환했다. 그런데 진짜 문제는 암호화 함수를 "만든 것"과 "모든 엔드포인트에 빠짐없이 적용한 것" 사이의 간극이었다 — AI 코드리뷰가 그 간극을 CRITICAL/HIGH로 잡아줬다. 마지막엔 실제로 쓰이지 않던 PEM 키 인증 경로를 통째로 제거해서 자동화 경로를 ID/PW 하나로 단순화했다.

난이도 : ★★★★☆

1️⃣ `Fernet 대칭키 암호화` 2️⃣ `soft delete` 3️⃣ `죽은 코드 제거`

### ✅ 요구사항

> 선임 : 서버 등록할 때 비밀번호가 DB에 평문으로 그냥 들어가고 있던데?  
> 나 : 네... 초기엔 환경변수 fallback 위주로 짰다가 DB 컬럼 추가하면서 그대로 넘어갔습니다  
> 선임 : 암호화부터 하고, 삭제도 진짜로 지우지 말고 이력 남기는 방식으로 바꾸자

RPA 플랫폼은 여러 사내 서버에 접속하기 위해 각 서버의 로그인 자격증명(호스트, 계정, 비밀번호)을 DB에 저장한다. 처음엔 `server.password` 평문 컬럼과 `os.environ[server.env_key]` 환경변수 fallback을 섞어 쓰고 있었다. 규모가 작을 땐 큰 문제가 아니었지만, 서버가 늘어나고 서버별로 개별 자격증명까지 저장하게 되면서 이 구조를 그대로 둘 수 없었다.

### ✅ 1단계 — Fernet 암호화 + soft delete

`cryptography` 패키지의 `Fernet`으로 대칭키 암호화 유틸을 만들었다. KMS 같은 별도 인프라 없이, 서버 하나의 마스터 키(`SERVER_SECRET_KEY` 환경변수)로 암복호화하는 가장 단순한 구조를 골랐다 — 규모에 맞는 최소 방어였다.

```python
# helpers.py — 자격증명 암복호화 유틸
def _fernet() -> Fernet:
    key = os.environ["SERVER_SECRET_KEY"]
    return Fernet(key.encode() if isinstance(key, str) else key)

def encrypt_password(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()

def get_credential(server) -> str:
    """우선순위: password_enc(복호화) > password(레거시) > env_key."""
    if server.password_enc:
        return _fernet().decrypt(server.password_enc.encode()).decode()
    if server.password:
        return server.password
    return os.environ.get(server.env_key, "")
```

같은 커밋에서 삭제 방식도 함께 바꿨다. 기존엔 `DELETE /servers/{id}`가 그대로 row를 지우는 hard delete였는데, 이걸 `deleted_at` 타임스탬프를 찍는 soft delete로 바꿨다. 삭제된 서버의 이력을 남겨야 나중에 "이 서버가 언제 왜 빠졌는지" 추적이 가능하고, 실수로 지웠을 때 복구할 여지도 생긴다.

```python
server.deleted_at = datetime.utcnow()
await db.commit()
# 조회는 전부 Server.deleted_at.is_(None) 필터를 통과해야 함
```

### ✅ AI 코드리뷰가 잡아낸 것 — "함수는 있는데 안 쓰는 곳이 있다"

`get_credential()` 함수를 만들고 나서, 실제로 이걸 어디에 적용했는지 점검이 필요했다. 코드리뷰 결과 CRITICAL/HIGH로 지적된 항목이 이랬다.

- `sync/ping/deploy/build/run/import` 엔드포인트 중 일부는 여전히 `server.password or os.environ.get(server.env_key, "") or ""` 같은 예전 패턴을 그대로 쓰고 있었음 — 암호화 컬럼이 생겼는데 복호화 로직을 안 타는 곳이 남아있었던 것
- `list_folders`, `get_file`, `sync`, `ping`, `deploy`, `build`, `run` 각각의 서버 조회 쿼리에 soft-delete 필터(`deleted_at.is_(None)`)가 빠져 있어서, **삭제된 서버로도 여전히 SSH 접속·파일 조회가 가능한 상태**였음
- `Fernet.decrypt()`가 `InvalidToken`을 던지는 경우(키 로테이션 등)에 대한 처리가 없어서, 키가 바뀌면 요청이 그대로 500으로 죽는 구조였음

```python
def get_credential(server: "Server") -> str:
    if server.password_enc:
        try:
            return _fernet().decrypt(server.password_enc.encode()).decode()
        except InvalidToken:
            logger.error("Server %s: password_enc 복호화 실패 (키 변경됨?)", server.id)
            raise
    if server.password:
        logger.warning("Server %s: 레거시 plaintext password 컬럼 사용 중", server.id)
        return server.password
    return os.environ.get(server.env_key, "")
```

가장 인상 깊었던 지적은 두 번째 것이다. 암호화는 이미 되어 있었는데, "삭제된 서버는 조회되면 안 된다"는 규칙을 엔드포인트 7~8개에 각각 따로 걸어야 하는 구조라, 그중 몇 개를 빠뜨렸다는 게 실질적인 보안 구멍이었다. 암호화 알고리즘 자체보다, **암호화된 자격증명에 접근하는 진입점 전부에 같은 규칙이 빠짐없이 걸려 있는가**가 더 중요한 문제였다.

### ✅ 서버별 개별 자격증명 확장 — 그리고 PEM 제거

이후 요구사항이 늘면서 서버 접속용 자격증명 하나가 아니라, 서버별로 개별 관리해야 하는 자격증명(관리 계정, DB 계정 등)이 추가로 필요해졌다. 이때 처음엔 PEM 키 기반 인증 경로도 함께 만들었다 — 사용자가 수동으로 접속할 때를 대비한 선택지였다.

```python
class Server(Base):
    ...
    target_user = Column(String(100), nullable=True)
    target_pem_enc = Column(Text, nullable=True)          # PEM 내용 Fernet 암호화
    target_root_user = Column(String(100), nullable=True)
    target_root_pw_enc = Column(String(512), nullable=True)
    target_db_user = Column(String(100), nullable=True)
    target_db_pw_enc = Column(String(512), nullable=True)
```

그런데 실제 자동화 경로(`run_db_grant` 등)를 다시 훑어보니, PEM 기반 SSH 함수(`run_pem`)를 부르는 곳이 하나도 없었다. 자동화 흐름은 전부 ID/비밀번호 인증만 타고 있었고, PEM은 애초에 코드에만 존재하는 죽은 경로였다. 컬럼과 함수를 남겨두는 것 자체가 암호화 대상만 늘리고 실제로 쓰이지 않는 공격 표면이었다.

<!-- 이미지 제안: 자격증명 인증 경로 Before/After — PEM+ID/PW 이원화 구조에서 ID/PW 단일 경로로 정리된 흐름도 -->

그래서 PEM 관련 코드를 전면 제거했다.

- `models/server.py`: `target_pem_enc` 컬럼 삭제 + Alembic 0009 마이그레이션으로 실제 DROP
- `ssh_native.py`: `run_pem()` 함수 삭제 (호출처 0건 확인 후)
- `run_db_grant`: PEM 기반 접속 → `run(host, port, root_user, root_pw, cmd)` (sshpass + 비밀번호)로 통일
- 정책 확정: **자동화/앱 경로는 무조건 ID/비밀번호, PEM은 사용자 수동 접속 전용**

```python
# Before — PEM SSH
check_out = run_pem(target_ip, port, target_user, target_pem, check_cmd, timeout=30)
# After — ID/PW SSH (native)
check_out = run(target_ip, port, root_user, root_pw, check_cmd, timeout=30)
```

### ✅ 결과 & 배운 점

| 항목 | 이전 | 이후 |
|------|------|------|
| 비밀번호 저장 | 평문 컬럼 + env fallback | Fernet 암호화 컬럼 우선, 레거시 fallback 경고 로깅 |
| 삭제 | hard delete | soft delete(`deleted_at`) + 조회 전역 필터 |
| 암호화 적용 범위 | 일부 엔드포인트만 | sync/ping/deploy/build/run/import 전체 일괄 적용 |
| 키 로테이션 대응 | 없음(500 크래시) | `InvalidToken` catch + 명시적 에러 로깅 |
| PEM 인증 경로 | 컬럼·함수 존재(호출처 0) | 전면 제거, ID/PW로 정책 단일화 |

이번 작업에서 가장 크게 배운 건, 보안 개선은 "암호화 함수 하나를 잘 짜는 것"으로 끝나지 않는다는 점이다. 그 함수를 호출해야 하는 진입점을 전부 나열하고, 하나도 빠짐없이 적용됐는지 확인하는 작업이 실제로는 더 크고 더 중요했다. 그리고 "혹시 몰라서" 만들어둔 PEM 경로처럼, 실사용이 확인되지 않는 인증 수단은 존재 자체가 보안 부채라는 것도 확인했다. 쓰이지 않는 경로는 남겨두는 게 아니라 지우는 게 맞다.

## 참고한 링크

- [cryptography — Fernet (symmetric encryption)](https://cryptography.io/en/latest/fernet/)
- [OWASP — Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
