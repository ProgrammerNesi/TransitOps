import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { vehiclesRouter } from "./modules/vehicles/vehicles.routes.js";
import { driversRouter } from "./modules/drivers/drivers.routes.js";
import { tripsRouter } from "./modules/trips/trips.routes.js";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes.js";
import { fuelExpenseRouter } from "./modules/fuel-expense/fuel-expense.routes.js";
import { dashboardRouter, reportsRouter } from "./modules/reports/reports.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { errorMiddleware } from "./common/error-middleware.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "transitops-api" });
  });

  app.use(
    "/api/auth",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }),
    authRouter
  );
  app.use("/api/users", usersRouter);
  app.use("/api/vehicles", vehiclesRouter);
  app.use("/api/drivers", driversRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/maintenance", maintenanceRouter);
  app.use("/api", fuelExpenseRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(errorMiddleware);

  return app;
}
