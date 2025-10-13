# 📊 Znak Lavki Monitoring & Alerting System

Complete monitoring and alerting infrastructure for the Znak Lavki mark management system with business metrics, structured logging, and multi-channel alerting.

## 🚀 Quick Start

```bash
# 1. Start the monitoring stack
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Access the dashboards
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Alertmanager: http://localhost:9093

# 3. Verify metrics are being collected
curl http://localhost:3000/metrics  # Mark service metrics
curl http://localhost:9090/targets  # Prometheus targets
```

## 📚 Documentation

| Document                                                              | Description                       |
| --------------------------------------------------------------------- | --------------------------------- |
| **[Quick Start Guide](./MONITORING_QUICK_START.md)**                  | Get started in 5 minutes          |
| **[Configuration Guide](./CONFIGURATION.md)**                         | Detailed setup instructions       |
| **[Monitoring Guide](../services/mark-service/MONITORING_GUIDE.md)**  | Complete monitoring documentation |
| **[Implementation Summary](../MONITORING_IMPLEMENTATION_SUMMARY.md)** | What was implemented              |

## 🎯 What's Included

### 🔧 Services

- **Prometheus** - Metrics collection and storage (15s scrape interval)
- **Grafana** - Visualization with 5 pre-configured dashboards
- **Alertmanager** - Multi-channel alert routing
- **Node Exporter** - System-level metrics
- **Postgres Exporter** - Database metrics
- **Redis Exporter** - Cache metrics
- **cAdvisor** - Container resource metrics
- **Loki + Promtail** - Log aggregation (optional)

### 📊 Dashboards (5 Pre-configured)

1. **System Overview** - High-level health monitoring
   - Service status, request rates, error rates, response times
2. **Business Metrics** ⭐ - Business KPIs
   - IDR rate, mark generation, validation success, active/expired marks
3. **Performance** - Response times and resource usage
   - Cache hit rates, database connections, system resources
4. **Errors** - Error tracking and debugging
   - Error rates by type, validation failures, top error endpoints
5. **User Activity** - Usage patterns and analytics
   - Active users, request patterns, peak activity hours

### 🔔 Alerts (30+ Rules)

#### Business Alerts (9)

- HighIDR / CriticalIDR - Invalid Data Rate monitoring
- MarkGenerationFailure - Generation error tracking
- LowValidationSuccessRate - Validation quality
- SlowMarkValidation - Performance monitoring
- HighExpiredMarksCount - Data hygiene
- LowSystemCoverage - Coverage tracking
- AbnormalActiveMarksGrowth - Anomaly detection
- HighMarkBlockingRate - Security monitoring

#### Performance Alerts (4)

- LowCacheHitRate - Cache efficiency
- DatabaseConnectionPool - Connection monitoring
- DatabaseConnectionPoolCritical - Critical thresholds
- HighEndpointLoad - Traffic spikes

#### Infrastructure Alerts (17+)

- ServiceDown, HighErrorRate, HighResponseTime
- PostgresDown, PostgresHighConnections, PostgresSlowQueries
- RedisDown, RedisHighMemoryUsage
- And more...

### 📡 Alert Channels

| Channel       | Severity          | Use Case                |
| ------------- | ----------------- | ----------------------- |
| **Email**     | All               | Team notifications      |
| **Slack**     | Critical, Warning | Real-time team alerts   |
| **PagerDuty** | Critical only     | 24/7 on-call escalation |

## ✨ Key Features

### Business Metrics

```typescript
// IDR Rate - Invalid Data Rate
idr_rate{supplier="all",time_window="5m"}

// Mark Generation Rate
rate(marks_generated_total[5m])

// Validation Success Rate
(rate(mark_validation_success_total[5m]) /
 (rate(mark_validation_success_total[5m]) +
  rate(mark_validation_failure_total[5m]))) * 100
```

### Correlation IDs

Every request gets a unique correlation ID for end-to-end tracing:

```
Request → X-Correlation-ID → All Logs → Response Header
```

