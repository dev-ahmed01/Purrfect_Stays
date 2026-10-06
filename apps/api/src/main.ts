import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { AppEnv } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get<ConfigService<AppEnv>>(ConfigService);
  const port = config.get('API_PORT', { infer: true }) ?? 4000;
  const prefix = config.get('API_PREFIX', { infer: true }) ?? 'api/v1';
  const webOrigin = config.get('WEB_ORIGIN', { infer: true }) ?? 'http://localhost:3000';

  app.use(helmet());
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  await app.listen(port);
}

void bootstrap();
