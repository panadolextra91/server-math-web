import { closeInactiveSessions } from "../src/models/session.model";
import { pool } from "../src/config/db";

describe("Session Cleanup", () => {
  it("closes inactive sessions", async () => {
    // Create a session with old timestamp (simulate inactive session)
    const [result] = await pool.execute(
      `INSERT INTO sessions (player_name, mode, difficulty, started_at) 
       VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 31 MINUTE))`,
      ["CleanupTestUser", "arithmetic", "easy"],
    );

    const sessionId = (result as { insertId: number }).insertId;

    // Verify session is not finished
    const [beforeRows] = await pool.execute(
      "SELECT finished_at FROM sessions WHERE id = ?",
      [sessionId],
    );
    expect((beforeRows as any[])[0]?.finished_at).toBeNull();

    // Run cleanup (30 minutes threshold)
    const closedCount = await closeInactiveSessions(30);

    // Verify session is now finished
    const [afterRows] = await pool.execute(
      "SELECT finished_at FROM sessions WHERE id = ?",
      [sessionId],
    );
    expect((afterRows as any[])[0]?.finished_at).not.toBeNull();
    expect(closedCount).toBeGreaterThanOrEqual(1);

    // Cleanup: delete test session
    await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
  });

  it("does not close active sessions", async () => {
    // Create a recent session
    const [result] = await pool.execute(
      `INSERT INTO sessions (player_name, mode, difficulty, started_at) 
       VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 10 MINUTE))`,
      ["ActiveTestUser", "arithmetic", "easy"],
    );

    const sessionId = (result as { insertId: number }).insertId;

    // Run cleanup (30 minutes threshold)
    await closeInactiveSessions(30);

    // Verify session is still active
    const [rows] = await pool.execute(
      "SELECT finished_at FROM sessions WHERE id = ?",
      [sessionId],
    );
    expect((rows as any[])[0]?.finished_at).toBeNull();

    // Cleanup: delete test session
    await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
  });
});

