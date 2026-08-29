import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  clientMemberships,
  clients,
  employeeClientAssignments,
  roles,
  users,
} from "@/db/schema";
import { ACTIONS, type Action } from "@/lib/rbac/actions";
import { requirePermissionForSession } from "@/lib/rbac/require-permission";
import { RESOURCES } from "@/lib/rbac/resources";
import {
  createClientMembershipInputSchema,
  createEmployeeAssignmentInputSchema,
  setClientMembershipStatusInputSchema,
  setEmployeeAssignmentStatusInputSchema,
  updateClientMembershipInputSchema,
  updateEmployeeAssignmentInputSchema,
} from "@/lib/validation/assignments";
import {
  isUniqueConstraintError,
  ServiceMutationError,
} from "@/services/errors";
import { requireAuthorizedServiceActor } from "@/services/security";

async function authorizeAssignmentChange(
  sessionId: string,
  action: Action,
): Promise<string> {
  const actorUserId = await requireAuthorizedServiceActor(sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENT_ASSIGNMENTS,
    action,
  });
  await requirePermissionForSession(sessionId, {
    clientId: null,
    resource: RESOURCES.CLIENT_ASSIGNMENTS,
    action: ACTIONS.MANAGE_ACCESS,
  });
  return actorUserId;
}

async function validateAssignmentRelationships({
  actorUserId,
  userId,
  clientId,
  roleId,
  accountType,
}: {
  actorUserId: string;
  userId: string;
  clientId: string;
  roleId: string;
  accountType: "internal" | "client";
}) {
  if (actorUserId === userId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot change your own client access.",
    );
  }

  const [[user], [client], [role]] = await Promise.all([
    db
      .select({ id: users.id, accountType: users.accountType, status: users.status })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ id: clients.id, status: clients.status })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1),
    db
      .select({ id: roles.id, audience: roles.audience })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1),
  ]);

  if (!user || user.accountType !== accountType || user.status === "disabled") {
    throw new ServiceMutationError(
      "invalid_relationship",
      `Select an available ${accountType} user.`,
    );
  }
  if (!client || client.status !== "active") {
    throw new ServiceMutationError(
      "invalid_relationship",
      "Assignments require an active client company.",
    );
  }
  if (!role || role.audience !== accountType) {
    throw new ServiceMutationError(
      "invalid_relationship",
      "The selected role does not apply to this account type.",
    );
  }
}

export async function createEmployeeAssignment(rawInput: unknown) {
  const input = createEmployeeAssignmentInputSchema.parse(rawInput);
  const actorUserId = await authorizeAssignmentChange(input.sessionId, ACTIONS.CREATE);
  await validateAssignmentRelationships({
    actorUserId,
    userId: input.userId,
    clientId: input.clientId,
    roleId: input.roleId,
    accountType: "internal",
  });
  const assignmentId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(employeeClientAssignments)
        .values({
          id: assignmentId,
          userId: input.userId,
          clientId: input.clientId,
          roleId: input.roleId,
          status: "active",
          assignedByUserId: actorUserId,
          assignedAt: now,
        })
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId: input.clientId,
          eventType: "employee_assignment.created",
          resource: RESOURCES.CLIENT_ASSIGNMENTS,
          action: ACTIONS.CREATE,
          targetType: "employee_client_assignment",
          targetId: assignmentId,
          outcome: "success",
          reason: `Assigned user ${input.userId} with role ${input.roleId}`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "This employee already has an assignment for that client.",
      );
    }
    throw error;
  }

  return { id: assignmentId, status: "active" as const };
}

