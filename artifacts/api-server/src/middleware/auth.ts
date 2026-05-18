import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

export type AuthedRequest = Request & {
  userId: string;
  userEmail?: string;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token. Please sign in." });
  }

  const token = header.slice(7);
  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    (req as AuthedRequest).userId = data.user.id;
    (req as AuthedRequest).userEmail = data.user.email;
    next();
  } catch {
    return res.status(503).json({ error: "Auth service unavailable" });
  }
}
