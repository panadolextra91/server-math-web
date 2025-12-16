import type { Difficulty, GeneratedQuestion } from "./arithmetic-generator";

export interface EquationQuestionPayload {
  a: number;
  b: number;
  c: number;
}

export function generateEquationQuestion(
  difficulty: Difficulty,
): GeneratedQuestion<EquationQuestionPayload> {
  let aRange: [number, number];
  let bRange: [number, number];
  let xRange: [number, number];

  if (difficulty === "easy") {
    // slightly larger but still simple positive coefficients and solutions
    aRange = [2, 8];
    bRange = [0, 40];
    xRange = [0, 20];
  } else if (difficulty === "medium") {
    aRange = [2, 12];
    bRange = [-40, 50];
    xRange = [-20, 20];
  } else {
    // harder: allow negative a and wider ranges for b and x
    aRange = [-12, 12];
    bRange = [-60, 60];
    xRange = [-30, 30];
  }

  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  let a = 0;
  while (a === 0 || a === 1) {
    a = randInt(aRange[0], aRange[1]);
  }
  const b = randInt(bRange[0], bRange[1]);
  const x = randInt(xRange[0], xRange[1]);
  const c = a * x + b;

  const questionText = `${a}x + ${b} = ${c}. Tìm x?`;

  return {
    questionText,
    payload: { a, b, c },
    answer: x,
    maxTimeMs: 25000,
  };
}


