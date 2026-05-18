import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { handlePayfastNotify, handleStripeWebhook } from "./routes/billing";
import { logger } from "./lib/logger";

const app: Express = express();

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
app.use(cors());

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const result = await handleStripeWebhook(
      req.body as Buffer,
      req.headers["stripe-signature"] as string | undefined,
    );
    res.status(result.status).json(result.body);
  },
);

app.post(
  "/api/billing/payfast/notify",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      await handlePayfastNotify(req.body as Record<string, string>);
      res.status(200).send("OK");
    } catch {
      res.status(400).send("Invalid");
    }
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
