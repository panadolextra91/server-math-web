import type { Request, Response, NextFunction } from "express";
import { ServiceUnavailableError } from "../utils/errors";
import { logger } from "../utils/logger";

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Request timeout middleware
 * Automatically cancels requests that exceed the specified timeout duration
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 */
export function timeoutMiddleware(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn("Request timeout", {
          method: req.method,
          url: req.url,
          timeoutMs,
          requestId: req.requestId,
        });

        // Clear the timeout to prevent double execution
        clearTimeout(timeoutId);

        // Send timeout error
        const error = new ServiceUnavailableError("Request timeout", {
          timeoutMs,
          message: `Request exceeded maximum duration of ${timeoutMs}ms`,
        });

        // Use error handler format
        res.status(error.statusCode).json({
          error: {
            code: error.code,
            message: error.message,
            requestId: req.requestId,
            details: error.details,
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when response is finished
    res.on("finish", () => {
      clearTimeout(timeoutId);
    });

    res.on("close", () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

