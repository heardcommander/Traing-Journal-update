import type { Request } from "express";
import type { AuthedRequest } from "../middleware/auth";

/** Shared journal user when auth is not wired (single-user / demo mode). */
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "default-user";

export function resolveUserId(req: Request): string {
  const authed = req as AuthedRequest;
  return authed.userId ?? DEFAULT_USER_ID;
}
