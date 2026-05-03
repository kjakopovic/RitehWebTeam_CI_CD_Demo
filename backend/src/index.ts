import express from "express";
import swaggerUi from "swagger-ui-express";
import { runMigrations } from "./migrate";
import { swaggerSpec } from "./swagger";
import healthcheckRouter from "../services/healthcheck";
import projectsRouter from "../services/projects";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoints
app.use(healthcheckRouter);
app.use(projectsRouter);

export { app };

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
