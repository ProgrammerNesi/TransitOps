import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { idParamSchema } from "../../common/schemas.js";
import { cancelTripSchema, completeTripSchema, createTripSchema, tripQuerySchema } from "./trips.schemas.js";
import * as tripsService from "./trips.service.js";

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

tripsRouter.get(
  "/",
  validate(tripQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await tripsService.listTrips(req.query as never));
  })
);

tripsRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await tripsService.getTrip(req.params.id));
  })
);

tripsRouter.post(
  "/",
  requireRoles(UserRole.DRIVER, UserRole.FLEET_MANAGER),
  validate(createTripSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await tripsService.createTrip(req.body));
  })
);

tripsRouter.post(
  "/:id/dispatch",
  requireRoles(UserRole.DRIVER, UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await tripsService.dispatchTrip(req.params.id, req.user));
  })
);

tripsRouter.post(
  "/:id/complete",
  requireRoles(UserRole.DRIVER, UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  validate(completeTripSchema),
  asyncHandler(async (req, res) => {
    res.json(await tripsService.completeTrip(req.params.id, req.body, req.user));
  })
);

tripsRouter.post(
  "/:id/cancel",
  requireRoles(UserRole.FLEET_MANAGER),
  validate(idParamSchema, "params"),
  validate(cancelTripSchema),
  asyncHandler(async (req, res) => {
    res.json(await tripsService.cancelTrip(req.params.id, req.user, req.body.reason));
  })
);
