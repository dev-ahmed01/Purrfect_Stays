export type ApiSuccess<T> = {
  data: T;
  requestId: string;
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
  timestamp?: string;
  path?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(
    status: number,
    failure: ApiFailure,
  ) {
    super(failure.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = failure.error.code;
    this.details = failure.error.details;
    this.requestId = failure.requestId;
  }
}
