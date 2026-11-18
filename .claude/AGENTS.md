# Agent Routing Table

**Project**: slog (React + Node/Express)
**Last updated**: 2026.07.09

---

## Routing Table

| Name | File Path | Tools | Dispatch Trigger | Caller |
|------|----------|-------|-----------------|--------|
| `ui_developer` | `bosu:ui_developer` | Read, Edit, Write, Bash | Frontend UI code · component · design decisions | Team lead | 
| `api_developer` | `bosu:api_developer` | Read, Edit, Write, Bash | Backend API · server logic code | Team lead | 
| `db_manager` | `bosu:db_manager` | Read, Edit, Write, Bash | DB schema · migrations | Team lead | 
| `architect` | `bosu:architect` | Read, Edit, Write, Bash | Infrastructure · container · env var decisions | Team lead | 
| `ecc:code-reviewer` | ECC built-in | — | ECCC autonomous review loop (🔴 0 target) | Team lead (auto) |
| `analyst` | `bosu:analyst` | Read, Bash (Gemini CLI) | Technical research · comparison · fact-checking · evidence | Team lead | 
| `claude_curator` | `bosu:claude_curator` | Read, Edit, Write, Bash | `.claude/` structural changes · new files · CLAUDE.md oversight | Team lead | 
| `deploy_agent` | `bosu:deploy_agent` | Read, Edit, Write, Bash | Deployment · CI/CD · infrastructure operations | Team lead | 
| `ecc:e2e-runner` | ECC built-in | — | 구현 완료 후 빌드·흐름·기능 검증 · ecc:code-reviewer 전 단계 | Team lead |

---

## ECC Skill Usage

Each agent may call ECC / Vercel plugin skills as supplementary tools during work.
Skill matrix, priority order, and disabled hook list → AGENT.md 'BOSU 흐름 — 팀장 직접 호출 원칙' 표(스킬은 BOSU 플러그인 — `bosu:` 접두어)

---

## Team Lead Control Flow (ECCC Autonomous Loop)

```
User request
   ↓
Team lead (main Claude — prompt session)
   ├─ Simple task (1–3 files, no new features)
   │     → dispatch agent directly (no meeting)
   └─ Complex task (new features · API · DB · auth, etc.)
         → draft brief plan, then dispatch agents in parallel
              ↓
   E: Agent works in worktree(<project>-<topic>/) + ECC skill assist
   C: Agent self-validates (Check, escalate to team lead after 3 failures)
   C: ecc:e2e-runner functional/flow validation (pass → next stage)
   C: ecc:code-reviewer autonomous dispatch — repeats until 🔴 0 items
              ↓ 🔴 0 items
   Team lead: explicit user approval → feature push → develop merge → push
              ↓
   Remove worktree (autonomous)
              ↓ ⛔ Gate: explicit user approval (Production deploy only)
   Deploy
```

**No direct agent-to-agent communication** — all reports and instructions go through the team lead.
**Worker attribution required**: `[<agent>] task` format. ECC skill calls also use `[<agent> + <skill>]`.

---

## Adding a New Agent

1. Team lead delegates new-agent request to `claude_curator`
2. `claude_curator` reports change proposal + impact scope to team lead
3. Team lead requests user approval (new agents require user approval)
4. After approval, `claude_curator` executes:
   - Create `.claude/agents/<name>.md`
   - Add to `.claude/agents/README.md` index
   - Update `CLAUDE.md` dispatch criteria table
   - Add row to this file's routing table
   - Add to `.claude/rules/ecc_skill_usage.md` ECC matrix if needed

---

## References

- Team lead definition → [AGENT.md](AGENT.md)
- Agent details → BOSU 플러그인 에이전트(`bosu:<이름>`)
- ECC skill matrix → AGENT.md 'BOSU 흐름 — 팀장 직접 호출 원칙' 표(스킬은 BOSU 플러그인 — `bosu:` 접두어)
- ECCC harness → [.claude/workflow/harness_ecc.md](workflow/harness_ecc.md)
- Absolute rules → [CLAUDE.md](../CLAUDE.md)
