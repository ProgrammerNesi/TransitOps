import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../common/async-handler.js";
import { requireAuth, requireRoles } from "../../common/auth.js";
import { validate } from "../../common/validate.js";
import { exportReportQuerySchema, kpiQuerySchema, reportQuerySchema } from "./reports.schemas.js";
import * as reportsService from "./reports.service.js";

export const dashboardRouter = Router();
export const reportsRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get(
  "/kpis",
  validate(kpiQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await reportsService.dashboardKpis(req.query as never));
  })
);

reportsRouter.use(requireAuth, requireRoles(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST));

reportsRouter.get(
  "/fuel-efficiency",
  validate(reportQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ data: await reportsService.fuelEfficiency(req.query.from as Date | undefined, req.query.to as Date | undefined) });
  })
);

reportsRouter.get(
  "/fleet-utilization",
  validate(reportQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ data: await reportsService.fleetUtilization(req.query.from as Date | undefined, req.query.to as Date | undefined) });
  })
);

reportsRouter.get(
  "/operational-cost",
  validate(reportQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ data: await reportsService.operationalCost(req.query.from as Date | undefined, req.query.to as Date | undefined) });
  })
);

reportsRouter.get(
  "/vehicle-roi",
  validate(reportQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json({ data: await reportsService.vehicleRoi(req.query.from as Date | undefined, req.query.to as Date | undefined) });
  })
);

reportsRouter.get(
  "/export",
  validate(exportReportQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const rows = await reportsService.runReport(
      String(req.query.report),
      req.query.from as Date | undefined,
      req.query.to as Date | undefined
    );
    const csv = reportsService.toCsv(rows as Record<string, unknown>[]);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="${req.query.report}.csv"`);
    res.send(csv);
  })
);
