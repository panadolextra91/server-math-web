import { pool } from "../config/db";

export interface PlayerStats {
  playerName: string;
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  avgTimeMs: number | null;
  totalScore: number;
  bestScore: number;
  byDifficulty: Array<{
    level: "easy" | "medium" | "hard";
    totalQuestions: number;
    accuracy: number;
    avgTimeMs: number | null;
  }>;
}

export async function getPlayerStats(playerName: string): Promise<PlayerStats | null> {
  // First check if player exists
  const [playerCheck] = await pool.execute(
    "SELECT COUNT(*) as count FROM sessions WHERE player_name = ?",
    [playerName],
  );

  const count = (playerCheck as any[])[0]?.count ?? 0;
  if (count === 0) {
    return null;
  }

  // Get overall stats
  // Optimized: removed subquery, calculate bestScore in a separate efficient query
  const [overallRows] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT s.id) AS totalSessions,
      COUNT(a.id) AS totalQuestions,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS totalCorrect,
      SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS totalWrong,
      AVG(CASE WHEN a.is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
      AVG(a.elapsed_ms) AS avgTimeMs,
      SUM(a.score_delta) AS totalScore
    FROM sessions s
    LEFT JOIN answer_logs a ON a.session_id = s.id
    WHERE s.player_name = ?
  `,
    [playerName],
  );

  const overall = (overallRows as any[])[0] ?? {};

  // Get best score separately (more efficient than subquery)
  const [bestScoreRows] = await pool.execute(
    `
    SELECT MAX(session_score) AS bestScore
    FROM (
      SELECT s.id, SUM(a.score_delta) AS session_score
      FROM sessions s
      JOIN answer_logs a ON a.session_id = s.id
      WHERE s.player_name = ?
      GROUP BY s.id
    ) session_scores
  `,
    [playerName],
  );

  const bestScore = Number((bestScoreRows as any[])[0]?.bestScore ?? 0);

  // Get stats by difficulty
  const [byDiffRows] = await pool.execute(
    `
    SELECT
      a.difficulty AS level,
      COUNT(*) AS totalQuestions,
      AVG(CASE WHEN a.is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
      AVG(a.elapsed_ms) AS avgTimeMs
    FROM answer_logs a
    JOIN sessions s ON s.id = a.session_id
    WHERE s.player_name = ?
    GROUP BY a.difficulty
  `,
    [playerName],
  );

  return {
    playerName,
    totalSessions: Number(overall.totalSessions ?? 0),
    totalQuestions: Number(overall.totalQuestions ?? 0),
    totalCorrect: Number(overall.totalCorrect ?? 0),
    totalWrong: Number(overall.totalWrong ?? 0),
    accuracy: Number(overall.accuracy ?? 0),
    avgTimeMs:
      overall.avgTimeMs !== null && overall.avgTimeMs !== undefined
        ? Number(overall.avgTimeMs)
        : null,
    totalScore: Number(overall.totalScore ?? 0),
    bestScore,
    byDifficulty: (byDiffRows as any[]).map((row) => ({
      level: row.level,
      totalQuestions: Number(row.totalQuestions ?? 0),
      accuracy: Number(row.accuracy ?? 0),
      avgTimeMs:
        row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
    })),
  };
}

