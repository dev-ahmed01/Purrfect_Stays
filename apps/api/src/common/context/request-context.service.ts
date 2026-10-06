import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get requestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  requireRequestId(): string {
    const requestId = this.requestId;

    if (!requestId) {
      throw new Error('Request context is unavailable outside an active HTTP request.');
    }

    return requestId;
  }
}
