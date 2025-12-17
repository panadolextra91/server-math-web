import type { Request, Response } from "express";
import {
  createSession,
  endSession,
  fetchSession,
  fetchSessionSummary,
} from "../services/session.service";
import { sanitizePlayerName } from "../utils/sanitize";
import { InvalidInputError, NotFoundError } from "../utils/errors";

export async function createSessionHandler(req: Request, res: Response) {
  const { playerName, mode, difficulty } = req.body as {
    playerName: string;
    mode?: "arithmetic" | "equation";
    difficulty?: "easy" | "medium" | "hard";
  };

  const sanitized = sanitizePlayerName(playerName);
  if (!sanitized) {
    throw new InvalidInputError("Invalid player name", "playerName", {
      reason: "Name must be 1-64 characters and contain only alphanumeric characters, spaces, hyphens, or underscores",
    });
  }

  const session = await createSession({ playerName: sanitized, mode, difficulty });
  res.status(201).json({
    sessionId: session.id,
    playerName: session.playerName,
    startedAt: session.startedAt,
  });
}

export async function endSessionHandler(req: Request, res: Response) {
  const { sessionId } = req.params as { sessionId: string };
  const id = Number(sessionId);
  const session = await fetchSession(id);
  if (!session) throw new NotFoundError("Session", id);

  await endSession(id);
  const summary = await fetchSessionSummary(id);
  res.json({
    sessionId: id,
    finishedAt: new Date(),
    summary,
  });
}

export async function getSessionSummaryHandler(req: Request, res: Response) {
  const { sessionId } = req.params as { sessionId: string };
  const id = Number(sessionId);
  const summary = await fetchSessionSummary(id);
  if (!summary) throw new NotFoundError("Session", id);
  res.json(summary);
}

