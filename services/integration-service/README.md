# Integration Service

Сервис интеграции для подключения к внешним системам (WMS, PIM, 1C).

## Возможности

### WMS Integration

- ✅ Валидация маркировочных кодов при сканировании
- ✅ Блокировка товаров на складе
- ✅ Получение деталей заказа
- ✅ Уведомления о товарах с истекающим сроком годности
- ✅ Управление инвентаризацией

### PIM Integration

- ✅ Получение информации о продуктах по GTIN
- ✅ Обновление атрибутов продуктов
- ✅ Синхронизация каталога продуктов
- ✅ Поиск продуктов
- ✅ Управление категориями

### 1C Integration

- ✅ Запрос кодов маркировки
- ✅ Отправка марок на печать
- ✅ Синхронизация производственных партий
- ✅ Экспорт документов
- ✅ Работа с XML форматом

## Архитектурные паттерны

### Circuit Breaker Pattern

Использует библиотеку `opossum` для защиты от каскадных отказов:

- Автоматическое открытие при превышении порога ошибок
- Период восстановления (reset timeout)
- Half-open состояние для тестирования восстановления

### Retry Logic

Exponential backoff с настраиваемыми параметрами:

- Максимальное количество попыток
- Экспоненциальная задержка
- Фильтрация ретрайбельных ошибок

### Message Queue (RabbitMQ)

Асинхронная обработка событий:

- Отдельные очереди для каждого типа интеграции
- Dead Letter Queue для обработки ошибок
- Приоритизация сообщений
- Retry механизм с ограничениями

### Webhook Endpoints

Приём событий от внешних систем:

- Верификация подписи HMAC SHA256
- Обработка различных типов событий
- Сохранение событий в БД
- Публикация в очередь для асинхронной обработки

### Data Transformation

Маппинг данных между форматами:

- Унификация форматов разных систем
- Валидация и санитизация данных
- Преобразование структур данных

### Scheduled Jobs (Cron)

Периодические задачи синхронизации:

- Синхронизация каталога продуктов (каждый час)
- Синхронизация производственных партий (каждые 30 минут)
- Проверка товаров с истекающим сроком (ежедневно в 8:00)
- Health check всех интеграций (каждые 5 минут)
- Очистка старых данных (ежедневно в полночь)

## Установка и запуск

### Локальная разработка

```bash
# Установка зависимостей
cd services/integration-service
npm install

# Запуск в режиме разработки
npm run dev

# Сборка
npm run build

# Запуск production
npm run start:prod

# Тесты
npm run test
npm run test:cov
```

### Docker

```bash
# Запуск с docker-compose
cd services/integration-service
docker-compose up -d

# Просмотр логов
docker-compose logs -f integration-service

# Остановка
docker-compose down

# Остановка с удалением данных
docker-compose down -v
```

## Конфигурация

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

Основные параметры:

### Server

- `NODE_ENV` - окружение (development/production)
- `PORT` - порт сервиса (по умолчанию 3002)
- `LOG_LEVEL` - уровень логирования (debug/info/warn/error)

### Database

- `DB_HOST` - хост PostgreSQL
- `DB_PORT` - порт PostgreSQL
- `DB_USERNAME` - имя пользователя
- `DB_PASSWORD` - пароль
- `DB_NAME` - имя базы данных

### RabbitMQ

- `RABBITMQ_URL` - URL подключения к RabbitMQ

### WMS

- `WMS_BASE_URL` - базовый URL WMS системы
- `WMS_API_KEY` - API ключ
- `WMS_WEBHOOK_SECRET` - секрет для верификации webhook

### PIM

- `PIM_BASE_URL` - базовый URL PIM системы
- `PIM_API_TOKEN` - токен авторизации
- `PIM_WEBHOOK_SECRET` - секрет для верификации webhook

### 1C

- `ONEC_BASE_URL` - базовый URL 1C системы
- `ONEC_USERNAME` - имя пользователя
- `ONEC_PASSWORD` - пароль
- `ONEC_WEBHOOK_SECRET` - секрет для верификации webhook

## API Endpoints

### WMS Integration

```http
POST /integration/wms/validate-mark
Body: { "markCode": "0104600123456789..." }

POST /integration/wms/block-item
Body: { "markCode": "...", "reason": "..." }

GET /integration/wms/order/:orderId

POST /integration/wms/notify-expiring
Body: { "items": [...] }

GET /integration/wms/inventory/:markCode
```

### PIM Integration

```http
GET /integration/pim/product/:gtin

POST /integration/pim/product/update-attributes
Body: { "gtin": "...", "attributes": {...} }

POST /integration/pim/sync-catalog

POST /integration/pim/search
Body: { "query": "...", "filters": {...} }

GET /integration/pim/categories
```

### 1C Integration

