# Permission Definitions

## Status

The canonical permission vocabulary, centralized authorization engine, and owner-approved initial role matrix are implemented in `src/lib/rbac`. All canonical roles, permission definitions, and initial role-permission relationships are seeded in the local database.

Permission names must never be invented in pages, services, or route handlers. All protected operations will use the constants and types defined here.

## Decision input

Every authorization request uses:

```text
User + Client scope + Resource + Action
```

A permission key is represented as `resource:action`, for example:

```text
clients:view
hrm:approve
roles:manage_access
```

The TypeScript permission-key type includes only valid resource/action combinations.

## Canonical actions

| Action | Meaning |
| --- | --- |
| `view` | Read a page or protected record |
| `create` | Create a new protected record |
| `edit` | Change an existing protected record |
| `delete` | Remove, archive, deactivate, or revoke a protected record according to its lifecycle |
| `approve` | Approve a workflow or controlled record |
| `export` | Download or export protected data |
| `manage_access` | Assign or revoke roles, permissions, grants, restrictions, or scope |

`delete` does not require hard deletion. Users, clients, and assignments will normally be disabled or deactivated to preserve audit history.

## Resource scopes

| Scope | Meaning |
| --- | --- |
| `provider` | Service-provider context only; client scope is not used |
| `client` | A valid client ID and assignment or membership are required |
| `contextual` | Can be evaluated in provider context or for one selected client |

## Permission catalog

| Resource | Scope | Valid actions |
| --- | --- | --- |
| Dashboard | Contextual | View |
| Clients | Provider | View, Create, Edit, Delete, Export |
| CRM | Client | View, Create, Edit, Delete, Export |
| HRM | Client | View, Create, Edit, Delete, Approve, Export |
| VMS | Client | View, Create, Edit, Delete, Approve, Export |
| BMS | Client | View, Create, Edit, Delete, Approve, Export |
| Vault | Client | View, Create, Edit, Delete, Export |
| Internal Chat | Provider | View, Create, Edit, Delete |
| Marketing | Client | View, Create, Edit, Delete, Approve, Export |
| Accounts | Client | View, Create, Edit, Delete, Approve, Export |
| Admin Console | Provider | View, Manage Access |
| Users | Contextual | View, Create, Edit, Delete, Manage Access |
| Roles | Provider | View, Create, Edit, Delete, Manage Access |
| Permission Definitions | Provider | View |
| Client Assignments | Provider | View, Create, Edit, Delete, Manage Access |
| User Permission Overrides | Provider | View, Create, Edit, Delete, Manage Access |
| Audit Logs | Provider | View, Export |

Permission definitions are code-owned. The Admin Console manages role-permission relationships and user overrides, but it cannot create arbitrary permission names. It rejects incompatible role audiences and override scopes, protects the current administrator's role and overrides from self-change, and audits successful changes.

## Admin Console rule

The initial role matrix must grant these permissions only to internal Admin and CEO/CTO roles:

- `admin_console:view`
- `admin_console:manage_access`

Access to the Admin Console route, navigation item, data reads, and mutations must all be checked independently through the central authorization service. Client users must never receive these provider-level permissions.

Internal users whose provider role has `admin_console:view` may open a client-module page shell when that same provider role has the module's `view` permission. This keeps all approved Admin and CEO/CTO pages visible without granting unscoped client data access. Services, mutations, exports, and persistent records continue to require the exact client assignment or membership through the normal authorization path. This exception is permission-based and must never be implemented with role-name checks.

## Deny behavior

Authorization will use this order:

```text
Invalid session or disabled user          => DENY
Invalid provider/client scope             => DENY
Matching user restriction                 => DENY
Matching user grant                       => ALLOW
Matching applicable role permission       => ALLOW
No matching permission                    => DENY
Invalid permission definition or failure  => DENY
```

The current scope rules are:

- Client-company accounts can receive permissions only for Dashboard, CRM, HRM, VMS, Vault, and Accounts. This audience boundary is checked before grants or role permissions, so stale incompatible relationships remain denied.
- Provider resources require an active internal user and no client ID.
- Client resources require an active client plus an active internal assignment or client membership for that exact client.
- Contextual resources use the provider role when no client is selected and the applicable assignment or membership role when a client is selected.
- User overrides with a null `client_id` apply to provider context. A client-specific override applies only to that exact client.
- Every decision reloads sessions, assignments, overrides, and role permissions from the database so access changes take effect immediately.
- Denied decisions are written to the audit log without session tokens or passwords. An invalid/nonexistent client identifier is retained only as an audit target so it cannot violate the client foreign key.

## Approved initial role matrix

The owner-approved least-privilege matrix is defined in `src/lib/rbac/role-permission-matrix.ts` and seeded for live authorization decisions.

All internal client-module permissions below still require an active assignment to the selected client. Client Owner and Client Employee permissions work only inside their own active company membership. The Owner's Users permissions are limited by the company-user service to listing and creating invited Employees in that same company.

| Role | Proposed starting access |
| --- | --- |
| CEO/CTO | Entire permission catalog, limited by valid provider and assigned-client scope |
| Admin | Entire permission catalog, limited by valid provider and assigned-client scope |
| Key Account Manager | Client records view/edit/export; CRM create/edit/export; view all assigned-client modules; internal chat |
| Company Secretary | Client view; BMS create/edit/approve/export; Vault create/edit/export; internal chat |
| CA | Client view; Accounts create/edit/approve/export; Vault create/edit/export; internal chat |
| Accountant | Client view; Accounts create/edit/export; Vault create/edit; internal chat |
| Designer | Client view; Marketing create/edit/export; Vault create/edit; internal chat |
| SME | View all assigned-client modules; internal chat; no approval, deletion, or export by default |
| Sales | Client and CRM create/edit/export; Marketing view; internal chat |
| Client Owner | Dashboard view; full operational actions for CRM, HRM, VMS, Vault, and Accounts; view and create invited Employees in the owner's own company |
| Client Employee | Read-only access to Dashboard, CRM, HRM, VMS, Vault, and Accounts in the employee's own company |

Only CEO/CTO and Admin receive Admin Console or `manage_access` permissions. Non-executive internal roles receive no deletion permission in this draft. Client Owner can delete records in the approved operational modules and create invited Employees within the owner's own company, but cannot access the Clients page, BMS, Marketing, Internal Chat, or provider administration.

The matrix was approved as documented. Future changes must be made through authorized access administration and audited; rerunning the initial seed only inserts missing relationships and does not remove later administrative changes.
