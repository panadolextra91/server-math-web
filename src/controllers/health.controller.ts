import type { Request, Response } from "express";
import { env } from "../config/env";

export function healthHandler(_req: Request, res: Response) {
  res.json({
    status: "ok",
    env: env.NODE_ENV ?? "dev",
    uptimeMs: Math.round(process.uptime() * 1000),
  });
}

