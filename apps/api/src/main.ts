import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
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

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });
  app.setGlobalPrefix(prefix);
  app.enableShutdownHooks();

  await app.listen(port);
}

void bootstrap();
