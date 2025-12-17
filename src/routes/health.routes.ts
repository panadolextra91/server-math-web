import { Router } from "express";
import { healthHandler } from "../controllers/health.controller";

export const healthRouter = Router();

// Wrap async handler to catch errors
const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

healthRouter.get("/health", asyncHandler(healthHandler));

