import { closeInactiveSessions } from "../models/session.model";
import { logger } from "../utils/logger";

const INACTIVE_MINUTES = 30;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run every 5 minutes

let cleanupInterval: NodeJS.Timeout | null = null;

export function startSessionCleanup(): void {
  // Run cleanup immediately on startup
  runCleanup();

  // Then run every 5 minutes
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, CLEANUP_INTERVAL_MS);

  logger.info("Session cleanup service started", {
    inactiveMinutes: INACTIVE_MINUTES,
    intervalMs: CLEANUP_INTERVAL_MS,
  });
}

export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("Session cleanup service stopped");
  }
}

async function runCleanup(): Promise<void> {
  try {
    const closedCount = await closeInactiveSessions(INACTIVE_MINUTES);
    if (closedCount > 0) {
      logger.info("Session cleanup completed", { closedSessions: closedCount });
    }
  } catch (error) {
    logger.error("Session cleanup failed", error instanceof Error ? error : new Error(String(error)));
  }
}

