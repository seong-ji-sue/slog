---
name: harness_ecc
description: 구현 플로우 — Execute→Check→Verify→Continue→Complete(ECCC) 자율 루프. 단순 수정 또는 파이프라인 밖 작업에서 팀장이 직접 발동.
---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 구현 하네스 (harness_ecc)
# 입력: 팀장이 확정한 작업 범위 (파이프라인 밖 작업)
# 출력: feature branch → develop 머지
# 선행: 없음 — 파이프라인 밖 작업·단순 수정 시 팀장이 직접 발동
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> **BOSU 일감 흐름 예외 (사용자 결정 — 지적 85)**: `.bosu/hub.json` 이 있는 프로젝트의 일감은 최신 develop 위 전체 테스트 GREEN 이면 `orca_flow.py finish` 가 커밋·develop 머지·작업 공간 정리·`git push origin develop` 까지 승인 없이 자동으로 한다(레포 루트 develop 의 보통 push 도 승인 표시 없이). 아래의 develop push 승인 게이트는 일감 흐름 밖(손으로 하는 작업)에만 해당한다. master·main push, 강제·지우기 push 는 언제나 사용자 승인.

# ECCC Harness — 구현 플로우

**Purpose**: Minimize user intervention across the full cycle of dev agent work → build validation → autonomous review → develop merge
**Applies to**: All agents that modify code files (`.ts`, `.tsx`, `.py`)

---

## Task Classification

| Class | Criteria | Team Lead Action |
|-------|----------|------------------|
| **Simple** | 에이전트 1개로 해결 가능한 작은 작업 | Dispatch agent directly (no Gemini, no meeting) |
| **Complex** | 신기능·API·DB·인증·여러 에이전트 필요·다파일 변경 | Gemini 필수 호출 → 회의 (서브에이전트 참여) → parallel dispatch |

---

## ECCC 5 Stages

