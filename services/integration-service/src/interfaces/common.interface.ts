export interface IntegrationConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface WebhookPayload {
  eventType: string;
  eventId: string;
  timestamp: Date;
  source: 'wms' | 'pim' | '1c';
  data: any;
  signature?: string;
}

export interface IntegrationEvent {
  eventId: string;
  eventType: string;
  source: string;
  timestamp: Date;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface SyncJob {
  jobId: string;
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: string[];
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  details?: any;
}

export interface MetricsData {
  timestamp: Date;
  serviceName: string;
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    circuitBreakerStatus: 'closed' | 'open' | 'half-open';
    queueSize: number;
    activeConnections: number;
  };
}
