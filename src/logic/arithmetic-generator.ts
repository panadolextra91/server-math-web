export type Difficulty = "easy" | "medium" | "hard";

export interface ArithmeticQuestionPayload {
  operands: number[];
  operators: ("+" | "-")[];
}

export interface GeneratedQuestion<TPayload> {
  questionText: string;
  payload: TPayload;
  answer: number;
  maxTimeMs: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateArithmeticQuestion(
  difficulty: Difficulty,
): GeneratedQuestion<ArithmeticQuestionPayload> {
  if (difficulty === "easy") {
    // slightly larger numbers to make it more engaging but still beginner‑friendly
    const a = randInt(5, 50);
    const b = randInt(5, 50);
    const op: "+" | "-" = Math.random() < 0.5 ? "+" : "-";
    const answer = op === "+" ? a + b : a - b;
    return {
      questionText: `${a} ${op} ${b} = ?`,
      payload: { operands: [a, b], operators: [op] },
      answer,
      maxTimeMs: 15000,
    };
  }

  if (difficulty === "medium") {
    // three‑term expressions with larger ranges
    const a = randInt(20, 80);
    const b = randInt(20, 80);
    const c = randInt(10, 60);
    const op1: "+" | "-" = Math.random() < 0.5 ? "+" : "-";
    const op2: "+" | "-" = Math.random() < 0.5 ? "+" : "-";

    const first = op1 === "+" ? a + b : a - b;
    const answer = op2 === "+" ? first + c : first - c;
    return {
      questionText: `${a} ${op1} ${b} ${op2} ${c} = ?`,
      payload: { operands: [a, b, c], operators: [op1, op2] },
      answer,
      maxTimeMs: 20000,
    };
  }

  // hard
  // harder: allow wider range and more negatives
  const a = randInt(-100, 150);
  const b = randInt(-100, 150);
  const c = randInt(-100, 150);
  const op1: "+" | "-" = Math.random() < 0.5 ? "+" : "-";
  const op2: "+" | "-" = Math.random() < 0.5 ? "+" : "-";

  // parentheses randomly around first two or last two operands
  const groupFirstTwo = Math.random() < 0.5;
  let questionText: string;
  let answer: number;
  if (groupFirstTwo) {
    const inner = op1 === "+" ? a + b : a - b;
    answer = op2 === "+" ? inner + c : inner - c;
    questionText = `(${a} ${op1} ${b}) ${op2} ${c} = ?`;
  } else {
    const inner = op2 === "+" ? b + c : b - c;
    answer = op1 === "+" ? a + inner : a - inner;
    questionText = `${a} ${op1} (${b} ${op2} ${c}) = ?`;
  }

  return {
    questionText,
    payload: { operands: [a, b, c], operators: [op1, op2] },
    answer,
    maxTimeMs: 25000,
  };
}


