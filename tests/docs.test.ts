import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("API Docs", () => {
  it("serves swagger UI", async () => {
    const res = await request(app).get("/api/docs").redirects(1);
    expect(res.status).toBe(200);
    // Swagger UI serves HTML content
    expect(res.text).toContain("swagger");
  });

  it("serves openapi json", async () => {
    const res = await request(app).get("/api/docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBeDefined();
    expect(res.body.info?.title).toBe("Math Learning Game API");
  });
});


