import { Router } from "express";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { loginSchema, refreshSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body.email, req.body.password));
  })
);

authRouter.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.refresh(req.body.refreshToken));
  })
);

authRouter.post("/logout", requireAuth, (_req, res) => {
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
