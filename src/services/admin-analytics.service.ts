import { pool } from "../config/db";

export interface AdminAnalytics {
  players: {
    total: number;
    today: number;
    thisMonth: number;
    activeToday: number; // Players who answered questions today
  };
  sessions: {
    total: number;
    active: number; // Sessions not finished
    completed: number;
    today: number;
    thisMonth: number;
    avgDuration: number | null; // Average session duration in minutes
  };
  questions: {
    total: number;
    today: number;
    thisMonth: number;
    totalCorrect: number;
    totalWrong: number;
    overallAccuracy: number;
    todayAccuracy: number;
    thisMonthAccuracy: number;
  };
  topics: {
    mostPlayed: {
      mode: string | null;
      difficulty: string | null;
      count: number;
    };
    byMode: Array<{
      mode: string;
      count: number;
      accuracy: number;
      avgTimeMs: number | null;
    }>;
    byDifficulty: Array<{
      difficulty: string;
      count: number;
      accuracy: number;
      avgTimeMs: number | null;
    }>;
    byModeAndDifficulty: Array<{
      mode: string;
      difficulty: string;
      count: number;
      accuracy: number;
    }>;
  };
  performance: {
    avgResponseTime: number | null;
    avgResponseTimeToday: number | null;
    fastestAvgResponseTime: {
      mode: string | null;
      difficulty: string | null;
      avgTimeMs: number | null;
    };
    highestAccuracy: {
      mode: string | null;
      difficulty: string | null;
      accuracy: number;
    };
  };
  activity: {
    peakHour: number | null; // Hour of day (0-23) with most activity
    questionsPerHour: Array<{
      hour: number;
      count: number;
    }>;
  };
  scores: {
    totalScore: number;
    avgScorePerSession: number | null;
    highestScore: number;
    avgScorePerQuestion: number | null;
  };
  timestamp: string;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  // Players statistics
  const [playersTotal] = await pool.execute(
    "SELECT COUNT(DISTINCT player_name) AS total FROM sessions"
  );
  const [playersToday] = await pool.execute(
    `SELECT COUNT(DISTINCT s.player_name) AS total
     FROM sessions s
     WHERE DATE(s.started_at) = CURDATE()`
  );
  const [playersThisMonth] = await pool.execute(
    `SELECT COUNT(DISTINCT s.player_name) AS total
     FROM sessions s
     WHERE YEAR(s.started_at) = YEAR(CURDATE())
       AND MONTH(s.started_at) = MONTH(CURDATE())`
  );
  const [activePlayersToday] = await pool.execute(
    `SELECT COUNT(DISTINCT s.player_name) AS total
     FROM sessions s
     JOIN answer_logs a ON a.session_id = s.id
     WHERE DATE(a.created_at) = CURDATE()`
  );

