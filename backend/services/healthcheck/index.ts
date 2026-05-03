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

export default router;
