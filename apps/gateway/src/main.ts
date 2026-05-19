import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { AppModule } from './app.module';

async function ensureDatabase(): Promise<void> {
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = new Client({
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: 'postgres',
    });

    try {
      await client.connect();

      const { rowCount } = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [process.env.DATABASE_NAME],
      );

      if (!rowCount) {
        await client.query(`CREATE DATABASE "${process.env.DATABASE_NAME}"`);
        Logger.log(`Database "${process.env.DATABASE_NAME}" created`, 'Bootstrap');
      }

      await client.end();
      return;
    } catch (err) {
      await client.end().catch(() => {});
      if (attempt === maxRetries) throw err;
      Logger.warn(`DB not ready, retrying in ${attempt * 2}s... (${attempt}/${maxRetries})`, 'Bootstrap');
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function bootstrap(): Promise<void> {
  await ensureDatabase();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDev ? true : (process.env.CORS_ORIGIN ?? false),
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);

  Logger.log(`API running on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
