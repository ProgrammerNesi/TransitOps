import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { idParamSchema } from "../../common/schemas.js";
import { createUserSchema, updateUserStatusSchema } from "./users.schemas.js";
import * as usersService from "./users.service.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRoles(UserRole.FLEET_MANAGER));

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await usersService.listUsers() });
  })
);

usersRouter.post(
  "/",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await usersService.createUser(req.body));
  })
);

usersRouter.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(updateUserStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await usersService.updateUserStatus(req.params.id, req.body.isActive));
  })
);
