import { Router } from "express";
import { z } from "zod";
import { getPlayerStatsHandler } from "../controllers/players.controller";
import { getPlayerMetrics } from "../controllers/player-metrics.controller";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../middlewares/async-handler";

const playerNameParamsSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    playerName: z.string().min(1),
  }),
});

export const playersRouter = Router();

playersRouter.get(
  "/players/:playerName/stats",
  validate(playerNameParamsSchema),
  asyncHandler(getPlayerStatsHandler),
);

// Player metrics endpoint (no auth required - players can see their own stats)
playersRouter.get(
  "/players/:playerName/metrics",
  validate(playerNameParamsSchema),
  asyncHandler(getPlayerMetrics),
);

