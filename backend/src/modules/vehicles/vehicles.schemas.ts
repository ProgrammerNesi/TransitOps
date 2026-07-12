import { VehicleStatus } from "@prisma/client";
import { z } from "zod";
import { decimalSchema, paginationQuerySchema } from "../../common/schemas.js";

export const vehicleQuerySchema = paginationQuerySchema.extend({
  type: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  region: z.string().optional()
});

export const createVehicleSchema = z.object({
  registrationNo: z.string().min(2).max(40),
  nameModel: z.string().min(2).max(120),
  type: z.string().min(2).max(60),
  maxLoadCapacity: decimalSchema.gt(0),
  odometer: decimalSchema.default(0),
  acquisitionCost: decimalSchema,
  region: z.string().min(2).max(80).optional()
});

export const updateVehicleSchema = createVehicleSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const updateVehicleStatusSchema = z.object({
  status: z.enum([VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP, VehicleStatus.RETIRED]),
  reason: z.string().max(500).optional()
});
