import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = performance.now();
    this.metrics.started();

    response.once('finish', () => {
      this.metrics.finished(
        request.method,
        response.statusCode,
        performance.now() - startedAt,
      );
    });

    next();
  }
}
