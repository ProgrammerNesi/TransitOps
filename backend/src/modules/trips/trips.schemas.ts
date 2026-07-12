import { TripStatus } from "@prisma/client";
import { z } from "zod";
import { decimalSchema, paginationQuerySchema } from "../../common/schemas.js";

export const tripQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(TripStatus).optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const createTripSchema = z.object({
  source: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeight: decimalSchema.gt(0),
  plannedDistance: decimalSchema.gt(0)
});

export const completeTripSchema = z.object({
  finalOdometer: decimalSchema,
  fuelConsumed: decimalSchema.default(0),
  fuelCost: decimalSchema.default(0),
  actualDistance: decimalSchema.gt(0),
  revenue: decimalSchema.optional()
});

export const cancelTripSchema = z.object({
  reason: z.string().max(500).optional()
});