  // Sessions statistics
  const [sessionsTotal] = await pool.execute(
    "SELECT COUNT(*) AS total FROM sessions"
  );
  const [sessionsActive] = await pool.execute(
    "SELECT COUNT(*) AS total FROM sessions WHERE finished_at IS NULL"
  );
  const [sessionsCompleted] = await pool.execute(
    "SELECT COUNT(*) AS total FROM sessions WHERE finished_at IS NOT NULL"
  );
  const [sessionsToday] = await pool.execute(
    `SELECT COUNT(*) AS total FROM sessions WHERE DATE(started_at) = CURDATE()`
  );
  const [sessionsThisMonth] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM sessions
     WHERE YEAR(started_at) = YEAR(CURDATE())
       AND MONTH(started_at) = MONTH(CURDATE())`
  );
  const [avgSessionDuration] = await pool.execute(
    `SELECT AVG(TIMESTAMPDIFF(MINUTE, started_at, finished_at)) AS avgDuration
     FROM sessions
     WHERE finished_at IS NOT NULL`
  );

  // Questions statistics
  const [questionsTotal] = await pool.execute(
    "SELECT COUNT(*) AS total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct, SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong FROM answer_logs"
  );
  const [questionsToday] = await pool.execute(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
            SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong
     FROM answer_logs
     WHERE DATE(created_at) = CURDATE()`
  );
  const [questionsThisMonth] = await pool.execute(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
            SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS wrong
     FROM answer_logs
     WHERE YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE())`
  );

  // Topics/Mode/Difficulty statistics
  const [mostPlayedTopic] = await pool.execute(
    `SELECT mode, difficulty, COUNT(*) AS count
     FROM answer_logs
     GROUP BY mode, difficulty
     ORDER BY count DESC
     LIMIT 1`
  );
  const [byMode] = await pool.execute(
    `SELECT
       mode,
       COUNT(*) AS count,
       AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
       AVG(elapsed_ms) AS avgTimeMs
     FROM answer_logs
     GROUP BY mode`
  );
  const [byDifficulty] = await pool.execute(
    `SELECT
       difficulty,
       COUNT(*) AS count,
       AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy,
       AVG(elapsed_ms) AS avgTimeMs
     FROM answer_logs
     GROUP BY difficulty`
  );
  const [byModeAndDifficulty] = await pool.execute(
    `SELECT
       mode,
       difficulty,
       COUNT(*) AS count,
       AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy
     FROM answer_logs
     GROUP BY mode, difficulty
     ORDER BY count DESC`
  );

  // Performance statistics
  const [avgResponseTime] = await pool.execute(
    "SELECT AVG(elapsed_ms) AS avgTime FROM answer_logs"
  );
  const [avgResponseTimeToday] = await pool.execute(
    `SELECT AVG(elapsed_ms) AS avgTime
     FROM answer_logs
     WHERE DATE(created_at) = CURDATE()`
  );
  const [fastestAvgResponse] = await pool.execute(
    `SELECT mode, difficulty, AVG(elapsed_ms) AS avgTimeMs
     FROM answer_logs
     GROUP BY mode, difficulty
     ORDER BY avgTimeMs ASC
     LIMIT 1`
  );
  const [highestAccuracy] = await pool.execute(
    `SELECT mode, difficulty, AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0 END) AS accuracy
     FROM answer_logs
     GROUP BY mode, difficulty
     HAVING COUNT(*) >= 10
     ORDER BY accuracy DESC
     LIMIT 1`
  );

  // Activity statistics (peak hours)
  const [questionsPerHour] = await pool.execute(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS count
     FROM answer_logs
     GROUP BY HOUR(created_at)
     ORDER BY hour`
  );

  // Score statistics
  const [scoreStats] = await pool.execute(
    `SELECT
       SUM(score_delta) AS totalScore,
       MAX(score_delta) AS highestScore,
       AVG(score_delta) AS avgScorePerQuestion
     FROM answer_logs`
  );
  const [avgScorePerSession] = await pool.execute(
    `SELECT AVG(session_score) AS avgScore
     FROM (
       SELECT session_id, SUM(score_delta) AS session_score
       FROM answer_logs
       GROUP BY session_id
     ) session_scores`
  );

  // Process results
  const playersData = {
    total: Number((playersTotal as any[])[0]?.total ?? 0),
    today: Number((playersToday as any[])[0]?.total ?? 0),
    thisMonth: Number((playersThisMonth as any[])[0]?.total ?? 0),
    activeToday: Number((activePlayersToday as any[])[0]?.total ?? 0),
  };

  const sessionsData = {
    total: Number((sessionsTotal as any[])[0]?.total ?? 0),
    active: Number((sessionsActive as any[])[0]?.total ?? 0),
    completed: Number((sessionsCompleted as any[])[0]?.total ?? 0),
    today: Number((sessionsToday as any[])[0]?.total ?? 0),
    thisMonth: Number((sessionsThisMonth as any[])[0]?.total ?? 0),
    avgDuration:
      avgSessionDuration && (avgSessionDuration as any[])[0]?.avgDuration !== null
        ? Number((avgSessionDuration as any[])[0].avgDuration)
        : null,
  };

  const qTotal = (questionsTotal as any[])[0] ?? {};
  const qToday = (questionsToday as any[])[0] ?? {};
  const qThisMonth = (questionsThisMonth as any[])[0] ?? {};

  const totalQ = Number(qTotal.total ?? 0);
  const totalCorrect = Number(qTotal.correct ?? 0);
  const totalWrong = Number(qTotal.wrong ?? 0);

  const questionsData = {
    total: totalQ,
    today: Number(qToday.total ?? 0),
    thisMonth: Number(qThisMonth.total ?? 0),
    totalCorrect,
    totalWrong,
    overallAccuracy: totalQ > 0 ? totalCorrect / totalQ : 0,
    todayAccuracy:
      Number(qToday.total ?? 0) > 0
        ? Number(qToday.correct ?? 0) / Number(qToday.total ?? 0)
        : 0,
    thisMonthAccuracy:
      Number(qThisMonth.total ?? 0) > 0
        ? Number(qThisMonth.correct ?? 0) / Number(qThisMonth.total ?? 0)
        : 0,
  };

  const mostPlayed = (mostPlayedTopic as any[])[0] ?? {};
  const fastest = (fastestAvgResponse as any[])[0] ?? {};
  const highestAcc = (highestAccuracy as any[])[0] ?? {};
  const scoreData = (scoreStats as any[])[0] ?? {};

  // Find peak hour
  const hourData = (questionsPerHour as any[]) || [];
  const peakHourData =
    hourData.length > 0
      ? hourData.reduce((max, curr) => (curr.count > max.count ? curr : max), hourData[0])
      : null;

  return {
    players: playersData,
    sessions: sessionsData,
    questions: questionsData,
    topics: {
      mostPlayed: {
        mode: mostPlayed.mode || null,
        difficulty: mostPlayed.difficulty || null,
        count: Number(mostPlayed.count ?? 0),
      },
      byMode: (byMode as any[]).map((row) => ({
        mode: row.mode,
        count: Number(row.count ?? 0),
        accuracy: Number(row.accuracy ?? 0),
        avgTimeMs: row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
      })),
      byDifficulty: (byDifficulty as any[]).map((row) => ({
        difficulty: row.difficulty,
        count: Number(row.count ?? 0),
        accuracy: Number(row.accuracy ?? 0),
        avgTimeMs: row.avgTimeMs !== null && row.avgTimeMs !== undefined ? Number(row.avgTimeMs) : null,
      })),
      byModeAndDifficulty: (byModeAndDifficulty as any[]).map((row) => ({
        mode: row.mode,
        difficulty: row.difficulty,
        count: Number(row.count ?? 0),
        accuracy: Number(row.accuracy ?? 0),
      })),
    },
    performance: {
      avgResponseTime:
        avgResponseTime && (avgResponseTime as any[])[0]?.avgTime !== null
          ? Number((avgResponseTime as any[])[0].avgTime)
          : null,
      avgResponseTimeToday:
        avgResponseTimeToday && (avgResponseTimeToday as any[])[0]?.avgTime !== null
          ? Number((avgResponseTimeToday as any[])[0].avgTime)
          : null,
      fastestAvgResponseTime: {
        mode: fastest.mode || null,
        difficulty: fastest.difficulty || null,
        avgTimeMs: fastest.avgTimeMs !== null && fastest.avgTimeMs !== undefined ? Number(fastest.avgTimeMs) : null,
      },
      highestAccuracy: {
        mode: highestAcc.mode || null,
        difficulty: highestAcc.difficulty || null,
        accuracy: Number(highestAcc.accuracy ?? 0),
      },
    },
    activity: {
      peakHour: peakHourData ? Number(peakHourData.hour) : null,
      questionsPerHour: hourData.map((row) => ({
        hour: Number(row.hour),
        count: Number(row.count ?? 0),
      })),
    },
    scores: {
      totalScore: Number(scoreData.totalScore ?? 0),
      avgScorePerSession:
        avgScorePerSession && (avgScorePerSession as any[])[0]?.avgScore !== null
          ? Number((avgScorePerSession as any[])[0].avgScore)
          : null,
      highestScore: Number(scoreData.highestScore ?? 0),
      avgScorePerQuestion:
        scoreData.avgScorePerQuestion !== null && scoreData.avgScorePerQuestion !== undefined
          ? Number(scoreData.avgScorePerQuestion)
          : null,
    },
    timestamp: new Date().toISOString(),
  };
}

