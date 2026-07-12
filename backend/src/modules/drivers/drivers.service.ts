import { DriverStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../common/http-error.js";
import { toPagination } from "../../common/schemas.js";
import type { AuthUser } from "../../common/auth.js";
import { writeAudit } from "../../common/audit.js";

export async function listDrivers(query: { page: number; pageSize: number; status?: DriverStatus; licenseCategory?: string }) {
  const where: Prisma.DriverWhereInput = {
    status: query.status,
    licenseCategory: query.licenseCategory
  };
  const [data, total] = await prisma.$transaction([
    prisma.driver.findMany({ where, ...toPagination(query), orderBy: { createdAt: "desc" } }),
    prisma.driver.count({ where })
  ]);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw notFound("Driver not found");
  return driver;
}

export async function createDriver(input: Prisma.DriverCreateInput) {
  try {
    return await prisma.driver.create({ data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("License number already exists");
    }
    throw error;
  }
}

export async function updateDriver(id: string, input: Prisma.DriverUpdateInput) {
  try {
    return await prisma.driver.update({ where: { id }, data: input });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw notFound("Driver not found");
      if (error.code === "P2002") throw conflict("License number already exists");
    }
    throw error;
  }
}

export async function updateDriverStatus(id: string, status: DriverStatus, actor: AuthUser | undefined, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.driver.findUnique({ where: { id } });
    if (!before) throw notFound("Driver not found");
    if (before.status === DriverStatus.ON_TRIP) throw conflict("Driver is currently On Trip");

    const after = await tx.driver.update({ where: { id }, data: { status } });
    await writeAudit(tx, actor, {
      entityType: "driver",
      entityId: id,
      action: "manual_status_change",
      before,
      after,
      reason
    });
    return after;
  });
}

export async function expiringLicenses(days: number) {
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + days);
  return prisma.driver.findMany({
    where: {
      licenseExpiry: {
        gte: now,
        lte: until
      },
      status: { not: DriverStatus.SUSPENDED }
    },
    orderBy: { licenseExpiry: "asc" }
  });
}
