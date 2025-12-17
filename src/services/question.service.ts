import { generateArithmeticQuestion } from "../logic/arithmetic-generator";
import { generateEquationQuestion } from "../logic/equation-generator";
import { insertQuestion } from "../models/question.model";

export async function generateQuestion(input: {
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
}) {
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
  };
}



