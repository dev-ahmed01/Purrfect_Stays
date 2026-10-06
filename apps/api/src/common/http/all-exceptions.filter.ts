import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@purrfect/database';
import type { Request, Response } from 'express';
import type { ApiErrorCode, ApiErrorResponse } from './api-error.js';
import type { RequestWithId } from './request-id.middleware.js';

type NormalizedError = {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId & Request>();
    const response = http.getResponse<Response>();
    const normalized = this.normalize(exception);

    if (normalized.status >= 500) {
      this.logger.error(
        JSON.stringify({
          event: 'request_failed',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl ?? request.url,
          error:
            exception instanceof Error
              ? { name: exception.name, message: exception.message, stack: exception.stack }
              : { value: String(exception) },
        }),
      );
    }

    const body: ApiErrorResponse = {
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details === undefined ? {} : { details: normalized.details }),
      },
      requestId: request.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    };

    response.status(normalized.status).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'A record with the same unique value already exists.',
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
        };
      }

      if (exception.code === 'P2034') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'DATABASE_CONFLICT',
          message: 'The operation conflicted with another update. Please retry.',
        };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return {
          status,
          code: this.codeFromStatus(status),
          message: payload,
        };
      }

      if (payload && typeof payload === 'object') {
        const objectPayload = payload as Record<string, unknown>;
        const message = this.extractMessage(objectPayload.message);

        return {
          status,
          code:
            typeof objectPayload.code === 'string'
              ? (objectPayload.code as ApiErrorCode)
              : this.codeFromStatus(status),
          message,
          ...(objectPayload.details === undefined ? {} : { details: objectPayload.details }),
        };
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    };
  }

  private extractMessage(message: unknown): string {
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join('; ');
    return 'Request could not be processed.';
  }

  private codeFromStatus(status: number): ApiErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
    }
  }
}
