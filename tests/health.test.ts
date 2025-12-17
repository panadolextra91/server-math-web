import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Health API", () => {
  it("returns ok status with database connectivity check", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptimeMs).toBe("number");
    expect(res.body.env).toBeDefined();
    expect(res.body.database).toBeDefined();
    expect(res.body.database.status).toBe("connected");
    expect(typeof res.body.database.responseTimeMs).toBe("number");

    // Request ID header should be present
    const requestId = res.headers["x-request-id"];
    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);
  });

  it("generates a unique request ID per request", async () => {
    const res1 = await request(app).get("/api/health");
    const res2 = await request(app).get("/api/health");

    const id1 = res1.headers["x-request-id"];
    const id2 = res2.headers["x-request-id"];

    expect(typeof id1).toBe("string");
    expect(typeof id2).toBe("string");
    expect(id1).not.toBe(id2);
  });
});


