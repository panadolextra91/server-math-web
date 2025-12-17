import { pool } from "../config/db";

export interface QuestionRow {
  id: number;
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
  payload: unknown;
  answer: string;
  created_at: Date;
}

export async function insertQuestion(input: {
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
  payload: unknown;
  answer: string;
}): Promise<number> {
  const [result] = await pool.execute(
    `INSERT INTO questions (mode, difficulty, payload, answer) VALUES (?, ?, ?, ?)`,
    [input.mode, input.difficulty, JSON.stringify(input.payload), input.answer],
  );
  return (result as { insertId: number }).insertId;
}

export async function getQuestionById(id: number): Promise<QuestionRow | null> {
  const [rows] = await pool.execute(`SELECT * FROM questions WHERE id = ?`, [id]);
  const row = (rows as any[])[0];
  if (!row) return null;
  return {
    id: row.id,
    mode: row.mode,
    difficulty: row.difficulty,
    payload: row.payload,
    answer: row.answer,
    created_at: row.created_at,
  };
}



