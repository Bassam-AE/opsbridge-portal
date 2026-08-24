# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use simple English in all responses to this project: short sentences, plain words, no jargon unless the codebase itself uses it.

Follow YAGNI, KISS, and DRY. Build only what the current task needs, pick the simple option, and keep one canonical source for each piece of logic (especially permission names and RBAC rules — see below).

## Read first

This is a security-sensitive Service Operations Portal. These docs are authoritative and override default assumptions — read the relevant one before touching related code:

| Document | Read before |
| --- | --- |
| `AGENTS.md` | Any change — working rules and non-negotiable security rules |
| `AI_HANDOFF.md` | Planning or app code changes — implementation status, locked decisions, step order, owner-confirmation items |
| `DATABASE.md` | DB/schema/service changes — schema, migrations, seed data, SQLite constraints |
| `PERMISSIONS.md` | Any protected route/service/data-access change — permission vocabulary, decision order, role matrix |
| `DESIGN.md` | UI/layout changes — shell, responsive rules, components, visual language |

If instructions conflict, protect security and owner-approved locked decisions first. Do not silently decide the two items marked "requires owner confirmation" in `AI_HANDOFF.md` (client-admin user creation; production session/password policy).

## Commands

```bash
npm install
npm run db:setup      # migrate + seed (dev credentials: admin / admin)
npm run dev
npm run lint
npm run typecheck
npm test              # vitest run, whole suite
```

Run a single test file or match:

```bash
npx vitest run tests/unit/rbac/authorize.test.ts
npx vitest run -t "name of test"
```

Database:

```bash
npm run db:generate   # generate a Drizzle migration after schema.ts changes — never hand-edit output
npm run db:migrate
npm run db:seed        # additive/idempotent, safe to rerun
npm run db:studio
```

Always run `npm run lint`, `npm run typecheck`, and the relevant tests before reporting a change done.

## Architecture

Layers, each only depending on the one below it — never skip a layer or duplicate its job elsewhere:

```
routes/components (src/app, src/components)
        -> services (src/services)         use cases, own authorization calls
        -> rbac (src/lib/rbac)             central authorize() decision
        -> db (src/db)                     Drizzle schema + queries, no React
```

- **Authorization is centralized in `src/lib/rbac`.** Every decision is `User + Client scope + Resource + Action` -> allow/deny, in this fixed order: invalid session/disabled user -> deny; invalid scope -> deny; matching restriction -> deny; matching grant -> allow; matching role permission -> allow; else deny. No caching — every check reloads from the DB so admin changes apply immediately.
- Permission keys are `resource:action` (e.g. `clients:view`, `roles:manage_access`). The only valid keys and role matrix live in `src/lib/rbac/resources.ts`, `actions.ts`, `permissions.ts`, `roles.ts`, `role-permission-matrix.ts`, `types.ts`. Never invent a permission string elsewhere — import the constant.
- **Never write a role-name check** like `role === "Admin"` in a page, component, route handler, or query. Always call the central `authorize`/`require-permission` functions in `src/lib/rbac`.
- Authorization must be enforced at every layer independently: page/layout check, Server Action / Route Handler check, and service-level check before the DB query. A hidden nav item or a protected layout is a UX nicety, not a security boundary.
- Two user populations share one `users` table: `internal` (service-provider employees, one provider-wide role, plus one role per assigned client via `employee_client_assignments`) and `client` (one company via `client_memberships`, one role in it). See `DATABASE.md` for the full table map.
- Client-scope rule: an internal user can only act within clients they're actively assigned to; a client user can only act within their own company. A client user must never see another user's cross-client roles or assignments.
- Lifecycle changes (user, client, assignment, role) are soft/status-based, not hard deletes, to preserve audit history. Every successful access-policy write and every denied access attempt is recorded in `audit_logs` (never store passwords or session tokens there).
- Mutation actor identity always comes from the server session, never from client-supplied input. A user cannot change their own role/permissions.
- IDs are app-generated UUID strings; timestamps are UTC ISO-8601 text — both chosen for portability toward a later PostgreSQL migration (see `DATABASE.md`).
- `src/components/shared/searchable-data-table.tsx` is the one canonical list/table component — module pages (Clients, HRM, CRM, VMS, BMS, Accounts) supply data/columns/search text into it rather than rebuilding table shell behavior.
- Current milestone is the secure MVP foundation (auth, RBAC, Admin Console, protected page skeletons). Most business-module pages (CRM, HRM, VMS, BMS, Marketing, Vault, Internal Chat) are intentionally static presentation prototypes — do not wire them to real data or add persistent business features without explicit owner approval.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
