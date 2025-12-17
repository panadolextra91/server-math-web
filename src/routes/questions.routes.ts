import { Router } from "express";
import { z } from "zod";
import { generateQuestionHandler } from "../controllers/questions.controller";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/async-handler";

const generateSchema = z.object({
  body: z.object({
    sessionId: z.coerce.number().int().positive(),
    mode: z.enum(["arithmetic", "equation"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const questionsRouter = Router();

questionsRouter.post(
  "/questions/generate",
  validate(generateSchema),
  asyncHandler(generateQuestionHandler),
);



