import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { JobRunnerModule } from "./job-runner.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(JobRunnerModule);
  const logger = new Logger("JobRunnerBootstrap");

  logger.log("Job runner started.");

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}, shutting down job runner.`);
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void bootstrap();
