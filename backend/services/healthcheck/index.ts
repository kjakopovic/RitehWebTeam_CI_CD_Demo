import { Router } from "express";
import pool from "../../src/db";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck
 *     description: Check if the server and database are running
 *     responses:
 *       200:
 *         description: Healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Unhealthy
 */
router.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (_error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

/**
 * @openapi
 * /health/v2:
 *   get:
 *     summary: Healthcheck v2
 *     responses:
 *       200:
 *         description: Hello RWT
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello RWT
 */
router.get("/health/v2", (_req, res) => {
  res.status(200).json({ status: "ok", message: "hello RWT" });
});

export default router;
