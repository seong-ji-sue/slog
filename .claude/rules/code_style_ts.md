# TypeScript Code Style Rules

**Purpose**: Unify variable and function declaration styles across the project
**Project**: slog
**Last updated**: 2026.07.09
**Scope**: All `.ts` / `.tsx` / `.js` files in this project

---

## Variable Declarations

| Keyword | Use | Notes |
|---------|-----|-------|
| `const` | **Default** | All variables start as `const` |
| `let` | Only when reassignment is actually needed | Loop counters, accumulators, etc. |
| `var` | **Forbidden** | Causes bugs due to hoisting and lack of block scope |

```ts
// ✅ Good
const items = parseInput(file);
let total = 0;
for (const it of items) total += it.size;

// ❌ Bad
var items = parseInput(file);
```

---

## Function Declarations

Rule: **Always use the `function` keyword for function declarations**.

| Location | Usage |
|----------|-------|
| General functions (utilities, route handler bodies, etc.) | `function` declaration |
| React components | `function ComponentName() { ... }` (declaration preferred) |
| Callbacks / event handlers (inline) | Arrow functions allowed |
| `Array.map / filter / reduce` etc. (inline) | Arrow functions allowed |

```ts
// ✅ Good
function extractNumberPrefix(filename: string): number | null {
  const m = filename.match(/^\s*(\d+)[\.\_\-\s]/);
  return m ? Number(m[1]) : null;
}

export default function Page() {
  return <Toolbar onUpload={(f) => handle(f)} />;
}

// ❌ Bad — general utility defined as arrow function
const extractNumberPrefix = (filename: string) => { ... };
```

Reason: `function` declarations have clear names in hoisting and stack traces, and are easier to index for top-level exports and test mocking.

---

## Types

- Maintain TypeScript `strict: true`
- `any` is forbidden — use `unknown` and narrow if unavoidable
- Validate external inputs (forms, HTTP bodies) with zod or similar before narrowing types (requires user approval to add dependency)
- Prefer union literal types over `enum`
  ```ts
  type ReceivedStatus = 'Y' | 'N';
  ```

---

## Constants

- No magic numbers or magic strings
- Define with `const` at the top of the module or in `lib/constants.ts`

```ts
// lib/constants.ts
export const ALLOWED_EXT = ['.xlsx', '.xls', '.ppt', '.pptx', '.doc', '.docx'] as const;
export const FILENAME_PREFIX_RE = /^\s*(\d+)[\.\_\-\s]/;
```

---

## Async

- Use `async/await`. Minimize `.then()` chaining.
- Throw errors with clear messages — no silent catches

```ts
// ✅ Good
try {
  const url = await createSignedUrl(key);
  return Response.redirect(url, 302);
} catch (e) {
  console.error('signed url failed', { key, e });
  return new Response('not found', { status: 404 });
}
```

---

## File Length and Structure

- Prefer files under 300 lines. Extract to `lib/` if exceeded.
- Named exports are preferred. Default exports only for route handlers and page components.

---

## Absolute Restrictions

- `var`
- `eval`, `new Function`
- Using server-only secrets (API keys, JWT secrets, etc.) in client components
- Silent catch (`catch {}`)
- Inline magic regexes or magic numbers

---

## References

- File naming rules → [claude_naming.md](claude_naming.md)
