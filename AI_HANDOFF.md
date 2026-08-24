# AI Agent Handoff: Service Operations Portal

## Purpose of this file

Read this file before planning, generating, or changing application code.

This file records the decisions made with the project owner, the current technical scope, the required implementation order, and the boundaries that AI agents must preserve.

## Current state

- The minimal TypeScript Next.js application has been initialized with `npm`.
- The responsive Tailwind CSS dashboard shell is implemented with an empty 12-column content grid.
- The sidebar expands as an overlay without resizing page content and contains the approved module routes.
- List-style module prototypes share one searchable table component. Internal Chat has a static two-pane prototype, Marketing has a static content-category grid, and Vault has a static folder-browser prototype.
- The initial SQLite/Drizzle schema is implemented and documented in `DATABASE.md`.
- The canonical resource/action permission vocabulary is implemented in `src/lib/rbac` and documented in `PERMISSIONS.md`.
- The business and RBAC planning document exists separately.
- The first Drizzle migration has been generated and applied locally.
- Database-backed Admin login, protected portal layout, and logout are implemented. The local bootstrap credentials are `admin` / `admin`, stored as a scrypt hash.
- The centralized RBAC engine and server-side permission guard are implemented. It validates the exact session, active user, provider/client scope, user restrictions, user grants, and applicable role permissions on every decision, and audits denials.
- The typed least-privilege role-permission matrix is owner-approved and seeded. The additive seed contains all canonical roles, permission definitions, and initial role-permission relationships.
- Admin Console navigation visibility and direct page access enforce `admin_console:view` through the centralized authorization engine. Admin and CEO/CTO are the only initial roles with that permission.
- Validated read services now exist for users, clients, roles, permission definitions, employee-client assignments, client memberships, user permission overrides, and audit logs. Every public service validates pagination/search input and independently authorizes before database access.
- Admin Console cards link to protected drill-down routes for users, clients, employee assignments, client memberships, roles with exact permissions, user overrides, and audit logs. These views support search and pagination where applicable.
- Admin Console now has protected user and client mutations. Authorized administrators can create internal or client users with a compatible initial role, disable or re-enable users, create and edit client companies, and deactivate or reactivate clients. Every mutation validates its input, re-authorizes in the service layer, derives the audit actor from the server session, and records the successful change transactionally.
- New users intentionally start as `invited` with no password hash. Re-enabling a user without a password restores `invited`, not `active`. Disabling a user invalidates all of that user's sessions immediately, and administrators cannot change their own enabled status.
- Assignment management, role-permission editing, and user grant/restriction mutations remain to be implemented. Their current Admin Console drill-downs are read-only.
- Schema export, linting, and type checks pass.
- The selected direction is one full-stack Next.js application with SQLite.
- Do not implement business module features until the owner starts a later milestone.

## Conversation recap

The project owner runs a service provider that assigns shared employees to several client companies. An employee can serve more than one client. Examples include HR staff, managers, accountants, designers, sales staff, and marketing specialists.

The portal will serve two user groups:

1. Internal users from the service provider.
2. Users from client companies.

The owner first considered a React frontend, a Node.js backend, and SQLite. The technical discussion then selected Next.js for the MVP because Next.js can keep the React interface and Node.js server logic in one application.

The database remains SQLite because the MVP is intended to be lightweight. The design must permit a later move to PostgreSQL without promising an automatic migration.

The access-control requirements are the primary engineering concern. Every page, server operation, and client-specific record must be protected.

## Locked decisions

- Use Next.js with the App Router.
- Use React through Next.js.
- Use Node.js LTS as the server runtime.
- Use SQLite for the MVP database.
- Use Drizzle ORM and generated migrations.
- Use `better-sqlite3` as the planned SQLite driver.
- Use Zod for external input validation.
- Use Tailwind CSS for the application shell and responsive interface styling.
- Use database-backed sessions with secure cookies.
- Use a central project-owned RBAC decision service.
- Use role permissions plus user-specific grants and restrictions.
- A restriction has priority over a grant and a role permission.
- Deny access when no rule explicitly permits it.
- Internal users can access only assigned clients.
- Client users can access only their own company.
- Protect both page routes and server-side operations.
- Use one repository and one deployable application for the MVP.
- Run SQLite on one application instance with persistent local storage.
- Keep business routes skeletal unless the owner explicitly approves a presentation prototype.
- Use TypeScript.
- Use `npm` as the package manager.
- Support both administrator-created accounts and email invitation links.
- Run and deploy the application locally for the initial milestone.
- Allow an internal user to have a different role for each assigned client.
- Do not expose an internal user's roles or assignments for other clients to client users.
- Apply administrator access changes on the next authorization check; do not keep stale permission decisions in a long-lived cache.
- Keep the current dashboard content grid empty until business widgets are approved for a later milestone.
- Treat all current business-module content as presentation-only sample data until database access and RBAC are implemented.
- Restrict Admin Console to internal Admin and CEO/CTO users through centralized authorization when RBAC is implemented.

