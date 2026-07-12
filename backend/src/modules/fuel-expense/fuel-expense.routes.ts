import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { createExpenseSchema, createFuelLogSchema, expenseQuerySchema, fuelLogQuerySchema } from "./fuel-expense.schemas.js";
import * as fuelExpenseService from "./fuel-expense.service.js";

export const fuelExpenseRouter = Router();

fuelExpenseRouter.use(requireAuth);

fuelExpenseRouter.get(
  "/fuel-logs",
  validate(fuelLogQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await fuelExpenseService.listFuelLogs(req.query as never));
  })
);

fuelExpenseRouter.post(
  "/fuel-logs",
  requireRoles(UserRole.FLEET_MANAGER, UserRole.DRIVER),
  validate(createFuelLogSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await fuelExpenseService.createFuelLog(req.body));
  })
);

fuelExpenseRouter.get(
  "/expenses",
  validate(expenseQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await fuelExpenseService.listExpenses(req.query as never));
  })
);

fuelExpenseRouter.post(
  "/expenses",
  requireRoles(UserRole.FLEET_MANAGER, UserRole.DRIVER),
  validate(createExpenseSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await fuelExpenseService.createExpense(req.body));
  })
);
