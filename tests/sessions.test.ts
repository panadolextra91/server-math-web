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

  it("sanitizes player name input", async () => {
    // Test trimming
    const res1 = await request(app)
      .post("/api/sessions")
      .send({ playerName: "  TrimmedUser  ", mode: "arithmetic" })
      .expect(201);
    expect(res1.body.playerName).toBe("TrimmedUser");

    // Test special character removal
    const res2 = await request(app)
      .post("/api/sessions")
      .send({ playerName: "User@#$%Name123", mode: "arithmetic" })
      .expect(201);
    expect(res2.body.playerName).toBe("UserName123");

    // Test length limit (64 chars)
    const longName = "A".repeat(100);
    const res3 = await request(app)
      .post("/api/sessions")
      .send({ playerName: longName, mode: "arithmetic" })
      .expect(201);
    expect(res3.body.playerName.length).toBeLessThanOrEqual(64);

    // Test invalid names - should return standardized error response
    const invalidRes1 = await request(app)
      .post("/api/sessions")
      .send({ playerName: "", mode: "arithmetic" })
      .expect(400);
    expect(invalidRes1.body.error).toBeDefined();
    expect(invalidRes1.body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof invalidRes1.body.error.requestId).toBe("string");

    const invalidRes2 = await request(app)
      .post("/api/sessions")
      .send({ playerName: "   ", mode: "arithmetic" })
      .expect(400);
    expect(invalidRes2.body.error.code).toBe("INVALID_INPUT");

    const invalidRes3 = await request(app)
      .post("/api/sessions")
      .send({ playerName: "@#$%", mode: "arithmetic" })
      .expect(400);
    expect(invalidRes3.body.error.code).toBe("INVALID_INPUT");
  });
});


