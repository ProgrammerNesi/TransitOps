import { ExpenseCategory, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../common/http-error.js";
import { toPagination } from "../../common/schemas.js";

export async function listFuelLogs(query: { page: number; pageSize: number; vehicleId?: string; from?: Date; to?: Date }) {
  const where: Prisma.FuelLogWhereInput = {
    vehicleId: query.vehicleId,
    date: query.from || query.to ? { gte: query.from, lte: query.to } : undefined
  };
  const [data, total] = await prisma.$transaction([
    prisma.fuelLog.findMany({ where, include: { vehicle: true, trip: true }, ...toPagination(query), orderBy: { date: "desc" } }),
    prisma.fuelLog.count({ where })
  ]);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function createFuelLog(input: Prisma.FuelLogUncheckedCreateInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw notFound("Vehicle not found");
  if (input.tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: input.tripId } });
    if (!trip) throw notFound("Trip not found");
  }
  return prisma.fuelLog.create({ data: input, include: { vehicle: true, trip: true } });
}

export async function listExpenses(query: { page: number; pageSize: number; vehicleId?: string; category?: ExpenseCategory }) {
  const where: Prisma.ExpenseWhereInput = {
    vehicleId: query.vehicleId,
    category: query.category
  };
  const [data, total] = await prisma.$transaction([
    prisma.expense.findMany({ where, include: { vehicle: true }, ...toPagination(query), orderBy: { date: "desc" } }),
    prisma.expense.count({ where })
  ]);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function createExpense(input: Prisma.ExpenseUncheckedCreateInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) throw notFound("Vehicle not found");
  return prisma.expense.create({ data: input, include: { vehicle: true } });
}
