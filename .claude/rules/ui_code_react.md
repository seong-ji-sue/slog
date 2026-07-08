# UI Code Rules (React SPA)

**Purpose**: Project-specific UI constraints for a React single-page app (ECC skills handle general React best practices)
**Project**: slog
**Last updated**: 2026.07.09
**Scope**: `src/`, `src/components/`

**ECC skill references** (call before working):
- `vercel:react-best-practices` — React code quality
- `ecc:frontend-patterns` — frontend architecture
- `ecc:vite-patterns` — Vite build/dev patterns
- `ecc:accessibility` — accessibility

---

## Project Rules

### Component Classification

| Location | Type | Example |
|----------|------|---------|
| `src/pages/` or `src/routes/` | Route-level views | Home, detail, admin |
| `src/components/` | Domain components | `PostCard`, `PostFeed`, `AdminTable` |
| `src/components/ui/` | Shared primitives | `Button`, `Dialog`, `Badge` |
| `src/lib/` | Non-React utilities | `api.ts`, `auth.ts`, `utils.ts` |
| `src/hooks/` | Custom hooks | `usePostFeed.ts` |

### Component Patterns

- Function components only. No class components.
- Co-locate component-specific styles/types with the component.
- Keep components focused; extract logic into custom hooks (`useXxx`).
- Lift shared state to the nearest common ancestor or a state store; avoid prop drilling beyond 2–3 levels.

### Data Fetching

- Use a data layer in `src/lib/api.ts` — components call typed functions, not raw `fetch` inline.
- Prefer a caching/query library (e.g., TanStack Query) for server state when the app grows (propose to user before adding a dependency).

### Empty / Loading / Error States

| State | Handling |
|-------|---------|
| No data | Empty state message |
| Loading | Skeleton or spinner |
| API error | Toast / inline error |
| Network error | User message + retry button |
| Streaming | Typing animation + Send button disabled |

### Styling

- Use the project's chosen styling approach (Tailwind / CSS modules) consistently.
- No inline styles (`style={{ color: 'red' }}`) for static styling — use classes.
- Use design tokens / CSS variables for colors rather than hardcoded hex values.

### Routing

- Use a single router setup (e.g., React Router) at the app root.
- Route segments in kebab-case; keep route components thin (delegate to domain components).

### Absolute Restrictions

- `dangerouslySetInnerHTML` (unless explicitly required and sanitized)
- Inline styles for static styling — use classes
- Importing server-only secrets into client bundle (anything shipped to the browser is public)
- Using emojis without explicit user request

---

## References

- Code style → [code_style_ts.md](code_style_ts.md)
- Feature spec → [../structures/project.md](../structures/project.md)
