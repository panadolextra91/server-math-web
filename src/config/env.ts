import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("math_game"),
  FRONTEND_ORIGIN: z.string().url().optional(),
  NODE_ENV: z.string().optional(),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_QUEUE_LIMIT: z.coerce.number().int().nonnegative().default(0),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(60000),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  ADMIN_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;


