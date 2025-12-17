import type { Request, Response } from "express";
import { submitAnswer } from "../services/answer.service";
import { fetchSession } from "../services/session.service";
import { NotFoundError } from "../utils/errors";

export async function submitAnswerHandler(req: Request, res: Response) {
  const { sessionId, questionId, mode, difficulty, questionText, correctAnswer, userAnswer, elapsedMs } =
    req.body as {
      sessionId: number;
      questionId?: string;
      mode: "arithmetic" | "equation";
      difficulty: "easy" | "medium" | "hard";
      questionText: string;
      correctAnswer?: string;
      userAnswer: string;
      elapsedMs: number;
    };

  const session = await fetchSession(sessionId);
  if (!session) throw new NotFoundError("Session", sessionId);

  const result = await submitAnswer({
    sessionId,
    questionId,
    mode,
    difficulty,
    questionText,
    correctAnswer,
    userAnswer,
    elapsedMs,
  });

  res.json(result);
}



