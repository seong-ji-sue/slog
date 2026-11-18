# File Naming Rules

**Purpose**: Consistent naming for files and folders
**Project**: slog
**Last updated**: 2026.07.09

---

## File Naming Rules

| Type | Rule | Example |
|------|------|---------|
| Markdown (general) | lowercase + snake_case | `git_convention.md`, `code_style.md` |
| Markdown (folder index) | `README.md` (fixed uppercase) | `README.md` |
| Markdown (ops guide) | `CLAUDE.md` (fixed uppercase) | `CLAUDE.md` |
| Markdown (human-facing) | `README.md` | This project only |
| TS/TSX components | PascalCase | `PostCard.tsx`, `ChatStream.tsx` |
| TS utilities / libraries | snake_case or lowercase | `api.ts`, `auth.ts`, `utils.ts` |
| Hooks | camelCase + `use` prefix | `usePostFeed.ts` |
| Route handler | `route.ts` (App Router fixed) | `app/api/auth/[...nextauth]/route.ts` |
| Python modules | lowercase + snake_case | `rag.py`, `db.py`, `auth_service.py` |
| JSON | lowercase | `package.json`, `tsconfig.json` |
| Shell | lowercase + snake_case | `start.sh` |

---

## Folder Naming Rules

| Type | Rule | Example |
|------|------|---------|
| Web route segments | kebab-case | `upload-excel/`, `export-missing/` |
| Dynamic segments | `[param]` | `download/[key]/` |
| Component groups | lowercase or PascalCase | `components/`, `components/ui/` |
| Libraries | lowercase | `lib/` |
| Claude operations | `.claude/<rule\|agents\|template\|...>` | Location of this file |

---

## Reference Paths

```markdown
# Same folder
[file](file.md)

# Parent folder
[CLAUDE.md](../../CLAUDE.md)

# From root
[CLAUDE.md](../../CLAUDE.md)
```

---

## Prohibited

- ❌ Arbitrary uppercase filenames (e.g., `API.md`) — only `README.md` / `CLAUDE.md` are exceptions
- ❌ Filenames with spaces
- ❌ PascalCase outside of components
- ❌ `.tsx` file with no component export — use `.ts` instead

---

## References

- File content rules → [claude_file.md](claude_file.md)
- Folder structure → 일감 명세(`bosu-output/tasks/<task_id>/` — PRD · Plan)
