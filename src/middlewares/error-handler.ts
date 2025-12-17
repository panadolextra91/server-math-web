import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof Error && "status" in err) {
    const status = (err as { status: number }).status;
    const message = err.message || "Unexpected error";

    logger.warn("Request error", {
      method: req.method,
      url: req.url,
      statusCode: status,
      error: err.message,
    });

    return res.status(status).json({ message });
  }

  // Unexpected error - log with full stack trace
  logger.error("Unhandled error", err instanceof Error ? err : new Error(String(err)));

  return res.status(500).json({ message: "Internal server error" });
}


