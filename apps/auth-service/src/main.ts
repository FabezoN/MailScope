import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { AppModule } from './app.module';

async function ensureDatabase(): Promise<void> {
  const dbName = process.env.AUTH_DATABASE_NAME!;
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
        [dbName],
      );
      if (!rowCount) {
        await client.query(`CREATE DATABASE "${dbName}"`);
        Logger.log(`Database "${dbName}" created`, 'Bootstrap');
      }
      await client.end();
      return;
    } catch (err) {
      await client.end().catch(() => {});
      if (attempt === maxRetries) throw err;
      Logger.warn(`DB not ready, retrying in ${attempt * 2}s... (${attempt}/${maxRetries})`, 'Bootstrap');
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

async function bootstrap() {
  await ensureDatabase();

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const port = process.env.AUTH_SERVICE_PORT ?? 3002;
  await app.listen(port);
  Logger.log(`Auth Service running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
