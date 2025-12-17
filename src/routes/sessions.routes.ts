import { Router } from "express";
import { z } from "zod";
import {
  createSessionHandler,
  endSessionHandler,
  getSessionSummaryHandler,
} from "../controllers/sessions.controller";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/async-handler";

const createSessionSchema = z.object({
  body: z.object({
    playerName: z.string().min(1),
    mode: z.enum(["arithmetic", "equation"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

const sessionIdParamsSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    sessionId: z.coerce.number().int().positive(),
  }),
});

export const sessionsRouter = Router();

sessionsRouter.post(
  "/sessions",
  validate(createSessionSchema),
  asyncHandler(createSessionHandler),
);
sessionsRouter.patch(
  "/sessions/:sessionId/end",
  validate(sessionIdParamsSchema),
  asyncHandler(endSessionHandler),
);
sessionsRouter.get(
  "/sessions/:sessionId/summary",
  validate(sessionIdParamsSchema),
  asyncHandler(getSessionSummaryHandler),
);