## Decisions that require owner confirmation

Do not silently decide these items:

1. Whether client administrators can create other client users in the MVP.
2. Production session lifetime and password rules. Authentication currently uses a configurable 12-hour local default and the owner-requested temporary Admin password.

If one of these decisions blocks the current task, ask the owner. If it does not block the task, document the assumption and keep it easy to change.

## Current milestone

Build only the secure MVP foundation:

- Login and logout.
- Internal and client user accounts.
- Client company records.
- Employee-to-client assignments.
- Roles and permissions.
- User grants and restrictions.
- Access administration.
- Central authorization checks.
- Protected page skeletons.
- Audit records.
- Authorization tests.

## Current page routes

Create protected skeletons for:

- Dashboard
- Clients
- CRM
- HRM
- VMS
- BMS
- Vault
- Internal Chat
- Marketing
- Accounts
- Admin Console

Unspecified business routes must show only their page name and basic access-denied handling. Owner-approved static presentation prototypes must not perform persistent business operations before their later milestone.

## Implementation principles

### Keep security decisions centralized

Do not write scattered checks such as `role === "Admin"` inside pages, components, Route Handlers, or database queries.

All authorization decisions must pass through one service with an interface equivalent to:

```text
authorize(userId, clientId, resource, action)
```

The exact function signature can change, but the responsibility must remain centralized.

### Check authorization close to the data

A protected layout or `proxy.ts` check can improve navigation, but it is not the final security boundary.

Each service or data-access operation must verify the session, permission, and client scope before reading or changing protected data.

### Use deny by default

If the session, client assignment, permission definition, or authorization service fails, deny the request.

### Keep modules independent

Pages can depend on services. Services can depend on authorization and data access. Database code must not depend on React components.

### Keep generated and handwritten files separate

- Drizzle migrations are generated and committed.
- Application services are handwritten.
- Permission definitions have one canonical source.
- Do not duplicate permission names in multiple files.

### Make each part testable

Business decisions must live in pure or isolated functions where possible. The RBAC engine must be testable without rendering a page.

## Planned project structure

```text
.
├── README.md
├── AI_HANDOFF.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── drizzle.config.ts
├── .env.example
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (portal)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── crm/page.tsx
│   │   │   ├── hrm/page.tsx
│   │   │   ├── vms/page.tsx
│   │   │   ├── bms/page.tsx
│   │   │   ├── vault/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── marketing/page.tsx
│   │   │   ├── accounts/page.tsx
│   │   │   └── admin/page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       └── auth/
│   │           ├── login/route.ts
│   │           └── logout/route.ts
│   ├── components/
│   │   ├── navigation/
│   │   └── access/
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── clients.ts
│   │   │   ├── assignments.ts
│   │   │   ├── access.ts
│   │   │   ├── sessions.ts
│   │   │   ├── audit.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── password.ts
│   │   │   ├── session.ts
│   │   │   └── require-session.ts
│   │   ├── rbac/
│   │   │   ├── resources.ts
│   │   │   ├── actions.ts
│   │   │   ├── authorize.ts
│   │   │   ├── require-permission.ts
│   │   │   └── types.ts
│   │   ├── validation/
│   │   │   ├── auth.ts
│   │   │   └── access.ts
│   │   └── env.ts
│   ├── services/
│   │   ├── users.ts
│   │   ├── clients.ts
│   │   └── access-control.ts
│   └── proxy.ts
└── tests/
    ├── unit/rbac/
    ├── integration/auth/
    ├── integration/access/
    └── e2e/
```

Do not create empty folders only to match this tree. Add each folder when its first real file is implemented.

## File creation order

### Step 1: Initialize the application

Create:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `.gitignore`
- `.env.example`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

These files must establish the Next.js application, scripts, strict compiler settings, linting, environment-variable names, and minimal root layout.

Do not add page modules or RBAC logic during initialization.

### Step 2: Configure the database

Create:

- `drizzle.config.ts`
- `src/db/index.ts`
- `src/db/schema/users.ts`
- `src/db/schema/clients.ts`
- `src/db/schema/assignments.ts`
- `src/db/schema/access.ts`
- `src/db/schema/sessions.ts`
- `src/db/schema/audit.ts`
- `src/db/schema/index.ts`

These files must define connections, tables, relations, indexes, constraints, and exported schema definitions.

Create the first migration only after the owner reviews the initial schema.

### Step 3: Define the permission vocabulary

Create:

- `src/lib/rbac/resources.ts`
- `src/lib/rbac/actions.ts`
- `src/lib/rbac/types.ts`

These files must contain the canonical resource names, canonical action names, and authorization data types.

No other file should invent resource or action strings.

### Step 4: Implement sessions

Create:

- `src/lib/auth/password.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/require-session.ts`
- `src/lib/validation/auth.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/(auth)/login/page.tsx`

