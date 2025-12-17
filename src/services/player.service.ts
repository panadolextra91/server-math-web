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
  const [overallRows] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT s.id) AS totalSessions,
      COUNT(a.id) AS totalQuestions,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS totalCorrect,
      SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS totalWrong,
      AVG(CASE WHEN a.is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
      AVG(a.elapsed_ms) AS avgTimeMs,
      SUM(a.score_delta) AS totalScore,
      MAX(s2.total_score) AS bestScore
    FROM sessions s
    LEFT JOIN answer_logs a ON a.session_id = s.id
    LEFT JOIN (
      SELECT session_id, SUM(score_delta) AS total_score
      FROM answer_logs
      GROUP BY session_id
    ) s2 ON s2.session_id = s.id
    WHERE s.player_name = ?
  `,
    [playerName],
  );

  const overall = (overallRows as any[])[0] ?? {};

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
    bestScore: Number(overall.bestScore ?? 0),
    byDifficulty: (byDiffRows as any[]).map((row) => ({
      level: row.level,
      totalQuestions: Number(row.totalQuestions ?? 0),
      accuracy: Number(row.accuracy ?? 0),
      avgTimeMs:
        row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
    })),
  };
}

