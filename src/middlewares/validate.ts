import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({ message: "Validation error", errors: result.error.flatten() });
    }

    // Replace parsed data to ensure typed access in controllers
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;
    next();
  };

