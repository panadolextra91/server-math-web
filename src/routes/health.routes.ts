import { Router } from "express";
import { healthHandler } from "../controllers/health.controller";
import { asyncHandler } from "../middlewares/async-handler";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(healthHandler));

