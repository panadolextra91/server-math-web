import type { Difficulty } from "./arithmetic-generator";

export interface ScoringResult {
  isCorrect: boolean;
  correctAnswer: string;
  scoreDelta: number;
}

function getSpeedThresholdMs(mode: "arithmetic" | "equation", difficulty: Difficulty): number {
  if (mode === "arithmetic") {
    if (difficulty === "easy") return 8000;
    if (difficulty === "medium") return 12000;
    return 15000;
  }
  // equation
  if (difficulty === "easy") return 12000;
  if (difficulty === "medium") return 18000;
  return 22000;
}

export function gradeAnswer(params: {
  mode: "arithmetic" | "equation";
  difficulty: Difficulty;
  correctAnswer: number | string;
  userAnswer: string;
  elapsedMs: number;
}): ScoringResult {
  const canonicalCorrect = String(params.correctAnswer).trim();
  const canonicalUser = params.userAnswer.trim();

  const isCorrect = canonicalUser === canonicalCorrect;

  let scoreDelta = isCorrect ? 10 : -5;

  if (isCorrect) {
    const threshold = getSpeedThresholdMs(params.mode, params.difficulty);
    if (params.elapsedMs > 0 && params.elapsedMs <= threshold) {
      scoreDelta += 3;
    }
  }

  return {
    isCorrect,
    correctAnswer: canonicalCorrect,
    scoreDelta,
  };
}



