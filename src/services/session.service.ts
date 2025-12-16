import {
  createSession as createSessionModel,
  finishSession as finishSessionModel,
  getSession,
  getSessionSummary,
} from "../models/session.model";
import type { Session, SessionSummary } from "../types/session";

export async function createSession(input: {
  playerName: string;
  mode?: "arithmetic" | "equation";
  difficulty?: "easy" | "medium" | "hard";
}): Promise<Session> {
  return createSessionModel(input);
}

export async function endSession(sessionId: number): Promise<void> {
  return finishSessionModel(sessionId);
}

export async function fetchSession(sessionId: number): Promise<Session | null> {
  return getSession(sessionId);
}

export async function fetchSessionSummary(sessionId: number): Promise<SessionSummary | null> {
  return getSessionSummary(sessionId);
}

