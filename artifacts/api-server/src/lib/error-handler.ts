import type { Express, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger";

export function registerErrorHandler(app: Express): void {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: err.flatten(),
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    logger.error({ err }, "Unhandled API error");
    res.status(500).json({ error: message });
  });
}
