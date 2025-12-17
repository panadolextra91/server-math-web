import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { sessionsRouter } from "./routes/sessions.routes";
import { questionsRouter } from "./routes/questions.routes";
import { answersRouter } from "./routes/answers.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { playersRouter } from "./routes/players.routes";
import { docsRouter } from "./routes/docs.routes";
import { metricsRouter } from "./routes/metrics.routes";
import { errorHandler } from "./middlewares/error-handler";
import { requestLogger } from "./middlewares/request-logger";
import { requestIdMiddleware } from "./middlewares/request-id";
import { timeoutMiddleware } from "./middlewares/timeout";
import { metricsMiddleware } from "./middlewares/metrics";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors(
      env.FRONTEND_ORIGIN
        ? { origin: env.FRONTEND_ORIGIN }
        : { origin: true }, // allow all in absence of config
    ),
  );
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(metricsMiddleware);
  app.use(timeoutMiddleware(env.REQUEST_TIMEOUT_MS));

  app.use("/api", healthRouter);
  app.use("/api", sessionsRouter);
  app.use("/api", questionsRouter);
  app.use("/api", answersRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", playersRouter);
  app.use("/api", docsRouter);
  app.use("/api", metricsRouter);

  app.use(errorHandler);

  return app;
}

