import mysql from "mysql2/promise";
import { env } from "./env";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: env.DB_QUEUE_LIMIT,
  idleTimeout: env.DB_IDLE_TIMEOUT_MS,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Connection timeout for establishing new connections
  connectTimeout: env.DB_CONNECT_TIMEOUT_MS,
  // Enable multiple statements (use with caution, disabled by default for security)
  multipleStatements: false,
  // Timezone
  timezone: "Z", // UTC
  // Character set
  charset: "utf8mb4",
});

