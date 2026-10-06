import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from './api-error.js';

export class ApiException extends HttpException {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
