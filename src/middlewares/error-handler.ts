import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { AppError, ErrorCode } from "../utils/errors";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId?: string;
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Handle AppError (standardized errors)
  if (err instanceof AppError) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: err.statusCode,
      errorCode: err.code,
      error: err.message,
      requestId: req.requestId,
      details: err.details,
    };

    if (err.statusCode >= 500) {
      logger.error("Request error", logData);
    } else {
      logger.warn("Request error", logData);
    }

    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
      },
    };

    if (err.details) {
      response.error.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle legacy errors with status property
  if (err instanceof Error && "status" in err) {
    const status = (err as { status: number }).status;
    const message = err.message || "Unexpected error";

    logger.warn("Request error", {
      method: req.method,
      url: req.url,
      statusCode: status,
      error: message,
      requestId: req.requestId,
    });

    const response: ErrorResponse = {
      error: {
        code: ErrorCode.BAD_REQUEST,
        message,
        requestId: req.requestId,
      },
    };

    return res.status(status).json(response);
  }

  // Unexpected error - log with full stack trace
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error("Unhandled error", {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    method: req.method,
    url: req.url,
    requestId: req.requestId,
  });

  const response: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
      requestId: req.requestId,
    },
  };

  return res.status(500).json(response);
}


