import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { idParamSchema } from "../../common/schemas.js";
import {
  createDriverSchema,
  driverQuerySchema,
  expiringLicenseQuerySchema,
  updateDriverSchema,
  updateDriverStatusSchema
} from "./drivers.schemas.js";
import * as driversService from "./drivers.service.js";

export const driversRouter = Router();

driversRouter.use(requireAuth);

driversRouter.get(
  "/expiring-licenses",
  requireRoles(UserRole.SAFETY_OFFICER, UserRole.FLEET_MANAGER),
  validate(expiringLicenseQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ data: await driversService.expiringLicenses(Number(req.query.days)) });
  })
);

driversRouter.get(
  "/",
  validate(driverQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await driversService.listDrivers(req.query as never));
  })
);

driversRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await driversService.getDriver(req.params.id));
  })
);

driversRouter.post(
  "/",
  requireRoles(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(createDriverSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await driversService.createDriver(req.body));
  })
);

driversRouter.put(
  "/:id",
  requireRoles(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(idParamSchema, "params"),
  validate(updateDriverSchema),
  asyncHandler(async (req, res) => {
    res.json(await driversService.updateDriver(req.params.id, req.body));
  })
);

driversRouter.patch(
  "/:id/status",
  requireRoles(UserRole.SAFETY_OFFICER),
  validate(idParamSchema, "params"),
  validate(updateDriverStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await driversService.updateDriverStatus(req.params.id, req.body.status, req.user, req.body.reason));
  })
);
