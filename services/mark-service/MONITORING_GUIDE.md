# Monitoring and Alerting Guide

## Overview

This document describes the comprehensive monitoring and alerting setup for the Znak Lavki Mark Service, including metrics collection, dashboards, alerts, and structured logging.

## Table of Contents

1. [Metrics Collection](#metrics-collection)
2. [Grafana Dashboards](#grafana-dashboards)
3. [Prometheus Alerts](#prometheus-alerts)
4. [Alertmanager Configuration](#alertmanager-configuration)
5. [Structured Logging](#structured-logging)
6. [Audit Trail](#audit-trail)
7. [Configuration](#configuration)

## Metrics Collection

### Business Metrics

The service collects the following business-critical metrics:

#### IDR Rate (Invalid Data Rate)

```typescript
// Metric: idr_rate
// Type: Gauge
// Description: Percentage of failed validations
// Labels: supplier, time_window
// Alert threshold: > 1% (warning), > 5% (critical)

metricsService.updateIDRRate(failedCount, totalCount, 'supplier-123', '5m');
```

#### Mark Generation Rate

```typescript
// Metric: marks_generated_total
// Type: Counter
// Description: Total marks generated
// Labels: gtin

metricsService.collectMarkGenerated(100, '04607177964089');
```

#### Validation Success Rate

```typescript
// Metric: mark_validation_success_total / mark_validation_failure_total
// Type: Counter
// Description: Success and failure counts for validations
// Labels: supplier, reason

metricsService.recordValidationTime(duration, 'success', 'supplier-123');
```

#### Average Response Times

```typescript
// Metric: mark_validation_duration_ms
// Type: Histogram
// Description: Validation duration in milliseconds
// Buckets: [5, 10, 25, 50, 100, 250, 500, 1000]

metricsService.recordValidationTime(duration, result, supplier, reason);
```

#### Active and Expired Marks

```typescript
// Metrics: active_marks_count, expired_marks_count
// Type: Gauge
// Description: Current count of marks by status

metricsService.updateActiveMarksCount(1500, 'supplier-123', 'active');
metricsService.updateExpiredMarksCount(50, 'supplier-123');
```

#### System Coverage

```typescript
// Metric: system_coverage_percentage
// Type: Gauge
// Description: Coverage percentage by type
// Labels: coverage_type (suppliers, products, categories)

metricsService.updateSystemCoverage(85.5, 'suppliers');
```

### HTTP Metrics

Automatically collected for all endpoints:

- `http_requests_total` - Total HTTP requests by method, endpoint, status
- `http_request_duration_ms` - Request duration histogram
- `http_request_errors_total` - Error count by method, endpoint, status code

### Cache Metrics

- `cache_hits_total` - Cache hits by cache type
- `cache_misses_total` - Cache misses by cache type

## Grafana Dashboards

### 1. System Overview Dashboard

**Location:** `monitoring/grafana/dashboards/overview.json`

**Panels:**

- Services Status (up/down)
- Request Rate across services
- Error Rate by service
- Response Time (95th percentile)
- QR Codes Generated (24h)
- Database Connections

**Use Case:** High-level system health monitoring

### 2. Business Metrics Dashboard

**Location:** `monitoring/grafana/dashboards/business-metrics.json`

**Panels:**

- IDR Rate (Invalid Data Rate) with alert threshold
- Mark Generation Rate by supplier
- Validation Success Rate gauge
- Average Validation Time (p50, p95)
- Active Marks Count by status
- Expired Marks counter
- System Coverage bar gauge
- Mark Generation Errors rate
- Validation Results pie chart
- Top Suppliers by mark generation

**Use Case:** Business KPI monitoring and analysis

### 3. Performance Dashboard

**Location:** `monitoring/grafana/dashboards/performance.json`

**Panels:**

- Request Rate (RPS)
- Response Time Percentiles (p99, p95, p50)
- Error Rate and Error Rate %
- Cache Hit Rate gauge
- Database Connection Pool usage
- QR Code Generation Performance
- Top 10 Slowest Endpoints
- Request Volume by Endpoint
- Cache Operations (hits/misses)
- System Resources (CPU, Memory)

**Use Case:** Performance optimization and bottleneck identification

### 4. Error Dashboard

**Location:** `monitoring/grafana/dashboards/errors.json`

**Panels:**

- Error Rate by Service
- Error Rate by Status Code
- Mark Generation Errors
- Mark Validation Failures
- Error Distribution pie chart
- 4xx vs 5xx Errors
- Top Error Endpoints
- Error Trends (24h)
- Validation Failure Reasons
- Error Rate Heatmap
- Service Health Status

**Use Case:** Error tracking and debugging

### 5. User Activity Dashboard

**Location:** `monitoring/grafana/dashboards/user-activity.json`

**Panels:**

- Active Users (24h)
- Total Requests (24h)
- Marks Generated/Validated (24h)
- User Activity Over Time
- Mark Operations Over Time
- Top Active Endpoints
- Request Methods Distribution
- Activity by Hour of Day
- Mark Generation by Supplier
- QR Code Generation Activity
- Cache Usage Statistics
- Response Status Codes Distribution

**Use Case:** User behavior analysis and usage patterns

## Prometheus Alerts

### Business Alerts

#### High IDR

```yaml
alert: HighIDR
expr: idr_rate{time_window="5m"} > 0.01
for: 5m
severity: warning
```

#### Critical IDR

```yaml
alert: CriticalIDR
expr: idr_rate{time_window="5m"} > 0.05
for: 2m
severity: critical
```

#### Mark Generation Failure

```yaml
alert: MarkGenerationFailure
expr: rate(mark_generation_errors_total[5m]) > 10
for: 5m
severity: critical
```

#### Low Validation Success Rate

```yaml
alert: LowValidationSuccessRate
expr: (rate(mark_validation_success_total[10m]) /
  (rate(mark_validation_success_total[10m]) +
  rate(mark_validation_failure_total[10m]))) < 0.95
for: 15m
severity: warning
```

#### Slow Mark Validation

```yaml
alert: SlowMarkValidation
expr: histogram_quantile(0.95,
  sum(rate(mark_validation_duration_ms_bucket[5m])) by (le)) > 500
for: 10m
severity: warning
```

### Performance Alerts

#### Low Cache Hit Rate

```yaml
alert: LowCacheHitRate
expr: (rate(cache_hits_total[5m]) /
  (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))) < 0.7
for: 10m
severity: warning
```

#### Database Connection Pool

```yaml
alert: DatabaseConnectionPool
expr: (pg_stat_activity_count / pg_settings_max_connections) * 100 > 80
for: 5m
severity: warning
```

## Alertmanager Configuration

### Multi-Channel Notifications

#### Email

Configured for all alert types with team-specific routing.

#### Slack

- **Critical Alerts:** `#alerts-critical`
- **Warning Alerts:** `#alerts-warning`
- **Info Alerts:** Not sent to Slack

#### PagerDuty

Only for critical alerts with 24/7 on-call rotation.

### Configuration

**Environment Variables Required:**

```bash
PAGERDUTY_INTEGRATION_KEY=your_integration_key
SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/...
SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/...
```

### Alert Routing

```yaml
routes:
  - match:
      severity: critical
    receiver: 'critical-alerts' # Email + Slack + PagerDuty

  - match:
      severity: warning
    receiver: 'warning-alerts' # Email + Slack

  - match:
      severity: info
    receiver: 'info-alerts' # Email only
```

## Structured Logging

### Correlation IDs

Every request receives a unique correlation ID for request tracing:

```typescript
// Automatic correlation ID generation
correlationId: req.correlationId || uuidv4()

// Passed in response header
X-Correlation-ID: <uuid>
```

### Log Format

**Request Log:**

```json
{
  "type": "request",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/marks/generate",
  "query": {},
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "supplier"
  }
}
```

**Response Log:**

```json
{
  "type": "response",
  "timestamp": "2025-10-13T10:30:00.250Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/marks/generate",
  "statusCode": 201,
  "duration": 250,
  "user": {
    "id": "user-123",
    "action": "POST /marks/generate"
  }
}
```

## Audit Trail

### Audit Logger

The `AuditLogger` service logs all critical user actions:

#### Mark Generation

```typescript
auditLogger.logMarkGeneration(userId, correlationId, count, supplier, 'success');
```

#### Mark Validation

```typescript
auditLogger.logMarkValidation(userId, correlationId, markId, isValid, reason);
```

#### Mark Blocking

```typescript
auditLogger.logMarkBlocking(userId, correlationId, markIds, reason, 'success');
```

#### Data Export

```typescript
auditLogger.logDataExport(userId, correlationId, format, recordCount, filters);
```

### Audit Log Format

```json
{
  "type": "audit",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "action": "mark_generation",
  "userId": "user-123",
  "result": "success",
  "details": {
    "count": 100,
    "supplier": "04607177964089"
  }
}
```

## Configuration

### Environment Variables

```bash
# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Prometheus
PROMETHEUS_ENDPOINT=http://prometheus:9090

# Grafana
GRAFANA_ENDPOINT=http://grafana:3000

# Alertmanager
ALERTMANAGER_ENDPOINT=http://alertmanager:9093

# PagerDuty
PAGERDUTY_INTEGRATION_KEY=your_key_here

# Slack
SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/services/...
SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/services/...

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
STRUCTURED_LOGGING=true
```

### Prometheus Configuration

Add the mark-service to Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: 'mark-service'
    static_configs:
      - targets: ['mark-service:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Accessing Metrics

### Metrics Endpoint

**URL:** `http://localhost:3000/metrics`

**Example Response:**

```
# HELP marks_generated_total Total number of marks generated
# TYPE marks_generated_total counter
marks_generated_total{gtin="04607177964089"} 1500

# HELP idr_rate Invalid Data Rate (IDR) - percentage of failed validations
# TYPE idr_rate gauge
idr_rate{supplier="all",time_window="5m"} 0.008

# HELP mark_validation_duration_ms Mark validation duration in milliseconds
# TYPE mark_validation_duration_ms histogram
mark_validation_duration_ms_bucket{result="success",le="50"} 1000
mark_validation_duration_ms_bucket{result="success",le="100"} 1450
```

## Best Practices

1. **Always use correlation IDs** for request tracing
2. **Set up alert fatigue prevention** - use appropriate thresholds
3. **Monitor dashboard regularly** - especially business metrics
4. **Review audit logs** for security and compliance
5. **Tune alert thresholds** based on actual traffic patterns
6. **Use structured logging** for better log analysis
7. **Set up retention policies** for metrics and logs
8. **Regular review** of system coverage metrics

## Troubleshooting

### High IDR Rate

1. Check validation failure reasons in Error Dashboard
2. Review recent mark generation patterns
3. Check for data quality issues with suppliers
4. Review audit logs for suspicious activity

### Slow Validation

1. Check database connection pool usage
2. Review cache hit rate
3. Check for slow queries in PostgreSQL
4. Review system resources (CPU, Memory)

### Alert Not Firing

1. Verify Prometheus is scraping metrics
2. Check alert rule syntax in Prometheus
3. Verify Alertmanager configuration
4. Check notification channel configuration

## Support

For issues or questions, contact:

- DevOps Team: devops@znak-lavki.com
- Backend Team: backend@znak-lavki.com
- On-Call: See PagerDuty rotation
