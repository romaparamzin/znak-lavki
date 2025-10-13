# 📊 Система Мониторинга и Алертинга Znak Lavki

Комплексная инфраструктура мониторинга и алертинга для системы управления марками Znak Lavki с бизнес-метриками, структурированным логированием и мультиканальными алертами.

## 🚀 Быстрый Старт

```bash
# 1. Запустите стек мониторинга
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# 2. Откройте дашборды
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Alertmanager: http://localhost:9093

# 3. Проверьте сбор метрик
curl http://localhost:3000/metrics  # Метрики mark service
curl http://localhost:9090/targets  # Targets Prometheus
```

## 📚 Документация

| Документ                                                                       | Описание                            |
| ------------------------------------------------------------------------------ | ----------------------------------- |
| **[Быстрый Старт](./БЫСТРЫЙ_СТАРТ_МОНИТОРИНГА.md)**                            | Начните за 5 минут                  |
| **[Руководство по Мониторингу](../services/mark-service/MONITORING_GUIDE.md)** | Полная документация (на английском) |
| **[Сводка Реализации](../МОНИТОРИНГ_РЕАЛИЗАЦИЯ.md)**                           | Что было реализовано                |

## 🎯 Что Включено

### 🔧 Сервисы

- **Prometheus** - Сбор и хранение метрик (интервал сбора 15с)
- **Grafana** - Визуализация с 5 преднастроенными дашбордами
- **Alertmanager** - Мультиканальная маршрутизация алертов
- **Node Exporter** - Метрики системного уровня
- **Postgres Exporter** - Метрики базы данных
- **Redis Exporter** - Метрики кэша
- **cAdvisor** - Метрики ресурсов контейнеров
- **Loki + Promtail** - Агрегация логов (опционально)

### 📊 Дашборды (5 Преднастроенных)

1. **Обзор Системы** - Мониторинг общего состояния
   - Статус сервисов, частота запросов, частота ошибок, время ответа

2. **Бизнес-Метрики** ⭐ - Бизнес-KPI
   - IDR rate, генерация марок, успешность валидации, активные/истекшие марки

3. **Производительность** - Время ответа и использование ресурсов
   - Эффективность кэша, соединения с БД, системные ресурсы

4. **Ошибки** - Отслеживание и отладка ошибок
   - Частота ошибок по типам, неудачи валидации, топ endpoints с ошибками

5. **Активность Пользователей** - Паттерны использования и аналитика
   - Активные пользователи, паттерны запросов, часы пиковой активности

### 🔔 Алерты (30+ Правил)

#### Бизнес-Алерты (9)

- HighIDR / CriticalIDR - Мониторинг Invalid Data Rate
- MarkGenerationFailure - Отслеживание ошибок генерации
- LowValidationSuccessRate - Качество валидации
- SlowMarkValidation - Мониторинг производительности
- HighExpiredMarksCount - Гигиена данных
- LowSystemCoverage - Отслеживание покрытия
- AbnormalActiveMarksGrowth - Обнаружение аномалий
- HighMarkBlockingRate - Мониторинг безопасности

#### Алерты Производительности (4)

- LowCacheHitRate - Эффективность кэша
- DatabaseConnectionPool - Мониторинг соединений
- DatabaseConnectionPoolCritical - Критические пороги
- HighEndpointLoad - Пики трафика

#### Алерты Инфраструктуры (17+)

- ServiceDown, HighErrorRate, HighResponseTime
- PostgresDown, PostgresHighConnections, PostgresSlowQueries
- RedisDown, RedisHighMemoryUsage
- И многое другое...

### 📡 Каналы Алертов

| Канал         | Критичность       | Назначение                        |
| ------------- | ----------------- | --------------------------------- |
| **Email**     | Все               | Уведомления команды               |
| **Slack**     | Critical, Warning | Алерты команды в реальном времени |
| **PagerDuty** | Только Critical   | Эскалация дежурным 24/7           |

## ✨ Ключевые Возможности

### Бизнес-Метрики

```typescript
// IDR Rate - Invalid Data Rate
idr_rate{supplier="all",time_window="5m"}

// Скорость Генерации Марок
rate(marks_generated_total[5m])

// Процент Успешности Валидации
(rate(mark_validation_success_total[5m]) /
 (rate(mark_validation_success_total[5m]) +
  rate(mark_validation_failure_total[5m]))) * 100
```

