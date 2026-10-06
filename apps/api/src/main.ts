import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { AppEnv } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const config = app.get<ConfigService<AppEnv>>(ConfigService);
  const port = config.get('API_PORT', { infer: true }) ?? 4000;
  const prefix = config.get('API_PREFIX', { infer: true }) ?? 'api/v1';
  const webOrigin = config.get('WEB_ORIGIN', { infer: true }) ?? 'http://localhost:3000';
  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true }) ?? 0;
  const bodyLimit = config.get('JSON_BODY_LIMIT', { infer: true }) ?? '128kb';

  if (trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(json({ limit: bodyLimit }));
  app.use(cookieParser());
  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });
  app.setGlobalPrefix(prefix);
  app.enableShutdownHooks();

  const server = await app.listen(port);
  server.requestTimeout = 15_000;
  server.headersTimeout = 20_000;
  server.keepAliveTimeout = 5_000;
}

void bootstrap();
