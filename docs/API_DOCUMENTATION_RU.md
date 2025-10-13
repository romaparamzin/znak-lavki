# Документация API - Знак Лавки

Полная документация API с примерами и лучшими практиками.

---

## Базовый URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.znak-lavki.ru/api/v1
```

## Аутентификация

Все запросы к API требуют аутентификации с Bearer токеном (кроме OAuth endpoints).

```bash
Authorization: Bearer <ваш_jwt_токен>
```

### Получение токена

```bash
POST /auth/oauth/yandex
Content-Type: application/json

{
  "code": "authorization_code",
  "redirect_uri": "https://app.znak-lavki.ru/callback"
}

Ответ:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600
}
```

---

## Endpoints

### 1. Управление марками

#### 1.1 Получить все марки (с пагинацией)

```http
GET /marks?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=DESC
```

**Параметры запроса:**

- `page` (опционально): Номер страницы, по умолчанию: 1
- `limit` (опционально): Записей на странице, по умолчанию: 20, макс: 100
- `status` (опционально): Фильтр по статусу (active, blocked, expired, used)
- `productId` (опционально): Фильтр по ID продукта
- `supplierId` (опционально): Фильтр по ID поставщика
- `search` (опционально): Поиск по коду марки
- `sortBy` (опционально): Поле сортировки (createdAt, status, и т.д.)
- `sortOrder` (опционально): Порядок сортировки (ASC, DESC)

**Ответ:**

```json
{
  "data": [
    {
      "id": 1,
      "markCode": "99LAV123456789",
      "qrData": "https://znak-lavki.ru/qr/99LAV123456789",
      "status": "active",
      "productId": 100,
      "supplierId": 50,
      "batchId": "BATCH-2025-001",
      "expiresAt": "2026-01-01T00:00:00.000Z",
      "lastValidatedAt": null,
      "validationCount": 0,
      "metadata": {
        "idr": 98.5,
        "manufacturer": "ООО Лавка",
        "productionDate": "2025-10-01"
      },
      "createdAt": "2025-10-13T12:00:00.000Z",
      "updatedAt": "2025-10-13T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Пример:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/marks?page=1&limit=10&status=active' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН'
```

---

#### 1.2 Получить марку по коду

```http
GET /marks/code/:markCode
```

**Параметры:**

- `markCode` (обязательно): Уникальный код марки

**Ответ:**

```json
{
  "id": 1,
  "markCode": "99LAV123456789",
  "qrData": "https://znak-lavki.ru/qr/99LAV123456789",
  "status": "active",
  "expiresAt": "2026-01-01T00:00:00.000Z",
  "validationCount": 0,
  "createdAt": "2025-10-13T12:00:00.000Z"
}
```

**Пример:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/marks/code/99LAV123456789' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН'
```

---

#### 1.3 Генерация марок (пакетная)

```http
POST /marks/generate
Content-Type: application/json
```

**Тело запроса:**

```json
{
  "count": 100,
  "productId": 100,
  "supplierId": 50,
  "batchId": "BATCH-2025-001",
  "expiresAt": "2026-01-01T00:00:00.000Z",
  "metadata": {
    "manufacturer": "ООО Лавка",
    "productionDate": "2025-10-01"
  }
}
```

**Ответ:**

```json
{
  "success": true,
  "generated": 100,
  "batchId": "BATCH-2025-001",
  "marks": [
    {
      "markCode": "99LAV123456789",
      "qrData": "https://znak-lavki.ru/qr/99LAV123456789"
    }
  ]
}
```

**Пример:**

```bash
curl -X POST \
  'http://localhost:3001/api/v1/marks/generate' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН' \
  -H 'Content-Type: application/json' \
  -d '{
    "count": 10,
    "productId": 100,
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }'
```

---

#### 1.4 Заблокировать марку

```http
PUT /marks/:markCode/block
Content-Type: application/json
```

**Тело запроса:**

```json
{
  "reason": "Подозрение на подделку"
}
```

**Ответ:**

```json
{
  "success": true,
  "markCode": "99LAV123456789",
  "status": "blocked",
  "reason": "Подозрение на подделку"
}
```

---

#### 1.5 Разблокировать марку

```http
PUT /marks/:markCode/unblock
```

**Ответ:**

```json
{
  "success": true,
  "markCode": "99LAV123456789",
  "status": "active"
}
```

---

#### 1.6 Массовая блокировка марок

```http
POST /marks/bulk-block
Content-Type: application/json
```

**Тело запроса:**

```json
{
  "markCodes": ["99LAV123456789", "99LAV987654321"],
  "reason": "Проблемы контроля качества"
}
```

**Ответ:**

```json
{
  "success": true,
  "blocked": 2,
  "failed": 0,
  "results": [
    {
      "markCode": "99LAV123456789",
      "success": true
    },
    {
      "markCode": "99LAV987654321",
      "success": true
    }
  ]
}
```

---

#### 1.7 Валидация марки

```http
POST /marks/validate
Content-Type: application/json
```

**Тело запроса:**

```json
{
  "markCode": "99LAV123456789",
  "location": {
    "latitude": 55.7558,
    "longitude": 37.6173
  }
}
```

**Ответ:**

```json
{
  "valid": true,
  "markCode": "99LAV123456789",
  "status": "active",
  "productInfo": {
    "name": "Органический мёд",
    "manufacturer": "ООО Лавка"
  },
  "validatedAt": "2025-10-13T12:00:00.000Z",
  "validationCount": 1
}
```

---

### 2. Дашборд

#### 2.1 Получить метрики дашборда

```http
GET /dashboard/metrics
```

**Ответ:**

```json
{
  "totalMarks": 1000,
  "activeMarks": 850,
  "blockedMarks": 50,
  "expiredMarks": 75,
  "usedMarks": 25,
  "todayGenerated": 100,
  "todayValidated": 50,
  "generatedTrend": 15,
  "validatedTrend": -5
}
```

**Пример:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/dashboard/metrics' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН'
```

---

### 3. Аналитика

#### 3.1 Получить тренды

```http
GET /analytics/trends?days=30
```

**Параметры запроса:**

- `days` (опционально): Количество дней, по умолчанию: 30

**Ответ:**

```json
[
  {
    "date": "2025-10-01",
    "generated": 100,
    "validated": 50
  },
  {
    "date": "2025-10-02",
    "generated": 120,
    "validated": 60
  }
]
```

---

#### 3.2 Получить распределение по статусам

```http
GET /analytics/status-distribution
```

**Ответ:**

```json
[
  {
    "status": "active",
    "count": 850,
    "percentage": 85
  },
  {
    "status": "blocked",
    "count": 50,
    "percentage": 5
  },
  {
    "status": "expired",
    "count": 75,
    "percentage": 7.5
  },
  {
    "status": "used",
    "count": 25,
    "percentage": 2.5
  }
]
```

---

### 4. Журнал аудита

#### 4.1 Получить записи аудита

```http
GET /audit/logs?page=1&limit=20&action=mark_blocked&startDate=2025-10-01&endDate=2025-10-13
```

**Параметры запроса:**

- `page` (опционально): Номер страницы
- `limit` (опционально): Записей на странице
- `markCode` (опционально): Фильтр по коду марки
- `action` (опционально): Фильтр по типу действия
- `userId` (опционально): Фильтр по ID пользователя
- `startDate` (опционально): Дата начала (ISO 8601)
- `endDate` (опционально): Дата окончания (ISO 8601)

**Ответ:**

```json
{
  "data": [
    {
      "id": 1,
      "markCode": "99LAV123456789",
      "action": "mark_blocked",
      "userId": "user-123",
      "metadata": {
        "reason": "Подозрение на подделку",
        "ip": "192.168.1.1"
      },
      "createdAt": "2025-10-13T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 500,
  "totalPages": 25
}
```

---

## Ограничение запросов

Все endpoints имеют ограничения на количество запросов:

- **Стандартные endpoints**: 100 запросов/минуту на IP
- **Вход (login)**: 5 запросов/минуту на IP
- **Массовые операции**: 10 запросов/минуту на IP

**Заголовки ограничений:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634123456
```

---

## Ответы с ошибками

Все ошибки следуют единому формату:

```json
{
  "statusCode": 400,
  "message": "Ошибка валидации",
  "error": "Bad Request",
  "timestamp": "2025-10-13T12:00:00.000Z",
  "path": "/api/v1/marks"
}
```

### Распространённые коды статуса

- `200 OK` - Успешно
- `201 Created` - Ресурс создан
- `400 Bad Request` - Неверный запрос
- `401 Unauthorized` - Отсутствует/неверный токен
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `429 Too Many Requests` - Превышен лимит запросов
- `500 Internal Server Error` - Ошибка сервера

---

## Пагинация

Все list endpoints поддерживают пагинацию:

```
GET /marks?page=2&limit=50
```

**Ответ включает:**

```json
{
  "data": [...],
  "page": 2,
  "limit": 50,
  "total": 1000,
  "totalPages": 20,
  "hasNextPage": true,
  "hasPreviousPage": true
}
```

---

## Фильтрация и сортировка

**Фильтрация:**

```
GET /marks?status=active&supplierId=50
```

**Сортировка:**

```
GET /marks?sortBy=createdAt&sortOrder=DESC
```

**Поиск:**

```
GET /marks?search=99LAV
```

---

## WebSocket события (реал-тайм)

Подключение к WebSocket для обновлений в реальном времени:

```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'ВАШ_JWT_ТОКЕН',
  },
});

// Слушать события марок
socket.on('mark:created', (data) => {
  console.log('Новая марка:', data);
});

socket.on('mark:blocked', (data) => {
  console.log('Марка заблокирована:', data);
});

socket.on('mark:validated', (data) => {
  console.log('Марка валидирована:', data);
});
```

---

## SDK и библиотеки

### JavaScript/TypeScript

```bash
npm install @znak-lavki/sdk
```

```typescript
import { ZnakLavkiClient } from '@znak-lavki/sdk';

const client = new ZnakLavkiClient({
  apiKey: 'ВАШ_API_KEY',
  baseURL: 'http://localhost:3001/api/v1',
});

// Получить марки
const marks = await client.marks.list({ page: 1, limit: 10 });

// Сгенерировать марки
const result = await client.marks.generate({
  count: 100,
  productId: 100,
});
```

---

## Лучшие практики

### 1. Используйте пагинацию

Всегда используйте пагинацию для list endpoints, чтобы избежать больших ответов.

### 2. Кэшируйте ответы

Кэшируйте ответы дашборда и аналитики на 30-60 секунд.

### 3. Обрабатывайте лимиты

Реализуйте экспоненциальную задержку при достижении лимита запросов.

### 4. Валидируйте ввод

Всегда валидируйте ввод на стороне клиента перед отправкой.

### 5. Используйте массовые операции

Используйте bulk endpoints для блокировки/разблокировки нескольких марок.

---

## Тестирование

### Примеры с cURL

**Получить марки:**

```bash
curl -X GET 'http://localhost:3001/api/v1/marks' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН'
```

**Сгенерировать марки:**

```bash
curl -X POST 'http://localhost:3001/api/v1/marks/generate' \
  -H 'Authorization: Bearer ВАШ_ТОКЕН' \
  -H 'Content-Type: application/json' \
  -d '{"count": 10, "productId": 100}'
```

---

## Поддержка

- **Swagger UI**: http://localhost:3001/api/docs
- **Статус API**: http://localhost:3001/health
- **Метрики**: http://localhost:3001/metrics

---

**Последнее обновление**: Октябрь 2025  
**Версия**: 1.0.0  
**Статус**: ✅ Готово к продакшену

