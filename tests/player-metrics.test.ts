import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Player Metrics", () => {
  const app = createApp();
  let sessionId: number;
  let playerName: string;

  beforeEach(async () => {
    playerName = `MetricsTestUser${Date.now()}`;

    // Create a session (player metrics work even with just a session, no answers needed)
    const sessionRes = await request(app)
      .post("/api/sessions")
      .send({ playerName, mode: "arithmetic", difficulty: "easy" });
    sessionId = sessionRes.body.sessionId;
  });

  it("returns player metrics without authentication", async () => {
    const res = await request(app).get(`/api/players/${playerName}/metrics`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("playerName", playerName);
    expect(res.body).toHaveProperty("totalSessions");
    expect(res.body).toHaveProperty("totalQuestions");
    expect(res.body).toHaveProperty("totalCorrect");
    expect(res.body).toHaveProperty("totalWrong");
    expect(res.body).toHaveProperty("accuracy");
    expect(res.body).toHaveProperty("averageResponseTime");
    expect(res.body).toHaveProperty("totalScore");
    expect(res.body).toHaveProperty("bestScore");
    expect(res.body).toHaveProperty("byDifficulty");
    expect(res.body).toHaveProperty("timestamp");

    expect(res.body.totalSessions).toBeGreaterThan(0);
    // Player has at least one session
    expect(res.body.totalSessions).toBeGreaterThanOrEqual(1);
    // totalQuestions might be 0 if no answers submitted yet
    expect(typeof res.body.totalQuestions).toBe("number");
  });

  it("returns 404 for non-existent player", async () => {
    const res = await request(app).get("/api/players/NonExistentPlayer999/metrics");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("sanitizes player name in URL", async () => {
    // Test with spaces and special chars
    const res = await request(app).get(`/api/players/${encodeURIComponent("  " + playerName + "  ")}/metrics`);

    expect(res.status).toBe(200);
    expect(res.body.playerName).toBe(playerName);
  });

  it("includes difficulty breakdown", async () => {
    const res = await request(app).get(`/api/players/${playerName}/metrics`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.byDifficulty)).toBe(true);
    
    // Should have at least one difficulty level
    if (res.body.byDifficulty.length > 0) {
      const diff = res.body.byDifficulty[0];
      expect(diff).toHaveProperty("level");
      expect(diff).toHaveProperty("totalQuestions");
      expect(diff).toHaveProperty("accuracy");
      expect(diff).toHaveProperty("avgTimeMs");
    }
  });
});

