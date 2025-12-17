interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

interface MetricsSnapshot {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  statusCodes: Record<number, number>;
  endpoints: Record<string, {
    count: number;
    avgResponseTime: number;
    errors: number;
  }>;
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  uptime: number;
  timestamp: number;
}

class MetricsCollector {
  private metrics: RequestMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k requests in memory
  private readonly windowMs = 60000; // 1 minute sliding window
  private startTime = Date.now();

  recordRequest(metric: Omit<RequestMetric, "timestamp">): void {
    const fullMetric: RequestMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics within window
    const cutoff = Date.now() - this.windowMs;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);

    // Also limit total size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= windowStart);

    if (recentMetrics.length === 0) {
      return this.getEmptySnapshot();
    }

    const durations = recentMetrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const totalRequests = recentMetrics.length;
    const totalErrors = recentMetrics.filter((m) => m.statusCode >= 500).length;

    // Calculate percentiles
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

    // Status code counts
    const statusCodes: Record<number, number> = {};
    recentMetrics.forEach((m) => {
      statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
    });

    // Endpoint statistics
    const endpoints: Record<string, { count: number; avgResponseTime: number; errors: number }> = {};
    const endpointGroups: Record<string, RequestMetric[]> = {};

    recentMetrics.forEach((m) => {
      const key = `${m.method} ${m.path}`;
      if (!endpointGroups[key]) {
        endpointGroups[key] = [];
      }
      endpointGroups[key].push(m);
    });

    Object.entries(endpointGroups).forEach(([key, metrics]) => {
      const durations = metrics.map((m) => m.durationMs);
      const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
      const errors = metrics.filter((m) => m.statusCode >= 500).length;

      endpoints[key] = {
        count: metrics.length,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errors,
      };
    });

    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const averageResponseTime = totalDuration / durations.length;
    const requestsPerSecond = (totalRequests / this.windowMs) * 1000;

    return {
      totalRequests,
      totalErrors,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      minResponseTime: durations[0] || 0,
      maxResponseTime: durations[durations.length - 1] || 0,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      statusCodes,
      endpoints,
      responseTimePercentiles: {
        p50,
        p95,
        p99,
      },
      uptime: now - this.startTime,
      timestamp: now,
    };
  }

  private getEmptySnapshot(): MetricsSnapshot {
    return {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      statusCodes: {},
      endpoints: {},
      responseTimePercentiles: {
        p50: 0,
        p95: 0,
        p99: 0,
      },
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }

  reset(): void {
    this.metrics = [];
    this.startTime = Date.now();
  }
}

export const metricsCollector = new MetricsCollector();

