# API Code Rules (Node / Express)

**Purpose**: Project-specific API constraints for a Node.js / Express backend (ECC skills handle general Node best practices)
**Project**: slog
**Last updated**: 2026.07.09
**Scope**: `server/`, `src/routes/`, `src/controllers/`

**ECC skill references** (call before working):
- `ecc:backend-patterns` — backend architecture patterns
- `ecc:api-design` — REST API design
- `ecc:error-handling` — error handling patterns

---

## Project Rules

### Structure

- Layered structure: `routes/` (wiring) → `controllers/` (HTTP) → `services/` (business logic) → data layer.
- One router per resource (`routes/posts.ts`); mount on the app with a base path.
- Keep controllers thin; put business logic in services.

```ts
// routes/posts.ts
import { Router } from 'express';
import * as posts from '../controllers/posts';

const router = Router();
router.get('/', posts.list);
router.post('/', posts.create);
export default router;
```

### Validation

- Validate every request body / query / params with a schema validator (e.g., zod) before use — no trusting raw `req.body`.
- Return `400` with a clear message on validation failure.

```ts
const CreatePost = z.object({ title: z.string().min(1) });

export async function create(req: Request, res: Response) {
  const parsed = CreatePost.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid body' });
  const post = await postService.create(parsed.data);
  res.status(201).json(post);
}
```

### Async and Error Handling

- Use `async/await`. Wrap async route handlers so rejected promises reach the error middleware (use a wrapper or `express-async-errors`).
- Centralized error-handling middleware; never `catch {}` silently.
- Log errors with context; map known errors to status codes.

### Responses (allowlist by default)

- Shape responses explicitly — pick the fields to return, never spread a raw DB row.
- Sensitive fields (password hashes, tokens, internal flags) are never serialized.

### Environment Variables

- Load all secrets via `process.env`; validate required vars at startup.
- Use `dotenv` for local `.env`. Hardcoding secrets is forbidden.

### Security Baseline

- Use `helmet`, configure CORS explicitly, and rate-limit public endpoints.
- Use parameterized queries / an ORM — never string-concatenate SQL.

### Absolute Restrictions

- Hardcoded secrets
- Unvalidated `req.body` / `req.query` reaching the data layer
- Silent catch (`catch {}`)
- String-concatenated SQL
- Spreading raw DB rows into responses

---

## References

- Code style → [code_style_ts.md](code_style_ts.md)
- Feature spec → [../structures/project.md](../structures/project.md)
