import type { Request, Response } from "express";
import { env } from "../config/env";
import { pool } from "../config/db";

export async function healthHandler(_req: Request, res: Response) {
  const uptimeMs = Math.round(process.uptime() * 1000);
  const health: {
    status: "ok" | "degraded";
    env: string;
    uptimeMs: number;
    database?: {
      status: "connected" | "disconnected";
      responseTimeMs?: number;
    };
  } = {
    status: "ok",
    env: env.NODE_ENV ?? "dev",
    uptimeMs,
  };

  // Test database connectivity
  try {
    const startTime = Date.now();
    await pool.query("SELECT 1");
    const responseTimeMs = Date.now() - startTime;

    health.database = {
      status: "connected",
      responseTimeMs,
    };
  } catch (error) {
    health.status = "degraded";
    health.database = {
      status: "disconnected",
    };
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
}

