# workflow — Standard Operating Procedures (SOPs)

This folder contains the universal SOPs for orchestration in slog.
Claude and agents read the relevant SOP file first before starting any complex task.

---

## 3-Layer Structure

```
Rules (Rules)        — .claude/rules/*  (code and operation guardrails)
Workflow (SOP)       — .claude/workflow/* (recurring task procedures)  ← this folder
Agents (Expert)      — .claude/agents/*  (read SOPs and rules, then execute)
```

---

## 기능 개발 — BOSU 4단계 파이프라인 (1순위 경로)

**기능 추가·신규 개발·개선은 `.claude/workflows/`의 4단계 파이프라인으로 진행한다** (팀장이 자동 발동, `bosu:spec-pipeline` 스킬이 프로토콜 SSoT):

```
brief-workflow(기획 🛑HG1) → spec-workflow(명세 🛑HG2) → impl-workflow(구현 ECRC) → test-workflow(테스트 GREEN)
```

상세: [../workflows/README.md](../workflows/README.md)

## 파이프라인 밖 작업 플로우

| File | 플로우 | Role |
|------|--------|------|
| [harness_ecc.md](harness_ecc.md) | 구현 하네스 | 파이프라인 밖 작업(버그픽스·리팩터·운영)의 ECCC 루프 → develop 머지 → push 게이트 |

---

## 보조 워크플로우

| File | Role |
|------|------|
| [gemini_mcp_loop.md](gemini_mcp_loop.md) | Gemini orchestration workflow (complex-task analysis via gemini-web MCP) |

---

## Pattern Summary

| Task Type | Approach |
|-----------|----------|
| 기능 추가·신규 개발·개선 | **BOSU 4단계 파이프라인** (brief→spec→impl→test-workflow) 자동 진입 |
| Simple change (1 agent, small scope) | Dispatch agent directly — no meeting, no Gemini |
| Complex task (파이프라인 밖: 버그픽스·리팩터·인프라·운영) | Gemini analysis → meeting → parallel dispatch → ECCC loop |
| Flow change / decision / error | Meeting first, then proceed |

---

## Project-Specific SOPs

Add project-specific development SOPs (setup, feature, schema, deploy, user flow, etc.) to this folder as needed.
Register each new file in this README and follow the file-content rules in [../rules/claude_file.md](../rules/claude_file.md).

---

## References

- Team lead definition → [../AGENT.md](../AGENT.md)
- Code rules → `.claude/rules/` (설치된 룰 파일)
- Agents → [../AGENTS.md](../AGENTS.md) (정의는 BOSU 플러그인 `bosu:<이름>`)
