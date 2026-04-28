import * as path from 'path';
import * as dotenv from 'dotenv';

// Le .env est à la racine du monorepo, pas dans apps/api/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { Client } from 'pg';
import { AppModule } from './app.module';

/**
 * Crée la base de données si elle n'existe pas encore.
 * On se connecte au db système "postgres" pour exécuter le CREATE DATABASE.
 */
async function ensureDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();

  const { rowCount } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [process.env.DB_NAME],
  );

  if (!rowCount) {
    await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
  }

  await client.end();
}

async function bootstrap(): Promise<void> {
  await ensureDatabase();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
