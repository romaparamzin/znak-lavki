# Monitoring Configuration Guide

## Environment Variables Setup

### Required Environment Variables

Create a `.env` file in the `monitoring/` directory with the following variables:

```bash
# Grafana Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme_in_production

# Database Connection (for postgres-exporter)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki

# Redis Connection (for redis-exporter)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Optional - Alert Channels

#### PagerDuty Integration

1. Go to PagerDuty → Services → Select your service
2. Click "Integrations" → "Add Integration"
3. Select "Events API V2"
4. Copy the Integration Key

```bash
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_integration_key_here
```

#### Slack Webhooks

1. Go to https://api.slack.com/messaging/webhooks
2. Create a new webhook for each channel
3. Copy the webhook URLs

```bash
SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

#### Email Configuration

For Gmail:

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password below

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=alerts@znak-lavki.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Telegram Bot (Optional)

1. Create a bot via @BotFather
2. Get your chat ID from @userinfobot

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Starting the Monitoring Stack

### Development Environment

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### Production Environment

```bash
cd monitoring

# Load environment variables
export $(cat .env | xargs)

# Start with production configuration
docker-compose -f docker-compose.monitoring.yml up -d
```

### Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.monitoring.yml ps

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana health
curl http://localhost:3000/api/health
```

## Service URLs

After starting the stack:

- **Grafana:** http://localhost:3000
  - Username: `admin` (or value from GRAFANA_ADMIN_USER)
  - Password: `admin` (or value from GRAFANA_ADMIN_PASSWORD)

- **Prometheus:** http://localhost:9090

- **Alertmanager:** http://localhost:9093

- **Node Exporter:** http://localhost:9100/metrics

- **Postgres Exporter:** http://localhost:9187/metrics

- **Redis Exporter:** http://localhost:9121/metrics

- **cAdvisor:** http://localhost:8080

## Initial Setup Steps

### 1. Change Grafana Password

```bash
# Access Grafana at http://localhost:3000
# Login with admin/admin
# You'll be prompted to change the password
```

### 2. Verify Prometheus Targets

```bash
# Visit http://localhost:9090/targets
# All targets should be UP and green
```

### 3. Import Grafana Dashboards

Method 1: Via UI

1. Go to Grafana → Dashboards → Import
2. Upload each JSON file from `monitoring/grafana/dashboards/`

Method 2: Via provisioning (automatic)

- Dashboards in `monitoring/grafana/dashboards/` are auto-loaded

### 4. Test Alerts

```bash
# Test alert by stopping a service
docker stop mark-service

# Wait 1-2 minutes
# Check Alertmanager: http://localhost:9093

# Verify alert was sent to configured channels
# Restart service
docker start mark-service
```

### 5. Configure Alert Channels in Alertmanager

Edit `monitoring/alertmanager/alertmanager.yml` and add your webhook URLs:

```yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL_CRITICAL}'
        channel: '#alerts-critical'
```

Restart Alertmanager:

```bash
docker-compose -f docker-compose.monitoring.yml restart alertmanager
```

## Retention Configuration

### Prometheus Data Retention

Default: 30 days

Change in docker-compose:

```yaml
prometheus:
  command:
    - '--storage.tsdb.retention.time=60d' # Change to 60 days
```

### Grafana Dashboard Settings

Configure in Grafana UI:

1. Configuration → Preferences
2. Set default time range
3. Set refresh intervals

## Resource Requirements

Minimum requirements for monitoring stack:

| Service           | CPU     | Memory     | Disk      |
| ----------------- | ------- | ---------- | --------- |
| Prometheus        | 0.5     | 2 GB       | 10 GB     |
| Grafana           | 0.2     | 512 MB     | 1 GB      |
| Alertmanager      | 0.1     | 256 MB     | 1 GB      |
| Node Exporter     | 0.1     | 128 MB     | -         |
| Postgres Exporter | 0.1     | 128 MB     | -         |
| Redis Exporter    | 0.1     | 128 MB     | -         |
| cAdvisor          | 0.2     | 256 MB     | -         |
| **Total**         | **1.3** | **3.4 GB** | **12 GB** |

## Network Configuration

All services run on a `monitoring` network:

```yaml
networks:
  monitoring:
    driver: bridge
