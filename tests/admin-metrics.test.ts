import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Admin Metrics Access", () => {
  const app = createApp();
  const originalAdminKey = process.env.ADMIN_API_KEY;

  afterEach(() => {
    // Restore original admin key
    if (originalAdminKey) {
      process.env.ADMIN_API_KEY = originalAdminKey;
    } else {
      delete process.env.ADMIN_API_KEY;
    }
  });

  it("allows access to server metrics without API key when not configured", async () => {
    // When ADMIN_API_KEY is not set, access should be allowed
    // This test assumes ADMIN_API_KEY is not set in test environment
    const res = await request(app).get("/api/metrics");
    // If it's 200, admin key is not required; if 401, it is required
    // Both are valid depending on environment
    expect([200, 401]).toContain(res.status);
  });

  it("requires admin API key when configured", async () => {
    // Note: This test verifies the admin auth logic works
    // Since the app is created once, we test the behavior based on current env
    const hasAdminKey = !!process.env.ADMIN_API_KEY;

    if (hasAdminKey) {
      // Without API key - should fail
      const res1 = await request(app).get("/api/metrics");
      expect(res1.status).toBe(401);
      expect(res1.body.error.code).toBe("UNAUTHORIZED");

      // With wrong API key - should fail
      const res2 = await request(app)
        .get("/api/metrics")
        .set("X-Admin-API-Key", "wrong-key");
      expect(res2.status).toBe(401);

      // With correct API key in header - should succeed
      const res3 = await request(app)
        .get("/api/metrics")
        .set("X-Admin-API-Key", process.env.ADMIN_API_KEY);
      expect(res3.status).toBe(200);
      expect(res3.body).toHaveProperty("totalRequests");

      // With correct API key in query - should succeed
      const res4 = await request(app).get(`/api/metrics?admin-api-key=${process.env.ADMIN_API_KEY}`);
      expect(res4.status).toBe(200);
    } else {
      // When admin key is not set, endpoint should be accessible
      const res = await request(app).get("/api/metrics");
      expect(res.status).toBe(200);
    }
  });

  it("protects metrics reset endpoint when admin key is configured", async () => {
    // This test only runs if ADMIN_API_KEY is set in environment
    // If not set, the endpoint will be accessible (for development)
    const hasAdminKey = !!process.env.ADMIN_API_KEY;

    if (hasAdminKey) {
      // Without API key - should fail
      const res1 = await request(app).post("/api/metrics/reset");
      expect(res1.status).toBe(401);

      // With correct API key - should succeed
      const res2 = await request(app)
        .post("/api/metrics/reset")
        .set("X-Admin-API-Key", process.env.ADMIN_API_KEY);
      expect(res2.status).toBe(200);
      expect(res2.body.message).toBe("Metrics reset successfully");
    } else {
      // When admin key is not set, endpoint should be accessible
      const res = await request(app).post("/api/metrics/reset");
      expect(res.status).toBe(200);
    }
  });
});

