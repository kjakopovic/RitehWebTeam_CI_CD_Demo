import path from "path";
import migrate from "node-pg-migrate";

export async function runMigrations(): Promise<void> {
  await migrate({
    databaseUrl: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "projects_db",
    },
    dir: path.resolve(__dirname, "../migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    log: console.log,
  });
  console.log("Migrations completed successfully");
}
