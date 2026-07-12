import { DriverStatus, Prisma, TripStatus, VehicleStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, conflict, notFound } from "../../common/http-error.js";
import { toPagination } from "../../common/schemas.js";
import { writeAudit } from "../../common/audit.js";
import type { AuthUser } from "../../common/auth.js";

const includeTrip = {
  vehicle: true,
  driver: true
};

async function validateTripResources(
  tx: Prisma.TransactionClient,
  input: { vehicleId: string; driverId: string; cargoWeight: number; excludeTripId?: string }
) {
  const [vehicle, driver] = await Promise.all([
    tx.vehicle.findUnique({ where: { id: input.vehicleId } }),
    tx.driver.findUnique({ where: { id: input.driverId } })
  ]);

  if (!vehicle) throw notFound("Vehicle not found");
  if (!driver) throw notFound("Driver not found");
  if (vehicle.status !== VehicleStatus.AVAILABLE) throw conflict("Vehicle is not Available");
  if (driver.status !== DriverStatus.AVAILABLE) throw conflict("Driver is not Available");
  if (Number(vehicle.maxLoadCapacity) < input.cargoWeight) throw badRequest("Cargo weight exceeds vehicle max load capacity");
  if (driver.licenseExpiry < new Date()) throw conflict("Driver license is expired");

  const activeTrip = await tx.trip.findFirst({
    where: {
      id: input.excludeTripId ? { not: input.excludeTripId } : undefined,
      status: { in: [TripStatus.DRAFT, TripStatus.DISPATCHED] },
      OR: [{ vehicleId: input.vehicleId }, { driverId: input.driverId }]
    }
  });
  if (activeTrip) throw conflict("Vehicle or driver already has an active trip");

  return { vehicle, driver };
}

export async function listTrips(query: {
  page: number;
  pageSize: number;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  from?: Date;
  to?: Date;
}) {
  const where: Prisma.TripWhereInput = {
    status: query.status,
    vehicleId: query.vehicleId,
    driverId: query.driverId,
    createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined
  };
  const [data, total] = await prisma.$transaction([
    prisma.trip.findMany({ where, include: includeTrip, ...toPagination(query), orderBy: { createdAt: "desc" } }),
    prisma.trip.count({ where })
  ]);
  return { data, meta: { total, page: query.page, pageSize: query.pageSize } };
}

export async function getTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id }, include: includeTrip });
  if (!trip) throw notFound("Trip not found");
  return trip;
}

export async function createTrip(input: {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
}) {
  return prisma.$transaction(
    async (tx) => {
      await validateTripResources(tx, input);
      return tx.trip.create({
        data: input,
        include: includeTrip
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function dispatchTrip(id: string, actor: AuthUser | undefined) {
  return prisma.$transaction(
    async (tx) => {
      const before = await tx.trip.findUnique({ where: { id }, include: includeTrip });
      if (!before) throw notFound("Trip not found");
      if (before.status !== TripStatus.DRAFT) throw conflict("Trip is not in Draft status");

      await validateTripResources(tx, {
        vehicleId: before.vehicleId,
        driverId: before.driverId,
        cargoWeight: Number(before.cargoWeight),
        excludeTripId: before.id
      });

      const [trip] = await Promise.all([
        tx.trip.update({
          where: { id },
          data: { status: TripStatus.DISPATCHED, dispatchedAt: new Date() },
          include: includeTrip
        }),
        tx.vehicle.update({ where: { id: before.vehicleId }, data: { status: VehicleStatus.ON_TRIP } }),
        tx.driver.update({ where: { id: before.driverId }, data: { status: DriverStatus.ON_TRIP } })
      ]);

      await writeAudit(tx, actor, {
        entityType: "trip",
        entityId: id,
        action: "dispatch",
        before,
        after: trip
      });
      return trip;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function completeTrip(
  id: string,
  input: { finalOdometer: number; fuelConsumed: number; fuelCost: number; actualDistance: number; revenue?: number },
  actor: AuthUser | undefined
) {
  return prisma.$transaction(
    async (tx) => {
      const before = await tx.trip.findUnique({ where: { id }, include: includeTrip });
      if (!before) throw notFound("Trip not found");
      if (before.status !== TripStatus.DISPATCHED) throw conflict("Trip is not in Dispatched status");
      if (input.finalOdometer < Number(before.vehicle.odometer)) throw badRequest("finalOdometer cannot be less than current odometer");

      const trip = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          actualDistance: input.actualDistance,
          revenue: input.revenue
        },
        include: includeTrip
      });

      await tx.vehicle.update({
        where: { id: before.vehicleId },
        data: { status: VehicleStatus.AVAILABLE, odometer: input.finalOdometer }
      });
      await tx.driver.update({ where: { id: before.driverId }, data: { status: DriverStatus.AVAILABLE } });

      if (input.fuelConsumed > 0 || input.fuelCost > 0) {
        await tx.fuelLog.create({
          data: {
            vehicleId: before.vehicleId,
            tripId: id,
            liters: input.fuelConsumed,
            cost: input.fuelCost,
            date: new Date()
          }
        });
      }

      await writeAudit(tx, actor, {
        entityType: "trip",
        entityId: id,
        action: "complete",
        before,
        after: trip
      });
      return trip;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function cancelTrip(id: string, actor: AuthUser | undefined, reason?: string) {
  return prisma.$transaction(
    async (tx) => {
      const before = await tx.trip.findUnique({ where: { id }, include: includeTrip });
      if (!before) throw notFound("Trip not found");
      if (before.status === TripStatus.COMPLETED || before.status === TripStatus.CANCELLED) {
        throw conflict("Trip already Completed or Cancelled");
      }

      const trip = await tx.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED, cancelledAt: new Date() },
        include: includeTrip
      });

      if (before.status === TripStatus.DISPATCHED) {
        await tx.vehicle.update({ where: { id: before.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
        await tx.driver.update({ where: { id: before.driverId }, data: { status: DriverStatus.AVAILABLE } });
      }

      await writeAudit(tx, actor, {
        entityType: "trip",
        entityId: id,
        action: "cancel",
        before,
        after: trip,
        reason
      });
      return trip;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
