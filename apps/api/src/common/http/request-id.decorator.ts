import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithId } from './request-id.middleware.js';

export const RequestId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithId>();
  return request.requestId;
});
