import { DriverStatus } from "@prisma/client";
import { z } from "zod";
import { decimalSchema, paginationQuerySchema } from "../../common/schemas.js";

export const driverQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DriverStatus).optional(),
  licenseCategory: z.string().optional()
});

export const createDriverSchema = z.object({
  name: z.string().min(2).max(120),
  licenseNo: z.string().min(2).max(80),
  licenseCategory: z.string().min(1).max(60),
  licenseExpiry: z.coerce.date(),
  contactNumber: z.string().min(5).max(30).optional(),
  safetyScore: decimalSchema.max(100).default(100)
});

export const updateDriverSchema = createDriverSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const updateDriverStatusSchema = z.object({
  status: z.enum([DriverStatus.AVAILABLE, DriverStatus.OFF_DUTY, DriverStatus.SUSPENDED]),
  reason: z.string().max(500).optional()
});

export const expiringLicenseQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30)
});
