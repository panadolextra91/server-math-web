import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Sessions API", () => {
  it("creates a session and can fetch summary", async () => {
    const createRes = await request(app)
      .post("/api/sessions")
      .send({ playerName: "TestUser", mode: "arithmetic", difficulty: "easy" })
      .expect(201);

    const sessionId = createRes.body.sessionId;
    expect(typeof sessionId).toBe("number");

    const summaryRes = await request(app)
      .get(`/api/sessions/${sessionId}/summary`)
      .expect(200);

    expect(summaryRes.body.sessionId).toBe(sessionId);
    expect(summaryRes.body.totalQuestions).toBe(0);
  });
});


