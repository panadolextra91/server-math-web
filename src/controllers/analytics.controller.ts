import type { Request, Response } from "express";
import { getAnalyticsOverview, getLeaderboard } from "../services/analytics.service";

export async function analyticsOverviewHandler(req: Request, res: Response) {
  const level = (req.query.level as "easy" | "medium" | "hard" | undefined) ?? undefined;
  const overview = await getAnalyticsOverview(level);
  res.json(overview);
}

export async function leaderboardHandler(req: Request, res: Response) {
  const scope =
    (req.query.scope as "all" | "weekly" | "daily" | undefined) ?? "all";
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;
  const result = await getLeaderboard({ scope, limit, offset, page });
  res.json(result);
}