```http
POST /integration/1c/request-marks
Body: { "requestId": "...", "productGtin": "...", "quantity": 100, ... }

POST /integration/1c/send-to-printer
Body: { "printJobId": "...", "marks": [...], ... }

POST /integration/1c/sync-batches

GET /integration/1c/document/:documentId/status

GET /integration/1c/document/:documentId/export
```

### Webhooks

```http
POST /webhooks/wms
Header: X-WMS-Signature

POST /webhooks/pim
Header: X-PIM-Signature

POST /webhooks/1c
Header: X-1C-Signature

POST /webhooks/generic
```

### Health & Metrics

```http
GET /integration/health
GET /integration/metrics
GET /integration/metrics/:service
```

## Swagger Documentation

После запуска сервиса документация доступна по адресу:

```
http://localhost:3002/api/docs
```

## Мониторинг

### Логи

Логи записываются в:

- `logs/error.log` - только ошибки
- `logs/combined.log` - все логи
- Консоль (с цветовым кодированием)

### Метрики

Метрики доступны через API:

- Количество запросов
- Количество ошибок
- Среднее время ответа
- Статус circuit breaker
- Статус здоровья сервисов

### RabbitMQ Management

Панель управления RabbitMQ:

```
http://localhost:15672
User: guest
Password: guest
```

## Тестирование

### Unit тесты

```bash
npm run test
```

### Integration тесты с mock серверами

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:cov
```

Тесты используют:

- Jest для unit/integration тестов
- nock для мокирования HTTP запросов
- Встроенные моки для сервисов

## Структура проекта

```
services/integration-service/
├── src/
│   ├── common/              # Общие утилиты
│   │   ├── logger.service.ts
│   │   ├── metrics.service.ts
│   │   ├── circuit-breaker.ts
│   │   └── retry.decorator.ts
│   ├── dto/                 # Data Transfer Objects
│   │   └── integration.dto.ts
│   ├── entities/            # TypeORM сущности
│   │   ├── integration-event.entity.ts
│   │   └── sync-job.entity.ts
│   ├── integrations/        # Интеграции с внешними системами
│   │   ├── wms.service.ts
│   │   ├── pim.service.ts
│   │   └── 1c.service.ts
│   ├── interfaces/          # TypeScript интерфейсы
│   │   ├── wms.interface.ts
│   │   ├── pim.interface.ts
│   │   ├── 1c.interface.ts
│   │   └── common.interface.ts
│   ├── integration/         # Основной контроллер
│   │   └── integration.controller.ts
│   ├── queue/               # RabbitMQ обработка
│   │   ├── rabbitmq.service.ts
│   │   └── event-processor.service.ts
│   ├── schedulers/          # Cron задачи
│   │   └── sync.scheduler.ts
│   ├── transformers/        # Трансформация данных
│   │   └── data-mapper.ts
│   ├── webhooks/            # Webhook обработка
│   │   ├── webhook.controller.ts
│   │   └── webhook.service.ts
│   ├── app.module.ts
│   └── main.ts
├── test/                    # Тесты
├── logs/                    # Логи (создаётся автоматически)
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Обработка ошибок

### Circuit Breaker

- Открывается при 50% ошибок
- Таймаут: 30 секунд
- Reset timeout: 30 секунд

### Retry Logic

- Максимум 3 попытки
- Начальная задержка: 1-5 секунд
- Экспоненциальный backoff
- Максимальная задержка: 60 секунд

### Dead Letter Queue

- Максимум 3 retry для сообщений
- TTL сообщений: 24 часа
- Автоматическое перенаправление failed сообщений

## Производительность

### Оптимизации

- Connection pooling для БД
- HTTP keep-alive для внешних API
- Batch обработка для синхронизации
- Pagination для больших датасетов
- Асинхронная обработка через очереди

### Рекомендуемые ресурсы

- CPU: 2 cores
- RAM: 2GB
- Disk: 10GB (для логов и БД)

## Безопасность

- ✅ Верификация webhook через HMAC SHA256
- ✅ Secure хранение секретов в env
- ✅ Rate limiting (настраивается)
- ✅ Input validation через class-validator
- ✅ Sanitization данных
- ✅ CORS настройка

## Troubleshooting

### RabbitMQ connection failed

```bash
# Проверьте что RabbitMQ запущен
docker-compose ps rabbitmq

# Проверьте логи
docker-compose logs rabbitmq
```

### Database connection failed

```bash
# Проверьте PostgreSQL
docker-compose ps postgres

# Проверьте переменные окружения
cat .env | grep DB_
```

### Circuit breaker открыт

```bash
# Проверьте health check внешней системы
curl http://external-system/health

# Проверьте метрики
curl http://localhost:3002/integration/metrics/wms
```

## Лицензия

MIT
