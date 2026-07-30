# Git Commit and Branch Rules

**Purpose**: Ensure consistency in commit messages, branch names, and work flows
**Project**: slog
**Last updated**: 2026.07.09

---

## Workflow by Task Scale

### A. Simple changes (text · style · typo · minor UI adjustments)

```
1. Change + commit directly on develop branch
2. Report to user after build/lint passes
3. ⛔ Wait for user approval
4. git push origin develop                 # triggers deploy
```

**Simple change criteria**: 1–3 files or fewer, no new features, unrelated to DB/API/auth, text/color/spacing/layout adjustments only

### B. Feature implementation (new features · API · DB schema · auth, etc.)

```
1. Change + commit on a feature branch
2. git push origin feature/<topic>
3. ⛔ Report task result to user → wait for explicit approval
4. git checkout develop
5. git merge feature/<topic>
6. git push origin develop
```

**Feature implementation criteria**: New routes, components, API endpoints, DB schema, auth flow, etc.

---

- **Step 3 (user approval) must never be automatically bypassed in either A or B**
- `develop` = integration branch (deploy target)
- On conflict: notify user and pause — do not resolve arbitrarily

---

## Multi-Agent Concurrent Work — git worktree

**Principle**: **Always use worktrees** — multiple CLI sessions run simultaneously, so all feature/fix work goes through worktrees regardless of single vs. multiple agents. Switching branches via `git checkout` in the same directory can overwrite another session's work.

### Create worktree (at task start)

```bash
# ⚠️ Always run from the project root (/Users/seongjisu/Documents/project/slog)
# Never run from a subdirectory
cd /Users/seongjisu/Documents/project/slog
git worktree add /Users/seongjisu/Documents/project/slog-<topic> feature/<topic>
cd /Users/seongjisu/Documents/project/slog-<topic>
```

### Remove worktree (after develop merge completes)

```bash
cd /Users/seongjisu/Documents/project/slog   # return to project root
git worktree remove /Users/seongjisu/Documents/project/slog-<topic>
```

### Rules

- **All feature/fix work in worktrees** — no exceptions
- **Sync with `git rebase develop`, not `git merge develop`** — keeps the develop graph linear; avoids stray `Merge branch 'develop' into feature/...` commits
- **Worktree location: `/Users/seongjisu/Documents/project/slog-<topic>`** — same level as the project root (sibling directory)
- **Absolutely forbidden**: creating a worktree inside the project's own path
- **Always run `git worktree add` from the project root** — running from a subdirectory causes path errors
- Main directory is `develop`-only — reserved for merge and push
- develop merge and push are performed from the project root
- The same branch cannot be checked out in two worktrees simultaneously (git enforces this)
- Check worktree list: `git worktree list`

---

## Branch Naming

| Pattern | Purpose | Example |
|---------|---------|---------|
| `main` | Stable deployable branch | `main` |
| `develop` | Integration development | `develop` |
| `feature/<topic>` | New features | `feature/upload-modal` |
| `fix/<topic>` | Bug fixes | `fix/parse-empty-row` |
| `refactor/<topic>` | Code cleanup with no behavior change | `refactor/data-table` |
| `chore/<topic>` | Build, config, dependencies, etc. | `chore/tailwind-config` |
| `docs/<topic>` | Docs only | `docs/plan-v2` |

Rules:
- English lowercase + kebab-case
- No spaces or non-ASCII characters in branch names
- **Abbreviations like `feat/` are forbidden** — use `feature/<topic>` for new features only
- One branch = one topic

> **Note**: The `feat:` type in commit messages follows the Conventional Commits standard and is kept as-is. Branch naming uses `feature/`. These are separate rules.

---

## Commit Messages (Conventional Commits–based)

### Format

```
<type>(<scope>/<agent>): <short summary>

[body — optional]
```

- `<scope>` is the code area — `api`, `ui`, `db`, `claude`, `auth`, etc.
- `<agent>` is the kebab-case name of the agent that made the commit — `ui-developer`, `api-developer`, `claude-curator`, etc.
- Separated by a slash (`/`)
- Human commits **omit** the agent part → `feat(ui): summary`
- Agent-only commit with ambiguous scope → `feat(claude-curator): summary`
- Multiple-agent collaboration uses `+` → `feat(ui/architect+ui-developer): summary`
- Very long multi-contributor commits: one-line summary + detail in body

### Type List

| type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code cleanup with no behavior change |
| `style` | Formatting, semicolons, etc. |
| `docs` | Documentation only |
| `chore` | Build, config, dependencies, etc. |
| `test` | Add or modify tests |
| `init` | Initial setup (one-time) |

