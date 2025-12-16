## Server – Math Learning Game

### 1. Requirements
- **Node.js**: LTS (>= 18)
- **MySQL**: running locally (Homebrew or Docker)

### 2. Setup
1. **Clone & install**
   ```bash
   cd /Users/huynhngocanhthu/server-math-web
   npm install
   ```
2. **Environment**
   Create `.env` in the project root:
   ```env
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_root_password
   DB_NAME=math_game
   FRONTEND_ORIGIN=http://localhost:5173
   ```
3. **Database**
   - Ensure MySQL is running:
     ```bash
     brew services start mysql
     ```
   - Create DB (only once):
     ```bash
     mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS math_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
     ```
   - Apply schema:
     ```bash
     mysql -u root -p math_game < db/migrations/001_init.sql
     ```

### 3. Run the server
- **Dev mode**
  ```bash
  npm run dev
  ```
  Server listens on `http://localhost:3000`.

### 4. API Overview (base URL: `/api`)

- **Health**
  - `GET /api/health`
  - Response: `{ status, env, uptimeMs }`

- **Sessions**
  - `POST /api/sessions`
    - Body:
      ```json
      {
        "playerName": "Alice",
        "mode": "arithmetic",
        "difficulty": "easy"
      }
      ```
    - Response: `{ sessionId, playerName, startedAt }`
  - `PATCH /api/sessions/:sessionId/end`
    - Response: `{ sessionId, finishedAt, summary }`
  - `GET /api/sessions/:sessionId/summary`
    - Response: session summary including history and stats.

- **Questions**
  - `POST /api/questions/generate`
    - Body:
      ```json
      {
        "sessionId": 1,
        "mode": "arithmetic",
        "difficulty": "easy"
      }
      ```
    - Response:
      ```json
      {
        "questionId": "1",
        "mode": "arithmetic",
        "difficulty": "easy",
        "type": "arithmetic",
        "questionText": "3 + 5 = ?",
        "payload": { "operands": [3,5], "operators": ["+"] },
        "maxTimeMs": 15000
      }
      ```

- **Answers / grading**
  - `POST /api/answers/submit`
    - Body:
      ```json
      {
        "sessionId": 1,
        "questionId": "1",
        "mode": "arithmetic",
        "difficulty": "easy",
        "questionText": "3 + 5 = ?",
        "userAnswer": "8",
        "elapsedMs": 4000
      }
      ```
      *(optional `correctAnswer` field is used only when `questionId` is missing).*
    - Response:
      ```json
      {
        "isCorrect": true,
        "correctAnswer": "8",
        "scoreDelta": 13,
        "totalScore": 13,
        "stats": {
          "totalQuestions": 1,
          "totalCorrect": 1,
          "totalWrong": 0,
          "totalScore": 13,
          "avgTimeMs": 4000,
          "accuracy": 1
        }
      }
      ```

- **Analytics**
  - `GET /api/analytics/overview?level=easy`
    - Response: aggregated stats across all sessions and difficulty levels (and per difficulty).

- **Leaderboard**
  - `GET /api/leaderboard?scope=all&limit=20`
    - `scope`: `all` | `weekly` | `daily` (default: `all`)
    - Response:
      ```json
      {
        "scope": "all",
        "updatedAt": "2025-12-16T12:00:00.000Z",
        "entries": [
          {
            "rank": 1,
            "playerName": "Alice",
            "totalScore": 120,
            "totalQuestions": 15,
            "accuracy": 0.93,
            "avgTimeMs": 5200
          }
        ]
      }
      ```

### 5. Notes
- Scores are always computed on the server (never trust client scores).
- Questions are generated on the fly but stored in `questions` table for auditability and correct-answer lookup.
- Tuning (ranges, timing, scoring bonuses) can be adjusted in:
  - `logic/arithmetic-generator.ts`
  - `logic/equation-generator.ts`
  - `logic/scoring.ts`


