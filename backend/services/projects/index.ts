import { Router } from "express";
import pool from "../../src/db";

const router = Router();

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create a new project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Project
 *               description:
 *                 type: string
 *                 example: A sample project
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Missing name
 *       500:
 *         description: Server error
 */
router.post("/projects", async (req, res) => {
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
  } catch (_error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List all projects
 *     responses:
 *       200:
 *         description: Array of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get("/projects", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (_error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

export default router;
