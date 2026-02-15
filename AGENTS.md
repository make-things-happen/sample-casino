# Agent Guidelines for WOMO Repository

This document provides guidelines for AI agents operating within the WOMO monorepo. Adhering to these conventions ensures consistency, maintainability, and high code quality.

## 1. Quick Reference

```bash
bun install                        # Install dependencies
bun run dev                        # Start all dev servers (web:3000, shortlink:3001, sample-casino:3003)
bun run build                      # Build all apps (or: turbo build)
bunx --bun biome check --write     # Lint & format (runs automatically on pre-commit via lefthook)
bun run typecheck                  # Type check (run from specific app, e.g. apps/web)
bun run db:generate                # Generate Drizzle migrations
bun run db:migrate                 # Run migrations
bun run db:studio                  # Open Drizzle Studio
bun run db:seed                    # Seed database
```

Run workspace-specific tasks: `turbo run <command> --filter=<workspace>`

## 2. Architecture

Turborepo monorepo with Bun. Two apps, five shared packages:

| App/Package | Purpose |
|---|---|
| `apps/web` | Main Next.js 16 app (App Router) — admin, operator, affiliate dashboards |
| `apps/shortlink` | Link shortening & click tracking service |
| `@workspace/api` | tRPC 11 routers (admin/, operator/, affiliate/, commons/) |
| `@workspace/auth` | Better Auth — roles: User, Admin, Affiliate, Operator |
| `@workspace/db` | Drizzle ORM + PostgreSQL (Neon), schema in `packages/db/schema/` |
| `@workspace/commons` | Shared constants and utilities |
| `@workspace/ui` | Shared UI components (Radix + Base UI + Tailwind 4) |

## 3. Code Style

- **Formatter:** Biome (2 spaces, double quotes). Just run `bunx --bun biome check --write`.
- **Naming:** `camelCase` vars/functions, `PascalCase` components/types, `SCREAMING_SNAKE_CASE` constants, `kebab-case` filenames.
- **Imports:** Group: node builtins → external → `@workspace/*` → `~/` absolute → `./` relative. Prefer named imports.
- **TypeScript:** Explicit types everywhere. Avoid `any`, use `unknown` + narrowing.
- **React:** Functional components with hooks. Use tRPC for all API calls.
- **Validation:** Zod schemas.

## 4. Key Paths (apps/web)

```
app/(fullscreen)/     # Auth pages (login, signup, etc.)
app/admin/            # Admin dashboard
app/affiliate/        # Affiliate dashboard
app/operator/         # Operator dashboard (affiliates, finance, offers, tracking-links)
app/api/auth/         # Better Auth routes
app/api/trpc/         # tRPC endpoint
app/api/postback/     # Postback tracking API
app/docs/             # Fumadocs documentation pages
components/           # App-specific components
```

## 5. Database

PostgreSQL via Drizzle ORM (Neon). Schema files in `packages/db/schema/`:
- `auth-*.ts` — users, sessions, accounts, organizations
- `womo-*.ts` — affiliates, operators, offers, links, clicks, conversions, players, payouts, ledger, balances
- `_womo-*-agg.ts` — aggregation tables

Dev DB: `postgres://postgres:xxxxxxxx@db.localtest.me:5432/main`

### Two Database Drivers

We use two Neon database drivers, defined in `packages/db/db.ts`:

| Driver | Factory | Type | Use case |
|--------|---------|------|----------|
| **Neon HTTP** | `createDbHttpInstance()` | `DrizzlePg` | Default for all reads and simple writes. Stateless, one-shot queries. **Does NOT support `db.transaction()`.** |
| **node-postgres (WS)** | `createDbWsInstance()` | `DrizzlePgWs` | Persistent connection with full transaction support. Use this when you need `db.transaction()`. |

