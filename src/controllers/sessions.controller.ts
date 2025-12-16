import type { Request, Response } from "express";
import {
  createSession,
  endSession,
  fetchSession,
  fetchSessionSummary,
} from "../services/session.service";

export async function createSessionHandler(req: Request, res: Response) {
  const { playerName, mode, difficulty } = req.body as {
    playerName: string;
    mode?: "arithmetic" | "equation";
    difficulty?: "easy" | "medium" | "hard";
  };

  const session = await createSession({ playerName, mode, difficulty });
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
  if (!session) return res.status(404).json({ message: "Session not found" });

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
  if (!summary) return res.status(404).json({ message: "Session not found" });
  res.json(summary);
}

