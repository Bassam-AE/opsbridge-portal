export type ServiceMutationErrorCode =
  | "conflict"
  | "not_found"
  | "invalid_relationship"
  | "self_access_change";

export class ServiceMutationError extends Error {
  readonly code: ServiceMutationErrorCode;

  constructor(code: ServiceMutationErrorCode, message: string) {
    super(message);
    this.name = "ServiceMutationError";
    this.code = code;
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("UNIQUE constraint failed") ||
      error.message.includes("SQLITE_CONSTRAINT_UNIQUE"))
  );
}
