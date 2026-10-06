import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import type { RequestWithId } from './request-id.middleware.js';

export type ApiSuccessResponse<T> = {
  data: T;
  requestId: string;
};

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<RequestWithId & Request>();

    return next.handle().pipe(
      map((data) => ({
        data,
        requestId: request.requestId ?? 'unknown',
      })),
    );
  }
}
