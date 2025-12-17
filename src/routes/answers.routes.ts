import { Router } from "express";
import { z } from "zod";
import { submitAnswerHandler } from "../controllers/answers.controller";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/async-handler";

const submitSchema = z.object({
  body: z.object({
    sessionId: z.coerce.number().int().positive(),
    questionId: z.string().optional(),
    mode: z.enum(["arithmetic", "equation"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    questionText: z.string().min(1),
    correctAnswer: z.string().optional(),
    userAnswer: z.string().min(1),
    elapsedMs: z.coerce.number().int().nonnegative(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const answersRouter = Router();

answersRouter.post(
  "/answers/submit",
  validate(submitSchema),
  asyncHandler(submitAnswerHandler),
);



