import { Router } from "express";
import { analyticsOverviewHandler, leaderboardHandler } from "../controllers/analytics.controller";
import { asyncHandler } from "../middlewares/async-handler";

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/overview", asyncHandler(analyticsOverviewHandler));
analyticsRouter.get("/leaderboard", asyncHandler(leaderboardHandler));



