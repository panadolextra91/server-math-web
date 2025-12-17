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
  });
});


