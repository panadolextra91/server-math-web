import { pool } from "../config/db";
import { leaderboardCache } from "../utils/cache";

export async function getAnalyticsOverview(level?: "easy" | "medium" | "hard") {
  const params: unknown[] = [];
  let levelCondition = "";
  if (level) {
    levelCondition = "WHERE difficulty = ?";
    params.push(level);
  }

  const [rows] = await pool.execute(
    `
    SELECT
      COUNT(DISTINCT s.player_name) AS totalPlayers,
      COUNT(DISTINCT s.id) AS totalSessions,
      COUNT(a.id) AS totalQuestions,
      AVG(CASE WHEN a.is_correct = 1 THEN 1.0 ELSE 0 END) AS avgAccuracy,
      AVG(a.elapsed_ms) AS avgTimeMs
    FROM sessions s
    LEFT JOIN answer_logs a ON a.session_id = s.id
    ${levelCondition}
  `,
    params,
  );

  const overall = (rows as any[])[0] ?? {};

  const [byDiffRows] = await pool.execute(
    `
    SELECT
      difficulty AS level,
      COUNT(*) AS totalQuestions,
      AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
      AVG(elapsed_ms) AS avgTimeMs
    FROM answer_logs
    GROUP BY difficulty
  `,
  );

  return {
    totalPlayers: Number(overall.totalPlayers ?? 0),
    totalSessions: Number(overall.totalSessions ?? 0),
    totalQuestions: Number(overall.totalQuestions ?? 0),
    avgAccuracy: Number(overall.avgAccuracy ?? 0),
    avgTimeMs: overall.avgTimeMs !== null && overall.avgTimeMs !== undefined ? Number(overall.avgTimeMs) : null,
    byDifficulty: (byDiffRows as any[]).map((row) => ({
      level: row.level,
      totalQuestions: Number(row.totalQuestions ?? 0),
      accuracy: Number(row.accuracy ?? 0),
      avgTimeMs:
        row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
    })),
  };
}

export async function getLeaderboard(params: {
  scope?: "all" | "weekly" | "daily";
  limit?: number;
  offset?: number;
  page?: number;
}) {
  const scope = params.scope ?? "all";
  const limit = Math.min(params.limit ?? 20, 100);
  
  // Calculate offset from page or use provided offset
  let offset = 0;
  if (params.page !== undefined && params.page > 0) {
    offset = (params.page - 1) * limit;
  } else if (params.offset !== undefined) {
    offset = Math.max(0, params.offset);
  }

  // Check cache first (cache key includes offset for pagination)
  const cacheKey = `leaderboard:${scope}:${limit}:${offset}`;
  const cached = leaderboardCache.get<{
    scope: string;
    updatedAt: string;
    entries: any[];
    pagination: {
      limit: number;
      offset: number;
      page: number | null;
      hasMore: boolean;
    };
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - query database
  let where = "";
  if (scope === "weekly") {
    where = "WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (scope === "daily") {
    where = "WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
  }

  // Get total count for pagination
  const [countRows] = await pool.query(
    `
    SELECT COUNT(DISTINCT s.player_name) AS total
    FROM answer_logs a
    JOIN sessions s ON s.id = a.session_id
    ${where}
  `,
  );
  const total = Number((countRows as any[])[0]?.total ?? 0);

  // Get paginated results
  const sql = `
    SELECT
      s.player_name AS playerName,
      COUNT(a.id) AS totalQuestions,
      SUM(a.score_delta) AS totalScore,
      AVG(CASE WHEN a.is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
      AVG(a.elapsed_ms) AS avgTimeMs
    FROM answer_logs a
    JOIN sessions s ON s.id = a.session_id
    ${where}
    GROUP BY s.player_name
    ORDER BY totalScore DESC, accuracy DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [rows] = await pool.query(sql);

  const entries = (rows as any[]).map((row, index) => ({
    rank: offset + index + 1,
    playerName: row.playerName,
    totalScore: Number(row.totalScore ?? 0),
    totalQuestions: Number(row.totalQuestions ?? 0),
    accuracy: Number(row.accuracy ?? 0),
    avgTimeMs:
      row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
  }));

  const currentPage = params.page ?? (offset > 0 ? Math.floor(offset / limit) + 1 : 1);
  const hasMore = offset + entries.length < total;

  const result = {
    scope,
    updatedAt: new Date().toISOString(),
    entries,
    pagination: {
      limit,
      offset,
      page: params.page ?? null,
      total,
      hasMore,
    },
  };

  // Cache for 60 seconds
  leaderboardCache.set(cacheKey, result, 60000);

  return result;
}


