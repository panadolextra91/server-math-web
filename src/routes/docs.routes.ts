import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiSpec } from "../docs/swagger";

export const docsRouter = Router();

const spec = buildOpenApiSpec();

docsRouter.get("/docs.json", (_req, res) => {
  res.json(spec);
});

docsRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));


