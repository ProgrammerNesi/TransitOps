import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { idParamSchema } from "../../common/schemas.js";
import { createVehicleSchema, updateVehicleSchema, updateVehicleStatusSchema, vehicleQuerySchema } from "./vehicles.schemas.js";
import * as vehiclesService from "./vehicles.service.js";

export const vehiclesRouter = Router();

vehiclesRouter.use(requireAuth);

vehiclesRouter.get(
  "/",
  validate(vehicleQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await vehiclesService.listVehicles(req.query as never));
  })
);

vehiclesRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await vehiclesService.getVehicle(req.params.id));
  })
);

vehiclesRouter.post(
  "/",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(createVehicleSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await vehiclesService.createVehicle(req.body));
  })
);

vehiclesRouter.put(
  "/:id",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  validate(updateVehicleSchema),
  asyncHandler(async (req, res) => {
    res.json(await vehiclesService.updateVehicle(req.params.id, req.body));
  })
);

vehiclesRouter.patch(
  "/:id/status",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  validate(updateVehicleStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await vehiclesService.updateVehicleStatus(req.params.id, req.body.status, req.user, req.body.reason));
  })
);

vehiclesRouter.get(
  "/:id/cost-summary",
  requireRoles(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST),
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await vehiclesService.getCostSummary(req.params.id));
  })
);
