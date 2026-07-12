import { Router } from "express";
import { requireAuth } from "../../common/auth.js";
import { asyncHandler } from "../../common/async-handler.js";
import { prisma } from "../../lib/prisma.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const expiringDrivers = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: soon } },
      orderBy: { licenseExpiry: "asc" },
      take: 10
    });
    res.json({
      data: expiringDrivers.map((driver) => ({
        id: `license-${driver.id}`,
        type: "LICENSE_EXPIRY",
        title: `${driver.name} license expires soon`,
        createdAt: new Date(),
        isRead: false
      }))
    });
  })
);
