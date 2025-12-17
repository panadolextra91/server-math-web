import request from "supertest";
import { createApp } from "../src/app";

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
});


