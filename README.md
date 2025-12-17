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
   # Database connection pool settings (optional)
   DB_CONNECTION_LIMIT=10
   DB_QUEUE_LIMIT=0
   DB_IDLE_TIMEOUT_MS=60000
   DB_CONNECT_TIMEOUT_MS=10000
   # Admin API key for server metrics access (optional - if not set, metrics are publicly accessible)
   ADMIN_API_KEY=your-secret-admin-key-here
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
   - Apply performance indexes (recommended):
     ```bash
     mysql -u root -p math_game < db/migrations/002_add_performance_indexes.sql
     ```

### 3. Run the server
- **Dev mode** (with auto-reload on file changes)
  ```bash
  npm run dev
  ```
  Server listens on `http://localhost:3000`.

- **Production mode** (compiled JavaScript)
  ```bash
  npm run build
  npm start
  ```
  The `build` command compiles TypeScript to JavaScript in the `dist/` directory.

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
- ✅ Metrics and performance monitoring (server-wide and player-specific)
- ✅ Admin authentication for protected endpoints
- ✅ Player statistics and metrics endpoints
- ✅ Input sanitization and validation
- ✅ Error handling and standardized error responses

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
    - Marks the session as finished
    - Response:
      ```json
      {
        "sessionId": 1,
        "finishedAt": "2025-12-17T12:00:00.000Z",
        "summary": {
          "totalQuestions": 10,
          "totalCorrect": 8,
          "totalWrong": 2,
          "accuracy": 0.8,
          "avgTimeMs": 4500,
          "totalScore": 75
        }
      }
      ```
    - Returns `404` if session not found
  - `GET /api/sessions/:sessionId/summary`
    - Returns detailed session summary including answer history
    - Response:
      ```json
      {
        "sessionId": 1,
        "mode": "arithmetic",
        "difficulty": "easy",
        "totalQuestions": 10,
        "totalCorrect": 8,
        "totalWrong": 2,
        "accuracy": 0.8,
        "avgTimeMs": 4500,
        "totalScore": 75,
        "history": [
          {
            "id": 1,
            "questionText": "3 + 5 = ?",
            "isCorrect": true,
            "scoreDelta": 10,
            "elapsedMs": 3000,
            "createdAt": "2025-12-17T12:00:00.000Z"
          }
        ]
      }
      ```
    - Returns `404` if session not found

- **Questions**
  - `POST /api/questions/generate`
    - Generates a new math question based on mode and difficulty
    - Questions are stored in the database for auditability
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
        "payload": {
          "operands": [3, 5],
          "operators": ["+"],
          "result": 8,
          "answer": "8"
        },
        "maxTimeMs": 15000
      }
      ```
    - For equation mode, `payload` includes `coefficient`, `constant`, `solution`, etc.
    - Returns `404` if session not found
    - Returns `400` if validation fails

- **Answers / grading**
  - `POST /api/answers/submit`
    - Submits an answer for grading and updates session statistics
    - Scoring: +10 for correct, -5 for incorrect, +3 speed bonus if answered quickly
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
      - `questionId` (optional): ID of the question from `/api/questions/generate`
      - `correctAnswer` (optional): Only used when `questionId` is missing (server recomputes when possible)
      - `elapsedMs`: Time taken to answer in milliseconds (used for speed bonus calculation)
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
    - Returns `404` if session not found
    - Returns `400` if validation fails
    - Note: Leaderboard cache is automatically invalidated after each answer submission

- **Analytics**
  - `GET /api/analytics/overview?level=easy`
    - Query parameter `level` (optional): `easy` | `medium` | `hard` - filter by difficulty level
    - Response: aggregated stats across all sessions and difficulty levels:
      ```json
      {
        "totalPlayers": 50,
        "totalSessions": 200,
        "totalQuestions": 5000,
        "avgAccuracy": 0.85,
        "avgTimeMs": 5200,
        "byDifficulty": [
          {
            "level": "easy",
            "totalQuestions": 2000,
            "accuracy": 0.92,
            "avgTimeMs": 4000
          },
          {
            "level": "medium",
            "totalQuestions": 2000,
            "accuracy": 0.83,
            "avgTimeMs": 5500
          },
          {
            "level": "hard",
            "totalQuestions": 1000,
            "accuracy": 0.75,
            "avgTimeMs": 7000
          }
        ]
      }
      ```

- **Leaderboard**
  - `GET /api/leaderboard?scope=all&limit=20&page=1` or `&offset=0`
    - Returns ranked list of players sorted by total score (descending), then accuracy
    - Results are cached for 60 seconds to improve performance
    - Query parameters:
      - `scope`: `all` | `weekly` | `daily` (default: `all`)
        - `all`: All-time leaderboard
        - `weekly`: Last 7 days
        - `daily`: Last 24 hours
      - `limit`: number (default: 20, max: 100) - Number of entries per page
      - `page`: number (1-based) - Page number (alternative to `offset`)
      - `offset`: number - Number of entries to skip (alternative to `page`)
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
    - Returns comprehensive player statistics across all sessions
    - Player name is automatically sanitized (trimmed, special characters removed)
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
          },
          {
            "level": "medium",
            "totalQuestions": 30,
            "accuracy": 0.90,
            "avgTimeMs": 5500
          },
          {
            "level": "hard",
            "totalQuestions": 15,
            "accuracy": 0.80,
            "avgTimeMs": 7000
          }
        ]
      }
      ```
    - Returns `404` if player not found
    - Note: This endpoint provides the same data as `/api/players/:playerName/metrics` but with a different response structure

