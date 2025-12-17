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
   REQUEST_TIMEOUT_MS=30000
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

### 4. Testing API Endpoints

The project includes automated API tests using **Vitest** and **Supertest**. No need for manual Postman testing!

- **Run all tests**
  ```bash
  npm test
  ```

- **Run tests in watch mode** (auto-rerun on file changes)
  ```bash
  npm run test:watch
  ```

**Test coverage:**
- ✅ Health endpoint (`GET /api/health`)
- ✅ Session lifecycle (create, end, summary)
- ✅ Question generation and answer grading (full flow)
- ✅ Analytics and leaderboard endpoints

All tests use the same database connection as the dev server, so ensure MySQL is running before running tests.

### 5. API Docs (Swagger / OpenAPI)

- **Swagger UI**: `GET /api/docs`
- **OpenAPI JSON**: `GET /api/docs.json`

### 6. API Overview (base URL: `/api`)

- **Health**
  - `GET /api/health`
  - Response:
    ```json
    {
      "status": "ok",
      "env": "dev",
      "uptimeMs": 12345,
      "database": {
        "status": "connected",
        "responseTimeMs": 2
      }
    }
    ```
  - Returns `503` if database is disconnected (status: `"degraded"`)

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
  - `GET /api/leaderboard?scope=all&limit=20&page=1` or `&offset=0`
    - `scope`: `all` | `weekly` | `daily` (default: `all`)
    - `limit`: number (default: 20, max: 100)
    - `page`: number (1-based, alternative to offset)
    - `offset`: number (alternative to page)
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
        ],
        "pagination": {
          "limit": 20,
          "offset": 0,
          "page": 1,
          "total": 150,
          "hasMore": true
        }
      }
      ```

- **Player Statistics**
  - `GET /api/players/:playerName/stats`
    - Response:
      ```json
      {
        "playerName": "Alice",
        "totalSessions": 5,
        "totalQuestions": 75,
        "totalCorrect": 68,
        "totalWrong": 7,
        "accuracy": 0.907,
        "avgTimeMs": 5200,
        "totalScore": 650,
        "bestScore": 180,
        "byDifficulty": [
          {
            "level": "easy",
            "totalQuestions": 30,
            "accuracy": 0.95,
            "avgTimeMs": 4000
          }
        ]
      }
      ```
    - Returns `404` if player not found

### 7. Error Handling

All errors follow a standardized format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Session with identifier '123' not found",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": {
      "resource": "Session",
      "identifier": 123
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Request validation failed
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid request
- `INVALID_INPUT` (400) - Invalid input data
- `INTERNAL_ERROR` (500) - Internal server error
- `DATABASE_ERROR` (500) - Database operation failed
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable (e.g., request timeout, database disconnected)

All error responses include:
- `code`: Machine-readable error code
- `message`: Human-readable error message
- `requestId`: Unique request ID for tracing
- `details`: Optional additional error context

### 8. Notes
- Scores are always computed on the server (never trust client scores).
- Questions are generated on the fly but stored in `questions` table for auditability and correct-answer lookup.
- **Input sanitization**: Player names are automatically sanitized (trimmed, limited to 64 chars, special characters removed).
- **Leaderboard caching**: Results are cached in-memory for 60 seconds to reduce database load. Cache is automatically invalidated when new answers are submitted.
- **Leaderboard pagination**: Supports `page` or `offset` parameters for large result sets.
- **Session cleanup**: Inactive sessions (>30 minutes) are automatically closed every 5 minutes.
- **Request ID tracking**: Each request receives a unique UUID v4 request ID, included in all logs and returned in the `X-Request-ID` response header for easy request tracing.
- **Standardized error handling**: All errors follow a consistent format with error codes, descriptive messages, and request IDs for easy debugging and client handling.
- **Structured logging**: All logs are output in JSON format for easy parsing and integration with log aggregation tools. Includes request/response details, error stack traces, and performance metrics.
- **Health check**: Includes database connectivity test. Returns `503` if database is unavailable.
- **Graceful shutdown**: Server handles SIGTERM/SIGINT signals and closes connections cleanly.
- **Request timeout**: All requests have a configurable timeout (default: 30 seconds via `REQUEST_TIMEOUT_MS`). Requests exceeding the timeout return a `503 SERVICE_UNAVAILABLE` error with timeout details.
- Tuning (ranges, timing, scoring bonuses) can be adjusted in:
  - `logic/arithmetic-generator.ts`
  - `logic/equation-generator.ts`
  - `logic/scoring.ts`



