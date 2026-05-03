import express from "express";
import pool from "./db";
import { runMigrations } from "./migrate";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Healthcheck endpoint
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// POST - create a new project
app.post("/projects", async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const result = await pool.query(
      "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *",
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

// GET - list all projects
app.get("/projects", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
