type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, meta?: Record<string, any>) {
    console.log(
      formatLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message,
        ...meta,
      }),
    );
  },

  warn(message: string, meta?: Record<string, any>) {
    console.warn(
      formatLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message,
        ...meta,
      }),
    );
  },

  error(message: string, error?: Error | Record<string, any>) {
    const meta: Record<string, any> = {};

    if (error instanceof Error) {
      meta.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      Object.assign(meta, error);
    }

    console.error(
      formatLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        ...meta,
      }),
    );
  },

  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        formatLog({
          timestamp: new Date().toISOString(),
          level: "debug",
          message,
          ...meta,
        }),
      );
    }
  },
};