```
┌────────────────────────────────────────────────────────────────────┐
│  E — Execute     Work in worktree(<project>-<topic>/) + ECC skill  │
│                  (All code changes in worktree only — no direct     │
│                   commits to develop)                               │
│                                                                    │
│  C — Check       빌드·타입 검증 (max 3 retries, failure → escalation)│
│                  · TS: tsc --noEmit                                 │
│                  · PY: python -m py_compile / ruff check            │
│                  통과 후 커밋 → [ECCC Check Complete] 팀장 보고      │
│                                                                    │
│  C — Verify      런타임 검증 — 에이전트가 직접 수행 (필수)      │
│                  · 개발 서버 기동 확인 (FE + BE)                    │
│                  · UI 렌더: 주요 페이지 로드, 콘솔 에러 0건          │
│                  · 네트워크: 4xx·5xx 없음                           │
│                  · API: 변경 엔드포인트 상태코드 정상, 500 금지       │
│                  통과 → C-Continue / 실패 → Execute 복귀 (max 2회)  │
│                  2회 실패 → Stage 2 에스컬레이션                    │
│                                                                    │
│  C — Continue    [Local consensus loop] Worker ↔ bosu:code-reviewer │
│                  ping-pong (팀장 우회 자율 루프)                    │
│       Stage 1: code-level → local loop self-resolves               │
│       Stage 2: planning contradiction / 5+ failures → main re-plans│
│       Stage 3: business/UX/secret input → Human Gate Pause         │
│       ↓ consensus complete (🔴 0 items)                            │
│       Team lead: report [ECC Complete — Merge Approval Request]    │
│       ⛔ ───── Gate: explicit user approval (feature push · merge)  │
│       ↓ approved                                                    │
│       Team lead: feature push → local develop merge (no push yet)  │
│                                                                    │
│  C — Complete    Remove worktree + delete local branch (auto)      │
│       Team lead: report completion + ask push approval             │
│       ⛔ ───── Gate: explicit user approval (git push origin develop)│
│       ↓ approved                                                    │
│       git push origin develop  →  🚀 auto-deploy                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## E — Execute

Team lead classifies task then dispatches:

```
Simple task → dispatch agent directly (no meeting)
Complex task → draft brief plan → dispatch agents in parallel
```

**Stack Config 확인 (dispatch 전 필수):**
```bash
grep -A 30 "## BOSU Stack Config" CLAUDE.md 2>/dev/null
```

읽어야 할 값:
| 키 | 역할 | 없으면 |
|----|------|--------|
| `BACKEND_AGENT` | 백엔드 담당 에이전트명 | `api_developer` |
| `FRONTEND_AGENT` | 프론트엔드 담당 에이전트명 | `ui_developer` |
| `DB_AGENT` | DB 담당 에이전트명 | `db_manager` |
| `REVIEWER` | 코드리뷰 에이전트 | `bosu:code-reviewer` |
| `BACKEND_PORT` | 서버 포트 | `8000` |
| `FRONTEND_PORT` | 프론트 포트 | `3000` |

에이전트 dispatch 시 항상 Stack Config 값 사용.
예: `BACKEND_AGENT: api_developer` → `[팀장] api_developer에게 dispatch`

### TDD Execute 시퀀스 (spec.md 기반)

spec.md의 Atomic TODO + TDD Scenarios를 순서대로 따름:

```
① API Contract   — Pydantic/DTO/Interface 계약 먼저 정의
② [RED] 테스트   — spec.md §5 Red 시나리오 작성 → 반드시 FAIL 확인
③ 데이터 모델    — ORM/Entity/스키마 구현
④ [GREEN] 서비스 — 서비스·라우터·컨트롤러 구현 → 테스트 통과
⑤ 마이그레이션   — DB 변경 시 마이그레이션 적용
⑥ [GREEN] 백엔드 전체 테스트 통과 확인
⑦ [REFACTOR] 백엔드 정리 (중복 제거·네이밍)
⑧ [RED] UI 테스트 — 스택 파악 후 프론트 테스트 작성 → FAIL 확인
⑨ [GREEN] UI 구현 → 테스트 통과
⑩ [REFACTOR] UI 정리
⑪ E2E 테스트     — 전체 흐름 통합 검증
```

**UI 없는 스택** (순수 백엔드·CLI 등): ⑧~⑩ 스킵, ⑪을 API E2E로 대체.

---

## C — Check (Build Validation)

프로젝트 Stack Config의 CHECK_LIGHT / CHECK_HEAVY 값 사용.
없으면 스택 자동 감지.

### LIGHT Check (항상 먼저)

프로젝트 `.claude/scripts/check-light.sh` 실행.
없으면 프로젝트 CLAUDE.md `CHECK_LIGHT` 명령 사용.

> 구문 오류·타입 에러·린트 — 빠르게 통과 or 실패 판정.

LIGHT 실패 → 에이전트 자율 수정 → 재실행. 3회 실패 → Execute 복귀.

### HEAVY Check (LIGHT 통과 후)

프로젝트 `.claude/scripts/check-heavy.sh` 실행.
없으면 프로젝트 CLAUDE.md `CHECK_HEAVY` 명령 사용.

> 테스트 실행 — 변경 파일 관련 범위 우선, 전체 스위트 포함.

**Test Gaming Detection** — `bosu:code-reviewer` 자동 dispatch(테스트 조작 감지 관점):
- `assert True` / 무조건 통과 단언 탐지
- 빈 mock으로 실제 로직 우회 탐지
- 테스트 파일 수정으로 기존 실패 은폐 탐지
- 발견 시 → Execute 복귀 (수정 없이 통과 불허)

HEAVY 통과 후 커밋 → `[ECCC Check Complete]` 팀장 보고.

### Check Failure Handling

| 시도 | 조치 |
|------|------|
| 1–2회 | 에이전트 자율 수정 후 재실행 |
| 3회 | 팀장 에스컬레이션 → 사용자 판단 요청 |

### Human Gate 조건

| 태그 | 트리거 | 조치 |
|------|--------|------|
| `[soft:3x]` | 동일 에러 3회 반복 | 팀장 보고 → 사용자 판단 |
| `[hard:1x]` | 시크릿 필요 / 인프라 다운 / 정책·UX 결정 / 비가역 변경 | 즉시 PAUSE → 사용자 응답 후 Resume |

---

## Branch Patterns

| Pattern | Flow |
|---------|------|
| Single merge (small/medium) | `feature/<topic>` → `develop` |
| Two-stage merge (large/complex) | `hotfix/<topic>` → `feature/<parent>` → `develop` |

Hotfixes merge into the parent feature branch; feature then carries them into develop. Hotfixes do not go directly to develop.

---

## C — Continue (Local Consensus Loop + Merge Gate)

**Core principle**: Worker ↔ `bosu:code-reviewer` ping-pong is **bypassed by main Claude**. The two agents reach consensus autonomously; only the final agreed result is reported to main Claude.

```
[Worker writes and commits]
        ↓
