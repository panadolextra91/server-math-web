/**
 * @openapi
 * openapi: 3.0.3
 * info:
 *   title: Math Learning Game API
 *   version: 0.1.0
 *   description: Node.js + Express + MySQL backend for a math learning game.
 * servers:
 *   - url: /api
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code: { type: string }
 *             message: { type: string }
 *             requestId: { type: string }
 *             details: { type: object, additionalProperties: true }
 *     CreateSessionRequest:
 *       type: object
 *       required: [playerName]
 *       properties:
 *         playerName: { type: string }
 *         mode: { type: string, enum: [arithmetic, equation] }
 *         difficulty: { type: string, enum: [easy, medium, hard] }
 *     CreateSessionResponse:
 *       type: object
 *       properties:
 *         sessionId: { type: number }
 *         playerName: { type: string }
 *         startedAt: { type: string, format: date-time }
 *     GenerateQuestionRequest:
 *       type: object
 *       required: [sessionId, mode, difficulty]
 *       properties:
 *         sessionId: { type: number }
 *         mode: { type: string, enum: [arithmetic, equation] }
 *         difficulty: { type: string, enum: [easy, medium, hard] }
 *     GenerateQuestionResponse:
 *       type: object
 *       properties:
 *         questionId: { type: string }
 *         mode: { type: string, enum: [arithmetic, equation] }
 *         difficulty: { type: string, enum: [easy, medium, hard] }
 *         type: { type: string, enum: [arithmetic, equation] }
 *         questionText: { type: string }
 *         payload: { type: object, additionalProperties: true }
 *         maxTimeMs: { type: number }
 *     SubmitAnswerRequest:
 *       type: object
 *       required: [sessionId, mode, difficulty, questionText, userAnswer, elapsedMs]
 *       properties:
 *         sessionId: { type: number }
 *         questionId: { type: string }
 *         mode: { type: string, enum: [arithmetic, equation] }
 *         difficulty: { type: string, enum: [easy, medium, hard] }
 *         questionText: { type: string }
 *         correctAnswer: { type: string }
 *         userAnswer: { type: string }
 *         elapsedMs: { type: number }
 *     SubmitAnswerResponse:
 *       type: object
 *       properties:
 *         isCorrect: { type: boolean }
 *         correctAnswer: { type: string }
 *         scoreDelta: { type: number }
 *         totalScore: { type: number }
 *         stats:
 *           type: object
 *           properties:
 *             totalQuestions: { type: number }
 *             totalCorrect: { type: number }
 *             totalWrong: { type: number }
 *             accuracy: { type: number }
 *             avgTimeMs: { type: number, nullable: true }
 *             totalScore: { type: number }
 *
 * /health:
 *   get:
 *     summary: Health check (includes DB connectivity)
 *     responses:
 *       200:
 *         description: OK
 *       503:
 *         description: DB unavailable
 *
 * /sessions:
 *   post:
 *     summary: Create a new session (no login, name only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSessionRequest'
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSessionResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /sessions/{sessionId}/end:
 *   patch:
 *     summary: End a session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Session ended }
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /sessions/{sessionId}/summary:
 *   get:
 *     summary: Get session summary
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Session summary }
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /questions/generate:
 *   post:
 *     summary: Generate a new question
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateQuestionRequest'
 *     responses:
 *       200:
 *         description: Generated question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateQuestionResponse'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /answers/submit:
 *   post:
 *     summary: Submit an answer and get grading + score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswerRequest'
 *     responses:
 *       200:
 *         description: Grading result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmitAnswerResponse'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /analytics/overview:
 *   get:
 *     summary: Analytics overview
 *     parameters:
 *       - in: query
 *         name: level
 *         required: false
 *         schema: { type: string, enum: [easy, medium, hard] }
 *     responses:
 *       200: { description: Overview }
 *
 * /leaderboard:
 *   get:
 *     summary: Leaderboard (supports caching + pagination)
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema: { type: string, enum: [all, weekly, daily], default: all }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 20, maximum: 100 }
 *       - in: query
 *         name: page
 *         schema: { type: number, minimum: 1 }
 *       - in: query
 *         name: offset
 *         schema: { type: number, minimum: 0 }
 *     responses:
 *       200: { description: Leaderboard }
 *
 * /players/{playerName}/stats:
 *   get:
 *     summary: Player statistics across all sessions
 *     parameters:
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Player stats }
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export const openapiDocMarker = true;