These files must provide password verification, session creation, session lookup, session invalidation, secure cookies, validated login input, and login/logout endpoints.

Do not store authorization state in the browser.

### Step 5: Implement the RBAC engine

Create:

- `src/lib/rbac/authorize.ts`
- `src/lib/rbac/require-permission.ts`
- `tests/unit/rbac/authorize.test.ts`

The authorization engine must evaluate:

1. The current session.
2. The requested client company.
3. The internal assignment or client ownership.
4. A user restriction.
5. A user-specific grant.
6. A role permission.
7. Deny by default.

Test restrictions, grants, missing permissions, wrong-client requests, disabled users, and invalid sessions before building protected pages.

### Step 6: Add services and authorized data access

Create:

- `src/services/users.ts`
- `src/services/clients.ts`
- `src/services/access-control.ts`
- `src/lib/validation/access.ts`

Every public service function must validate its input and call the authorization layer before it accesses protected records.

### Step 7: Add the protected portal shell

Create:

- `src/proxy.ts`
- `src/app/(portal)/layout.tsx`
- shared navigation components
- an access-denied component

`proxy.ts` can perform an early session check. The protected layout must verify the session again. Neither check replaces service-level authorization.

Navigation must hide unavailable pages for usability, but hidden navigation must not be treated as security.

### Step 8: Add the access administration area

Create the access-control administration page and the required server operations.

It must support the current deliverables for:

- User records.
- Client assignments.
- Role permissions.
- User grants.
- User restrictions.

All access changes must create audit records. A user must not change the user's own access.

Current Step 8 progress: user and client-company lifecycle operations are implemented. The remaining write slices are employee-client assignments, client memberships, role-permission relationships, and user grants/restrictions.

### Step 9: Add protected page skeletons

Create one page file for each approved route. Each page must:

1. Verify the session.
2. Verify the page's View permission.
3. Enforce client scope when a client is selected.
4. Render only the page name unless an owner-approved presentation prototype is documented.

### Step 10: Complete authorization tests

Add integration and browser tests for:

- Valid and invalid login.
- Disabled account.
- Correct and incorrect client assignment.
- Every role's starting permissions.
- User grant.
- User restriction.
- Restriction priority.
- Direct page URL access.
- Direct Route Handler access.
- Access-administration restrictions.
- Audit-record creation.

## Initial database model

The initial schema should contain these concepts:

| Concept | Purpose |
| --- | --- |
| `users` | Internal and client identities |
| `clients` | Client companies |
| `client_memberships` | Associates client users with their company and applicable role |
| `employee_client_assignments` | Limits internal users to assigned clients and assigns the role applicable to each client |
| `roles` | Named starting permission groups |
| `permissions` | Resource and action pairs |
| `role_permissions` | Permissions assigned to roles |
| `user_permission_overrides` | Explicit grants and restrictions |
| `sessions` | Server-side login sessions |
| `audit_logs` | Access-policy changes and denied attempts |

Use foreign keys, unique constraints, and indexes. Do not store core relationships as JSON.

## Authorization evaluation order

Use this required behavior:

```text
No valid session                         => DENY
Disabled user                            => DENY
Client outside the user's allowed scope => DENY
Matching user restriction               => DENY
Matching user grant                     => ALLOW
Matching role for the client permission => ALLOW
No matching permission                  => DENY
```

Record important denied requests without storing passwords, session secrets, or unnecessary personal data.
Never return an internal user's assignments or roles for other clients to a client user.

## Next.js-specific rules

- Use Server Components by default.
- Add Client Components only when browser interaction requires them.
- Keep database modules server-only.
- Do not treat `proxy.ts` as the authorization boundary.
- Authenticate and authorize every Server Action.
- Authenticate and authorize every Route Handler.
- Evaluate current access data on every authorization check so administrator changes take effect immediately.
- Do not expose database models directly to Client Components.
- Return only the fields required by the current page.

## Developer-experience rules

- Prefer small files with one clear responsibility.
- Prefer feature services over large utility files.
- Use clear names instead of abbreviations, except approved business module names.
- Add a test with each authorization rule.
- Keep package scripts predictable.
- Keep environment variables documented in `.env.example`.
- Add comments only when they explain a security decision or a non-obvious constraint.
- Do not add Redux, GraphQL, Redis, microservices, or Kubernetes during this milestone.
- Do not add a dependency when a small platform feature is sufficient.
- Do not generate large amounts of placeholder code.
- Update this handoff file when a locked technical decision changes.

## Required agent workflow

For each implementation part:

1. Read `README.md` and this file.
2. Inspect the current repository and existing changes.
3. State the exact part being implemented.
4. Ask only questions that affect that part.
5. Implement the smallest complete vertical change.
6. Add or update tests.
7. Run linting, type checks, and relevant tests.
8. Report changed files, verification results, assumptions, and the next safe part.

Do not start a later step while the current step has unresolved security or schema failures.
