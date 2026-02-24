// this import has to be at the top of the file for fastify to be instrumented properly
import { shutdownTracing } from "@/instrumentation";
import cors from "@fastify/cors";

import * as Sentry from "@sentry/node";
import buildApp from "./app";
import { env } from "./env";
import path from "node:path";
import { db, migrateWithLock } from "@telli/api-database";

async function runDatabaseMigration() {
  try {
    console.info("Running database migrations...");
    await migrateWithLock(db, {
      migrationsFolder: path.join(
        process.cwd(),
        "..",
        "..",
        "packages",
        "api-database",
        "migrations",
      ),
    });
    console.info("Database migrations completed successfully.");
  } catch (error) {
    console.error("Error running database migrations:", error);
    throw error;
  }
}

async function main() {
  await runDatabaseMigration();

  const fastify = await buildApp({
    logger: true,
    ajv: {
      customOptions: {
        keywords: ["x-examples"],
        strict: false,
      },
    },
  });

  fastify.after(() => {
    fastify.gracefulShutdown(async () => {
      await shutdownTracing();
    });
  });

  Sentry.setupFastifyErrorHandler(fastify);

  await fastify.register(cors, {
    // TODO: uncomment if you want to enable cors
    // origin: "*",
    methods: ["GET", "PATCH", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "sentry-trace",
      "baggage",
    ],
  });

  await fastify.ready();
  fastify.swagger();

  fastify.listen(
    {
      port: env.port,
      host: "0.0.0.0",
    },
    (err, address) => {
      if (err) throw err;
      console.info(`Server is now listening on ${address}`);
    },
  );
}

main()
  .then(() => {})
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
