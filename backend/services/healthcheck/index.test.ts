import express from "express";
import request from "supertest";
import healthcheckRouter from "./index";

jest.mock("../../src/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

import pool from "../../src/db";
const mockPool = pool as jest.Mocked<typeof pool>;

const app = express();
app.use(express.json());
app.use(healthcheckRouter);

describe("GET /health", () => {
  it("should return 200 when database is connected", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "connected" });
  });

  it("should return 503 when database is disconnected", async () => {
    (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "error", database: "disconnected" });
  });
});

describe("GET /health/v2", () => {
  it("should return 200 with Hello RWT", async () => {
    const res = await request(app).get("/health/v2");

    expect(res.status).toBe(200);
    expect(res.text).toBe("Hello RWT");
  });
});
