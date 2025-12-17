import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const logEntry: Record<string, any> = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    };

    // Add request ID if present (useful for tracing)
    if (req.requestId) {
      logEntry.requestId = req.requestId;
    }

    // Log request body size if available
    if (req.headers["content-length"]) {
      logEntry.requestSize = parseInt(req.headers["content-length"], 10);
    }

    // Log response size if available
    if (res.get("content-length")) {
      logEntry.responseSize = parseInt(res.get("content-length") || "0", 10);
    }

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error("HTTP request", logEntry);
    } else if (res.statusCode >= 400) {
      logger.warn("HTTP request", logEntry);
    } else {
      logger.info("HTTP request", logEntry);
    }
  });

  next();
}

