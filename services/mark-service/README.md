# Mark Service - QR Code Generation and Validation

Полнофункциональный сервис генерации и валидации качественных марок с поддержкой QR-кодов, кэширования, аудита и метрик.

## 🚀 Основные возможности

- ✅ **Batch-генерация марок** - до 10,000 марок за один запрос
- ✅ **Генерация QR-кодов** - с встраиванием логотипа
- ✅ **Валидация марок** - с кэшированием результатов в Redis
- ✅ **Bulk-операции** - массовая блокировка/разблокировка марок
- ✅ **Автоматическая проверка истечения** - cron-задача для помарки истекших марок
- ✅ **Аудит всех операций** - полная история действий с марками
- ✅ **Rate Limiting** - защита API от злоупотреблений
- ✅ **Prometheus метрики** - мониторинг производительности
- ✅ **Swagger документация** - интерактивная документация API
- ✅ **Индексирование БД** - оптимизированные запросы
- ✅ **Connection pooling** - эффективное использование соединений с БД

## 📋 Требования

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6 (опционально, для кэширования)
- pnpm >= 8

## 🛠️ Установка

```bash
# Установка зависимостей
pnpm install

# Запуск PostgreSQL и Redis (через Docker)
docker-compose up -d postgres redis

# Запуск в режиме разработки
pnpm dev

# Сборка для production
pnpm build

# Запуск в production
pnpm start:prod
```

## 🔧 Конфигурация

Создайте файл `.env` на основе `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## 📚 API Документация

После запуска сервиса документация Swagger доступна по адресу:
```
http://localhost:3001/api/docs
```

### Основные эндпоинты

#### Генерация марок
```http
POST /api/v1/marks/generate
Content-Type: application/json

{
  "gtin": "04607177964089",
  "quantity": 100,
  "productionDate": "2025-10-10T00:00:00Z",
  "expiryDate": "2026-10-10T00:00:00Z",
  "supplierId": 12345,
  "generateQrCodes": true
}
```

#### Получение марки
```http
GET /api/v1/marks/code/{markCode}
```

#### Валидация марки
```http
POST /api/v1/marks/validate
Content-Type: application/json

{
  "markCode": "99LAV0460717796408966LAV1234567890ABCDEF",
  "location": "Warehouse-A"
}
```

#### Блокировка марки
```http
PUT /api/v1/marks/{markCode}/block
Content-Type: application/json

{
  "reason": "Product recall due to quality issues"
}
```

#### Массовая блокировка
```http
POST /api/v1/marks/bulk-block
Content-Type: application/json

{
  "markCodes": ["99LAV...", "99LAV..."],
  "reason": "Batch recall"
}
```

#### Список истекающих марок
```http
GET /api/v1/marks/expiring/list?daysBeforeExpiry=30
```

#### Список марок с фильтрами
```http
GET /api/v1/marks?status=active&gtin=04607177964089&page=1&limit=20
```

## 🗄️ Структура базы данных

### Таблица `quality_marks`

```sql
CREATE TABLE quality_marks (
  id UUID PRIMARY KEY,
  mark_code VARCHAR(50) UNIQUE NOT NULL,
  gtin VARCHAR(14) NOT NULL,
  status ENUM('active', 'blocked', 'expired', 'used') DEFAULT 'active',
  production_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  supplier_id INTEGER,
  manufacturer_id INTEGER,
  order_id VARCHAR(100),
  blocked_reason TEXT,
  blocked_by VARCHAR(100),
  blocked_at TIMESTAMP,
  validation_count INTEGER DEFAULT 0,
  last_validated_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mark_code ON quality_marks(mark_code);
CREATE INDEX idx_status_expiry ON quality_marks(status, expiry_date);
CREATE INDEX idx_gtin ON quality_marks(gtin);
CREATE INDEX idx_supplier ON quality_marks(supplier_id);
CREATE INDEX idx_created ON quality_marks(created_at);
```

### Таблица `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  mark_code VARCHAR(50),
  action ENUM('mark_generated', 'mark_blocked', 'mark_unblocked', 'mark_validated', etc.),
  user_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_mark ON audit_logs(mark_code);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
pnpm test

# Запуск тестов с покрытием
pnpm test:cov

# Запуск тестов в watch режиме
pnpm test:watch
```

## 📊 Метрики

Метрики Prometheus доступны по адресу:
```
http://localhost:3001/metrics
```

Доступные метрики:
- `http_requests_total` - Общее количество HTTP запросов
- `http_request_duration_ms` - Длительность HTTP запросов
- `http_request_errors_total` - Количество ошибок
- `marks_generated_total` - Количество сгенерированных марок
- `marks_validated_total` - Количество валидаций
- `marks_blocked_total` - Количество заблокированных марок
- `qr_codes_generated_total` - Количество сгенерированных QR-кодов
- `cache_hits_total` - Попадания в кэш
- `cache_misses_total` - Промахи кэша

## 🏥 Health Check

```http
GET /health
```

Ответ:
```json
{
  "status": "ok",
  "service": "mark-service",
  "timestamp": "2025-10-10T12:00:00.000Z",
  "uptime": 3600
}
```

## 🔐 Rate Limiting

По умолчанию применяются следующие ограничения:

| Эндпоинт | Лимит | Период |
|----------|-------|---------|
| `POST /marks/generate` | 10 | 1 минута |
| `POST /marks/validate` | 200 | 1 минута |
| `POST /marks/bulk-block` | 5 | 1 минута |
| `GET /marks/:id` | 100 | 1 минута |
| `GET /marks` | 50 | 1 минута |

## 🎯 Производительность

### Оптимизации

1. **Batch-обработка** - генерация до 10,000 марок за один запрос
2. **Connection pooling** - 5-20 соединений с БД
3. **Redis кэширование** - кэш марок и результатов валидации
4. **Database индексы** - оптимизированные запросы
5. **Параллельная генерация QR-кодов** - батчи по 50 кодов

### Бенчмарки

- Генерация 1,000 марок: ~1-2 секунды
- Генерация 10,000 марок: ~10-15 секунд
- Валидация марки (с кэшем): ~5-10 мс
- Валидация марки (без кэша): ~50-100 мс
- Генерация QR-кода: ~100-200 мс

## 📝 Формат марки

Марка имеет формат: `99LAV{GTIN}66LAV{16-chars}`

Пример: `99LAV0460717796408966LAV1234567890ABCDEF`

- `99LAV` - префикс
- `{GTIN}` - 8, 12, 13 или 14 цифр (штрихкод товара)
- `66LAV` - разделитель
- `{16-chars}` - 16 случайных символов (A-Z, 0-9)

## 🐛 Отладка

```bash
# Включить debug логи
export LOG_LEVEL=debug

# Проверить подключение к БД
pnpm typecheck

# Просмотр логов
tail -f logs/combined.log
```

## 📦 Docker

```bash
# Сборка образа
docker build -t mark-service .

# Запуск контейнера
docker run -p 3001:3001 --env-file .env mark-service
```

## 🚀 Deployment

### Production checklist

- [ ] Установите `NODE_ENV=production`
- [ ] Настройте подключение к production БД
- [ ] Настройте Redis для кэширования
- [ ] Отключите `synchronize` в TypeORM
- [ ] Настройте мониторинг (Prometheus + Grafana)
- [ ] Настройте логирование (ELK Stack)
- [ ] Настройте резервное копирование БД
- [ ] Настройте SSL/TLS
- [ ] Настройте rate limiting под нагрузку

## 📄 Лицензия

MIT

## 👥 Команда

Znak Lavki Development Team

