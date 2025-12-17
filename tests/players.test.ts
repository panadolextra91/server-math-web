import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Players API", () => {
  it("returns player statistics", async () => {
    const playerName = "StatsTestUser";

    // Create session and submit answers
    const sessionRes = await request(app)
      .post("/api/sessions")
      .send({ playerName, mode: "arithmetic", difficulty: "easy" })
      .expect(201);

    const sessionId = sessionRes.body.sessionId;

    // Submit a few answers
    for (let i = 0; i < 3; i++) {
      const qRes = await request(app)
        .post("/api/questions/generate")
        .send({ sessionId, mode: "arithmetic", difficulty: "easy" })
        .expect(200);

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
          elapsedMs: 3000 + i * 1000,
        })
        .expect(200);
    }

    // Get player stats
    const statsRes = await request(app)
      .get(`/api/players/${playerName}/stats`)
      .expect(200);

    expect(statsRes.body.playerName).toBe(playerName);
    expect(statsRes.body.totalSessions).toBeGreaterThanOrEqual(1);
    expect(statsRes.body.totalQuestions).toBeGreaterThanOrEqual(3);
    expect(typeof statsRes.body.totalCorrect).toBe("number");
    expect(typeof statsRes.body.totalWrong).toBe("number");
    expect(typeof statsRes.body.accuracy).toBe("number");
    expect(Array.isArray(statsRes.body.byDifficulty)).toBe(true);
  });

  it("returns 404 for non-existent player", async () => {
    const res = await request(app)
      .get("/api/players/NonExistentPlayer12345/stats")
      .expect(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(typeof res.body.error.requestId).toBe("string");
  });

  it("sanitizes player name in URL", async () => {
    // Test with special characters (should be sanitized then treated as not found)
    const res1 = await request(app)
      .get("/api/players/Test@User123/stats")
      .expect(404); // Should not find because special chars are removed
    expect(res1.body.error).toBeDefined();
    expect(res1.body.error.code).toBe("NOT_FOUND");

    // Test with spaces (should be trimmed)
    const res2 = await request(app)
      .get("/api/players/  StatsTestUser  /stats")
      .expect(200); // Should work after sanitization

    expect(res2.body.playerName).toBe("StatsTestUser");
  });
});

