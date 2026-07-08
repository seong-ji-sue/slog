# Rule File Writing Template

**Reference**: Use this template when creating a new rules file
**Location**: `.claude/rules/[rule-name].md`

---

```markdown
# [Rule Name]

**Purpose**: [Why this rule is needed]
**Last updated**: YYYY.MM.DD
**Scope**: [Folder or file pattern]

---

## [Section Name]

- [Rule 1]
- [Rule 2]

## Examples

```ts
// ✅ Good
...

// ❌ Bad
...
```

## Restrictions

- [Absolute restriction 1]
- [Absolute restriction 2]

## On Violation

- [Consequence or response action]

## References

- [Related file links]
```

---

## Writing Checklist

- [ ] `Last updated` date filled in
- [ ] Scope clearly defined (folder / file pattern / language)
- [ ] ✅/❌ examples included where possible
- [ ] Add one line to `.claude/rules/README.md` table
- [ ] Update CLAUDE.md absolute rules / checklist if impacted
