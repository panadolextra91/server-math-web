import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

/**
 * Simple admin authentication middleware using API key
 * Checks for X-Admin-API-Key header or admin-api-key query parameter
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  // If no admin API key is configured, allow access (for development)
  if (!env.ADMIN_API_KEY) {
    return next();
  }

  // Check for API key in header or query parameter
  const apiKey = req.get("X-Admin-API-Key") || (req.query["admin-api-key"] as string);

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    throw new UnauthorizedError("Admin API key required", {
      message: "Invalid or missing admin API key",
    });
  }

  next();
}

