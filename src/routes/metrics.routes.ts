import { Router } from "express";
import { getMetrics, resetMetrics } from "../controllers/metrics.controller";
import { asyncHandler } from "../middlewares/async-handler";
import { adminAuth } from "../middlewares/admin-auth";

export const metricsRouter = Router();

// Server-wide metrics - admin only
metricsRouter.get("/metrics", adminAuth, asyncHandler(getMetrics));
metricsRouter.post("/metrics/reset", adminAuth, asyncHandler(resetMetrics));

