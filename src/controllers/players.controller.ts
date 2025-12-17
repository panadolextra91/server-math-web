import type { Request, Response } from "express";
import { getPlayerStats } from "../services/player.service";
import { sanitizePlayerName } from "../utils/sanitize";

export async function getPlayerStatsHandler(req: Request, res: Response) {
  const { playerName } = req.params as { playerName: string };

  const sanitized = sanitizePlayerName(playerName);
  if (!sanitized) {
    return res.status(400).json({ message: "Invalid player name" });
  }

  const stats = await getPlayerStats(sanitized);
  if (!stats) {
    return res.status(404).json({ message: "Player not found" });
  }

  res.json(stats);
}

