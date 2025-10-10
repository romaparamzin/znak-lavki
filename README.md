# Znak Lavki (Знак Лавки) - Система контроля качества

Комплексное monorepo решение для генерации QR-кодов, валидации и системы управления качеством на складе.

## 📋 Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Требования](#требования)
- [Начало работы](#начало-работы)
- [Структура проекта](#структура-проекта)
- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Развертывание](#развертывание)
- [Участие в разработке](#участие-в-разработке)
- [Лицензия](#лицензия)

## 🎯 Обзор

Знак Лавки - это корпоративная система управления знаками качества, которая обеспечивает:

- ✅ Генерация и валидация QR-кодов для товаров
- 📦 Интеграция с системами WMS, PIM и 1C
- 📱 Мобильное приложение для работников склада
- 🖥️ Административная панель для управления
- 🔔 Уведомления и оповещения в реальном времени
- 📊 Аналитика и отчетность

## 🏗️ Архитектура

Это monorepo проект, использующий **pnpm workspaces** со следующей структурой:

```
znak-lavki/
├── apps/                    # Фронтенд приложения
│   ├── admin-panel/        # React 18 + TypeScript + Vite
│   └── mobile-app/         # React Native + Expo
├── services/               # Бэкенд микросервисы
│   ├── api-gateway/        # Основной API Gateway (Порт 3000)
│   ├── mark-service/       # Сервис QR-кодов (Порт 3001)
│   ├── integration-service/# Интеграции (Порт 3002)
│   └── notification-service/# Уведомления (Порт 3003)
└── packages/               # Общие пакеты
    └── shared/
        ├── types/          # TypeScript типы
        ├── utils/          # Общие утилиты
        └── ui/             # Общие UI компоненты
```

## 🛠️ Технологический стек

### Бэкенд
- **Фреймворк:** NestJS
- **Язык:** TypeScript
- **База данных:** PostgreSQL 15
- **Кеш:** Redis 7
- **Хранилище:** MinIO (S3-совместимое)
- **API Документация:** Swagger/OpenAPI

### Фронтенд
- **Админ панель:** React 18, TypeScript, Vite, TailwindCSS
- **Мобильное приложение:** React Native, Expo
- **Управление состоянием:** Zustand
- **Получение данных:** TanStack Query (React Query)

### DevOps
- **Менеджер пакетов:** pnpm 8
- **Инструмент monorepo:** Turbo
- **CI/CD:** GitHub Actions
- **Контейнеризация:** Docker & Docker Compose
- **Git Hooks:** Husky
- **Качество кода:** ESLint, Prettier, Commitlint

## 📦 Требования

Перед началом работы убедитесь, что у вас установлено:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.0.0
- **Git** >= 2.40.0

### Установка pnpm

```bash
npm install -g pnpm@8
```

## 🚀 Начало работы

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/znak-lavki.git
cd znak-lavki
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корневой директории:

```bash
cp .env.example .env
```

Отредактируйте `.env` с вашими настройками.

### 4. Запуск инфраструктурных сервисов

Запустите PostgreSQL, Redis и MinIO с помощью Docker Compose:

```bash
make docker-up
# или
docker-compose up -d
```

Дождитесь готовности сервисов (~10 секунд). Проверить статус можно командой:

```bash
docker-compose ps
```

### 5. Запуск серверов разработки

Запустите все сервисы и приложения в режиме разработки:

```bash
make dev
# или
pnpm run dev
```

Это запустит:
- API Gateway: http://localhost:3000
- Mark Service: http://localhost:3001
- Integration Service: http://localhost:3002
- Notification Service: http://localhost:3003
- Admin Panel: http://localhost:5173

### 6. Доступ к приложениям

- **Админ панель:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **API Документация:** http://localhost:3000/api/docs
- **MinIO Console:** http://localhost:9001 (admin/minioadmin)
- **pgAdmin:** http://localhost:5050 (admin@znak-lavki.com/admin)

## 📁 Структура проекта

```
znak-lavki/
├── .github/
│   └── workflows/          # CI/CD пайплайны
├── .husky/                 # Git hooks
├── apps/
│   ├── admin-panel/        # React админ панель
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── mobile-app/         # React Native приложение
│       ├── src/
│       │   └── screens/
│       ├── App.tsx
│       ├── app.json
│       └── package.json
├── services/
│   ├── api-gateway/        # API Gateway сервис
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   ├── mark-service/       # Сервис QR-кодов
│   ├── integration-service/# Сервис интеграций
│   └── notification-service/# Сервис уведомлений
├── packages/
│   └── shared/
│       ├── types/          # Общие TypeScript типы
│       ├── utils/          # Общие утилиты
│       └── ui/             # Общие UI компоненты
├── docker/
│   └── postgres/
│       └── init.sql        # Инициализация БД
├── docker-compose.yml      # Конфигурация Docker сервисов
├── Makefile               # Команды разработки
├── package.json           # Корневой package.json
├── pnpm-workspace.yaml    # Конфигурация pnpm workspace
├── turbo.json             # Конфигурация Turbo
└── tsconfig.base.json     # Базовая конфигурация TypeScript
```

## 💻 Разработка

### Доступные команды

```bash
# Установить зависимости
pnpm install

# Запустить все сервисы в режиме разработки
pnpm run dev

# Собрать все пакеты
pnpm run build

# Запустить тесты
pnpm run test

# Проверить код линтером
pnpm run lint

# Форматировать код
pnpm run format

# Проверка типов
pnpm run typecheck

# Очистить артефакты сборки
pnpm run clean
```

### Работа с конкретными пакетами

```bash
# Выполнить команду в конкретном пакете
pnpm --filter @znak-lavki/api-gateway dev
pnpm --filter @znak-lavki/admin-panel build

# Добавить зависимость в конкретный пакет
pnpm --filter @znak-lavki/api-gateway add express

# Добавить dev зависимость
pnpm --filter @znak-lavki/admin-panel add -D @types/react
```

### Команды Docker

```bash
# Запустить все сервисы
make docker-up

# Остановить все сервисы
make docker-down

# Просмотр логов
make docker-logs

# Очистка (удаляет volumes)
make docker-clean
```

## 🧪 Тестирование

### Запуск всех тестов

```bash
pnpm run test
```

### Запуск тестов для конкретного сервиса

```bash
pnpm --filter @znak-lavki/api-gateway test
pnpm --filter @znak-lavki/mark-service test:watch
pnpm --filter @znak-lavki/admin-panel test:cov
```

### End-to-End тестирование

```bash
# TODO: Добавить настройку E2E тестирования
```

## 🔧 Конфигурация

### Переменные окружения

Основные переменные окружения (см. `.env.example` для полного списка):

```env
# Окружение Node
NODE_ENV=development

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=znak_lavki

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Сервисы
API_GATEWAY_PORT=3000
MARK_SERVICE_PORT=3001
INTEGRATION_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003
```

## 🚢 Развертывание

### Сборка для продакшена

```bash
pnpm run build
```

### Docker сборка

```bash
# Собрать конкретный сервис
docker build -f services/api-gateway/Dockerfile -t znak-lavki/api-gateway .

# Собрать все сервисы
docker-compose -f docker-compose.prod.yml build
```

### CI/CD

Проект включает GitHub Actions workflows для:

- **CI Pipeline** (`.github/workflows/ci.yml`): Линтинг, тестирование и сборка при каждом push
- **Deploy Pipeline** (`.github/workflows/deploy.yml`): Развертывание в продакшен на ветке main
- **Release Pipeline** (`.github/workflows/release.yml`): Создание релизов по тегам версий

## 📝 Git Workflow

### Соглашение о коммитах

Проект следует [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: добавить функцию генерации QR-кода
fix: исправить проблему подключения к БД
docs: обновить README
style: форматировать код с помощью prettier
refactor: реструктурировать API gateway
test: добавить unit тесты для mark service
chore: обновить зависимости
```

### Pre-commit hooks

Husky настроен на выполнение:
- Линтинг staged файлов
- Форматирование кода
- Валидация сообщений коммитов

## 🤝 Участие в разработке

1. Сделайте форк репозитория
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Закоммитьте ваши изменения (`git commit -m 'feat: добавить потрясающую функцию'`)
4. Отправьте изменения в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📊 API Документация

Каждый сервис предоставляет Swagger документацию:

- API Gateway: http://localhost:3000/api/docs
- Mark Service: http://localhost:3001/api/docs
- Integration Service: http://localhost:3002/api/docs
- Notification Service: http://localhost:3003/api/docs

## 🔐 Безопасность

- Все пароли хешируются с использованием bcrypt
- JWT токены для аутентификации
- CORS настроен для разрешенных источников
- Rate limiting на API endpoints
- Защита от SQL инъекций с помощью TypeORM
- Валидация входных данных с class-validator

## 📈 Мониторинг

TODO: Добавить настройку мониторинга (Prometheus, Grafana, и т.д.)

## 🐛 Решение проблем

### Порт уже используется

Если возникает ошибка "port already in use":

```bash
# Найти и завершить процесс на конкретном порту
lsof -ti:3000 | xargs kill -9
```

### Проблемы подключения к БД

```bash
# Сбросить базу данных
docker-compose down -v
docker-compose up -d postgres
```

### Проблемы установки pnpm

```bash
# Очистить кеш pnpm
pnpm store prune

# Удалить все node_modules и переустановить
pnpm run clean
pnpm install
```

## 📞 Поддержка

По вопросам поддержки пишите на support@znak-lavki.com или создайте issue в репозитории.

## 📄 Лицензия

Проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👥 Авторы

- Ваша команда

## 🙏 Благодарности

- Команда NestJS за отличный фреймворк
- Команда React за React и React Native
- Всем участникам open-source проектов

---

**Сделано с ❤️ для лучшего управления качеством**
