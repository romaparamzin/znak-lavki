# Установка и решение проблем

## Ошибки TypeScript при разработке

Если вы видите ошибки TypeScript о missing modules, это нормально до установки зависимостей.

### Решение:

```bash
# 1. Перейдите в директорию сервиса
cd services/mark-service

# 2. Установите зависимости
pnpm install

# 3. Убедитесь, что PostgreSQL и Redis запущены
docker-compose up -d postgres redis

# 4. Примените миграции БД
psql -U postgres -d znak_lavki -f migrations/001_create_tables.sql

# 5. Запустите сервис в режиме разработки
pnpm dev
```

## Основные зависимости

Проект использует следующие основные пакеты:

### Dependencies:
- `@nestjs/common` - NestJS core
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/cache-manager` - Caching support
- `@nestjs/throttler` - Rate limiting
- `@nestjs/schedule` - Cron jobs
- `@nestjs/swagger` - API documentation
- `qrcode` - QR code generation
- `sharp` - Image processing
- `typeorm` - Database ORM
- `pg` - PostgreSQL driver
- `redis` - Redis client
- `cache-manager` - Cache management

### DevDependencies:
- `@types/node` - Node.js type definitions
- `@types/qrcode` - QRCode type definitions
- `@types/sharp` - Sharp type definitions
- `typescript` - TypeScript compiler

## Проверка работоспособности

После установки зависимостей и запуска сервиса:

1. **Health Check**: http://localhost:3001/health
2. **Swagger Docs**: http://localhost:3001/api/docs
3. **Metrics**: http://localhost:3001/metrics

## Типичные проблемы

### 1. Cannot find module '@nestjs/common'

**Решение**: Выполните `pnpm install` в директории `services/mark-service`

### 2. Cannot find name 'Buffer'

**Решение**: Убедитесь, что установлен `@types/node`:
```bash
pnpm add -D @types/node
```

### 3. Redis connection error

**Решение**: 
- Убедитесь, что Redis запущен: `docker ps | grep redis`
- Или отключите Redis в `.env`: `REDIS_ENABLED=false`

### 4. PostgreSQL connection error

**Решение**:
- Проверьте настройки подключения в `.env`
- Убедитесь, что PostgreSQL запущен: `docker ps | grep postgres`
- Создайте базу данных: `createdb znak_lavki`

## Структура проекта

```
services/mark-service/
├── src/
│   ├── common/
│   │   └── enums/
│   │       └── mark-status.enum.ts
│   ├── controllers/
│   │   └── mark.controller.ts
│   ├── dto/
│   │   ├── block-mark.dto.ts
│   │   ├── bulk-block.dto.ts
│   │   ├── generate-mark.dto.ts
│   │   ├── mark-filter.dto.ts
│   │   ├── mark-response.dto.ts
│   │   ├── validate-mark.dto.ts
│   │   └── index.ts
│   ├── entities/
│   │   ├── audit-log.entity.ts
│   │   └── quality-mark.entity.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── interceptors/
│   │   └── metrics.interceptor.ts
│   ├── qr/
│   │   └── qr.module.ts
│   ├── services/
│   │   ├── audit.service.ts
│   │   ├── cache.service.ts
│   │   ├── mark-generator.service.ts
│   │   ├── mark.service.ts
│   │   ├── metrics.service.ts
│   │   ├── qr-code.service.ts
│   │   ├── *.spec.ts (тесты)
│   ├── app.module.ts
│   └── main.ts
├── migrations/
│   └── 001_create_tables.sql
├── package.json
├── tsconfig.json
└── README.md
```

## Команды

```bash
# Разработка
pnpm dev              # Запуск с hot-reload
pnpm build            # Сборка проекта
pnpm start:prod       # Запуск production

# Тестирование
pnpm test             # Запуск тестов
pnpm test:cov         # Тесты с покрытием
pnpm test:watch       # Тесты в watch режиме

# Утилиты
pnpm lint             # Проверка кода
pnpm typecheck        # Проверка типов TypeScript
```

## Дополнительная информация

См. [README.md](./README.md) для полной документации.