### Correlation IDs

Каждый запрос получает уникальный correlation ID для end-to-end трейсинга:

```
Запрос → X-Correlation-ID → Все Логи → Заголовок Ответа
```

### Структурированное Логирование

Все логи в формате JSON для легкого парсинга и поиска:

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

### Аудит-Трейл

Полное логирование аудита для соответствия:

- Генерация/валидация марок
- Операции блокировки марок
- Экспорт данных
- События аутентификации
- Отказы в доступе

## 📁 Структура Файлов

```
monitoring/
├── alertmanager/
│   └── alertmanager.yml              # Маршрутизация алертов (Email, Slack, PagerDuty)
├── prometheus/
│   ├── prometheus.yml                # Конфигурация сбора для всех сервисов
│   └── rules/
│       └── alerts.yml                # 30+ правил алертов
├── grafana/
│   ├── datasources/
│   │   └── prometheus.yaml           # Автоконфигурируемый источник данных
│   └── dashboards/
│       ├── business-metrics.json     # 11 панелей - Бизнес-KPI
│       ├── performance.json          # 11 панелей - Производительность
│       ├── errors.json               # 12 панелей - Отслеживание ошибок
│       ├── user-activity.json        # 14 панелей - Аналитика пользователей
│       └── overview.json             # 7 панелей - Здоровье системы
├── docker-compose.monitoring.yml     # Полный стек мониторинга
├── БЫСТРЫЙ_СТАРТ_МОНИТОРИНГА.md      # Руководство быстрого старта
└── README_RU.md                      # Этот файл
```

## 🔧 Конфигурация

### Обязательные Переменные Окружения

Создайте файл `.env` в директории `monitoring/`:

```bash
# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=измените_меня

# База данных (для postgres-exporter)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki

# Redis (для redis-exporter)
REDIS_HOST=redis
REDIS_PORT=6379

# Опционально: Каналы Алертов
PAGERDUTY_INTEGRATION_KEY=ваш_ключ
SLACK_WEBHOOK_URL_CRITICAL=https://hooks.slack.com/...
SLACK_WEBHOOK_URL_WARNING=https://hooks.slack.com/...
```

### Запуск Стека

```bash
# Development
docker-compose -f docker-compose.monitoring.yml up -d

# Production (с переменными окружения)
export $(cat .env | xargs)
docker-compose -f docker-compose.monitoring.yml up -d

# Проверка статуса
docker-compose -f docker-compose.monitoring.yml ps
```

## 📊 Доступ к Сервисам

| Сервис                | URL                           | Учетные данные |
| --------------------- | ----------------------------- | -------------- |
| **Grafana**           | http://localhost:3000         | admin/admin    |
| **Prometheus**        | http://localhost:9090         | -              |
| **Alertmanager**      | http://localhost:9093         | -              |
| **Node Exporter**     | http://localhost:9100/metrics | -              |
| **Postgres Exporter** | http://localhost:9187/metrics | -              |
| **Redis Exporter**    | http://localhost:9121/metrics | -              |
| **cAdvisor**          | http://localhost:8080         | -              |

## 🔍 Частые Запросы

### Проверка Текущего IDR Rate

```promql
idr_rate{time_window="5m"}
```

### Поиск Медленных Endpoints

```promql
topk(10, histogram_quantile(0.95,
  sum(rate(http_request_duration_ms_bucket[5m])) by (le, endpoint)))
```

### Процент Успешности Валидации

```promql
(rate(mark_validation_success_total[5m]) /
 (rate(mark_validation_success_total[5m]) +
  rate(mark_validation_failure_total[5m]))) * 100
```

### Эффективность Кэша

```promql
(rate(cache_hits_total[5m]) /
 (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))) * 100
```

## 🚨 Примеры Алертов

### Критический Алерт

```yaml
alert: CriticalIDR
expr: idr_rate{time_window="5m"} > 0.05
for: 2m
labels:
  severity: critical
  team: backend
annotations:
  summary: 'Критический IDR для {{ $labels.supplier }}'
  description: 'IDR rate превышает 5% - требуется немедленное действие'
# Вызывает: PagerDuty + Slack + Email
```

### Warning Алерт

