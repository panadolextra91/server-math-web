import type { Request, Response, NextFunction } from "express";
import { metricsCollector } from "../services/metrics.service";

/**
 * Middleware to collect metrics for each request
 * Should be placed after request logger to capture accurate timing
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    // Normalize path (remove query params and IDs for better grouping)
    let path = req.path;
    
    // Replace numeric IDs with :id for better endpoint grouping
    path = path.replace(/\/\d+/g, "/:id");
    
    // Remove query string
    path = path.split("?")[0];

    metricsCollector.recordRequest({
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}

