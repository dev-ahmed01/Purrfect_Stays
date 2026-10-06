import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, type Observable } from 'rxjs';
import type { RequestWithId } from '../http/request-id.middleware.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId & Request>();
    const response = http.getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      finalize(() => {
        this.logger.log(
          JSON.stringify({
            event: 'request_completed',
            requestId: request.requestId,
            method: request.method,
            path: request.originalUrl ?? request.url,
            statusCode: response.statusCode,
            durationMs: Number((performance.now() - startedAt).toFixed(1)),
          }),
        );
      }),
    );
  }
}
