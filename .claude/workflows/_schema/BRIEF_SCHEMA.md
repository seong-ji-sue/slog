# BRIEF_SCHEMA — 표준 기획서 규격 (`_data/brief/BRIEF_{feature}.md`)

> 기획 워크플로우(brief-workflow) BRIEF 단계 산출물. `gate_check.py brief`가 기계 검증한다.
> 원칙: **Proactive Anchoring** — AI가 80%를 선제 가정으로 채우고, 사용자는 방향을 가르는 결정만 확인한다.
> EARS(Easy Approach to Requirements Syntax) 정형 문장으로 요구사항을 기술해 PRD acs와 1:1 매핑을 보장한다.

---

## 섹션 구성 (6개 고정 — 번호·제목 불변, 게이트가 헤더를 정규식 검사)

```markdown
# BRIEF — {feature}

## 0. OVERVIEW
- 목적: <이 기능/제품이 해결하는 문제 1~3줄>
- 타겟: <사용자/페르소나>
- 범위: <이번 피처 범위>
- non-goals: <이번에 하지 않는 것 — 명시적으로>

## 1. CORE FACTS
- [F-01] <입력(아이디어·기존 자료)에서 확정된 사실만. 창작 금지>
- [F-02] ...

## 2. ASSUMPTIONS
- [A-01] <정보 부족 지점의 선제 가정 + 근거. "이의 없으면 이대로 진행">
- [A-02] ...

## 3. EARS REQUIREMENTS
- [REQ-01] When <트리거/조건> → Then <시스템의 관측 가능 행동>
- [REQ-02] Given <전제 상태>, When <행동> → Then <결과>

## 4. SCREENS
- [S-01] <화면명> — <핵심 역할 1줄. FACTS 분해·PRD screens의 출발점>
- [S-02] ...

## 5. OPEN QUESTIONS
- [Q-01] <제품 방향을 가르는 결정만. 최대 5개 — FACTS questions[]로 승격됨>
- (없으면 "- 없음")
```

## 규칙

| 항목 | 규칙 |
|------|------|
| 섹션 | `## 0.`~`## 5.` 6개 전부 존재 (제목 영문 고정) |
| ID 포맷 | `[F-NN]` `[A-NN]` `[REQ-NN]` `[S-NN]` `[Q-NN]` (NN=2자리 이상) |
| EARS | `[REQ-xx]` 라인은 반드시 `→` 포함 (When/Given 조건 → Then 행동). 모호 형용사(빠르게·직관적으로) 금지 — 계량 가능 표현으로 |
| CORE FACTS | 입력에 근거한 사실만 — 없는 내용 창작 금지(추정은 전부 §2로) |
| OPEN QUESTIONS | 최대 5개 — 초과분은 질문 병합 또는 §2 가정 확인형으로 전환 |
| 탈스택 | 스택·프레임워크·코드·파일경로·셀렉터 금지 (PRD와 동일 원칙) |
| 누적 | 갱신 시 기존 ID 보존(재번호 금지) — 추가·수정만 |

## 게이트 (`gate_check.py brief --feature {f}`)

- 섹션 헤더 6개 존재
- `[F-NN]` ≥1 · `[REQ-NN]` ≥1 · `[S-NN]` ≥1
- 모든 `[REQ-NN]` 라인에 `→` 포함
- `[Q-NN]` 6개 이상이면 FAIL (최대 5)

## 소비처

| 소비자 | 사용 |
|--------|------|
| designer (DESIGN 단계) | §0 제품 성격 + §4 화면 후보 → 토큰·가이드 |
| facts-writer (FACTS 단계) | 전체 — 화면 분해·confidence 평가·§5를 질문 출발점으로 |
| prd-writer (spec-workflow) | 요구사항 전수 원천(§3 EARS → acs, §4 → screens) |
