import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { conflict, notFound } from "../../common/http-error.js";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
}

export async function createUser(input: { email: string; password: string; name: string; role: string }) {
  try {
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    return await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role as never
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("Email already exists");
    }
    throw error;
  }
}

export async function updateUserStatus(id: string, isActive: boolean) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw notFound("User not found");
    }
    throw error;
  }
}
