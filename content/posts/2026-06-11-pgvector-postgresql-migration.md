---
title: "왜 단순 CRUD 앱에 pgvector를 넣었나 — SQLite에서 PostgreSQL로"
date: 2026-06-11 21:30:00 +0900
description: "스크립트 검색 기능에 나중에 시맨틱 검색을 붙일 걸 대비해서, SQLite로도 충분했던 백엔드를 PostgreSQL+pgvector로 먼저 전환한 이유와 트레이드오프"
categories: ["일감"]
tags: ["PostgreSQL", "pgvector", "SQLAlchemy", "asyncpg", "벡터DB", "백엔드"]
series: "AutoIt 업무 자동화"
project: "autoit-자동화"
difficulty: 3
scope: "company"
log: 120
draft: false
---

> **TL;DR** — 지금 당장은 SQLite만으로도 충분히 돌아가는 CRUD 백엔드였는데, 스크립트 검색 기능에 나중에 시맨틱 검색을 붙일 걸 대비해서 PostgreSQL + pgvector로 먼저 전환했다. 검색 엔드포인트 자체는 아직 텍스트 매칭(ILIKE)이지만, 임베딩을 저장할 자리와 인프라는 미리 만들어뒀다.

난이도 : ★★★☆☆

1️⃣ `PostgreSQL 전환` 2️⃣ `pgvector 선제 도입`

### ✅ 요구사항

> 동료 : 지금 스크립트가 폴더별로 수백 개 쌓여 있는데, 이름으로만 찾기 힘들다. 내용 기반으로 비슷한 스크립트 찾는 기능 나중에 필요할 것 같다  
> 나 : 시맨틱 검색 말하는 거면 임베딩 저장할 데가 있어야 되는데, 지금 SQLite로는 안 될 텐데  
> 동료 : 지금 바로 만들 필요는 없고, 나중에 붙이기 쉽게만 구조를 잡아두면 좋겠다  
> 나 : 그럼 이번에 DB부터 정리하고 넘어가겠다

당장 화면에 노출할 기능은 아니었다. 하지만 "나중에 임베딩 기반 검색을 붙인다"는 방향이 정해진 이상, 그때 가서 DB를 통째로 갈아엎는 것보다 지금 미리 옮겨두는 게 낫다고 판단했다.

### ✅ 왜 SQLite를 버리고 PostgreSQL+pgvector를 골랐나

SQLite(`aiosqlite`)는 파일 하나로 동작해서 배포가 단순하고, 지금까지 CRUD 용도로는 아무 문제가 없었다. 문제는 벡터 유사도 검색이다. SQLite에는 표준으로 딸려오는 벡터 확장이 없어서, 임베딩을 저장하고 유사도로 정렬하려면 결국 별도 벡터 DB(Chroma, Qdrant 등)를 하나 더 붙이거나 SQLite 확장을 억지로 얹어야 한다.

PostgreSQL + `pgvector` 확장을 쓰면 이 문제가 단순해진다.

- 기존 관계형 테이블(스크립트 메타데이터, 서버 정보 등)과 벡터 컬럼을 **같은 DB, 같은 트랜잭션 안에서** 다룰 수 있다
- 별도 벡터 DB 서비스를 새로 띄우고 운영할 필요가 없다 — 이미 쓰는 DB 컨테이너 하나로 끝난다
- SQLAlchemy 생태계 안에서 `pgvector.sqlalchemy.Vector` 타입으로 기존 ORM 모델과 동일하게 다룰 수 있다

전환은 세 단계로 나눠서 진행했다.

**1단계 — 환경변수 기반 DB 전환 (SQLite 유지한 채로)**

```python
# web/backend/database.py (1단계)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"sqlite+aiosqlite:///{_DB_PATH}",
)
```

`asyncpg`, `pgvector` 패키지를 `requirements.txt`에 먼저 추가하고, `DATABASE_URL` 환경변수가 있으면 그쪽을 쓰고 없으면 기존 SQLite 파일로 폴백하도록 만들었다. 이 시점까지는 로컬 개발에서 여전히 SQLite로 돌아간다 — 급하게 한 번에 다 바꾸지 않고 스위치를 켜고 끌 수 있게 여지를 남긴 것이다.

