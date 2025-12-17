import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { sessionsRouter } from "./routes/sessions.routes";
import { questionsRouter } from "./routes/questions.routes";
import { answersRouter } from "./routes/answers.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { errorHandler } from "./middlewares/error-handler";
import { requestLogger } from "./middlewares/request-logger";

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
  app.use(requestLogger);

  app.use("/api", healthRouter);
  app.use("/api", sessionsRouter);
  app.use("/api", questionsRouter);
  app.use("/api", answersRouter);
  app.use("/api", analyticsRouter);

  app.use(errorHandler);

  return app;
}

