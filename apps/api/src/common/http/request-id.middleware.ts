import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextService } from '../context/request-context.service.js';

export type RequestWithId = Request & {
  requestId: string;
};

function normalizeIncomingRequestId(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) return undefined;

  const normalized = candidate.trim();
  if (!normalized || normalized.length > 128) return undefined;

  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : undefined;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(request: RequestWithId, response: Response, next: NextFunction) {
    const incomingId = normalizeIncomingRequestId(request.headers['x-request-id']);
    request.requestId = incomingId ?? randomUUID();
    response.setHeader('x-request-id', request.requestId);

    this.context.run({ requestId: request.requestId }, next);
  }
}
