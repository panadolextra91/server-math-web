import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { metricsCollector } from "../src/services/metrics.service";

describe("Metrics API", () => {
  const app = createApp();
  const adminApiKey = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    // Reset metrics before each test
    metricsCollector.reset();
  });

  const getMetricsRequest = () => {
    const req = request(app).get("/api/metrics");
    if (adminApiKey) {
      return req.set("X-Admin-API-Key", adminApiKey);
    }
    return req;
  };

  const resetMetricsRequest = () => {
    const req = request(app).post("/api/metrics/reset");
    if (adminApiKey) {
      return req.set("X-Admin-API-Key", adminApiKey);
    }
    return req;
  };

  it("returns metrics snapshot", async () => {
    // Make some requests to generate metrics
    await request(app).get("/api/health");
    await request(app).get("/api/health");
    await request(app).post("/api/sessions").send({ playerName: "TestUser" });

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalRequests");
    expect(res.body).toHaveProperty("totalErrors");
    expect(res.body).toHaveProperty("averageResponseTime");
    expect(res.body).toHaveProperty("minResponseTime");
    expect(res.body).toHaveProperty("maxResponseTime");
    expect(res.body).toHaveProperty("requestsPerSecond");
    expect(res.body).toHaveProperty("statusCodes");
    expect(res.body).toHaveProperty("endpoints");
    expect(res.body).toHaveProperty("responseTimePercentiles");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
    // Check for enhanced analytics
    expect(res.body).toHaveProperty("analytics");
    expect(res.body.analytics).toHaveProperty("players");
    expect(res.body.analytics).toHaveProperty("questions");
    expect(res.body.analytics).toHaveProperty("topics");

    // Verify metrics are populated
    expect(res.body.totalRequests).toBeGreaterThan(0);
    expect(res.body.statusCodes).toHaveProperty("200");
    expect(Object.keys(res.body.endpoints).length).toBeGreaterThan(0);
  });

  it("tracks response times correctly", async () => {
    await request(app).get("/api/health");

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    expect(res.body.averageResponseTime).toBeGreaterThanOrEqual(0);
    expect(res.body.minResponseTime).toBeGreaterThanOrEqual(0);
    expect(res.body.maxResponseTime).toBeGreaterThanOrEqual(0);
    expect(res.body.maxResponseTime).toBeGreaterThanOrEqual(res.body.minResponseTime);
  });

  it("tracks status codes", async () => {
    await request(app).get("/api/health");
    await request(app).get("/api/sessions/99999/summary"); // 404

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    expect(res.body.statusCodes).toHaveProperty("200");
    expect(res.body.statusCodes).toHaveProperty("404");
  });

  it("tracks endpoints with normalized paths", async () => {
    await request(app).get("/api/health");
    await request(app).get("/api/sessions/1/summary");
    await request(app).get("/api/sessions/2/summary");

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    // Should group /sessions/:id/summary together
    const endpointKey = "GET /sessions/:id/summary";
    expect(res.body.endpoints).toHaveProperty(endpointKey);
    expect(res.body.endpoints[endpointKey].count).toBeGreaterThanOrEqual(2);
  });

  it("calculates percentiles", async () => {
    // Make multiple requests
    for (let i = 0; i < 10; i++) {
      await request(app).get("/api/health");
    }

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    expect(res.body.responseTimePercentiles).toHaveProperty("p50");
    expect(res.body.responseTimePercentiles).toHaveProperty("p95");
    expect(res.body.responseTimePercentiles).toHaveProperty("p99");
    expect(res.body.responseTimePercentiles.p99).toBeGreaterThanOrEqual(res.body.responseTimePercentiles.p50);
  });

  it("resets metrics", async () => {
    await request(app).get("/api/health");

    let res = await getMetricsRequest();
    const initialCount = res.body?.totalRequests ?? 0;
    expect(initialCount).toBeGreaterThan(0);

    res = await resetMetricsRequest();
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Metrics reset successfully");

    // After reset, only the metrics request itself should be counted
    res = await getMetricsRequest();
    // The reset request and this metrics request are counted
    expect(res.body.totalRequests).toBeLessThanOrEqual(2);
  });

  it("tracks errors (5xx status codes)", async () => {
    // Note: We can't easily trigger 5xx errors in tests without mocking
    // But we can verify the structure is there
    await request(app).get("/api/health");

    const res = await getMetricsRequest();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalErrors");
    expect(typeof res.body.totalErrors).toBe("number");
    // Check if analytics are included
    if (res.body.analytics) {
      expect(res.body.analytics).toHaveProperty("players");
      expect(res.body.analytics).toHaveProperty("questions");
      expect(res.body.analytics).toHaveProperty("topics");
    }
  });
});

