import type { Request, Response } from "express";
import { generateQuestion } from "../services/question.service";
import { fetchSession } from "../services/session.service";

export async function generateQuestionHandler(req: Request, res: Response) {
  const { sessionId, mode, difficulty } = req.body as {
    sessionId: number;
    mode: "arithmetic" | "equation";
    difficulty: "easy" | "medium" | "hard";
  };

  const session = await fetchSession(sessionId);
  if (!session) return res.status(404).json({ message: "Session not found" });

  const question = await generateQuestion({ mode, difficulty });
  res.json(question);
}


