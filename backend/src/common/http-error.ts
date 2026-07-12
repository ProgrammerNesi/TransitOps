export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "APP_ERROR",
    public details?: unknown
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, "BAD_REQUEST", details);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "Forbidden") => new HttpError(403, message, "FORBIDDEN");
export const notFound = (message = "Resource not found") => new HttpError(404, message, "NOT_FOUND");
export const conflict = (message: string) => new HttpError(409, message, "CONFLICT");
export const locked = (message: string) => new HttpError(423, message, "LOCKED");