[bosu:code-reviewer autonomously invoked]
        ↓
🔴 present → Worker receives only distilled feedback, self-corrects + re-commits → bosu:code-reviewer re-invoked → repeat
🔴 0 items → "Consensus complete" signal reported to main Claude once
        ↓  (자동 실행 — 사용자 승인 불필요)
git push origin <feature-branch>
git checkout develop
git merge <feature-branch> --no-ff   ← local only, no push
Remove worktree + delete local branch
        ↓
Main Claude: 최종 보고 → ⛔ push approval gate (배포 승인 요청)
        ↓ approved
git push origin develop   → 🚀 auto-deploy
```

(Two-stage merge: merge hotfix into feature branch first, then follow the same flow above.)

**Main Claude's role**: Receive final agreed result → auto execute feature push + local merge + cleanup → report to user → push gate.
Intermediate round text must never be passed to main Claude.

**Environment constraint (current Claude Code CLI)**: Task tool can only be called by main Claude, so 100% bypass is not possible.
Workaround — main Claude only passes round text through; no processing or intermediate judgment.

---

## Escalation Guard — 3-Stage Branch

All situations arising in the worker/reviewer local loop are automatically classified into one of the following stages.

### Stage 1: Local Consensus (default)

- **Trigger**: Simple compile errors, convention mismatches, typos, missing imports
- **Action**: Worker ↔ Reviewer self-resolve via ping-pong. No main Claude involvement.
- **Exit condition**: Reviewer responds with 🔴 0 items → "consensus complete" signal

### Stage 2: Main Agent Intervention (re-planning)

- **Trigger**:
  - Worker or Reviewer determines that the plan or premise itself is wrong
  - Local ping-pong fails 5+ times
  - Contradiction found in task spec
- **Action**: Immediately abort local loop → report contradiction to main Claude (or Gemini)
- **After**: Main re-plans (task spec) → re-dispatches sub-agents with new spec

### Stage 3: Human Gate (user decision)

- **Trigger**: Outside AI domain
  - Whether to force-upgrade a library
  - UI/UX taste choices
  - External API keys / secrets input
  - Business policy decisions
- **Action**: Pause entire system
- **After**: Present options via terminal/Slack → receive response → inject context and Resume

### Decision Tree

```
[Error or anomaly during sub-agent work]
        │
        ├─► Simple code/compile error → Stage 1: Local consensus loop
        │
        ├─► Planning/direction contradiction or 5+ failures → Stage 2: Main agent re-planning
        │
        └─► Business/UX/external input needed → Stage 3: Human Gate Pause/Resume
