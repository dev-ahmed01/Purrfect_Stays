import { MetricsService } from '../src/common/observability/metrics.service.js';

describe('MetricsService', () => {
  it('records low-cardinality method/status metrics and latency', () => {
    const metrics = new MetricsService();

    metrics.started();
    metrics.finished('GET', 200, 20);
    metrics.started();
    metrics.finished('POST', 429, 40);

    expect(metrics.snapshot()).toMatchObject({
      requests: {
        total: 2,
        inFlight: 0,
        averageDurationMs: 30,
        byStatusClass: {
          '2xx': 1,
          '4xx': 1,
        },
        byMethod: {
          GET: 1,
          POST: 1,
        },
      },
    });
  });
});
