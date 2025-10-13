# Integration Service - Руководство по интеграции

## Обзор

Integration Service обеспечивает надежную интеграцию с внешними системами:

- **WMS** (Warehouse Management System) - управление складом
- **PIM** (Product Information Management) - управление товарной информацией
- **1C** - система учета и генерации маркировочных кодов

## Быстрый старт

### 1. Установка

```bash
cd services/integration-service
npm install
```

### 2. Настройка окружения

Создайте `.env` файл:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki_integration

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# External Systems
WMS_BASE_URL=http://your-wms-system.com
WMS_API_KEY=your-api-key
PIM_BASE_URL=http://your-pim-system.com
PIM_API_TOKEN=your-token
ONEC_BASE_URL=http://your-1c-system.com
ONEC_USERNAME=admin
ONEC_PASSWORD=password
```

### 3. Запуск

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod

# Docker
docker-compose up -d
```

## Интеграция с WMS

### Валидация маркировочного кода

**Endpoint:** `POST /integration/wms/validate-mark`

**Request:**

```json
{
  "markCode": "0104600123456789012110ABC123456"
}
```

**Response:**

```json
{
  "isValid": true,
  "markCode": "0104600123456789012110ABC123456",
  "status": "valid",
  "productInfo": {
    "gtin": "04600123456789",
    "name": "Молоко 3.2%",
    "expirationDate": "2024-12-31T00:00:00.000Z"
  },
  "warehouseLocation": "A-12-03"
}
```

**Пример использования:**

```typescript
import { WMSService } from './integrations/wms.service';

// В контроллере или сервисе
async validateMark(markCode: string) {
  const result = await this.wmsService.validateMarkOnScan(markCode);

  if (!result.isValid) {
    throw new BadRequestException('Невалидный код маркировки');
  }

  return result;
}
```

### Блокировка товара

**Endpoint:** `POST /integration/wms/block-item`

**Request:**

```json
{
  "markCode": "0104600123456789012110ABC123456",
  "reason": "Обнаружен брак при контроле качества"
}
```

### Получение заказа

**Endpoint:** `GET /integration/wms/order/:orderId`

**Response:**

```json
{
  "orderId": "ORDER-12345",
  "customerId": "CUST-001",
  "orderDate": "2024-01-15T10:00:00.000Z",
  "status": "processing",
  "items": [
    {
      "itemId": "ITEM-001",
      "gtin": "04600123456789",
      "productName": "Молоко 3.2%",
      "quantity": 10,
      "markCodes": ["...", "..."],
      "unitPrice": 75.5,
      "totalPrice": 755.0
    }
  ],
  "totalAmount": 755.0,
  "deliveryAddress": "г. Москва, ул. Примерная, д. 1"
}
```

## Интеграция с PIM

### Получение информации о продукте

**Endpoint:** `GET /integration/pim/product/:gtin`

**Response:**