```

### Escalation Format

```
[ECCC Escalation — Stage 2]
- Stage: <Local 5-failure | Planning contradiction | Premise error>
- Detected at: <Worker self-review | Reviewer feedback>
- Contradiction: <specific description>
- Affected files/docs: <filenames / task spec location>
- Requesting main to: revise task spec / dispatch different agent

[ECCC Escalation — Stage 3 Human Gate]
- Stage: User decision required
- Decision item: <item>
- Options: A) ... B) ... C) ...
- Reason outside AI domain: <reason>
- Status: Paused (waiting for Resume signal)
```

---

## C — Complete (Worktree Cleanup → Report → Push Gate)

Immediately after local develop merge, **team lead runs autonomously (no user approval needed)**:

1. **curator audit** — `claude_curator` read-only 감사:
   ```
   · 변경 파일 관련 문서(.claude/structures, AGENTS.md) 정합 확인
   · 깨진 참조 0건 · 잔존 임시파일 0건
   ```
   curator는 문제 목록만 반환 — 팀장이 수정 여부 판단.
2. **pre-merge 서버 점검** — Stack Config 포트 기준:
   ```bash
   # BACKEND_PORT 응답 확인
   curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT:-8000}/health
   # FRONTEND_PORT 응답 확인 (있을 경우)
   curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_PORT:-3000}
   ```
   응답 없으면 → 개발 서버 기동·렌더·API 응답을 직접 확인 → 실패 시 Execute 복귀.
3. **Remove worktree** → `git worktree remove <worktree-parent>/<project>-<topic>`
4. **Delete local branch** → `git branch -d feature/<topic>`

Then team lead reports and requests push approval:

```
[로컬 머지·정리 완료 — 배포 승인 요청]
- 작업 요약: <summary>
- 리뷰: ✅ clean (🔴 0 items)
- 로컬 develop 머지: ✅
- Worktree 제거: ✅
- 로컬 브랜치 제거: ✅

git push origin develop = 배포 실행합니까?
```

### Push Gate — Explicit User Approval (git push origin develop = deploy)

**Only proceeds on explicit user approval.** On approval, team lead runs:

```bash
git push origin develop   # → auto-deploy triggered
```

---

## Post-Complete — 문서 갱신 (push 완료 후)

**실행 주체**: 팀장 (수동 호출 — 자동 실행 금지)

`git push origin develop` 완료 후 팀장이 순서대로 수행:

### 1. claude_curator 호출 — 전체 문서 싱크 확인 (수동)
- 점검 대상: `AGENTS.md` · `AGENT.md`('BOSU 흐름' 표) · 일감 명세(`bosu-output/tasks/<task_id>/` — PRD · Plan)
- 변경된 구조·라우팅·스킬이 문서에 반영됐는지 확인
- 불일치 발견 시: `bosu:claude_curator` 호출해서 수정

### 2. 작업 중 필요했던 스킬·에이전트 확인
- 이번 작업에서 부족했거나 새로 필요한 스킬·에이전트 목록 정리
- 필요 시 조사 후 추가 여부 결정
- **추가 결정 시에만** `bosu:claude_curator` 호출 → 문서 수정 + 사용자 승인

> ⚠️ curator 자동 호출 금지 — 팀장이 판단해서 명시적으로 호출

---

## Agent ECCC Participation

| Agent | E | C(Check) | C(Verify) | C(Continue) | C(Complete) |
|-------|---|----------|-----------|-------------|-------------|
| Team lead (main Claude) | dispatch/classify | — | — | ✅ receive consensus result only · merge gate | ✅ push gate · worktree 삭제 |
| `ui_developer` | ✅ execute | ✅ tsc+build | ✅ 런타임 직접 검증 | ✅ self-correct until consensus | ❌ |
| `api_developer` | ✅ execute | ✅ py_compile | ✅ 런타임 직접 검증 | ✅ self-correct until consensus | ❌ |
| `db_manager` | ✅ execute | ✅ py_compile | ✅ 런타임 직접 검증 | ✅ self-correct until consensus | ❌ |
| `architect` | ✅ execute | ✅ direct | ✅ 런타임 직접 검증 | ✅ self-correct until consensus | ❌ |
| `bosu:code-reviewer` | ❌ | ❌ | ❌ | ✅ autonomous review loop (bypasses main) | ❌ |
| `analyst` | ✅ research | ❌ | ❌ | ❌ | ❌ |
| `deploy_agent` | ✅ execute | ✅ direct | ✅ 런타임 직접 검증 | ❌ | ✅ deploy |
| `designer` | ✅ design spec | ❌ | ❌ | ❌ | ❌ |

---

## Inter-Agent Communication Structure

```
User
  ↓ request
