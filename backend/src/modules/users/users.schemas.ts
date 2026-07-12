import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(UserRole)
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});
