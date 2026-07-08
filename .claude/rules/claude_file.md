# File Content Rules

**Purpose**: Define role and content standards for each file type
**Project**: slog
**Last updated**: 2026.07.09

---

## Principles

- Files contain **only content that belongs to their role**
- Content already existing in another file is **replaced with a link**
- No duplication — one place to update when something changes

---

## Content Standards by File Type

### `.claude/structures/project.md` (single source of truth)
**Include**: Folder structure, feature spec, user flow, API design, development phases, environment config, implementation status
**Exclude**: Human setup guide (README.md), Claude operational rules (CLAUDE.md)

### `README.md` (human-facing)
**Include**: One-line description, stack, prerequisites, setup/run, usage, deployment, folder structure summary
**Exclude**: Internal rules (`.claude/rules/`), detailed spec (`structures/project.md`)

### `CLAUDE.md`
**Include**: Absolute rules, key reference links, agent dispatch criteria
**Exclude**: Folder structure details (`structures/project.md`), rule body text (`rules/*.md`)

### `.claude/rules/*.md`
**Include**: Purpose, items, examples, prohibitions, and references for that rule
**Exclude**: Other rule body text (link instead)

### `.claude/agents/*.md`
**Include**: name/description/tools frontmatter, Role / Context / Critical Constraints / SOP / Success Metrics / Interaction Rules
**Exclude**: General code rule body text (link to `rules/*.md`)

---

## Link vs Inline Criteria

| Situation | Action |
|-----------|--------|
| Same content exists in another file | Link |
| A 1–3 line summary is sufficient | Inline + link |
| Core content of this file | Inline |
| Full procedure from another file | Link only |

---

## New File Checklist

- [ ] Verify file naming rules → [claude_naming.md](claude_naming.md)
- [ ] Confirm the content is not already in another file
- [ ] Add one line to the folder's `README.md`
- [ ] Add link to parent `CLAUDE.md` if needed

---

## Adding a New Rule

- [ ] Use `.claude/template/rule_template.md` format
- [ ] Add one line to `.claude/rules/README.md`
- [ ] Update CLAUDE.md absolute rules / dispatch criteria if impacted

---

## Adding a New Agent

- [ ] Use `.claude/template/agent_template.md` format
- [ ] Update table and dispatch criteria in `.claude/agents/README.md`
- [ ] Add row to agent dispatch criteria table in `CLAUDE.md`

---

## Absolute Rules

- No new md file creation without user approval
- When the same content exists in both `structures/project.md` and elsewhere, update both simultaneously — having the same fact in two places creates a sync obligation
- Secrets (API keys, service roles) must never be written in plain text in any md file
