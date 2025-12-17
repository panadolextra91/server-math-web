import { pool } from "../config/db";
import type { Session, SessionSummary } from "../types/session";

export async function createSession(input: {
  playerName: string;
  mode?: "arithmetic" | "equation";
  difficulty?: "easy" | "medium" | "hard";
}): Promise<Session> {
  const [result] = await pool.execute(
    `INSERT INTO sessions (player_name, mode, difficulty) VALUES (?, ?, ?)`,
    [input.playerName, input.mode ?? null, input.difficulty ?? null],
  );

  const insertId = (result as { insertId: number }).insertId;
  return {
    id: insertId,
    playerName: input.playerName,
    mode: input.mode ?? null,
    difficulty: input.difficulty ?? null,
    startedAt: new Date(),
    finishedAt: null,
  };
}

export async function finishSession(sessionId: number): Promise<void> {
  await pool.execute(`UPDATE sessions SET finished_at = CURRENT_TIMESTAMP WHERE id = ?`, [sessionId]);
}

export async function getSession(sessionId: number): Promise<Session | null> {
  const [rows] = await pool.execute(
    `SELECT id, player_name, mode, difficulty, started_at, finished_at FROM sessions WHERE id = ?`,
    [sessionId],
  );

  const row = (rows as any[])[0];
  if (!row) return null;

  return {
    id: row.id,
    playerName: row.player_name,
    mode: row.mode,
    difficulty: row.difficulty,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function getSessionSummary(sessionId: number): Promise<SessionSummary | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const [aggRows] = await pool.execute(
    `SELECT
        COUNT(*) AS totalQuestions,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS totalCorrect,
        SUM(elapsed_ms) / NULLIF(COUNT(*), 0) AS avgTimeMs,
        SUM(score_delta) AS totalScore
     FROM answer_logs
     WHERE session_id = ?`,
    [sessionId],
  );

  const agg = (aggRows as any[])[0] ?? {};
  const totalQuestions = Number(agg.totalQuestions ?? 0);
  const totalCorrect = Number(agg.totalCorrect ?? 0);
  const totalWrong = Math.max(totalQuestions - totalCorrect, 0);
  const avgTimeMs = agg.avgTimeMs !== null && agg.avgTimeMs !== undefined ? Number(agg.avgTimeMs) : null;
  const totalScore = Number(agg.totalScore ?? 0);
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  const [historyRows] = await pool.execute(
    `SELECT id, question_text, is_correct, score_delta, elapsed_ms, created_at
     FROM answer_logs
     WHERE session_id = ?
     ORDER BY created_at DESC, id DESC`,
    [sessionId],
  );

  const history = (historyRows as any[]).map((row) => ({
    id: row.id,
    questionText: row.question_text,
    isCorrect: row.is_correct === 1,
    scoreDelta: row.score_delta,
    elapsedMs: row.elapsed_ms,
    createdAt: row.created_at,
  }));

  return {
    sessionId: session.id,
    mode: session.mode,
    difficulty: session.difficulty,
    totalQuestions,
    totalCorrect,
    totalWrong,
    accuracy,
    avgTimeMs,
    totalScore,
    history,
  };
}

/**
 * Closes sessions that have been inactive for more than the specified minutes
 * @param inactiveMinutes - Number of minutes of inactivity before closing (default: 30)
 * @returns Number of sessions closed
 */
export async function closeInactiveSessions(inactiveMinutes: number = 30): Promise<number> {
  const [result] = await pool.execute(
    `
    UPDATE sessions
    SET finished_at = CURRENT_TIMESTAMP
    WHERE finished_at IS NULL
      AND started_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `,
    [inactiveMinutes],
  );

  return (result as { affectedRows: number }).affectedRows;
}

