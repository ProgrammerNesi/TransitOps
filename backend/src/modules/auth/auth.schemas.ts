import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});