### Structured Logging

All logs in JSON format for easy parsing and searching:

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

### Audit Trail

Complete audit logging for compliance:

- Mark generation/validation
- Mark blocking operations
- Data exports
- Authentication events
- Permission denials

## 📁 File Structure

```
monitoring/
├── alertmanager/
│   └── alertmanager.yml              # Alert routing (Email, Slack, PagerDuty)
├── prometheus/
│   ├── prometheus.yml                # Scrape config for all services
│   └── rules/
│       └── alerts.yml                # 30+ alert rules
├── grafana/
│   ├── datasources/
│   │   └── prometheus.yaml           # Auto-configured datasource
│   └── dashboards/
│       ├── business-metrics.json     # 11 panels - Business KPIs
│       ├── performance.json          # 11 panels - Performance
│       ├── errors.json               # 12 panels - Error tracking
│       ├── user-activity.json        # 14 panels - User analytics
│       └── overview.json             # 7 panels - System health
├── docker-compose.monitoring.yml     # Complete monitoring stack
├── CONFIGURATION.md                  # Detailed configuration guide
├── MONITORING_QUICK_START.md         # Quick start guide
└── README_NEW.md                     # This file
```

## 🔧 Configuration

### Required Environment Variables

Create `.env` file in `monitoring/` directory:

```bash
# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme

# Database (for postgres-exporter)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki

# Redis (for redis-exporter)
REDIS_HOST=redis
REDIS_PORT=6379

# Optional: Alert Channels
PAGERDUTY_INTEGRATION_KEY=your_key
SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/...
SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/...
```

### Starting the Stack

```bash
# Development
docker-compose -f docker-compose.monitoring.yml up -d

# Production (with env vars)
export $(cat .env | xargs)
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps
```

## 📊 Accessing Services

| Service               | URL                           | Credentials |
| --------------------- | ----------------------------- | ----------- |
| **Grafana**           | http://localhost:3000         | admin/admin |
| **Prometheus**        | http://localhost:9090         | -           |
| **Alertmanager**      | http://localhost:9093         | -           |
| **Node Exporter**     | http://localhost:9100/metrics | -           |
| **Postgres Exporter** | http://localhost:9187/metrics | -           |
| **Redis Exporter**    | http://localhost:9121/metrics | -           |
| **cAdvisor**          | http://localhost:8080         | -           |

## 🎨 Dashboard Examples

### Business Metrics Dashboard

![Business Metrics](../docs/images/business-metrics.png)

**Key Panels:**

- IDR Rate with alert threshold
- Mark Generation Rate by supplier
- Validation Success Rate gauge (target: 95%+)
- Active Marks Count trend
- System Coverage percentage

### Performance Dashboard

![Performance](../docs/images/performance.png)

**Key Panels:**

- Request Rate (RPS)
- Response Time Percentiles (p50, p95, p99)
- Cache Hit Rate
- Database Connection Pool
- Top 10 Slowest Endpoints

## 🔍 Common Queries

### Check Current IDR Rate

```promql
idr_rate{time_window="5m"}
```

### Find Slow Endpoints

```promql
topk(10, histogram_quantile(0.95,
  sum(rate(http_request_duration_ms_bucket[5m])) by (le, endpoint)))
```

### Validation Success Rate

```promql
(rate(mark_validation_success_total[5m]) /
 (rate(mark_validation_success_total[5m]) +
  rate(mark_validation_failure_total[5m]))) * 100
```

### Cache Hit Rate

```promql
(rate(cache_hits_total[5m]) /
 (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))) * 100
```

## 🚨 Alert Examples

### Critical Alert

```yaml
alert: CriticalIDR
expr: idr_rate{time_window="5m"} > 0.05
for: 2m
labels:
  severity: critical
  team: backend
annotations:
  summary: 'Critical IDR for {{ $labels.supplier }}'
  description: 'IDR rate exceeds 5% - immediate action required'
# Triggers: PagerDuty + Slack + Email
```

