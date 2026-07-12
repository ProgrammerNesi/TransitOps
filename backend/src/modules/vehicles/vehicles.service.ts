import { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../common/http-error.js";
import { toPagination } from "../../common/schemas.js";
import { writeAudit } from "../../common/audit.js";
import type { AuthUser } from "../../common/auth.js";

export async function listVehicles(query: { page: number; pageSize: number; type?: string; status?: VehicleStatus; region?: string }) {
  const where: Prisma.VehicleWhereInput = {
    type: query.type,
    status: query.status,
    region: query.region
  };

  const [data, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      ...toPagination(query),
      orderBy: { createdAt: "desc" }
    }),
    prisma.vehicle.count({ where })
  ]);

  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw notFound("Vehicle not found");
  return vehicle;
}

export async function createVehicle(input: Prisma.VehicleCreateInput) {
  try {
    return await prisma.vehicle.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("Registration number already exists");
    }
    throw error;
  }
}

export async function updateVehicle(id: string, input: Prisma.VehicleUpdateInput) {
  try {
    return await prisma.vehicle.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw notFound("Vehicle not found");
      if (error.code === "P2002") throw conflict("Registration number already exists");
    }
    throw error;
  }
}

export async function updateVehicleStatus(id: string, status: VehicleStatus, actor: AuthUser | undefined, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.vehicle.findUnique({ where: { id } });
    if (!before) throw notFound("Vehicle not found");
    if (before.status === VehicleStatus.ON_TRIP) throw conflict("Vehicle is currently On Trip");

    const after = await tx.vehicle.update({ where: { id }, data: { status } });
    await writeAudit(tx, actor, {
      entityType: "vehicle",
      entityId: id,
      action: "manual_status_change",
      before,
      after,
      reason
    });
    return after;
  });
}

export async function getCostSummary(id: string) {
  await getVehicle(id);
  const [fuel, maintenance, expenses] = await prisma.$transaction([
    prisma.fuelLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true, liters: true } }),
    prisma.maintenanceLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true } }),
    prisma.expense.aggregate({ where: { vehicleId: id }, _sum: { amount: true } })
  ]);

  const fuelCost = Number(fuel._sum.cost ?? 0);
  const maintenanceCost = Number(maintenance._sum.cost ?? 0);
  const expenseCost = Number(expenses._sum.amount ?? 0);

  return {
    vehicleId: id,
    fuelLiters: Number(fuel._sum.liters ?? 0),
    fuelCost,
    maintenanceCost,
    expenseCost,
    totalOperationalCost: fuelCost + maintenanceCost + expenseCost
  };
}
