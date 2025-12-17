import type { Request, Response } from "express";
import { metricsCollector } from "../services/metrics.service";
import { getAdminAnalytics } from "../services/admin-analytics.service";

export async function getMetrics(req: Request, res: Response) {
  const snapshot = metricsCollector.getSnapshot();
  const analytics = await getAdminAnalytics();
  
  res.json({
    ...snapshot,
    analytics,
  });
}

export async function resetMetrics(req: Request, res: Response) {
  metricsCollector.reset();
  res.json({ message: "Metrics reset successfully" });
}

