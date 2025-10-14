# E2E Testing Suite для Znak Lavki

Комплексная система E2E тестирования для всей системы Znak Lavki.

## 📋 Оглавление

- [Установка](#установка)
- [Структура проекта](#структура-проекта)
- [Запуск тестов](#запуск-тестов)
- [Типы тестов](#типы-тестов)
- [CI/CD](#cicd)
- [Отчёты](#отчёты)

## 🚀 Установка

```bash
# Установка зависимостей
cd e2e
pnpm install

# Установка Playwright browsers
pnpm exec playwright install

# Установка K6 для нагрузочных тестов
brew install k6  # macOS
```

## 📁 Структура проекта

```
e2e/
├── config/              # Конфигурация тестов
│   ├── jest.setup.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── tests/               # Тесты
│   ├── web/            # Playwright E2E тесты
│   ├── api/            # Jest API тесты
│   ├── mobile/         # Detox мобильные тесты
│   └── load/           # K6 нагрузочные тесты
├── fixtures/           # Тестовые данные
├── utils/              # Утилиты
│   ├── api-client.ts
│   └── test-data-manager.ts
├── reports/            # Отчёты
└── docker-compose.test.yml  # Docker окружение
```

## 🧪 Запуск тестов

### API тесты

```bash
# Запуск всех API тестов
pnpm run test:api

# Запуск конкретного теста
pnpm run test:api -- marks-api.spec.ts

# С покрытием кода
pnpm run test:api -- --coverage
```

### Web E2E тесты (Playwright)

```bash
# Запуск всех веб-тестов
pnpm run test:web

# Запуск в headed режиме (виден браузер)
pnpm run test:web:headed

# Запуск с отладкой
pnpm run test:web:debug

# Запуск в конкретном браузере
pnpm run test:web -- --project=chromium

# Запуск конкретного теста
pnpm run test:web -- mark-lifecycle.spec.ts
```

### Нагрузочные тесты (K6)

```bash
# Запуск всех нагрузочных тестов
pnpm run test:load

# Запуск конкретного сценария
k6 run tests/load/scenarios/mark-generation.js

# С настройками
k6 run --vus 100 --duration 5m tests/load/scenarios/mark-validation.js
```

### Smoke тесты

```bash
# Быстрая проверка критичных функций
pnpm run test:smoke
```

### Регрессионное тестирование

```bash
# Полный набор тестов
pnpm run test:regression
```

## 🐳 Docker окружение

### Запуск тестового окружения

```bash
# Запуск всех сервисов
pnpm run docker:up

# Остановка и очистка
pnpm run docker:down
```

### Сервисы в тестовом окружении:

- **PostgreSQL** (порт 5433) - база данных
- **Redis** (порт 6380) - кеш
- **MinIO** (порт 9100-9101) - хранилище
- **API Gateway** (порт 3100) - шлюз API
- **Mark Service** (порт 3101) - сервис марок
- **Integration Service** (порт 3102) - интеграции
- **Notification Service** (порт 3103) - уведомления
- **Admin Panel** (порт 5174) - админ-панель

## 📊 Типы тестов

### 1. Web E2E Tests (Playwright)

Полный цикл тестирования веб-интерфейса:

- ✅ Генерация марок
- ✅ Блокировка/разблокировка
- ✅ Валидация марок
- ✅ Экспорт данных
- ✅ Дашборд и аналитика
- ✅ Массовые операции

### 2. API Integration Tests (Jest)

Тестирование API эндпоинтов:

- ✅ CRUD операции с марками
- ✅ Валидация данных
- ✅ Rate limiting
- ✅ Concurrent requests
- ✅ Performance benchmarks

### 3. Load Tests (K6)

Нагрузочное тестирование:

- ✅ 1000 concurrent mark generations
- ✅ 5000 concurrent validations
- ✅ Bulk operations 10k marks
- ✅ API rate limiting verification

### 4. Mobile Tests (Detox)

Тестирование мобильного приложения:

- ✅ Сканирование QR-кодов
- ✅ Валидация марок
- ✅ Offline режим
- ✅ Sync данных

## 🔄 CI/CD

Тесты автоматически запускаются в GitHub Actions:

- **Pull Request** - API + Web тесты
- **Push to main** - Полный набор тестов
- **Nightly** (2 AM) - Load тесты + Regression
- **Manual** - По требованию

### Матрица браузеров:

- ✅ Chrome
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Mobile Chrome
- ✅ Mobile Safari

## 📈 Отчёты

### Генерация отчётов

```bash
# HTML отчёт
pnpm run report

# Allure отчёт
pnpm run allure:generate
pnpm run allure:open
```

### Типы отчётов:

1. **Jest HTML Report** - `reports/test-report.html`
2. **Playwright HTML Report** - `reports/playwright/index.html`
3. **Allure Report** - `allure-report/index.html`
4. **K6 JSON Report** - `reports/load-test.json`

## 🎯 Критерии прохождения тестов

### API Tests

- ✅ Все тесты зелёные
- ✅ Response time < 2s (p95)
- ✅ Error rate < 10%

### Web Tests

- ✅ Все тесты зелёные во всех браузерах
- ✅ No console errors
- ✅ Accessibility score > 90

### Load Tests

- ✅ Response time < 2s (p95)
- ✅ Error rate < 5%
- ✅ Throughput > 100 req/s

## 🔧 Управление тестовыми данными

### Seed данных

```bash
pnpm run seed
```

### Cleanup данных

```bash
pnpm run clean
```

### Создание тестовых марок

```typescript
import { TestDataManager } from './utils/test-data-manager';

const testData = new TestDataManager();
await testData.connect();

// Создать одну марку
const mark = await testData.createMark({
  gtin: '1234567890123',
  status: 'active',
});

// Создать 100 марок
const marks = await testData.createMarks(100, {
  gtin: '1234567890123',
});

await testData.cleanup();
```

## 🐛 Отладка

### Playwright

```bash
# UI Mode
pnpm exec playwright test --ui

# Debug mode
pnpm run test:web:debug

# Trace viewer
pnpm exec playwright show-trace trace.zip
```

### Jest

```bash
# Debug конкретного теста
node --inspect-brk node_modules/.bin/jest tests/api/marks-api.spec.ts

# В VS Code: добавить breakpoint и F5
```

## 📝 Написание тестов

### Пример API теста

```typescript
import { ApiClient } from '../../utils/api-client';

describe('My API Test', () => {
  let api: ApiClient;

  beforeAll(async () => {
    api = new ApiClient('http://localhost:3001');
  });

  test('should do something', async () => {
    const response = await api.post('/api/v1/marks/generate', {
      gtin: '1234567890123',
      quantity: 10,
    });

    expect(response.status).toBe(201);
    expect(response.data.count).toBe(10);
  });
});
```

### Пример Web теста

```typescript
import { test, expect } from '@playwright/test';

test('should generate marks', async ({ page }) => {
  await page.goto('/marks');
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="gtin-input"]', '1234567890123');
  await page.click('[data-testid="submit-button"]');

  await expect(page.locator('[data-testid="success-message"]')).toContainText('Успешно создано');
});
```

## 🚨 Troubleshooting

### Docker не запускается

```bash
# Проверить статус Docker
docker info

# Перезапустить Docker
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
```

### Тесты падают с timeout

```bash
# Увеличить timeout в jest.config.ts
testTimeout: 120000

# Или в конкретном тесте
test('slow test', async () => {
  // ...
}, 120000);
```

### Браузеры Playwright не установлены

```bash
pnpm exec playwright install
```

## 📚 Полезные ссылки

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [K6 Documentation](https://k6.io/docs)
- [Detox Documentation](https://wix.github.io/Detox)

## 👥 Контакты

При вопросах по тестам обращайтесь:

- QA Team: qa@znak-lavki.com
- Slack: #qa-testing
