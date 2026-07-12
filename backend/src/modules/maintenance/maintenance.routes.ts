import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { idParamSchema } from "../../common/schemas.js";
import { closeMaintenanceSchema, maintenanceQuerySchema, openMaintenanceSchema } from "./maintenance.schemas.js";
import * as maintenanceService from "./maintenance.service.js";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get(
  "/",
  validate(maintenanceQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await maintenanceService.listMaintenance(req.query as never));
  })
);

maintenanceRouter.post(
  "/",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(openMaintenanceSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await maintenanceService.openMaintenance(req.body, req.user));
  })
);

maintenanceRouter.patch(
  "/:id/close",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  validate(closeMaintenanceSchema),
  asyncHandler(async (req, res) => {
    res.json(await maintenanceService.closeMaintenance(req.params.id, req.body, req.user));
  })
);
