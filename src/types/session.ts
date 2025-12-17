export interface Session {
  id: number;
  playerName: string;
  mode: "arithmetic" | "equation" | null;
  difficulty: "easy" | "medium" | "hard" | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface SessionSummary {
  sessionId: number;
  mode: Session["mode"];
  difficulty: Session["difficulty"];
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  avgTimeMs: number | null;
  totalScore: number;
  history: Array<{
    id: number;
    questionText: string;
    isCorrect: boolean;
    scoreDelta: number;
    elapsedMs: number;
    createdAt: Date;
  }>;
}