export async function updateEmployeeAssignment(rawInput: unknown) {
  const input = updateEmployeeAssignmentInputSchema.parse(rawInput);
  const actorUserId = await authorizeAssignmentChange(input.sessionId, ACTIONS.EDIT);
  const [assignment] = await db
    .select({
      id: employeeClientAssignments.id,
      userId: employeeClientAssignments.userId,
      clientId: employeeClientAssignments.clientId,
      roleId: employeeClientAssignments.roleId,
    })
    .from(employeeClientAssignments)
    .where(eq(employeeClientAssignments.id, input.assignmentId))
    .limit(1);

  if (!assignment) {
    throw new ServiceMutationError("not_found", "The assignment no longer exists.");
  }
  await validateAssignmentRelationships({
    actorUserId,
    userId: assignment.userId,
    clientId: assignment.clientId,
    roleId: input.roleId,
    accountType: "internal",
  });
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    transaction
      .update(employeeClientAssignments)
      .set({ roleId: input.roleId })
      .where(eq(employeeClientAssignments.id, input.assignmentId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: assignment.clientId,
        eventType: "employee_assignment.role_changed",
        resource: RESOURCES.CLIENT_ASSIGNMENTS,
        action: ACTIONS.EDIT,
        targetType: "employee_client_assignment",
        targetId: input.assignmentId,
        outcome: "success",
        reason: `${assignment.roleId} -> ${input.roleId}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.assignmentId };
}

export async function setEmployeeAssignmentStatus(rawInput: unknown) {
  const input = setEmployeeAssignmentStatusInputSchema.parse(rawInput);
  const action = input.status === "inactive" ? ACTIONS.DELETE : ACTIONS.EDIT;
  const actorUserId = await authorizeAssignmentChange(input.sessionId, action);
  const [assignment] = await db
    .select({
      id: employeeClientAssignments.id,
      userId: employeeClientAssignments.userId,
      clientId: employeeClientAssignments.clientId,
      roleId: employeeClientAssignments.roleId,
      status: employeeClientAssignments.status,
    })
    .from(employeeClientAssignments)
    .where(eq(employeeClientAssignments.id, input.assignmentId))
    .limit(1);

  if (!assignment) {
    throw new ServiceMutationError("not_found", "The assignment no longer exists.");
  }
  if (input.status === "active") {
    await validateAssignmentRelationships({
      actorUserId,
      userId: assignment.userId,
      clientId: assignment.clientId,
      roleId: assignment.roleId,
      accountType: "internal",
    });
  } else if (actorUserId === assignment.userId) {
    throw new ServiceMutationError(
      "self_access_change",
      "You cannot change your own client access.",
    );
  }
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    transaction
      .update(employeeClientAssignments)
      .set({
        status: input.status,
        endedAt: input.status === "inactive" ? now : null,
      })
      .where(eq(employeeClientAssignments.id, input.assignmentId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: assignment.clientId,
        eventType: "employee_assignment.status_changed",
        resource: RESOURCES.CLIENT_ASSIGNMENTS,
        action,
        targetType: "employee_client_assignment",
        targetId: input.assignmentId,
        outcome: "success",
        reason: `${assignment.status} -> ${input.status}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.assignmentId, status: input.status };
}

export async function createClientMembership(rawInput: unknown) {
  const input = createClientMembershipInputSchema.parse(rawInput);
  const actorUserId = await authorizeAssignmentChange(input.sessionId, ACTIONS.CREATE);
  await validateAssignmentRelationships({
    actorUserId,
    userId: input.userId,
    clientId: input.clientId,
    roleId: input.roleId,
    accountType: "client",
  });
  const membershipId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.transaction((transaction) => {
      transaction
        .insert(clientMemberships)
        .values({
          id: membershipId,
          userId: input.userId,
          clientId: input.clientId,
          roleId: input.roleId,
          status: "active",
          assignedByUserId: actorUserId,
          joinedAt: now,
        })
        .run();
      transaction
        .insert(auditLogs)
        .values({
          actorUserId,
          clientId: input.clientId,
          eventType: "client_membership.created",
          resource: RESOURCES.CLIENT_ASSIGNMENTS,
          action: ACTIONS.CREATE,
          targetType: "client_membership",
          targetId: membershipId,
          outcome: "success",
          reason: `Added user ${input.userId} with role ${input.roleId}`,
          createdAt: now,
        })
        .run();
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ServiceMutationError(
        "conflict",
        "This client user already has a company membership.",
      );
    }
    throw error;
  }

  return { id: membershipId, status: "active" as const };
}

export async function updateClientMembership(rawInput: unknown) {
  const input = updateClientMembershipInputSchema.parse(rawInput);
  const actorUserId = await authorizeAssignmentChange(input.sessionId, ACTIONS.EDIT);
  const [membership] = await db
    .select({
      id: clientMemberships.id,
      userId: clientMemberships.userId,
      clientId: clientMemberships.clientId,
      roleId: clientMemberships.roleId,
    })
    .from(clientMemberships)
    .where(eq(clientMemberships.id, input.membershipId))
    .limit(1);

  if (!membership) {
    throw new ServiceMutationError("not_found", "The membership no longer exists.");
  }
  await validateAssignmentRelationships({
    actorUserId,
    userId: membership.userId,
    clientId: input.clientId,
    roleId: input.roleId,
    accountType: "client",
  });
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    transaction
      .update(clientMemberships)
      .set({ clientId: input.clientId, roleId: input.roleId })
      .where(eq(clientMemberships.id, input.membershipId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: input.clientId,
        eventType: "client_membership.updated",
        resource: RESOURCES.CLIENT_ASSIGNMENTS,
        action: ACTIONS.EDIT,
        targetType: "client_membership",
        targetId: input.membershipId,
        outcome: "success",
        reason: `Client ${membership.clientId} -> ${input.clientId}; role ${membership.roleId} -> ${input.roleId}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.membershipId };
}

export async function setClientMembershipStatus(rawInput: unknown) {
  const input = setClientMembershipStatusInputSchema.parse(rawInput);
  const action = input.status === "inactive" ? ACTIONS.DELETE : ACTIONS.EDIT;
  const actorUserId = await authorizeAssignmentChange(input.sessionId, action);
  const [membership] = await db
    .select({
      id: clientMemberships.id,
      userId: clientMemberships.userId,
      clientId: clientMemberships.clientId,
      roleId: clientMemberships.roleId,
      status: clientMemberships.status,
    })
    .from(clientMemberships)
    .where(eq(clientMemberships.id, input.membershipId))
    .limit(1);

  if (!membership) {
    throw new ServiceMutationError("not_found", "The membership no longer exists.");
  }
  if (input.status === "active") {
    await validateAssignmentRelationships({
      actorUserId,
      userId: membership.userId,
      clientId: membership.clientId,
      roleId: membership.roleId,
      accountType: "client",
    });
  }
  const now = new Date().toISOString();

  db.transaction((transaction) => {
    transaction
      .update(clientMemberships)
      .set({ status: input.status })
      .where(eq(clientMemberships.id, input.membershipId))
      .run();
    transaction
      .insert(auditLogs)
      .values({
        actorUserId,
        clientId: membership.clientId,
        eventType: "client_membership.status_changed",
        resource: RESOURCES.CLIENT_ASSIGNMENTS,
        action,
        targetType: "client_membership",
        targetId: input.membershipId,
        outcome: "success",
        reason: `${membership.status} -> ${input.status}`,
        createdAt: now,
      })
      .run();
  });

  return { id: input.membershipId, status: input.status };
}
