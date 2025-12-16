import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./config/db";

async function main() {
  // sanity check DB connection at startup
  await pool.query("SELECT 1");

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

