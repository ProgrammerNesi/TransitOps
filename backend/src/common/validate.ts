import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "./http-error.js";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodSchema, part: RequestPart = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(badRequest("Validation failed", result.error.flatten()));
    }
    req[part] = result.data;
    next();
  };
}
