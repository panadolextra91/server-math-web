import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./config/db";
import { logger } from "./utils/logger";
import { startSessionCleanup, stopSessionCleanup } from "./services/session-cleanup.service";

async function main() {
  // sanity check DB connection at startup
  try {
    await pool.query("SELECT 1");
    logger.info("Database connection established", {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
    });
  } catch (error) {
    logger.error("Failed to connect to database", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info("Server started", {
      port: env.PORT,
      env: env.NODE_ENV ?? "dev",
    });
  });

  // Start session cleanup service
  startSessionCleanup();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down server...");
    stopSessionCleanup();

    server.close(() => {
      logger.info("HTTP server closed");
      pool.end(() => {
        logger.info("Database pool closed");
        process.exit(0);
      });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.error("Failed to start server", err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
});

