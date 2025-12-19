import axios from "axios";
import { env } from "../config/env";

type Mode = "arithmetic" | "equation";
type Difficulty = "easy" | "medium" | "hard";

interface GenAIQuizItem {
  prompt: string;
  answer: number | string;
  difficulty: string;
  quizType: string;
}

interface GeneratedFromGenAI {
  questionText: string;
  payload: unknown;
  answer: number | string;
  maxTimeMs: number;
}

function getDefaultMaxTimeMs(mode: Mode, difficulty: Difficulty): number {
  if (mode === "arithmetic") {
    if (difficulty === "easy") return 15000;
    if (difficulty === "medium") return 20000;
    return 25000;
  }

  // equations are generally a bit slower
  return 25000;
}

export async function generateQuestionFromGenAI(input: {
  mode: Mode;
  difficulty: Difficulty;
}): Promise<GeneratedFromGenAI> {
  if (!env.GENAI_BASE_URL) {
    throw new Error("GENAI_BASE_URL is not configured");
  }

  const base = env.GENAI_BASE_URL.replace(/\/+$/, "");
  const url = `${base}/generate`;

  const response = await axios.post<GenAIQuizItem[]>(
    url,
    {
      quiz_type: input.mode,
      difficulty: input.difficulty,
      n: 1,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const item = response.data?.[0];
  if (!item) {
    throw new Error("GenAI quiz service returned no items");
  }

  const maxTimeMs = getDefaultMaxTimeMs(input.mode, input.difficulty);

  return {
    questionText: item.prompt,
    // Store the raw GenAI payload so we can inspect or evolve it later if needed
    payload: {
      prompt: item.prompt,
      difficulty: item.difficulty,
      quizType: item.quizType,
    },
    answer: item.answer,
    maxTimeMs,
  };
}


