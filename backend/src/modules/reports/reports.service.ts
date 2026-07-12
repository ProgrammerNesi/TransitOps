import { Prisma, TripStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../common/http-error.js";

function dateWhere(from?: Date, to?: Date) {
  return from || to ? { gte: from, lte: to } : undefined;
}

export async function dashboardKpis(query: { type?: string; status?: VehicleStatus; region?: string }) {
  const vehicleWhere: Prisma.VehicleWhereInput = {
    type: query.type,
    status: query.status,
    region: query.region
  };

  const vehicleScope = await prisma.vehicle.findMany({
    where: vehicleWhere,
    select: { id: true, status: true }
  });
  const vehicleIds = vehicleScope.map((vehicle) => vehicle.id);
  const totalVehicles = vehicleScope.filter((vehicle) => vehicle.status !== VehicleStatus.RETIRED).length;
  const activeVehicles = vehicleScope.filter((vehicle) => vehicle.status === VehicleStatus.ON_TRIP).length;
  const availableVehicles = vehicleScope.filter((vehicle) => vehicle.status === VehicleStatus.AVAILABLE).length;
  const inMaintenance = vehicleScope.filter((vehicle) => vehicle.status === VehicleStatus.IN_SHOP).length;

  const [activeTrips, pendingTrips, driversOnDuty] = await prisma.$transaction([
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED, vehicleId: vehicleIds.length ? { in: vehicleIds } : undefined } }),
    prisma.trip.count({ where: { status: TripStatus.DRAFT, vehicleId: vehicleIds.length ? { in: vehicleIds } : undefined } }),
    prisma.driver.count({ where: { status: "ON_TRIP" } })
  ]);

  return {
    activeVehicles,
    availableVehicles,
    inMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilizationPct: totalVehicles ? Number(((activeVehicles / totalVehicles) * 100).toFixed(2)) : 0
  };
}

export async function fuelEfficiency(from?: Date, to?: Date) {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: TripStatus.COMPLETED, completedAt: dateWhere(from, to) } },
      fuelLogs: { where: { date: dateWhere(from, to) } }
    },
    orderBy: { registrationNo: "asc" }
  });

  return vehicles.map((vehicle) => {
    const distance = vehicle.trips.reduce((sum, trip) => sum + Number(trip.actualDistance ?? trip.plannedDistance), 0);
    const liters = vehicle.fuelLogs.reduce((sum, log) => sum + Number(log.liters), 0);
    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      type: vehicle.type,
      region: vehicle.region,
      distance,
      liters,
      efficiencyKmPerLiter: liters ? Number((distance / liters).toFixed(2)) : 0
    };
  });
}

export async function operationalCost(from?: Date, to?: Date) {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: { where: { date: dateWhere(from, to) } },
      expenses: { where: { date: dateWhere(from, to) } },
      maintenanceLogs: { where: { startedAt: dateWhere(from, to) } }
    },
    orderBy: { registrationNo: "asc" }
  });

  return vehicles.map((vehicle) => {
    const fuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
    const expenseCost = vehicle.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const maintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + Number(log.cost), 0);
    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      fuelCost,
      expenseCost,
      maintenanceCost,
      totalCost: fuelCost + expenseCost + maintenanceCost
    };
  });
}

export async function fleetUtilization(from?: Date, to?: Date) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: VehicleStatus.RETIRED } },
    include: {
      trips: { where: { createdAt: dateWhere(from, to) } }
    },
    orderBy: { registrationNo: "asc" }
  });

  const totalTrips = vehicles.reduce((sum, vehicle) => sum + vehicle.trips.length, 0);
  return vehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
    registrationNo: vehicle.registrationNo,
    status: vehicle.status,
    trips: vehicle.trips.length,
    utilizationPct: totalTrips ? Number(((vehicle.trips.length / totalTrips) * 100).toFixed(2)) : 0
  }));
}

export async function vehicleRoi(from?: Date, to?: Date) {
  const [costRows, vehicles] = await Promise.all([
    operationalCost(from, to),
    prisma.vehicle.findMany({
      include: {
        trips: { where: { status: TripStatus.COMPLETED, completedAt: dateWhere(from, to) } }
      },
      orderBy: { registrationNo: "asc" }
    })
  ]);
  const costByVehicle = new Map(costRows.map((row) => [row.vehicleId, row.totalCost]));

  return vehicles.map((vehicle) => {
    const revenue = vehicle.trips.reduce((sum, trip) => sum + Number(trip.revenue ?? 0), 0);
    const cost = costByVehicle.get(vehicle.id) ?? 0;
    const net = revenue - cost;
    return {
      vehicleId: vehicle.id,
      registrationNo: vehicle.registrationNo,
      acquisitionCost: Number(vehicle.acquisitionCost),
      revenue,
      operationalCost: cost,
      net,
      roiPct: Number(vehicle.acquisitionCost) ? Number(((net / Number(vehicle.acquisitionCost)) * 100).toFixed(2)) : 0
    };
  });
}

export async function runReport(report: string, from?: Date, to?: Date) {
  if (report === "fuel-efficiency") return fuelEfficiency(from, to);
  if (report === "utilization") return fleetUtilization(from, to);
  if (report === "cost") return operationalCost(from, to);
  if (report === "roi") return vehicleRoi(from, to);
  throw badRequest("Unknown report type");
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
