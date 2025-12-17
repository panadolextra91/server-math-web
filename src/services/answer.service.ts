import { getQuestionById } from "../models/question.model";
import { insertAnswerLog, getSessionAnswerStats } from "../models/answer-log.model";
import { gradeAnswer } from "../logic/scoring";
import { leaderboardCache } from "../utils/cache";

export async function submitAnswer(input: {
  sessionId: number;
  questionId?: string | null;
  mode: "arithmetic" | "equation";
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  correctAnswer?: string;
  userAnswer: string;
  elapsedMs: number;
}) {
  let canonicalCorrect: string | null = null;
  let numericCorrect: string | number;

  if (input.questionId) {
    const q = await getQuestionById(Number(input.questionId));
    if (q) {
      canonicalCorrect = q.answer;
    }
  }

  if (!canonicalCorrect) {
    numericCorrect = input.correctAnswer ?? "";
  } else {
    numericCorrect = canonicalCorrect;
  }

  const scoring = gradeAnswer({
    mode: input.mode,
    difficulty: input.difficulty,
    correctAnswer: numericCorrect,
    userAnswer: input.userAnswer,
    elapsedMs: input.elapsedMs,
  });

  await insertAnswerLog({
    sessionId: input.sessionId,
    questionId: input.questionId ? Number(input.questionId) : null,
    mode: input.mode,
    difficulty: input.difficulty,
    questionText: input.questionText,
    correctAnswer: scoring.correctAnswer,
    userAnswer: input.userAnswer,
    isCorrect: scoring.isCorrect,
    scoreDelta: scoring.scoreDelta,
    elapsedMs: input.elapsedMs,
  });

  // Invalidate leaderboard cache since scores have changed
  leaderboardCache.clearByPrefix("leaderboard:");

  const stats = await getSessionAnswerStats(input.sessionId);

  return {
    isCorrect: scoring.isCorrect,
    correctAnswer: scoring.correctAnswer,
    scoreDelta: scoring.scoreDelta,
    totalScore: stats.totalScore,
    stats,
  };
}



