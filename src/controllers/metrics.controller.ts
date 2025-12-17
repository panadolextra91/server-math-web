import type { Request, Response } from "express";
import { metricsCollector } from "../services/metrics.service";

export async function getMetrics(req: Request, res: Response) {
  const snapshot = metricsCollector.getSnapshot();
  res.json(snapshot);
}

export async function resetMetrics(req: Request, res: Response) {
  metricsCollector.reset();
  res.json({ message: "Metrics reset successfully" });
}

