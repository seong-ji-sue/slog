# Agent Writing Template

**Reference**: Use this template when creating a new agent
**Location**: `.claude/agents/[agent-name].md`

---

```markdown
---
name: [agent-name]
description: [Dispatch condition — be specific, e.g. "when ~", "on ~ request"]
model: sonnet
tools:
  - Read
  - Edit
  - Bash
---

## Role
[One-line role definition]

## Identity
- **이름·직책**: [Name · Title]
- **경력**: [Years. Domain expertise. 1–2 lines of representative experience]
- **강점**: [3–4 core competencies, comma-separated]
- **스타일**: [Communication style, personality, work pattern]
- **철학**: ["One-line motto — wrap in double quotes"]
- **회사 내 위치**: [Reporting line, collaboration style, when this agent is deployed]

## Context
[Background and reference files this agent needs to know]
- Feature spec: [../structures/project.md](../structures/project.md)
- Relevant rules: [../rules/<relevant-rule>.md](../rules/<relevant-rule>.md)

## Critical Constraints
- [Absolute restriction 1]
- [Absolute restriction 2]

## SOP
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Success Metrics
- [Success criterion 1]
- [Success criterion 2]

## Hooks & Skills
<!-- List hooks and ECC skills this agent uses -->
- **Hooks**: (e.g., PostToolUse(Edit|Write) → ts_check.sh)
- **Skills**: (e.g., vercel:nextjs, ecc:frontend-patterns)

## Interaction Rules
- Explain implementation direction before starting; wait for approval
- Ask rather than assume on uncertain items
```

---

## Writing Checklist

- [ ] description includes user utterance patterns (e.g., "add it", "fix it")
- [ ] tools list only what is actually needed — no unnecessary permissions
- [ ] Critical Constraints reflects absolute rules from CLAUDE.md / structures/project.md
- [ ] Add one line to `.claude/agents/README.md` table
- [ ] Add one line to agent dispatch criteria table in `CLAUDE.md`
