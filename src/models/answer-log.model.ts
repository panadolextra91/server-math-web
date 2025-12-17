import { pool } from "../config/db";

export interface AnswerLogStats {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalScore: number;
  avgTimeMs: number | null;
  accuracy: number;
}

export async function insertAnswerLog(input: {
  sessionId: number;
  questionId?: number | null;
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  scoreDelta: number;
  elapsedMs: number;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO answer_logs
      (session_id, question_id, mode, difficulty, question_text, correct_answer, user_answer, is_correct, score_delta, elapsed_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.sessionId,
      input.questionId ?? null,
      input.mode,
      input.difficulty,
      input.questionText,
      input.correctAnswer,
      input.userAnswer,
      input.isCorrect ? 1 : 0,
      input.scoreDelta,
      input.elapsedMs,
    ],
  );
}

export async function getSessionAnswerStats(sessionId: number): Promise<AnswerLogStats> {
  const [rows] = await pool.execute(
    `SELECT
        COUNT(*) AS totalQuestions,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS totalCorrect,
        SUM(score_delta) AS totalScore,
        SUM(elapsed_ms) / NULLIF(COUNT(*), 0) AS avgTimeMs
     FROM answer_logs
     WHERE session_id = ?`,
    [sessionId],
  );

  const agg = (rows as any[])[0] ?? {};
  const totalQuestions = Number(agg.totalQuestions ?? 0);
  const totalCorrect = Number(agg.totalCorrect ?? 0);
  const totalWrong = Math.max(totalQuestions - totalCorrect, 0);
  const totalScore = Number(agg.totalScore ?? 0);
  const avgTimeMs =
    agg.avgTimeMs !== null && agg.avgTimeMs !== undefined ? Number(agg.avgTimeMs) : null;
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  return {
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalScore,
    avgTimeMs,
    accuracy,
  };
}