```yaml
alert: LowCacheHitRate
expr: (rate(cache_hits_total[5m]) /
  (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))) < 0.7
for: 10m
labels:
  severity: warning
  team: backend
annotations:
  summary: 'Низкая эффективность кэша: {{ $labels.cache_type }}'
# Вызывает: Slack + Email
```

## 📈 Требования к Ресурсам

| Компонент    | CPU | Память | Диск  |
| ------------ | --- | ------ | ----- |
| Prometheus   | 0.5 | 2 GB   | 10 GB |
| Grafana      | 0.2 | 512 MB | 1 GB  |
| Alertmanager | 0.1 | 256 MB | 1 GB  |
| Exporters    | 0.5 | 640 MB | -     |
| **Всего**    | 1.3 | 3.4 GB | 12 GB |

## 🛠️ Устранение Неполадок

### Метрики Не Появляются

```bash
# Проверка экспорта метрик сервисом
curl http://localhost:3000/metrics

# Проверка targets Prometheus
open http://localhost:9090/targets

# Проверка логов
docker logs prometheus
```

### Алерты Не Срабатывают

```bash
# Проверка загрузки правил алертов
curl http://localhost:9090/api/v1/rules

# Проверка Alertmanager
open http://localhost:9093

# Тест алерта
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"test","severity":"critical"}}]'
```

### Дашборд Не Загружается

```bash
# Проверка логов Grafana
docker logs grafana

# Повторный импорт дашборда
# Grafana UI → Dashboards → Import → Загрузить JSON
```

## 📊 Справочник Метрик

### Бизнес-Метрики

- `idr_rate` - Invalid Data Rate
- `marks_generated_total` - Всего сгенерировано марок
- `mark_validation_success_total` - Успешные валидации
- `mark_validation_failure_total` - Неудачные валидации
- `active_marks_count` - Текущие активные марки
- `expired_marks_count` - Текущие истекшие марки
- `mark_validation_duration_ms` - Время валидации
- `system_coverage_percentage` - Покрытие системы

### HTTP Метрики

- `http_requests_total` - Количество HTTP запросов
- `http_request_duration_ms` - Длительность запроса
- `http_request_errors_total` - HTTP ошибки

### Метрики Кэша

- `cache_hits_total` - Попадания в кэш
- `cache_misses_total` - Промахи кэша

## 🎓 Лучшие Практики

1. ✅ Проверяйте дашборды ежедневно (особенно Бизнес-Метрики)
2. ✅ Настройте мобильные алерты для критических через PagerDuty
3. ✅ Анализируйте недельные тренды (используйте диапазон 7d)
4. ✅ Обновляйте пороги алертов на основе трафика
5. ✅ Документируйте инциденты с correlation IDs
6. ✅ Регулярные проверки здоровья (см. Руководство Быстрого Старта)

## 📞 Поддержка

| Тип Проблемы           | Контакт                |
| ---------------------- | ---------------------- |
| Критические Production | PagerDuty On-Call      |
| Настройка Мониторинга  | devops@znak-lavki.com  |
| Вопросы по Дашбордам   | backend@znak-lavki.com |
| Документация           | См. ссылки выше        |

## 🔄 Что Дальше

Будущие улучшения:

- [ ] Распределенный трейсинг (Jaeger/Zipkin)
- [ ] Обнаружение аномалий на основе ML
- [ ] Отслеживание SLO/SLA
- [ ] Дашборды анализа стоимости
- [ ] Отслеживание user journey

## ✅ Статус Реализации

**Статус:** ✅ **ГОТОВО К PRODUCTION**

**Завершено:**

- ✅ MetricsService с бизнес-метриками
- ✅ Структурированное логирование с correlation IDs
- ✅ 30+ правил алертов Prometheus
- ✅ 5 дашбордов Grafana (48+ панелей)
- ✅ Мультиканальные алерты (Email, Slack, PagerDuty)
- ✅ Полная документация

**Дата:** 13 октября 2025

---

Для детальной информации см.:

- [Руководство по Мониторингу](../services/mark-service/MONITORING_GUIDE.md) (на английском)
- [Быстрый Старт](./БЫСТРЫЙ_СТАРТ_МОНИТОРИНГА.md)
- [Сводка Реализации](../МОНИТОРИНГ_РЕАЛИЗАЦИЯ.md)
