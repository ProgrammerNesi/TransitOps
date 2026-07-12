import { TripStatus, VehicleStatus } from "@prisma/client";
import { z } from "zod";

export const kpiQuerySchema = z.object({
  type: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  region: z.string().optional()
});

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const exportReportQuerySchema = reportQuerySchema.extend({
  report: z.enum(["fuel-efficiency", "utilization", "cost", "roi"])
});

export { TripStatus };
