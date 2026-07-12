import type { Prisma } from "@prisma/client";
import type { AuthUser } from "./auth.js";

export async function writeAudit(
  tx: Prisma.TransactionClient,
  actor: AuthUser | undefined,
  input: {
    entityType: string;
    entityId: string;
    action: string;
    before?: unknown;
    after?: unknown;
    reason?: string;
  }
) {
  await tx.auditLog.create({
    data: {
      actorId: actor?.id,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeJson: input.before as Prisma.InputJsonValue,
      afterJson: input.after as Prisma.InputJsonValue,
      reason: input.reason
    }
  });
}
