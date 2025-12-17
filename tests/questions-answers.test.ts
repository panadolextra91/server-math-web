import request from "supertest";
import { createApp } from "../src/app";
import { getQuestionById } from "../src/models/question.model";

const app = createApp();

describe("Questions & Answers flow", () => {
  it("generates a question and grades an answer", async () => {
    // create session first
    const sessionRes = await request(app)
      .post("/api/sessions")
      .send({ playerName: "QAUser", mode: "arithmetic", difficulty: "easy" })
      .expect(201);

    const sessionId: number = sessionRes.body.sessionId;

    // generate question
    const qRes = await request(app)
      .post("/api/questions/generate")
      .send({ sessionId, mode: "arithmetic", difficulty: "easy" })
      .expect(200);

    const questionId: string = qRes.body.questionId;
    expect(questionId).toBeDefined();

    // look up canonical answer from DB
    const stored = await getQuestionById(Number(questionId));
    expect(stored).not.toBeNull();

    const correctAnswer = stored!.answer;

    // submit answer using the canonical correct answer
    const answerRes = await request(app)
      .post("/api/answers/submit")
      .send({
        sessionId,
        questionId,
        mode: "arithmetic",
        difficulty: "easy",
        questionText: qRes.body.questionText,
        userAnswer: correctAnswer,
        elapsedMs: 4000,
      })
      .expect(200);

    expect(answerRes.body.isCorrect).toBe(true);
    expect(answerRes.body.totalScore).toBeGreaterThanOrEqual(10);
    expect(answerRes.body.stats.totalQuestions).toBe(1);
  });
});


