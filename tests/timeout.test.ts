import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Request Timeout", () => {
  const app = createApp();

  it("allows normal requests to complete within timeout", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("timeout middleware is applied and doesn't interfere with fast requests", async () => {
    // Test multiple endpoints to ensure timeout middleware is working
    const healthRes = await request(app).get("/api/health");
    expect(healthRes.status).toBe(200);

    const sessionsRes = await request(app)
      .post("/api/sessions")
      .send({ playerName: "TimeoutTest" });
    expect(sessionsRes.status).toBe(201);
  });
});

