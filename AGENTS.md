# Agent and Contributor Guide

## Read first

This repository is a security-sensitive Service Operations Portal. Before making a change, read the documents relevant to the work. The documents below are authoritative; this file provides the working rules and does not replace them.

| Document | Use it for |
| --- | --- |
| [README.md](README.md) | Product purpose, MVP scope, setup, and definition of done. |
| [CLAUDE.md](CLAUDE.md) | Cross-agent coding conventions, architecture boundaries, and project command details. |
| [AI_HANDOFF.md](AI_HANDOFF.md) | Current implementation status, locked decisions, implementation boundaries, and owner decisions that require confirmation. Read before planning or changing application code. |
| [DATABASE.md](DATABASE.md) | Schema, database lifecycle, migrations, seed data, and SQLite constraints. Read before database or service changes. |
| [PERMISSIONS.md](PERMISSIONS.md) | Canonical permission vocabulary, RBAC decision order, role matrix, and scope rules. Read before any protected route, server operation, service, or data-access change. |
| [DESIGN.md](DESIGN.md) | Shell, responsive behavior, accessibility, components, and visual language. Read before UI or layout changes. |

If instructions conflict, protect security and owner-approved locked decisions first. Ask the owner before deciding an item explicitly marked as requiring owner confirmation in `AI_HANDOFF.md`.

## Scope and architecture

- The current milestone is the secure MVP foundation. Do not add persistent business-module features or dashboard widgets unless the owner explicitly approves that milestone change.
- Use TypeScript, Next.js App Router, React, Tailwind CSS, Drizzle ORM, SQLite, Zod, and `npm`. Keep the application as one full-stack deployable project.
- Keep presentation, services, authorization, and database responsibilities separate. Pages and components may call services; services own use cases and authorization; database code must not depend on React.
- Reuse existing shared shell, navigation, and presentation components. Do not create a second application shell or duplicate shared table/list behavior.
- Keep generated Drizzle migrations separate from handwritten application code. Commit generated migrations required by schema changes.

## Security rules (non-negotiable)

- Deny access by default. Treat missing, invalid, or failed authorization as a denial.
- Send every authorization decision through the central RBAC service. Never add page-, component-, route-, or query-level checks based on role names such as `role === "Admin"`.
- Protect every page route, Server Action, Route Handler, service, and protected database operation independently. Hidden navigation and protected layouts are usability layers, not security boundaries.
- Validate every external input with the project's Zod validation patterns before use.
- Enforce exact provider/client scope: internal users require an active assignment for the client; client users are limited to their own active membership.
- Use only the canonical permission constants and types from `src/lib/rbac`; never invent permission strings.
- Preserve restriction precedence over grants and role permissions. Do not cache authorization decisions across access changes.
- Derive mutation actors from the server session, never from client input. Audit successful access-policy changes and denied access attempts without recording passwords or session tokens.
- Use soft lifecycle changes for users, clients, assignments, and roles unless an approved design explicitly requires otherwise. Do not weaken audit-history retention.

## Working practices

1. Inspect the relevant code and the documents above before editing. Preserve unrelated user changes in a dirty worktree.
2. Make the smallest cohesive change that satisfies the request; do not refactor unrelated code.
3. Follow existing naming, structure, and validation patterns. Keep canonical definitions in one place rather than duplicating them.
4. Add or update focused tests for changed behavior, especially both allowed and denied authorization paths.
5. Run the narrowest relevant checks, then run `npm run lint`, `npm run typecheck`, and `npm test` when the change warrants it. Report any checks not run or that fail.
6. For database schema changes, generate a Drizzle migration with `npm run db:generate`; do not hand-edit generated migration output unless correcting a reviewed generation issue. Apply locally with the documented migration flow when appropriate.
7. Do not commit secrets, local SQLite databases, session tokens, or production credentials. Keep `.env.example` limited to safe placeholders.

## Commands

```bash
npm install
npm run db:setup
npm run dev
npm run lint
npm run typecheck
npm test
```

The local bootstrap credentials documented in `README.md` are development-only; never treat them as deployable credentials.

## Change handoff

In a handoff or pull request, state the user-visible outcome, files changed, authorization or scope effects, database/migration impact, and the exact verification performed. Call out assumptions, deferred owner decisions, and known limitations.

Follow YAGNI, KISS, and DRY. Build only what the current task needs, pick the simple option, and keep one canonical source for each piece of logic (especially permission names and RBAC rules — see below).

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
