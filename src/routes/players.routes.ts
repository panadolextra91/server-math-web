import { Router } from "express";
import { z } from "zod";
import { getPlayerStatsHandler } from "../controllers/players.controller";
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