- The tRPC context (`ctx.db`) always uses the **HTTP driver** (`createDbHttpInstance()`).
- When a mutation needs transactions, create a WS instance **inside the procedure**: `const dbWs = createDbWsInstance();` and use `dbWs.transaction(...)`.
- For simple delete + insert patterns where atomicity is not critical, prefer running sequential queries on `ctx.db` (HTTP) instead of spinning up a WS connection.
- The `DrizzlePgInstance` union type (exported from `packages/db`) accepts either driver — use it for shared service functions that may receive either.

**IMPORTANT: ALWAYS ask the user for confirmation before generating or applying database migrations.** Never run `drizzle-kit generate` or `drizzle-kit migrate` without explicit approval. Migrations are destructive and irreversible — confirm intent first.

**IMPORTANT: Database changes MUST always be committed atomically in their own dedicated commit.** Every change to `packages/db/schema/` files or `packages/db/drizzle/` migration files must be in a separate commit — never mixed with application code (API routes, UI components, etc.). This applies regardless of how small the change is. Database changes are always the **first** commit, then commit the API/UI code that uses them afterward. This keeps DB changes isolated, makes rollbacks safer, and keeps the git history clean.

## 6. Environment

Required env vars (see `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`

## 7. Deployment

- Vercel (web app), Neon (PostgreSQL), Upstash (Redis)
- Branches: `master` (prod), `staging`, `dev`
- GitHub Actions runs migrations on push to these branches

## 8. Branching

**NEVER commit or push directly to `master`, `dev`, or `staging`.** These are protected deployment branches. Always create a new feature branch off the current branch before committing. Use descriptive branch names following the pattern `<type>/<short-description>` (e.g., `feat/affiliate-payout-dashboard`, `fix/auth-session-expiry`, `chore/update-deps`). When work is ready, open a pull request to merge into the target branch.

## 9. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). Format: `<type>(<optional scope>): <description>`

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`

Examples:
- `feat: add affiliate payout dashboard`
- `fix(auth): resolve session expiry on token refresh`
- `chore: update dependencies`

Never add a `Co-Authored-By` trailer to commits.

## 10. Drizzle Query Style

Always prefer Drizzle's built-in operators (`eq`, `and`, `or`, `gt`, `gte`, `lt`, `lte`, `between`, `like`, `inArray`, `isNull`, `not`, `sum`, `count`, `avg`, `min`, `max`, `desc`, `asc`, etc.) over raw `sql\`\`` template literals. This includes CTEs (`db.$with()` / `db.with()`), subqueries (`.as()`), set operations (`union`, `intersect`, `except`), and all join types. Only use the `sql\`\`` syntax when dealing with complex expressions that are genuinely not supported by the Drizzle query builder (e.g., `CASE WHEN`, window functions, complex casts, or DB-specific functions).

## 11. Comments

- **Never write obvious comments** that just restate what the code does (e.g., `/** Get the offer */`, `// increment counter`). The code itself should be readable enough.
- **Comments should answer "why"**, not "what". Explain the reasoning behind a decision, a non-obvious constraint, or a workaround.
- **Complex logic deserves comments.** If a block involves a subtle algorithm, a tricky edge case, or an unintuitive approach, explain the intent so the next reader doesn't have to reverse-engineer it.
- **Keep comments concise.** One or two sentences max. If you need more, the code should probably be refactored.

## 12. Documentation

Operator-facing documentation lives in `apps/web/content/docs/` as MDX files (Fumadocs). When making significant changes to operator-facing features, update the relevant docs pages:

- **New feature** → Create a new MDX page and add it to `content/docs/meta.json`
- **Changed behavior** → Update the existing docs page that covers the feature
- **New terms** → Add definitions to `content/docs/glossary.mdx`

Documentation pages follow this frontmatter schema:
```yaml
---
title: Page Title
description: Short description for navigation and SEO.
---
```

Supported components: `<Callout type="info|warn|error">` from fumadocs-ui. Cross-link pages with `[text](/docs/page-name)`.

## 13. No Tests Yet

No testing framework is configured. No test files exist in the codebase.