- **Metrics** (Performance Monitoring & Analytics)
  - `GET /api/metrics` (Admin only - requires `X-Admin-API-Key` header or `admin-api-key` query parameter)
    - Returns comprehensive server metrics including:
      - **Real-time performance metrics** (60-second sliding window)
      - **Enhanced analytics** (all-time and time-based statistics)
    - Real-time performance metrics:
      ```json
      {
        "totalRequests": 150,
        "totalErrors": 2,
        "averageResponseTime": 12.5,
        "minResponseTime": 1,
        "maxResponseTime": 250,
        "requestsPerSecond": 2.5,
        "statusCodes": {
          "200": 145,
          "404": 3,
          "500": 2
        },
        "endpoints": {
          "GET /health": {
            "count": 50,
            "avgResponseTime": 2.1,
            "errors": 0
          },
          "POST /sessions": {
            "count": 30,
            "avgResponseTime": 15.3,
            "errors": 0
          }
        },
        "responseTimePercentiles": {
          "p50": 5,
          "p95": 45,
          "p99": 120
        },
        "uptime": 3600000,
        "timestamp": 1702800000000,
        "analytics": {
          "players": {
            "total": 150,
            "today": 25,
            "thisMonth": 120,
            "activeToday": 20
          },
          "sessions": {
            "total": 500,
            "active": 15,
            "completed": 485,
            "today": 30,
            "thisMonth": 200,
            "avgDuration": 12.5
          },
          "questions": {
            "total": 5000,
            "today": 150,
            "thisMonth": 2000,
            "totalCorrect": 4250,
            "totalWrong": 750,
            "overallAccuracy": 0.85,
            "todayAccuracy": 0.88,
            "thisMonthAccuracy": 0.86
          },
          "topics": {
            "mostPlayed": {
              "mode": "arithmetic",
              "difficulty": "easy",
              "count": 2500
            },
            "byMode": [
              {
                "mode": "arithmetic",
                "count": 3500,
                "accuracy": 0.87,
                "avgTimeMs": 4500
              }
            ],
            "byDifficulty": [
              {
                "difficulty": "easy",
                "count": 2500,
                "accuracy": 0.92,
                "avgTimeMs": 4000
              }
            ],
            "byModeAndDifficulty": [
              {
                "mode": "arithmetic",
                "difficulty": "easy",
                "count": 2000,
                "accuracy": 0.93
              }
            ]
          },
          "performance": {
            "avgResponseTime": 5200,
            "avgResponseTimeToday": 4800,
            "fastestAvgResponseTime": {
              "mode": "arithmetic",
              "difficulty": "easy",
              "avgTimeMs": 3500
            },
            "highestAccuracy": {
              "mode": "arithmetic",
              "difficulty": "easy",
              "accuracy": 0.95
            }
          },
          "activity": {
            "peakHour": 14,
            "questionsPerHour": [
              { "hour": 0, "count": 10 },
              { "hour": 14, "count": 150 }
            ]
          },
          "scores": {
            "totalScore": 50000,
            "avgScorePerSession": 100,
            "highestScore": 250,
            "avgScorePerQuestion": 10
          },
          "timestamp": "2025-12-17T12:00:00.000Z"
        }
      }
      ```
    - **Real-time metrics** are calculated from a 60-second sliding window
    - **Analytics** include:
      - **Players**: Total, today, this month, active today
      - **Sessions**: Total, active, completed, today, this month, average duration
      - **Questions**: Total, today, this month, correct/wrong counts, accuracy (overall/today/month)
      - **Topics**: Most played mode/difficulty, breakdowns by mode, difficulty, and combinations
      - **Performance**: Average response times, fastest mode/difficulty, highest accuracy
      - **Activity**: Peak hour, questions per hour distribution
      - **Scores**: Total score, highest score, averages per session/question
    - Endpoint paths are normalized (numeric IDs replaced with `:id` for better grouping)
    - **Authentication**: Requires admin API key (set via `ADMIN_API_KEY` environment variable)
      - Send API key in header: `X-Admin-API-Key: your-api-key`
      - Or as query parameter: `?admin-api-key=your-api-key`
      - If `ADMIN_API_KEY` is not set, endpoint is publicly accessible (development mode)
  - `POST /api/metrics/reset` (Admin only)
    - Resets all collected metrics
    - Response: `{ "message": "Metrics reset successfully" }`
    - Requires same admin authentication as `GET /api/metrics`
  - `GET /api/players/:playerName/metrics` (Public - no authentication required)
    - Returns player-specific performance metrics:
      ```json
      {
        "playerName": "Alice",
        "totalSessions": 5,
        "totalQuestions": 75,
        "totalCorrect": 68,
        "totalWrong": 7,
        "accuracy": 0.907,
        "averageResponseTime": 5200,
        "totalScore": 650,
        "bestScore": 180,
        "byDifficulty": [
          {
            "level": "easy",
            "totalQuestions": 30,
            "accuracy": 0.95,
            "avgTimeMs": 4000
          }
        ],
        "timestamp": "2025-12-17T12:00:00.000Z"
      }
      ```
    - Players can view their own metrics by providing their player name
    - No authentication required - players can access their stats freely

