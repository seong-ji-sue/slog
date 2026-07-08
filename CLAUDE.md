# slog — Claude Operating Guide

**Project**: 이직용 기술 블로그 — Next.js 15, 티스토리 아카이브 이관
**Stack**: React + Node/Express
**Source of truth**: [CLAUDE.md](CLAUDE.md) + [docs/meetings/](docs/meetings/) + [.claude/AGENTS.md](.claude/AGENTS.md)

---

## Basic Rules

- Response style: concise (임/함/됨)
- Language: Korean (user-facing output) / English (internal instructions)
- No arbitrary new md file creation
- Design decisions are recorded in docs/meetings/

---

## Agent Dispatch Criteria

Team lead = main Claude prompt session. No separate `leader` agent. Details → [AGENT.md](.claude/AGENT.md)

| Situation | Caller | Agent |
|-----------|--------|-------|
| Frontend UI · 컴포넌트 · 디자인 코드 | Team lead | `ui_developer` | 
| 백엔드 API · 서버 로직 코드 | Team lead | `api_developer` | 
| DB 스키마 · 마이그레이션 | Team lead | `db_manager` | 
| 인프라 · 컨테이너 · 환경변수 결정 | Team lead | `architect` | 
| 에이전트 커밋 후 자율 리뷰 루프 | Team lead (auto) | `ecc:code-reviewer` |
| 기술 조사 · 비교 · 사실 확인 · 판단 근거 | Main Claude | `analyst` | 
| `.claude/` 또는 `CLAUDE.md` 구조 변경 · 신규 | Main Claude | `claude_curator` | 
| 배포 · CI/CD · 인프라 운영 작업 | Team lead | `deploy_agent` | 
| 구현 완료 후 빌드 · 흐름 검증 | Team lead | `ecc:e2e-runner` |

---

## 워크플로우 (BOSU 명세 파이프라인)

모든 기능 개발은 BOSU 3-워크플로우(명세→구현→테스트)를 따름 — 상세는 `bosu:spec-pipeline` 스킬과 [.claude/workflows/README.md](.claude/workflows/README.md)가 SSoT.

| 플로우 | 진입점 | 역할 |
|--------|--------|------|
| 명세 | `Workflow(name:"spec-workflow")` · 스킬 `bosu:spec-pipeline` | 기획 브리프 → FACTS(Human Gate) → PRD → PLAN → TC(RED) |
| 구현 | `Workflow(name:"impl-workflow")` | plan.contract 소비 구현 → build/lint → TC 락 드리프트 확인 |
| 테스트 | `Workflow(name:"test-workflow")` | E2E spec 생성 → 실앱 GREEN 실측 → 재구현 피드백 루프 |

산출물: `.claude/specs/` (prd·plan·tc 계약 체인). 명세 단계 에이전트: `bosu:facts-writer`·`bosu:prd-writer`·`bosu:plan-writer`·`bosu:tc-writer`, 리드: `bosu:spec-lead`·`bosu:impl-lead`·`bosu:test-lead`.

---

## ECCC Harness

All code changes → **E(Execute) → C(Check) → C(Continue) → C(Complete)** 4-stage autonomous loop.
Details → BOSU 플러그인 `bosu:spec-pipeline` · `bosu:runtime-verify` 스킬 (SSoT)

```
Simple task (solvable by 1 agent, small scope)
    → team lead dispatches agent directly (no meeting)

Complex task (new features · API · DB · auth · multi-agent)
    → Gemini 필수 호출 (요구사항 분석·외부조사·명세서 작성) ← Gemini 응답 없으면 다음 단계 절대 진행 금지
    → 회의 (팀장 주재, 서브에이전트 참여)
         - 팀장이 Gemini 명세서 공유 및 회의 진행
         - 각 에이전트 담당·구현 방법·인터페이스·의존성·순서·테스트 합의
         - 회의록 → docs/meetings/
    → 에이전트 병렬 dispatch (회의 합의 기반)

[Common from here]
Agent writes code (병렬 실행, worktree 격리)
    ↓
Build/syntax validation (agent direct, max 3 retries)
    ↓ passes
ecc:e2e-runner 기능·흐름 검증 (통과 시 다음 단계)
    ↓ passes
ecc:code-reviewer autonomous loop (repeats until 🔴 0 items)
    ↓ 🔴 0 items
feature push → local develop merge → worktree cleanup (all auto)
    ↓
Team lead reports completion + requests push approval
⛔ explicit user approval → git push origin develop → 🚀 deploy
    ↓
Post-Complete: 회의록 마무리 · 문서 싱크 · 스킬 확인 (팀장 수동)
```

---

## Key References

| Document | Content |
|----------|---------|
| [AGENT.md](.claude/AGENT.md) | Team lead (main Claude) role · authority · operating principles |
| [AGENTS.md](.claude/AGENTS.md) | Agent routing table |
| `bosu:spec-pipeline` (BOSU 플러그인) | 명세 파이프라인 오케스트레이터 (FACTS→PRD→PLAN→TC) |
| [.claude/workflows/README.md](.claude/workflows/README.md) | 명세·구현·테스트 워크플로우 엔진 (BOSU 소유 — 사본 수정 금지) |

---

## Absolute Rules

- **All code work in worktrees** — feature/fix commits blocked in the main directory via pre-commit hook
- **develop merge = auto** (no approval needed once 🔴 0 confirmed) — feature push + local develop merge + worktree cleanup run automatically
- **develop push = explicit user approval required** — `git push origin develop` triggers Production deploy and requires explicit approval (no auto-pass)
- Do not modify branches in use by other sessions (check `git worktree list` first)
- **Branch thoughtfully** — branch only per task unit; no meaningless or duplicate branches
- **One commit = one topic** — follow Conventional Commits; never mix unrelated changes
- ECC · Vercel skills must be matched against the skill matrix before starting work
- Worker attribution required on every ECC · Vercel skill call — format: `[<agent> + <skill>]`
- MD files are only for meeting notes · rules · SOPs · skills · agent definitions · structure definitions — no mid-work artifact MDs
- No hardcoded secrets
- **하나의 프롬프트 = 브랜치 하나** — 하나의 사용자 요청은 feature 브랜치 하나에서 처리
- **Gemini 응답 필수 확인** — 복잡 작업 시 Gemini 응답 없으면 절대 다음 단계 진행 금지
