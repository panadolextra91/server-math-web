import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof Error && "status" in err) {
    const status = (err as { status: number }).status;
    const message = err.message || "Unexpected error";
    return res.status(status).json({ message });
  }

  return res.status(500).json({ message: "Internal server error" });
}

