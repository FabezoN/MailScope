import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDev ? true : (process.env.CORS_ORIGIN ?? false),
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Gateway running on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
