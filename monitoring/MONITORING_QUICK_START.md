# Monitoring Quick Start Guide

## 🚀 Quick Setup

### 1. Start Monitoring Stack

```bash
# Start Prometheus, Grafana, and Alertmanager
cd monitoring
docker-compose up -d
```

### 2. Access Dashboards

**Grafana:** http://localhost:3000

- Username: `admin`
- Password: `admin` (change on first login)

**Prometheus:** http://localhost:9090

**Alertmanager:** http://localhost:9093

### 3. Import Grafana Dashboards

1. Navigate to Grafana → Dashboards → Import
2. Import the following dashboards:
   - `monitoring/grafana/dashboards/business-metrics.json`
   - `monitoring/grafana/dashboards/performance.json`
   - `monitoring/grafana/dashboards/errors.json`
   - `monitoring/grafana/dashboards/user-activity.json`
   - `monitoring/grafana/dashboards/overview.json`

### 4. Configure Alert Channels

#### Slack Integration

1. Create Slack webhook URLs:
   - Critical alerts: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
   - Warning alerts: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

2. Update environment variables:

```bash
export SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/...
export SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/...
```

3. Restart Alertmanager:

```bash
docker-compose restart alertmanager
```

#### PagerDuty Integration

1. Get your PagerDuty integration key from Events API V2
2. Set environment variable:

```bash
export PAGERDUTY_INTEGRATION_KEY=your_integration_key
```

3. Restart Alertmanager

### 5. Verify Metrics Collection

Check that metrics are being collected:

```bash
# Check mark-service metrics endpoint
curl http://localhost:3000/metrics

# Check Prometheus targets
open http://localhost:9090/targets
```

## 📊 Key Dashboards

### System Overview

**Use:** High-level health monitoring
**Key Panels:**

- Service status (up/down)
- Request rate
- Error rate
- Response times

### Business Metrics

**Use:** Business KPI tracking
**Key Panels:**

- IDR Rate (Invalid Data Rate)
- Mark generation rate
- Validation success rate
- Active/expired marks

### Performance

**Use:** Performance optimization
**Key Panels:**

- Response time percentiles
- Cache hit rate
- Database connection pool
- Resource usage

### Errors

**Use:** Error tracking and debugging
**Key Panels:**

- Error rate by service
- Error distribution
- Top error endpoints
- Validation failures

### User Activity

**Use:** Usage analysis
**Key Panels:**

- Active users
- Request patterns
- Mark operations
- Peak activity hours

## 🔔 Important Alerts

### Critical Alerts (PagerDuty + Slack + Email)

| Alert                          | Threshold                  | Action Required                                |
| ------------------------------ | -------------------------- | ---------------------------------------------- |
| CriticalIDR                    | IDR > 5%                   | Immediate investigation of data quality        |
| MarkGenerationFailure          | > 10 errors/min            | Check service health and dependencies          |
| DatabaseConnectionPoolCritical | > 95% usage                | Scale database or investigate connection leaks |
| ServiceDown                    | Service unavailable > 1min | Restart service, check logs                    |

### Warning Alerts (Slack + Email)

| Alert                  | Threshold   | Action Within                     |
| ---------------------- | ----------- | --------------------------------- |
| HighIDR                | IDR > 1%    | 30 minutes - investigate patterns |
| SlowMarkValidation     | p95 > 500ms | 1 hour - optimize queries         |
| LowCacheHitRate        | < 70%       | 2 hours - review cache strategy   |
| DatabaseConnectionPool | > 80% usage | 1 hour - monitor and plan scaling |

## 🔍 Common Monitoring Tasks

### Check Current IDR Rate

**Grafana:** Business Metrics Dashboard → IDR Rate Panel

**PromQL:**

```promql
idr_rate{time_window="5m"}
```

### Find Slow Endpoints

**Grafana:** Performance Dashboard → Top 10 Slowest Endpoints

**PromQL:**

```promql
topk(10, histogram_quantile(0.95,
  sum(rate(http_request_duration_ms_bucket[5m])) by (le, endpoint)))
```

### Check Validation Success Rate

**Grafana:** Business Metrics Dashboard → Validation Success Rate Gauge

**PromQL:**

```promql
(rate(mark_validation_success_total[5m]) /
 (rate(mark_validation_success_total[5m]) +
  rate(mark_validation_failure_total[5m]))) * 100
```

### Monitor Active Marks

**Grafana:** Business Metrics Dashboard → Active Marks Count

**PromQL:**

```promql
active_marks_count
```

## 📝 Audit Trail

### View Audit Logs

```bash
# View audit logs from mark-service
docker logs mark-service | grep '"type":"audit"' | jq

# Filter by action
docker logs mark-service | grep '"action":"mark_generation"' | jq
```

### Search by Correlation ID

```bash
# Find all logs related to a specific request
CORRELATION_ID="550e8400-e29b-41d4-a716-446655440000"
docker logs mark-service | grep $CORRELATION_ID | jq
```

## 🔧 Troubleshooting

### Metrics Not Appearing

1. Check service is exposing metrics:

```bash
curl http://localhost:3000/metrics
```

2. Check Prometheus is scraping:

```bash
# Visit Prometheus targets page
open http://localhost:9090/targets
```

3. Check for errors in Prometheus logs:

```bash
docker logs prometheus
```

### Alerts Not Firing

1. Check alert rules are loaded:

```bash
open http://localhost:9090/alerts
```

2. Verify Alertmanager connection:

```bash
open http://localhost:9090/config
```

3. Check Alertmanager logs:

```bash
docker logs alertmanager
```

### Dashboards Not Loading

1. Verify Grafana can connect to Prometheus:
   - Go to Configuration → Data Sources
   - Test Prometheus connection

2. Check dashboard JSON syntax:

```bash
# Validate JSON
jq . monitoring/grafana/dashboards/business-metrics.json
```

## 📚 Additional Resources

- **Full Documentation:** `services/mark-service/MONITORING_GUIDE.md`
- **Alert Rules:** `monitoring/prometheus/rules/alerts.yml`
- **Alertmanager Config:** `monitoring/alertmanager/alertmanager.yml`
- **Dashboard JSON:** `monitoring/grafana/dashboards/`

## 🆘 Support

| Issue Type                 | Contact                 |
| -------------------------- | ----------------------- |
| Critical Production Issues | PagerDuty On-Call       |
| Monitoring Setup           | devops@znak-lavki.com   |
| Dashboard Questions        | backend@znak-lavki.com  |
| Metric Definitions         | See MONITORING_GUIDE.md |

## 🎯 Best Practices

1. **Check dashboards daily** - especially Business Metrics
2. **Set up mobile alerts** - for critical alerts via PagerDuty
3. **Review weekly trends** - use 7d time range
4. **Update alert thresholds** - based on actual traffic patterns
5. **Document incidents** - include correlation IDs
6. **Regular health checks** - use automated monitoring checks

## ✅ Health Check Checklist

Daily:

- [ ] All services UP in System Overview
- [ ] IDR rate < 1%
- [ ] No critical alerts
- [ ] Validation success rate > 95%

Weekly:

- [ ] Review performance trends
- [ ] Check cache hit rates
- [ ] Analyze user activity patterns
- [ ] Review and tune alert thresholds

Monthly:

- [ ] Review system coverage metrics
- [ ] Analyze long-term trends
- [ ] Plan capacity based on growth
- [ ] Update dashboards with new metrics