Team lead (main Claude)
  ├─ [simple] dispatch agent directly
  └─ [complex] draft plan → dispatch agents in parallel
        ↓
  receive [ECCC Check Complete]
        ↓
  [Local consensus loop — bypasses main Claude]
  Worker ↔ bosu:code-reviewer autonomous ping-pong
  🔴 present → Worker self-corrects + re-commits → bosu:code-reviewer re-invoked → repeat
        ↓ escalation branch
  Stage 1 (code error) → local consensus loop self-resolves
  Stage 2 (planning contradiction / 5+ failures) → team lead receives Abort → main re-plans
  Stage 3 (business/UX/secret) → full Pause → user decides
        ↓ 🔴 0 items ("consensus complete" signal)
  Team lead: report [ECC Complete — Merge Approval Request] (receives final result only)
              ⛔ explicit user approval gate
              ↓ approved
  Team lead: feature push → local develop merge → worktree cleanup (all auto)
        ↓
  Report completion → ⛔ push approval gate
        ↓ approved
  git push origin develop  →  🚀 auto-deploy
```

**Local consensus loop (Worker ↔ Reviewer)**: Bypassing main Claude is the principle.
**Team lead intervenes only on receiving an escalation signal** — intermediate round text must not pass through.

---

## User Gates

| Gate | Position | Condition |
|------|----------|-----------|
| **Auto execute** | Immediately after Continue consensus | feature push + local develop merge + worktree cleanup = automatic (no approval) |
| **Push gate** | After worktree cleanup + report (end of Complete) | `git push origin develop` = deploy = explicit user approval |
| **Stage 3 Human Gate** | When outside-AI-domain issue arises mid-loop | Business/UX/secret/policy decision = full Pause → user response → Resume |
| **New agent/skill/hook gate** | When introducing new agent, skill, or hook | Record the decision (task DECISIONS) → explicit user approval → claude_curator executes. No arbitrary addition. |

---

## Other-Session Branch Protection

Do not cherry-pick, rebase, reset, or commit to branches not started by this session. Report to user only if encountered.

---

## Document Consistency Check Timing

Consistency checks for `.claude/` docs and READMEs are run **only at branch close (just before merge)**. Consistency issues discovered mid-work are recorded as "pending items" in the task's DECISIONS, then resolved in bulk before merge.

---

## ECC Active Use Principle

Before starting work, match the skill to call using the 'BOSU 흐름 — 팀장 직접 호출 원칙' table in `.claude/AGENT.md`. Worker attribution: `[<agent> + <skill>]`.

Representative scenarios:
- Build auto-fix → 담당 워커가 빌드 오류를 직접 고침(`bosu:impl-lead` 1차 진단)
- Validation/review → `bosu:code-reviewer` · `bosu:python-reviewer` · `bosu:typescript-reviewer`
- Security → `bosu:code-reviewer`(보안 관점)
- Deploy validation → `bosu:browser-qa`

---

## References

- Commit rules → project `git_convention.md`
- bosu:code-reviewer → BOSU 플러그인 에이전트(Agent 로 dispatch)
- Gemini orchestration → [gemini_mcp_loop.md](gemini_mcp_loop.md)
