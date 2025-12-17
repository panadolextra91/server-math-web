import type { Request, Response } from "express";
import { getPlayerStats } from "../services/player.service";
import { sanitizePlayerName } from "../utils/sanitize";
import { NotFoundError } from "../utils/errors";

export async function getPlayerMetrics(req: Request, res: Response) {
  const playerName = sanitizePlayerName(req.params.playerName);

  const stats = await getPlayerStats(playerName);

  if (!stats) {
    throw new NotFoundError("Player", playerName);
  }

  // Format as metrics response
  res.json({
    playerName: stats.playerName,
    totalSessions: stats.totalSessions,
    totalQuestions: stats.totalQuestions,
    totalCorrect: stats.totalCorrect,
    totalWrong: stats.totalWrong,
    accuracy: stats.accuracy,
    averageResponseTime: stats.avgTimeMs,
    totalScore: stats.totalScore,
    bestScore: stats.bestScore,
    byDifficulty: stats.byDifficulty,
    timestamp: new Date().toISOString(),
  });
}

