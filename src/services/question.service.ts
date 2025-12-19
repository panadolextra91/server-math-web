import { generateArithmeticQuestion } from "../logic/arithmetic-generator";
import { generateEquationQuestion } from "../logic/equation-generator";
import { insertQuestion } from "../models/question.model";
import { env } from "../config/env";
import { generateQuestionFromGenAI } from "./genai-quiz.service";
import { logger } from "../utils/logger";

export async function generateQuestion(input: {
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
}) {
  // If external GenAI quiz model is configured, delegate question generation to it.
  if (env.GENAI_BASE_URL) {
    try {
      const generated = await generateQuestionFromGenAI({
        mode: input.mode,
        difficulty: input.difficulty,
      });

      const questionId = await insertQuestion({
        mode: input.mode,
        difficulty: input.difficulty,
        payload: generated.payload,
        answer: String(generated.answer),
      });

      return {
        questionId: String(questionId),
        mode: input.mode,
        difficulty: input.difficulty,
        type:
          input.mode === "arithmetic"
            ? ("arithmetic" as const)
            : ("equation" as const),
        questionText: generated.questionText,
        payload: generated.payload,
        maxTimeMs: generated.maxTimeMs,
        source: "genai" as const,
      };
    } catch (err) {
      logger.warn("GenAI quiz service failed, falling back to local generator", {
        error:
          err instanceof Error
            ? { name: err.name, message: err.message }
            : err,
        baseUrl: env.GENAI_BASE_URL,
      });
      // fall through to local generators below
    }
  }

  // Fallback: use built‑in deterministic generators.
  if (input.mode === "arithmetic") {
    const generated = generateArithmeticQuestion(input.difficulty);
    const questionId = await insertQuestion({
      mode: input.mode,
      difficulty: input.difficulty,
      payload: generated.payload,
      answer: String(generated.answer),
    });

    return {
      questionId: String(questionId),
      mode: input.mode,
      difficulty: input.difficulty,
      type: "arithmetic" as const,
      questionText: generated.questionText,
      payload: generated.payload,
      maxTimeMs: generated.maxTimeMs,
      source: "local" as const,
    };
  }

  const generated = generateEquationQuestion(input.difficulty);
  const questionId = await insertQuestion({
    mode: input.mode,
    difficulty: input.difficulty,
    payload: generated.payload,
    answer: String(generated.answer),
  });

  return {
    questionId: String(questionId),
    mode: input.mode,
    difficulty: input.difficulty,
    type: "equation" as const,
    questionText: generated.questionText,
    payload: generated.payload,
    maxTimeMs: generated.maxTimeMs,
    source: "local" as const,
  };
}