### Warning Alert

```yaml
alert: LowCacheHitRate
expr: (rate(cache_hits_total[5m]) /
  (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))) < 0.7
for: 10m
labels:
  severity: warning
  team: backend
annotations:
  summary: 'Low cache hit rate: {{ $labels.cache_type }}'
# Triggers: Slack + Email
```

## 🔐 Security

### Change Default Passwords

```bash
# Grafana
# Login and change password on first access

# Or set via environment
GRAFANA_ADMIN_PASSWORD=secure_password
```

### Enable HTTPS

Use nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name grafana.example.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Restrict Access

```bash
# Firewall rules
ufw allow from 192.168.1.0/24 to any port 3000
```

## 📈 Resource Requirements

| Component    | CPU     | Memory     | Disk      |
| ------------ | ------- | ---------- | --------- |
| Prometheus   | 0.5     | 2 GB       | 10 GB     |
| Grafana      | 0.2     | 512 MB     | 1 GB      |
| Alertmanager | 0.1     | 256 MB     | 1 GB      |
| Exporters    | 0.5     | 640 MB     | -         |
| **Total**    | **1.3** | **3.4 GB** | **12 GB** |

## 🛠️ Troubleshooting

### Metrics Not Appearing

```bash
# Check service exposes metrics
curl http://localhost:3000/metrics

# Check Prometheus targets
open http://localhost:9090/targets

# Check logs
docker logs prometheus
```

### Alerts Not Firing

```bash
# Check alert rules loaded
curl http://localhost:9090/api/v1/rules

# Check Alertmanager
open http://localhost:9093

# Test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"test","severity":"critical"}}]'
```

### Dashboard Not Loading

```bash
# Check Grafana logs
docker logs grafana

# Re-import dashboard
# Grafana UI → Dashboards → Import → Upload JSON
```

## 📊 Metrics Reference

### Business Metrics

- `idr_rate` - Invalid Data Rate
- `marks_generated_total` - Total marks generated
- `mark_validation_success_total` - Successful validations
- `mark_validation_failure_total` - Failed validations
- `active_marks_count` - Current active marks
- `expired_marks_count` - Current expired marks
- `mark_validation_duration_ms` - Validation timing
- `system_coverage_percentage` - System coverage

### HTTP Metrics

- `http_requests_total` - HTTP request count
- `http_request_duration_ms` - Request duration
- `http_request_errors_total` - HTTP errors

### Cache Metrics

- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses

## 🎓 Best Practices

1. ✅ Check dashboards daily (especially Business Metrics)
2. ✅ Set up mobile alerts for critical issues
3. ✅ Review weekly trends (use 7d time range)
4. ✅ Update alert thresholds based on traffic
5. ✅ Document incidents with correlation IDs
6. ✅ Regular health checks (see Quick Start Guide)

## 📞 Support

| Issue Type          | Contact                 |
| ------------------- | ----------------------- |
| Critical Production | PagerDuty On-Call       |
| Monitoring Setup    | devops@znak-lavki.com   |
| Dashboard Questions | backend@znak-lavki.com  |
| Documentation       | See guides linked above |

## 🔄 What's Next

Future enhancements:

- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] ML-based anomaly detection
- [ ] SLO/SLA tracking
- [ ] Cost analysis dashboards
- [ ] User journey tracking

## ✅ Implementation Status

**Status:** ✅ **PRODUCTION READY**

**Completed:**

- ✅ MetricsService with business metrics
- ✅ Structured logging with correlation IDs
- ✅ 30+ Prometheus alert rules
- ✅ 5 Grafana dashboards (48+ panels)
- ✅ Multi-channel alerting (Email, Slack, PagerDuty)
- ✅ Complete documentation

**Date:** October 13, 2025

---

For detailed information, see:

- [Monitoring Guide](../services/mark-service/MONITORING_GUIDE.md)
- [Quick Start](./MONITORING_QUICK_START.md)
- [Configuration](./CONFIGURATION.md)
