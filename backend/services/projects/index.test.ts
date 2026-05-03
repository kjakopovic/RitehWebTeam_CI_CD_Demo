import express from "express";
import request from "supertest";
import projectsRouter from "./index";

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
app.use(projectsRouter);

describe("POST /projects", () => {
  it("should create a project and return 201", async () => {
    const project = { id: 1, name: "Test", description: "Desc", created_at: "2024-01-01" };
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [project] });

    const res = await request(app)
      .post("/projects")
      .send({ name: "Test", description: "Desc" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(project);
  });

  it("should create a project without description", async () => {
    const project = { id: 2, name: "No Desc", description: null, created_at: "2024-01-01" };
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [project] });

    const res = await request(app)
      .post("/projects")
      .send({ name: "No Desc" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(project);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/projects")
      .send({ description: "No name" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "name is required" });
  });

  it("should return 500 when database fails", async () => {
    (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app)
      .post("/projects")
      .send({ name: "Fail" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to create project" });
  });
});

describe("GET /projects", () => {
  it("should return all projects", async () => {
    const projects = [
      { id: 1, name: "P1", description: "D1", created_at: "2024-01-02" },
      { id: 2, name: "P2", description: null, created_at: "2024-01-01" },
    ];
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: projects });

    const res = await request(app).get("/projects");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(projects);
  });

  it("should return empty array when no projects exist", async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/projects");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should return 500 when database fails", async () => {
    (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/projects");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to fetch projects" });
  });
});
