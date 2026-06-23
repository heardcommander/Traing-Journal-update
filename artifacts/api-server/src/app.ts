import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";

const app: Express = express();

const allowedOrigins = [
  process.env.APP_URL,
  process.env.API_PUBLIC_URL,
  "http://localhost:18405",
  "http://127.0.0.1:18405",
].filter(Boolean) as string[];

// Always available — Railway healthcheck must pass even if DB/routes fail to load.
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
