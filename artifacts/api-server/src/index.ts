import app from "./app";
import { logger } from "./lib/logger";
import { registerErrorHandler } from "./lib/error-handler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  void import("@workspace/db")
    .then(({ ensureSchema }) => ensureSchema())
    .then(() => import("./routes/index.js"))
    .then(({ default: router }) => {
      app.use("/api", router);
      registerErrorHandler(app);
      logger.info("API routes mounted");
    })
    .catch((mountErr) => {
      logger.error(
        { err: mountErr },
        "Failed to mount API routes — check DATABASE_URL and Supabase env vars",
      );
    });
});
