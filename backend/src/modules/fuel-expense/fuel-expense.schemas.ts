import { ExpenseCategory } from "@prisma/client";
import { z } from "zod";
import { decimalSchema, paginationQuerySchema } from "../../common/schemas.js";

export const fuelLogQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional(),
  liters: decimalSchema.gt(0),
  cost: decimalSchema,
  date: z.coerce.date()
});

export const expenseQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  category: z.nativeEnum(ExpenseCategory).optional()
});

export const createExpenseSchema = z.object({
  vehicleId: z.string().uuid(),
  category: z.nativeEnum(ExpenseCategory),
  amount: decimalSchema.gt(0),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional()
});
