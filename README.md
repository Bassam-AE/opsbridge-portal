# Service Operations Portal

## Project status

The minimal TypeScript Next.js application and responsive Tailwind CSS dashboard shell have been initialized with `npm`. Current business-module routes remain presentation prototypes. Admin Console provides navigable, searchable, paginated database views for users, clients, assignments, memberships, roles and their exact permissions, user overrides, and audit logs through validated, independently authorized services. Authorized administrators can now create internal or client users with an initial role, disable or re-enable users, and create, edit, deactivate, or reactivate client companies.

## Local setup and login

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000/login` and use the temporary local credentials:

```text
Username: admin
Password: admin
```

The seed stores a scrypt password hash and does not reset an existing Admin password when rerun. These credentials are intentionally development-only and must be replaced before any shared or production deployment.

The current milestone is a secure MVP foundation. It will provide login, client-scoped role-based access control, access administration, and protected page skeletons.

The canonical resource/action permission catalog and approved least-privilege role matrix are documented in `PERMISSIONS.md` and seeded in the local database. Admin Console visibility and direct-route access require `admin_console:view`; its user, client, role, permission, assignment, override, and audit reads each enforce their own resource permission again before querying SQLite.

Admin Console writes use protected Server Actions and independently authorized service functions. User creation and role assignment occur in one transaction, client lifecycle changes are soft changes, every successful write creates an audit event, and disabling a user invalidates that user's sessions immediately. Newly created users have `invited` status and cannot sign in until the invitation/password-setup workflow is implemented.

## Project purpose

The portal will provide one application for the service provider's employees and its client companies.

An internal employee can serve more than one client company. The system must limit that employee to assigned clients. A client user must be limited to the user's own company.

The complete product can later contain operational tools and workflows for client management, HR, vendors, accounts, marketing, documents, communication, requests, and progress tracking.

## Current deliverables

The current milestone must deliver:

1. Login and logout for internal users and client users.
2. User, client company, and employee-to-client assignment records.
3. Roles and granular permissions.
4. Role permission management by authorized administrators.
5. User-specific permission grants and restrictions.
6. Client-scope enforcement for every protected operation.
7. Protected page routes and protected server operations.
8. Access administration for users, roles, permissions, and assignments.
9. Audit records for access changes and denied access attempts.
10. Page skeletons that show only the page name, except for explicitly approved static presentation prototypes.
11. Automated tests for allowed and denied access paths.

## MVP page skeletons

The current milestone will create protected skeletons for:

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

These routes will not contain persistent business module operations in the current milestone. Their current content is owner-approved static presentation only.

## Access-control rules

The authorization decision uses four inputs:

```text
User + Client company + Resource + Action
```

The standard actions are:

- View
- Create
- Edit
- Delete
- Approve
- Export
- Manage Access

The following rules are mandatory:

- A user receives the normal permissions of the role applicable to the current client scope.
- An authorized administrator can add a user-specific grant.
- An authorized administrator can add a user-specific restriction.
- A restriction has priority over a grant and a role permission.
- An internal user can access only assigned client companies.
- A client user can access only the user's own company.
- Missing permission means denied access.
- Every page request, server mutation, Route Handler, and database operation must enforce authorization.
- Hiding a button or menu item is not an authorization check.
- A user must not change the user's own role or permissions.
- The system must record access-policy changes.
- A client user must never receive information about an internal user's assignments or roles for other clients.
- Administrator access changes must affect the next authorization decision without stale permission caching.
- Admin Console is restricted to internal Admin and CEO/CTO users; hiding its navigation item does not replace direct-route and server-operation authorization.

## Recommended technology stack

| Area | Technology |
| --- | --- |
| Application framework | Next.js with the App Router |
| Interface | React through Next.js with Tailwind CSS |
| Server runtime | Node.js LTS |
| Language | TypeScript |
| Database | SQLite |
| Database layer | Drizzle ORM |
| SQLite driver | `better-sqlite3` |
| Validation | Zod |
| Authentication | Database-backed sessions and secure cookies |
| Authorization | Central project-owned RBAC service |
| Unit and integration tests | Vitest |
| Browser tests | Playwright |
| Deployment | Local Node.js instance with persistent storage for the initial milestone |

## Technical architecture

The application will use these layers:

1. **Routes and components** render pages and collect user input.
2. **Authentication** identifies the current user and manages sessions.
3. **Authorization** decides whether the user can perform an action for a client company.
4. **Services** implement application use cases.
5. **Data access** performs authorized database queries.
6. **Database** stores users, clients, assignments, roles, permissions, sessions, and audit records.

Authorization rules must stay in one central service. Page components and database functions must not contain scattered role-name checks.

## Planned source structure

```text
src/
  app/
    (auth)/
    (portal)/
    api/
  components/
  db/
    schema/
    migrations/
  lib/
    auth/
    rbac/
    validation/
  services/
  proxy.ts
tests/
  unit/
  integration/
  e2e/
```

The detailed file order and the responsibility of each file are defined in `AI_HANDOFF.md`.

## SQLite conditions

The MVP must use one application instance and one persistent local disk. The SQLite file must not be stored on a temporary or network filesystem.

Database migrations must be used from the first schema change. The schema should use portable types and avoid unnecessary SQLite-specific behavior. This will reduce the work required for a later PostgreSQL migration.

## Definition of done

The current milestone is complete when:

- A user can log in and log out.
- An internal user can access only assigned clients.
- A client user can access only the user's own company.
- Role permissions work for every defined resource and action.
- User grants and restrictions work, and restrictions have priority.
- An authorized administrator can manage access.
- Every page and server operation denies access by default.
- Direct URL and direct endpoint access cannot bypass authorization.
- All listed page skeletons exist.
- Automated access tests pass.
- Access changes and denied requests are recorded.

## Confirmed implementation decisions

- Use TypeScript and `npm`.
- Support both administrator-created accounts and email invitation links.
- Run and deploy the initial milestone locally.
- Allow an internal user to have a different role for each assigned client.
- Keep an internal user's roles and assignments for other clients hidden from client users.
- Make administrator access changes effective on the next authorization check without stale permission caching.

## Open decisions

The following decisions remain open and can be resolved before their implementation step:

1. Whether client administrators can create other client users in the MVP.
2. Production session lifetime and password rules. The local authentication slice currently uses a configurable 12-hour session and the explicitly requested temporary `admin` password.