### 7. Authentication & Authorization

The server uses a simple, flexible authentication model:

- **No authentication required for players**: Players can use the game by simply providing their name. No login or account creation is required.
- **Admin API key for server metrics**: 
  - Server-wide metrics endpoints (`GET /api/metrics`, `POST /api/metrics/reset`) require an admin API key
  - Set the `ADMIN_API_KEY` environment variable to enable protection
  - Send the API key via:
    - Header: `X-Admin-API-Key: your-api-key`
    - Query parameter: `?admin-api-key=your-api-key`
  - If `ADMIN_API_KEY` is not set, these endpoints are publicly accessible (useful for development)
- **Public player endpoints**: 
  - Player statistics (`GET /api/players/:playerName/stats`)
  - Player metrics (`GET /api/players/:playerName/metrics`)
  - These endpoints are publicly accessible - players can view their own stats by providing their player name

### 8. Error Handling

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
- `VALIDATION_ERROR` (400) - Request validation failed (e.g., missing required fields, invalid enum values)
- `NOT_FOUND` (404) - Resource not found (e.g., session, player, question)
- `BAD_REQUEST` (400) - Invalid request format or malformed data
- `INVALID_INPUT` (400) - Invalid input data (e.g., invalid player name format)
- `UNAUTHORIZED` (401) - Authentication required (e.g., missing or invalid admin API key)
- `INTERNAL_ERROR` (500) - Internal server error (unexpected server-side errors)
- `DATABASE_ERROR` (500) - Database operation failed
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable (e.g., request timeout, database disconnected)

All error responses include:
- `code`: Machine-readable error code
- `message`: Human-readable error message
- `requestId`: Unique request ID for tracing
- `details`: Optional additional error context

### 9. Notes
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
- **Database optimizations**:
  - Connection pool is configurable via environment variables (`DB_CONNECTION_LIMIT`, `DB_QUEUE_LIMIT`, `DB_IDLE_TIMEOUT_MS`, `DB_CONNECT_TIMEOUT_MS`)
  - Performance indexes are available in `db/migrations/002_add_performance_indexes.sql` to optimize common queries (session history, leaderboard, player stats, session cleanup)
  - Query optimizations include efficient aggregation queries and proper index usage
- **Performance monitoring**: 
  - Server-wide metrics endpoint (`GET /api/metrics`) - Admin only, protected by API key. Tracks response times, request counts, error rates, and endpoint statistics over a 60-second sliding window.
  - Player metrics endpoint (`GET /api/players/:playerName/metrics`) - Public access, no authentication required. Players can view their own performance statistics including accuracy, scores, and difficulty breakdowns.
- Tuning (ranges, timing, scoring bonuses) can be adjusted in:
  - `logic/arithmetic-generator.ts`
  - `logic/equation-generator.ts`
  - `logic/scoring.ts`



