import type { Request, Response } from "express";
import { getPlayerStats } from "../services/player.service";
import { sanitizePlayerName } from "../utils/sanitize";
import { InvalidInputError, NotFoundError } from "../utils/errors";

export async function getPlayerStatsHandler(req: Request, res: Response) {
  const { playerName } = req.params as { playerName: string };

  const sanitized = sanitizePlayerName(playerName);
  if (!sanitized) {
    throw new InvalidInputError("Invalid player name", "playerName", {
      reason: "Name must be 1-64 characters and contain only alphanumeric characters, spaces, hyphens, or underscores",
    });
  }

  const stats = await getPlayerStats(sanitized);
  if (!stats) {
    throw new NotFoundError("Player", sanitized);
  }

  res.json(stats);
}

