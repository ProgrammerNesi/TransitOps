import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "./http-error.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

type TokenPayload = AuthUser & { type: "access" | "refresh" };

export function signAccessToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ ...user, type: "access" }, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(user: AuthUser) {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ ...user, type: "refresh" }, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  if (payload.type !== "refresh") throw unauthorized("Invalid refresh token");
  return payload;
}

export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    if (payload.type !== "access") return next(unauthorized("Invalid access token"));
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};

export function requireRoles(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden("Your role cannot perform this action"));
    next();
  };
}