### Agent Attribution Rules (Multi-AI Agent Collaboration)

- **Agent-made commits** must include the agent name after the scope slash
- Agent names are **kebab-case**:
  - Allowed values: `ui-developer`, `api-developer`, `db-manager`, `architect`, `analyst`, `claude-curator`, `deploy-agent`, `designer`, `code-reviewer`
- **Human commits** omit the slash + agent part → no slash = human
- **Multi-agent collaboration** uses `+`: `feat(ui/architect+ui-developer): ...`

### Examples

```bash
# Human-only commit (no slash or agent)
feat(ui): add status filter dropdown

# Agent-only commit (code scope + agent)
feat(api/api-developer): implement post CRUD routes

# Agent work with ambiguous code scope (agent only)
chore(claude-curator): update git_convention.md format

# Multi-agent collaboration
feat(auth/architect+ui-developer): implement Google OAuth flow

architect designed the OAuth flow; ui-developer implemented it.

# Analyst only
docs(claude/analyst): draft multi-session collaboration SOP

# Type only (no scope)
docs: fix README typo
```

### `.claude/` Change Scope Rules (for tracking operational assets)

All changes inside the `.claude/` directory use the fixed scope `claude`. After the slash is the agent (or team lead) that made the change.

```bash
# Agent definition update
docs(claude/claude-curator): update ui_developer agent SOP

# New agent added
feat(claude/claude-curator): register build_fixer agent

# Workflow update
refactor(claude/claude-curator): restructure harness_ecc.md ECCC loop

# Rule change
docs(claude/claude-curator): add .claude/ tracking rules to git_convention.md

# Meeting note (team lead direct)
docs(claude): write integration kickoff meeting note

# New skill
feat(claude/claude-curator): register tdd-workflow skill
```

Unified under `claude` scope instead of per-file paths — groups all `.claude/` changes together in changelogs.

### Body Writing Criteria

- Write **why**, not what
- Summary line ≤ 50 chars; wrap body at 72 chars

### Compatibility and Tooling Notes

- Header format follows the Conventional Commits spec (scope slot contains `<scope>/<agent>` as one unit)
- Stats/changelog tools treating `ui/ui-developer`, `ui/architect`, and `ui` as separate groups is a known trade-off
- Future `commitlint` adoption: resolve with scope-enum regex `^[a-z-]+(\/[a-z-]+(\+[a-z-]+)*)?$`

### Blog Content Batch Commits (work-unit rule)

When writing multiple `content/posts/*.md` files for the same source project/series (e.g. all posts derived from one company project's commit history + Redmine), commit them **as a single commit**, not one commit per post.

- **Work-unit = one commit**: "SecureKey 시리즈 29편", "AutoIt 업무 자동화 15편" 등 하나의 조사·도출 작업에서 나온 포스트 묶음은 파일 개수와 무관하게 커밋 1개로 묶는다
- Applies even when multiple parallel sub-agents wrote the individual files — the sub-agents must NOT run `git add`/`git commit` themselves; the orchestrating session stages and commits everything at the end
- A new work-unit (different source project/series) gets its own separate commit — don't merge two unrelated series into one commit either
- Rationale: keeps `git log` readable as "one series = one entry," and makes it trivial to revert/review an entire batch atomically

---

## Absolute Rules

- **Run `git merge` one at a time** — never chain multiple merges with `&&`. The first merge's hook can hold a lock and cause the next merge to conflict.
  ```bash
  # ❌ Forbidden
  git merge fix/a && git merge fix/b
  # ✅ Run in sequence
  git merge fix/a
  git merge fix/b
  ```
- The 6-step **basic workflow** above is the default — bypass only on explicit user instruction
- **No direct commits to `develop`** — all work must start on a `feature/` or `fix/` branch
- **Step 3 (user approval) must never be auto-bypassed** — no merge or push to develop without approval
- Agent commits must **never omit the agent name after the scope slash** (required to distinguish from human commits)
- `--no-verify` is forbidden (no pre-commit hook bypass)
- Direct force push to `develop` is forbidden (report to user and get approval first)
- Never commit secrets — `.env*`, API tokens, JWT secrets (verify `.gitignore`)
- `.claude/settings.local.json` is personal override only — never track with git
- One commit = one topic. Never mix unrelated changes.

---

## On Violation

- Secret exposure detected: immediately rotate keys + consider history rewrite
- Wrongly pushed to main: prefer revert commit; force push is forbidden

---

## References

- [.gitignore](../../.gitignore)
- File naming rules → [claude_naming.md](claude_naming.md)
