import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private totalRequests = 0;
  private inFlightRequests = 0;
  private totalDurationMs = 0;
  private readonly byStatusClass = new Map<string, number>();
  private readonly byMethod = new Map<string, number>();

  started() {
    this.inFlightRequests += 1;
  }

  finished(method: string, statusCode: number, durationMs: number) {
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
    this.totalRequests += 1;
    this.totalDurationMs += durationMs;

    const statusClass = String(Math.floor(statusCode / 100)) + 'xx';
    this.byStatusClass.set(
      statusClass,
      (this.byStatusClass.get(statusClass) ?? 0) + 1,
    );
    this.byMethod.set(method, (this.byMethod.get(method) ?? 0) + 1);
  }

  snapshot() {
    const memory = process.memoryUsage();

    return {
      uptimeSeconds: Number(process.uptime().toFixed(1)),
      requests: {
        total: this.totalRequests,
        inFlight: this.inFlightRequests,
        averageDurationMs:
          this.totalRequests === 0
            ? 0
            : Number((this.totalDurationMs / this.totalRequests).toFixed(1)),
        byStatusClass: Object.fromEntries(this.byStatusClass),
        byMethod: Object.fromEntries(this.byMethod),
      },
      process: {
        rssBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
      },
    };
  }
}
