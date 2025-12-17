import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";
import { ValidationError } from "../utils/errors";

export const validate =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.flatten();
      return next(
        new ValidationError("Validation error", {
          issues: details,
        }),
      );
    }

    // Replace parsed data to ensure typed access in controllers
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;
    next();
  };


