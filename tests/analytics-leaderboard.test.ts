import request from "supertest";
import { createApp } from "../src/app";
import { leaderboardCache } from "../src/utils/cache";

const app = createApp();

describe("Analytics & Leaderboard", () => {
  it("returns analytics overview and leaderboard entries", async () => {
    // create at least one session + answer so leaderboard has data
    const sessionRes = await request(app)
      .post("/api/sessions")
      .send({ playerName: "LeaderboardUser", mode: "arithmetic", difficulty: "easy" })
      .expect(201);

    const sessionId: number = sessionRes.body.sessionId;

    const qRes = await request(app)
      .post("/api/questions/generate")
      .send({ sessionId, mode: "arithmetic", difficulty: "easy" })
      .expect(200);

    await request(app)
      .post("/api/answers/submit")
      .send({
        sessionId,
        questionId: qRes.body.questionId,
        mode: "arithmetic",
        difficulty: "easy",
        questionText: qRes.body.questionText,
        userAnswer: "0", // may be wrong, but still logs data
        elapsedMs: 5000,
      })
      .expect(200);

    const analyticsRes = await request(app).get("/api/analytics/overview").expect(200);
    expect(typeof analyticsRes.body.totalSessions).toBe("number");

    const leaderboardRes = await request(app).get("/api/leaderboard").expect(200);
    expect(Array.isArray(leaderboardRes.body.entries)).toBe(true);
  });

  it("caches leaderboard results and invalidates on new answer", async () => {
    // Clear cache before test
    leaderboardCache.clear();

    // Create a session and submit an answer to have some data
    const sessionRes = await request(app)
      .post("/api/sessions")
      .send({ playerName: "CacheTestUser", mode: "arithmetic", difficulty: "easy" })
      .expect(201);

    const sessionId: number = sessionRes.body.sessionId;

    const qRes = await request(app)
      .post("/api/questions/generate")
      .send({ sessionId, mode: "arithmetic", difficulty: "easy" })
      .expect(200);

    // Submit correct answer
    const correctAnswer = qRes.body.payload.operands[0] + qRes.body.payload.operands[1];
    await request(app)
      .post("/api/answers/submit")
      .send({
        sessionId,
        questionId: qRes.body.questionId,
        mode: "arithmetic",
        difficulty: "easy",
        questionText: qRes.body.questionText,
        userAnswer: String(correctAnswer),
        elapsedMs: 3000,
      })
      .expect(200);

    // First request - should cache the result
    const firstRes = await request(app).get("/api/leaderboard?scope=all&limit=20").expect(200);
    const firstUpdatedAt = firstRes.body.updatedAt;
    const firstEntries = firstRes.body.entries;

    // Verify cache was populated
    const cacheKey = "leaderboard:all:20";
    const cached = leaderboardCache.get(cacheKey);
    expect(cached).not.toBeNull();
    expect(cached?.scope).toBe("all");
    expect(cached?.entries.length).toBe(firstEntries.length);

    // Second request immediately after - should return cached data
    const secondRes = await request(app).get("/api/leaderboard?scope=all&limit=20").expect(200);
    const secondUpdatedAt = secondRes.body.updatedAt;

    // Should have same updatedAt timestamp (from cache)
    expect(secondUpdatedAt).toBe(firstUpdatedAt);
    expect(secondRes.body.entries.length).toBe(firstEntries.length);

    // Submit another answer - this should invalidate cache
    const qRes2 = await request(app)
      .post("/api/questions/generate")
      .send({ sessionId, mode: "arithmetic", difficulty: "easy" })
      .expect(200);

    const correctAnswer2 = qRes2.body.payload.operands[0] + qRes2.body.payload.operands[1];
    await request(app)
      .post("/api/answers/submit")
      .send({
        sessionId,
        questionId: qRes2.body.questionId,
        mode: "arithmetic",
        difficulty: "easy",
        questionText: qRes2.body.questionText,
        userAnswer: String(correctAnswer2),
        elapsedMs: 2500,
      })
      .expect(200);

    // Cache should be cleared after answer submission
    const cacheAfterAnswer = leaderboardCache.get(cacheKey);
    expect(cacheAfterAnswer).toBeNull();

    // Third request - should hit DB again (cache miss) and have new updatedAt
    const thirdRes = await request(app).get("/api/leaderboard?scope=all&limit=20").expect(200);
    const thirdUpdatedAt = thirdRes.body.updatedAt;

    // Should have different updatedAt (fresh from DB)
    expect(thirdUpdatedAt).not.toBe(firstUpdatedAt);
    // Should have more entries or updated scores
    expect(thirdRes.body.entries.length).toBeGreaterThanOrEqual(firstEntries.length);
  });
});


