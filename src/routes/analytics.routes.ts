import { Router } from "express";
import { analyticsOverviewHandler, leaderboardHandler } from "../controllers/analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/overview", analyticsOverviewHandler);
analyticsRouter.get("/leaderboard", leaderboardHandler);



