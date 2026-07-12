import { MaintenanceStatus, Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../common/http-error.js";
import { toPagination } from "../../common/schemas.js";
import { writeAudit } from "../../common/audit.js";
import type { AuthUser } from "../../common/auth.js";

export async function listMaintenance(query: { page: number; pageSize: number; vehicleId?: string; status?: MaintenanceStatus }) {
  const where: Prisma.MaintenanceLogWhereInput = {
    vehicleId: query.vehicleId,
    status: query.status
  };
  const [data, total] = await prisma.$transaction([
    prisma.maintenanceLog.findMany({ where, include: { vehicle: true }, ...toPagination(query), orderBy: { startedAt: "desc" } }),
    prisma.maintenanceLog.count({ where })
  ]);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function openMaintenance(
  input: { vehicleId: string; serviceType: string; cost: number; notes?: string },
  actor: AuthUser | undefined
) {
  return prisma.$transaction(
    async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
      if (!vehicle) throw notFound("Vehicle not found");
      if (vehicle.status === VehicleStatus.ON_TRIP) throw conflict("Vehicle currently On Trip");
      if (vehicle.status === VehicleStatus.RETIRED) throw conflict("Cannot open maintenance for a retired vehicle");

      const openRecord = await tx.maintenanceLog.findFirst({
        where: { vehicleId: input.vehicleId, status: MaintenanceStatus.OPEN }
      });
      if (openRecord) throw conflict("Vehicle already has an open maintenance record");

      const record = await tx.maintenanceLog.create({
        data: input,
        include: { vehicle: true }
      });
      const updatedVehicle = await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { status: VehicleStatus.IN_SHOP }
      });

      await writeAudit(tx, actor, {
        entityType: "maintenance",
        entityId: record.id,
        action: "open",
        before: vehicle,
        after: { record, vehicle: updatedVehicle }
      });
      return record;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function closeMaintenance(
  id: string,
  input: { finalCost?: number; closingNotes?: string },
  actor: AuthUser | undefined
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.maintenanceLog.findUnique({ where: { id }, include: { vehicle: true } });
    if (!before) throw notFound("Maintenance record not found");
    if (before.status === MaintenanceStatus.CLOSED) throw conflict("Maintenance record already closed");

    const record = await tx.maintenanceLog.update({
      where: { id },
      data: {
        status: MaintenanceStatus.CLOSED,
        closedAt: new Date(),
        cost: input.finalCost ?? before.cost,
        notes: input.closingNotes ? `${before.notes ?? ""}\n${input.closingNotes}`.trim() : before.notes
      },
      include: { vehicle: true }
    });

    const vehicleStatus = before.vehicle.status === VehicleStatus.RETIRED ? VehicleStatus.RETIRED : VehicleStatus.AVAILABLE;
    const vehicle = await tx.vehicle.update({
      where: { id: before.vehicleId },
      data: { status: vehicleStatus }
    });

    await writeAudit(tx, actor, {
      entityType: "maintenance",
      entityId: id,
      action: "close",
      before,
      after: { record, vehicle },
      reason: input.closingNotes
    });
    return record;
  });
}