```

To connect mark-service to monitoring:

```yaml
# In mark-service docker-compose
services:
  mark-service:
    networks:
      - default
      - monitoring

networks:
  monitoring:
    external: true
```

## Security Considerations

### 1. Change Default Passwords

- Grafana admin password
- Database passwords
- Redis password (if used)

### 2. Enable HTTPS

Use a reverse proxy (nginx) for HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name grafana.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 3. Restrict Access

Use firewall rules:

```bash
# Allow only from specific IPs
ufw allow from 192.168.1.0/24 to any port 3000
ufw allow from 192.168.1.0/24 to any port 9090
```

### 4. Enable Authentication

Enable basic auth in Prometheus:

```yaml
# prometheus.yml
basic_auth_users:
  admin: $2a$10$hash...
```

## Backup Configuration

### Prometheus Data

```bash
# Backup Prometheus data
docker run --rm \
  -v prometheus-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz /data
```

### Grafana Dashboards

Dashboards are stored in Git, but for runtime backups:

```bash
# Backup Grafana data
docker run --rm \
  -v grafana-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/grafana-$(date +%Y%m%d).tar.gz /data
```

### Automated Backup Script

```bash
#!/bin/bash
# backup-monitoring.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d)

# Backup Prometheus
docker run --rm \
  -v prometheus-data:/data \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/prometheus-${DATE}.tar.gz /data

# Backup Grafana
docker run --rm \
  -v grafana-data:/data \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/grafana-${DATE}.tar.gz /data

# Keep only last 7 days
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup-monitoring.sh
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.monitoring.yml logs <service-name>

# Check configuration
docker-compose -f docker-compose.monitoring.yml config

# Validate Prometheus config
docker run --rm -v $(pwd)/prometheus:/etc/prometheus \
  prom/prometheus:latest \
  promtool check config /etc/prometheus/prometheus.yml
```

### Targets Not Scraping

1. Check service is exposing metrics:

```bash
curl http://localhost:3000/metrics
```

2. Check network connectivity:

```bash
docker exec prometheus ping mark-service
```

3. Check Prometheus logs:

```bash
docker logs prometheus
```

### Alerts Not Firing

1. Verify alert rules are loaded:

```bash
curl http://localhost:9090/api/v1/rules
```

2. Check Alertmanager connection:

```bash
curl http://localhost:9090/api/v1/alertmanagers
```

3. Test Alertmanager receiver:

```bash
# Send test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"test","severity":"warning"}}]'
```

### Dashboard Not Loading

1. Check Grafana logs:

```bash
docker logs grafana
```

2. Verify datasource:

- Grafana → Configuration → Data Sources
- Test connection to Prometheus

3. Re-import dashboard:

- Delete existing dashboard
- Import JSON again

## Performance Tuning

### Prometheus

Increase scrape interval for less critical metrics:

```yaml
scrape_configs:
  - job_name: 'node'
    scrape_interval: 60s # Instead of 15s
```

### Grafana

Limit query time range:

```yaml
# grafana.ini
[dashboards]
default_home_dashboard_path = /path/to/dashboard.json
min_refresh_interval = 10s
```

### Alertmanager

Increase group wait time:

```yaml
route:
  group_wait: 30s # Wait longer before sending
  group_interval: 5m
```

## Scaling Considerations

For high-load environments:

1. **Prometheus Federation**
   - Multiple Prometheus servers
   - Federated scraping

2. **Remote Storage**
   - Use Thanos or Cortex
   - Long-term storage

3. **HA Setup**
   - Multiple Alertmanager instances
   - Multiple Grafana instances with shared DB

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
