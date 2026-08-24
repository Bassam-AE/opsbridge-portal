import { AdminConsolePlaceholder } from "@/components/admin/admin-console-placeholder";
import { AccessDenied } from "@/components/access/access-denied";
import { ACTIONS } from "@/lib/rbac/actions";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  listAuditLogs,
  listClientAssignments,
  listClientMemberships,
  listPermissionDefinitions,
  listRoles,
  listUserPermissionOverrides,
} from "@/services/access-control";
import { listClients } from "@/services/clients";
import { listUsers } from "@/services/users";

export default async function AdminConsolePage() {
  let sessionId: string;

  try {
    const access = await requirePermission({
      clientId: null,
      resource: RESOURCES.ADMIN_CONSOLE,
      action: ACTIONS.VIEW,
    });
    sessionId = access.session.id;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return (
        <AccessDenied description="Admin Console is available only to authorized Admin and CEO/CTO users." />
      );
    }

    throw error;
  }

  const listInput = { sessionId, search: "", limit: 1, offset: 0 };
  const logInput = { sessionId, limit: 1, offset: 0 };
  let results: [
    Awaited<ReturnType<typeof listUsers>>,
    Awaited<ReturnType<typeof listClients>>,
    Awaited<ReturnType<typeof listClientAssignments>>,
    Awaited<ReturnType<typeof listClientMemberships>>,
    Awaited<ReturnType<typeof listRoles>>,
    Awaited<ReturnType<typeof listPermissionDefinitions>>,
    Awaited<ReturnType<typeof listUserPermissionOverrides>>,
    Awaited<ReturnType<typeof listAuditLogs>>,
  ];

  try {
    results = await Promise.all([
      listUsers(listInput),
      listClients(listInput),
      listClientAssignments(listInput),
      listClientMemberships(listInput),
      listRoles(listInput),
      listPermissionDefinitions(listInput),
      listUserPermissionOverrides(logInput),
      listAuditLogs(logInput),
    ]);
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return (
        <AccessDenied description="You do not have all permissions required to view administration data." />
      );
    }

    throw error;
  }

  const [
    userResult,
    clientResult,
    assignmentResult,
    membershipResult,
    roleResult,
    permissionResult,
    overrideResult,
    auditResult,
  ] = results;

  return (
    <AdminConsolePlaceholder
      statistics={{
        users: userResult.total,
        clients: clientResult.total,
        employeeAssignments: assignmentResult.total,
        clientMemberships: membershipResult.total,
        roles: roleResult.total,
        permissions: permissionResult.total,
        permissionOverrides: overrideResult.total,
        auditLogs: auditResult.total,
      }}
    />
  );
}
