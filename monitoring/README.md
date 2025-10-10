# Мониторинг Znak Lavki

Полная конфигурация мониторинга и алертинга для проекта Znak Lavki.

## Компоненты

### Prometheus
- **Назначение**: Сбор и хранение метрик
- **Порт**: 9090
- **Конфигурация**: `prometheus/prometheus-*.yml`

### Grafana
- **Назначение**: Визуализация метрик и дашборды
- **Порт**: 3000
- **Логин**: admin/admin
- **Дашборды**: `grafana/dashboards/`

### Alertmanager
- **Назначение**: Управление и маршрутизация алертов
- **Порт**: 9093
- **Конфигурация**: `alertmanager/alertmanager.yml`

### ELK Stack
- **Elasticsearch**: Хранилище логов (порт 9200)
- **Logstash**: Обработка логов (порт 5044)
- **Kibana**: Визуализация логов (порт 5601)
- **Filebeat**: Сбор логов с контейнеров

## Быстрый старт

### Development окружение

```bash
# Запуск с мониторингом
docker-compose -f docker-compose.dev.yml --profile monitoring up -d

# Доступ к сервисам
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093
```

### Production (Kubernetes)

```bash
# Применить Prometheus Operator
kubectl apply -f k8s/monitoring/

# Проверить статус
kubectl get pods -n monitoring
```

## Метрики

### Основные метрики приложения

```promql
# Количество запросов в секунду
rate(http_requests_total[5m])

# Частота ошибок
rate(http_requests_total{status=~"5.."}[5m])

# Время ответа (95 перцентиль)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Количество сгенерированных QR кодов
increase(qr_codes_generated_total[1h])
```

### Метрики инфраструктуры

```promql
# Использование CPU
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Использование памяти
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Свободное место на диске
node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100
```

## Алерты

### Категории алертов

1. **Critical** - Требует немедленного реагирования
   - Сервис недоступен
   - База данных недоступна
   - Нет свободного места на диске

2. **Warning** - Требует внимания
   - Высокое использование ресурсов
   - Медленные запросы
   - Высокая частота ошибок

3. **Info** - Информационные
   - Низкая активность системы
   - Изменения конфигурации

### Настройка уведомлений

Отредактируйте `alertmanager/alertmanager.yml`:

```yaml
# Email уведомления
smtp_smarthost: 'smtp.gmail.com:587'
smtp_from: 'alerts@znak-lavki.com'
smtp_auth_username: 'your-email@gmail.com'
smtp_auth_password: 'your-app-password'

# Telegram (раскомментируйте)
telegram_configs:
  - bot_token: 'YOUR_BOT_TOKEN'
    chat_id: YOUR_CHAT_ID

# Slack (раскомментируйте)
slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#alerts'
```

## Grafana Dashboards

### Доступные дашборды

1. **Overview** - Общая информация о системе
2. **Services** - Метрики микросервисов
3. **Infrastructure** - Метрики инфраструктуры
4. **Database** - PostgreSQL метрики
5. **Business** - Бизнес-метрики

### Импорт дашбордов

```bash
# Автоматически загружаются из grafana/dashboards/
# Или импортируйте вручную в UI Grafana
```

## ELK Stack

### Просмотр логов

```bash
# Kibana доступна на http://localhost:5601

# Создание index pattern
1. Откройте Kibana
2. Management -> Index Patterns
3. Создайте pattern: znak-lavki-*
4. Выберите timestamp field: @timestamp
```

### Поиск в логах

```
# Все ошибки
level:ERROR

# Ошибки конкретного сервиса
service:api-gateway AND level:ERROR

# Медленные запросы
tags:slow_query AND duration_ms:>1000

# Запросы от конкретного IP
client_ip:192.168.1.1
```

### Полезные запросы

```
# Top 10 ошибок
level:ERROR | stats count() by log_message

# Медленные SQL запросы
service:postgres AND duration_ms:>1000

# HTTP ошибки 5xx
status:5* | stats count() by service
```

## Retention политики

### Prometheus
- Хранение метрик: 15 дней
- Конфигурация: `--storage.tsdb.retention.time=15d`

### Elasticsearch
- Логи хранятся 30 дней
- ILM политика автоматически удаляет старые индексы
- Настройка в `elasticsearch.yml`

## Troubleshooting

### Prometheus не собирает метрики

```bash
# Проверьте targets
curl http://localhost:9090/api/v1/targets

# Проверьте конфигурацию
promtool check config prometheus/prometheus.yml
```

### Alertmanager не отправляет уведомления

```bash
# Проверьте статус
curl http://localhost:9093/api/v1/status

# Проверьте конфигурацию
amtool check-config alertmanager/alertmanager.yml

# Посмотрите логи
docker logs alertmanager
```

### Elasticsearch не индексирует логи

```bash
# Проверьте health
curl http://localhost:9200/_cluster/health

# Проверьте индексы
curl http://localhost:9200/_cat/indices

# Проверьте Logstash
curl http://localhost:9600/_node/stats
```

## Best Practices

1. **Метрики**
   - Используйте метки (labels) разумно
   - Избегайте high cardinality меток
   - Используйте rate() для counter метрик

2. **Алерты**
   - Создавайте actionable алерты
   - Избегайте alert fatigue
   - Используйте правильные severity уровни

3. **Логи**
   - Используйте структурированные логи (JSON)
   - Добавляйте context (request_id, user_id)
   - Логируйте на правильном уровне

4. **Дашборды**
   - Один дашборд = одна цель
   - Используйте переменные для фильтрации
   - Добавляйте описания к панелям

## Дополнительные ресурсы

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

