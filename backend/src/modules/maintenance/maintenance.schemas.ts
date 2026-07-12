import { MaintenanceStatus } from "@prisma/client";
import { z } from "zod";
import { decimalSchema, paginationQuerySchema } from "../../common/schemas.js";

export const maintenanceQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional()
});

export const openMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  serviceType: z.string().min(2).max(120),
  cost: decimalSchema.default(0),
  notes: z.string().max(2000).optional()
});

export const closeMaintenanceSchema = z.object({
  finalCost: decimalSchema.optional(),
  closingNotes: z.string().max(2000).optional()
});