**2단계 — pgvector 스키마 추가**

```python
# web/backend/models/script_vector.py
class ScriptVector(Base):
    __tablename__ = "script_vectors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    folder_name = Column(String(255), nullable=False)
    script_type = Column(String(10))  # CS or WEB
    content_hash = Column(String(64), unique=True)
    content_preview = Column(Text)
    embedding = Column(Vector(384))  # sentence-transformers 차원에 맞춤
    indexed_at = Column(DateTime, default=datetime.utcnow)
```

Alembic 마이그레이션으로 `script_vectors` 테이블을 추가하고, 검색 엔드포인트도 하나 만들었다. 여기서 솔직하게 밝혀야 할 부분이 있는데, 이 시점의 `/api/scripts/search`는 벡터 유사도 검색이 아니라 그냥 `ILIKE` 텍스트 매칭이다.

```python
# web/backend/routers/scripts.py
@router.get("/search", response_model=List[ScriptSearchResult])
async def search_scripts(
    q: str = Query(..., description="검색어"),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> List[ScriptSearchResult]:
    """content_preview ILIKE 전문 검색 (embedding 검색은 추후 구현)."""
    result = await db.execute(
        select(ScriptVector)
        .where(ScriptVector.content_preview.ilike(f"%{q}%"))
        .limit(limit)
    )
    ...
```

`embedding` 컬럼과 `Vector(384)` 타입은 이미 스키마에 들어가 있지만, 실제 유사도 검색 로직(코사인 거리 정렬 등)은 다음 단계로 미뤘다. 스키마와 API 계약(요청/응답 형태)을 먼저 확정해두고, 검색 알고리즘 자체는 나중에 갈아끼워도 API를 호출하는 쪽엔 영향이 없게 설계한 셈이다.

**3단계 — SQLite 완전 제거**

```python
# web/backend/database.py (3단계)
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL 환경변수가 필요합니다.")
```

폴백 경로를 없애고 `DATABASE_URL`을 필수값으로 바꿨다. `docker-compose.yml`의 DB 이미지도 `pgvector/pgvector:pg15`로 교체해서, 컨테이너를 띄우는 순간부터 pgvector 확장이 이미 설치돼 있는 상태로 시작하게 만들었다.

### ✅ 결과 & 배운 점

| 항목 | 이전(SQLite) | 이후(PostgreSQL+pgvector) |
|------|------|------|
| DB 구성 | 파일 하나, docker 불필요 | docker-compose 필수(pgvector 이미지) |
| 벡터 저장 | 불가 | `Vector(384)` 컬럼 지원 |
| 검색 방식 | 없음 | ILIKE 텍스트 매칭(유사도 검색은 후속) |
| 향후 확장 | 별도 벡터 DB 도입 필요 | 같은 DB에서 유사도 검색만 추가하면 됨 |

과한 선제 투자가 아니냐는 생각도 스스로 해봤다. 지금 당장 쓰지도 않을 벡터 컬럼을 미리 만들어둔 셈이니까. 그런데 "SQLite 파일 하나"에서 "DB 컨테이너 + 마이그레이션"으로 넘어가는 전환 자체가 비용이 큰 작업이라, 이걸 벡터 검색이 실제로 급해진 시점에 하는 것보다는 CRUD만 있을 때 미리 해두는 게 리스크가 작다고 판단했다. 스키마와 인프라를 먼저 잡아두고 알고리즘은 나중에 채워 넣는 방식이, 결과적으로 "언젠가 필요할 기능"을 위해 지불하는 선불 비용을 최소화하는 방법이었다.

## 참고한 링크

- [pgvector — Open-source vector similarity search for Postgres](https://github.com/pgvector/pgvector)
- [pgvector-python — SQLAlchemy integration](https://github.com/pgvector/pgvector-python)
- [asyncpg — Documentation](https://magicstack.github.io/asyncpg/current/)