```json
{
  "gtin": "04600123456789",
  "name": "Молоко пастеризованное 3.2%",
  "description": "Свежее молоко высшего качества",
  "brand": "Простоквашино",
  "category": "Молочные продукты",
  "attributes": {
    "weight": 1000,
    "volume": 1,
    "shelfLife": 5,
    "storageConditions": "от +2 до +6 °C",
    "countryOfOrigin": "Россия"
  },
  "images": ["https://...", "https://..."],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### Обновление атрибутов

**Endpoint:** `POST /integration/pim/product/update-attributes`

**Request:**

```json
{
  "gtin": "04600123456789",
  "attributes": {
    "weight": 1000,
    "volume": 1,
    "shelfLife": 7
  }
}
```

### Синхронизация каталога

**Endpoint:** `POST /integration/pim/sync-catalog`

Запускает полную синхронизацию каталога продуктов в фоновом режиме.

**Response:**

```json
{
  "success": true,
  "message": "Catalog sync started"
}
```

## Интеграция с 1C

### Запрос кодов маркировки

**Endpoint:** `POST /integration/1c/request-marks`

**Request:**

```json
{
  "requestId": "REQ-20240115-001",
  "productGtin": "04600123456789",
  "quantity": 100,
  "productionBatchId": "BATCH-2024-001",
  "expirationDate": "2024-12-31T00:00:00.000Z",
  "requestedBy": "operator@company.com",
  "priority": "normal"
}
```

**Response:**

```json
{
  "success": true,
  "marks": ["0104600123456789012110ABC123456", "0104600123456789012110ABC123457", "..."]
}
```

**Priority levels:**

- `normal` - обычный приоритет
- `high` - высокий приоритет
- `urgent` - срочный (обрабатывается в первую очередь)

### Отправка на печать

**Endpoint:** `POST /integration/1c/send-to-printer`

**Request:**

```json
{
  "printJobId": "PRINT-001",
  "marks": [
    {
      "markCode": "0104600123456789012110ABC123456",
      "gtin": "04600123456789",
      "serialNumber": "ABC123456",
      "expirationDate": "2024-12-31T00:00:00.000Z",
      "batchNumber": "BATCH-001"
    }
  ],
  "printerQueue": "printer-warehouse-01",
  "printFormat": "datamatrix",
  "copies": 1,
  "priority": 5
}
```

**Print formats:**

- `datamatrix` - DataMatrix код
- `qr` - QR код
- `barcode` - штрих-код

## Webhooks

### Настройка webhook в WMS

1. В настройках WMS укажите URL:

```
https://your-domain.com/webhooks/wms
```

2. Укажите секретный ключ (должен совпадать с `WMS_WEBHOOK_SECRET`)

3. Выберите события:
   - `inventory.updated` - обновление инвентаря
   - `order.created` - создание заказа
   - `order.updated` - обновление заказа
   - `item.blocked` - блокировка товара
   - `item.expired` - истечение срока годности

### Пример webhook payload от WMS:

```json
{
  "eventType": "inventory.updated",
  "eventId": "evt-wms-12345",
  "source": "wms",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "markCode": "0104600123456789012110ABC123456",
    "location": "A-12-03",
    "quantity": 10,
    "status": "available"
  },
  "signature": "sha256=..."
}
```

### Верификация webhook

Integration Service автоматически верифицирует подпись webhook используя HMAC SHA256:

```typescript
// В webhook.service.ts
verifySignature(payload: any, signature: string, source: string): boolean {
  const secret = this.secrets.get(source);
  const expectedSignature = this.generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Scheduled Jobs (Cron)

Integration Service автоматически выполняет периодические задачи:

### 1. Синхронизация каталога продуктов

- **Расписание:** каждый час
- **Действие:** синхронизирует каталог продуктов из PIM

### 2. Синхронизация производственных партий

- **Расписание:** каждые 30 минут
- **Действие:** синхронизирует данные о производственных партиях из 1C

### 3. Проверка товаров с истекающим сроком

- **Расписание:** ежедневно в 8:00
- **Действие:** находит товары с истекающим сроком и отправляет уведомления

### 4. Health check

- **Расписание:** каждые 5 минут
- **Действие:** проверяет доступность всех внешних систем

### 5. Очистка старых данных

- **Расписание:** ежедневно в 00:00
- **Действие:** удаляет завершенные задачи старше 30 дней

## Circuit Breaker

### Как работает

Circuit Breaker защищает систему от каскадных отказов:

```
[CLOSED] → (50% ошибок) → [OPEN] → (30 секунд) → [HALF-OPEN] → (успешный запрос) → [CLOSED]
                                                                  ↓ (ошибка)
                                                                 [OPEN]
```

**Состояния:**

- `CLOSED` - нормальная работа
- `OPEN` - все запросы отклоняются
- `HALF-OPEN` - тестовый запрос для проверки восстановления

### Настройка

```typescript
const circuitBreaker = createCircuitBreaker(
  this.makeApiCall.bind(this),
  'service-name',
  logger,
  metricsService,
  {
    timeout: 30000, // 30 секунд таймаут
    errorThresholdPercentage: 50, // открыть при 50% ошибок
    resetTimeout: 30000, // 30 секунд до половинного открытия
  },
);
```

### Мониторинг

```bash
# Получить статус circuit breaker
curl http://localhost:3002/integration/metrics/wms

# Response
{
  "requestCount": 1000,
  "errorCount": 50,
  "averageResponseTime": 250,
  "circuitBreakerStatus": "closed",
  "healthStatus": "healthy"
}
```

## Retry Logic

### Exponential Backoff

```typescript
@Retry({
  maxAttempts: 3,           // максимум 3 попытки
  delayMs: 1000,            // начальная задержка 1 секунда
  exponentialBackoff: true, // экспоненциальный рост
  maxDelayMs: 10000,        // максимальная задержка 10 секунд
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT']
})
async myMethod() {
  // ...
}
```

**Задержки между попытками:**

- 1-я попытка: сразу
- 2-я попытка: 1 секунда
- 3-я попытка: 2 секунды
- 4-я попытка: 4 секунды (если maxAttempts > 3)

## Message Queue (RabbitMQ)

### Очереди

- `wms.events` - события от WMS
- `pim.sync` - синхронизация PIM
- `1c.marks` - запросы на маркировку
- `integration.dlq` - dead letter queue
- `integration.notifications` - уведомления

### Публикация сообщения

```typescript
await this.rabbitMQService.publishWMSEvent({
  eventType: 'mark.validated',
  eventId: 'evt-123',
  data: { markCode, result },
});
```

### Обработка сообщений

```typescript
await this.rabbitMQService.consumeMessages('wms.events', async (message) => {
  // Обработка сообщения
  await this.processMessage(message);
});
```

### Dead Letter Queue

Сообщения попадают в DLQ после:

- 3 неудачных попыток обработки
- Истечения TTL (24 часа)

## Мониторинг и логирование

### Логи

```bash
# Все логи
tail -f logs/combined.log

# Только ошибки
tail -f logs/error.log

# Docker logs
docker-compose logs -f integration-service
```

### Метрики

```bash
# Все метрики
curl http://localhost:3002/integration/metrics

# Метрики конкретного сервиса
curl http://localhost:3002/integration/metrics/wms
curl http://localhost:3002/integration/metrics/pim
curl http://localhost:3002/integration/metrics/1c
```

### Health Check

```bash
curl http://localhost:3002/integration/health
```

**Response:**

```json
{
  "wms": "healthy",
  "pim": "healthy",
  "1c": "degraded",
  "overall": "degraded"
}
```

## Data Transformation

### Использование DataMapper

```typescript
import { DataMapper } from './transformers/data-mapper';

// Трансформация WMS заказа
const internalOrder = DataMapper.transformWMSOrder(externalOrder);

// Трансформация PIM продукта
const internalProduct = DataMapper.transformPIMProduct(externalProduct);

// Обратная трансформация
const wmsFormat = DataMapper.toWMSOrder(internalOrder);

// Санитизация данных
const clean = DataMapper.sanitizeData(dirtyData);
```

## Тестирование

### Mock серверы

Тесты используют `nock` для мокирования HTTP запросов:

```typescript
import nock from 'nock';

nock('http://wms-system:8080')
  .post('/api/v1/marks/validate')
  .reply(200, { isValid: true, status: 'valid' });

const result = await wmsService.validateMarkOnScan(markCode);
```

### Запуск тестов

```bash
# Все тесты
npm run test

# С coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Best Practices

### 1. Обработка ошибок

```typescript
try {
  await this.wmsService.validateMarkOnScan(markCode);
} catch (error) {
  if (error.response?.status === 404) {
    throw new NotFoundException('Марка не найдена');
  }
  if (error.response?.status >= 500) {
    // Circuit breaker откроется автоматически
    throw new ServiceUnavailableException('WMS недоступен');
  }
  throw error;
}
```

### 2. Асинхронная обработка

Для долгих операций используйте очереди:

```typescript
// Вместо ожидания
await this.pimService.syncProductCatalog(); // может занять минуты

// Используйте очередь
await this.rabbitMQService.publishPIMSync({
  eventType: 'catalog.sync.requested',
  timestamp: new Date(),
});
```

### 3. Мониторинг производительности

```typescript
const startTime = Date.now();
try {
  const result = await this.externalApiCall();
  const duration = Date.now() - startTime;
  this.metricsService.recordRequest('service-name', duration, false);
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  this.metricsService.recordRequest('service-name', duration, true);
  throw error;
}
```

### 4. Идемпотентность

Всегда используйте уникальные ID для операций:

```typescript
const requestId = `REQ-${Date.now()}-${uuid()}`;
await this.oneCService.requestMarkCodes({
  requestId, // важно для идемпотентности
  productGtin,
  quantity,
});
```

## Troubleshooting

### Проблема: Circuit breaker постоянно открыт

**Решение:**

1. Проверьте доступность внешней системы
2. Увеличьте timeout
3. Проверьте сетевые настройки

```bash
# Проверка доступности
curl http://external-system/health

# Проверка метрик
curl http://localhost:3002/integration/metrics/wms
```

### Проблема: Сообщения в DLQ

**Решение:**

1. Проверьте логи ошибок
2. Исправьте проблему
3. Переотправьте сообщения из DLQ

```bash
# Просмотр DLQ в RabbitMQ Management
http://localhost:15672/#/queues/%2F/integration.dlq
```

### Проблема: Медленная синхронизация

**Решение:**

1. Увеличьте batch size
2. Используйте pagination
3. Оптимизируйте запросы к БД

## Поддержка

Для вопросов и проблем:

- GitHub Issues
- Email: support@znak-lavki.ru
- Документация: /docs
