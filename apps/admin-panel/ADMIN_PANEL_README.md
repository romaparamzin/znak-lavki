# 🎨 Admin Panel - React + TypeScript

Полнофункциональная административная панель для управления качественными метками.

## 📦 Стек технологий

- **React 18** + **TypeScript 5.3**
- **Vite** - быстрая сборка
- **Ant Design 5** - UI компоненты
- **React Query** - data fetching и кэширование
- **Zustand** - state management
- **React Router v6** - routing
- **React Hook Form** - формы
- **Recharts** - графики и аналитика
- **Socket.io** - WebSocket для real-time обновлений
- **i18next** - интернационализация
- **Vitest** + **Playwright** - тестирование

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd apps/admin-panel
pnpm install
```

### 2. Настройка окружения

Создайте файл `.env`:

```env
# API
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# OAuth Yandex
VITE_YANDEX_CLIENT_ID=your_client_id_here
VITE_YANDEX_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Запуск

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview production build
pnpm preview

# Tests
pnpm test
pnpm test:e2e
```

## 📁 Структура проекта

```
apps/admin-panel/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   │   ├── Dashboard/       # Виджеты дашборда
│   │   ├── MarksTable/      # Таблица меток
│   │   ├── BulkOperations/  # Массовые операции
│   │   ├── Layout/          # Layout компоненты
│   │   └── common/          # Общие компоненты
│   │
│   ├── features/            # Feature модули
│   │   ├── auth/           # Аутентификация
│   │   ├── marks/          # Управление метками
│   │   ├── analytics/      # Аналитика
│   │   └── audit/          # Аудит
│   │
│   ├── pages/              # Страницы
│   │   ├── Dashboard/
│   │   ├── Marks/
│   │   ├── Analytics/
│   │   ├── Settings/
│   │   └── AuditLog/
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useMarks.ts
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useExport.ts
│   │
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   ├── marksStore.ts
│   │   ├── uiStore.ts
│   │   └── wsStore.ts
│   │
│   ├── lib/                # Утилиты и библиотеки
│   │   ├── api-client.ts
│   │   ├── export.ts
│   │   ├── websocket.ts
│   │   └── utils.ts
│   │
│   ├── types/              # TypeScript типы
│   │   ├── mark.types.ts
│   │   ├── auth.types.ts
│   │   └── api.types.ts
│   │
│   ├── config/             # Конфигурация
│   │   ├── api.config.ts
│   │   ├── routes.config.ts
│   │   └── theme.config.ts
│   │
│   ├── i18n/               # Переводы
│   │   ├── en.json
│   │   └── ru.json
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── tests/                  # Тесты
│   ├── unit/
│   └── e2e/
│
└── public/
```

## 🔐 Аутентификация

### OAuth с Yandex

```typescript
import { authService } from '@/features/auth/authService';

// Вход через Yandex OAuth
await authService.login();

// Выход
await authService.logout();

// Проверка прав
const canBlockMarks = authService.checkPermission(Permission.MARKS_BLOCK);
```

### Protected Routes

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Route
  path="/marks"
  element={
    <ProtectedRoute permission={Permission.MARKS_VIEW}>
      <MarksPage />
    </ProtectedRoute>
  }
/>
```

## 📊 Основные компоненты

### 1. Dashboard (Дашборд)

Главная страница с метриками и виджетами:

```typescript
import { Dashboard } from '@/pages/Dashboard';

<Dashboard />
```

**Возможности:**
- Метрики в реальном времени (общее количество меток, активные, заблокированные и т.д.)
- Графики трендов (генерация, валидация, блокировка)
- Недавняя активность
- Быстрые действия

### 2. Marks Management (Управление метками)

Полное управление метками с фильтрацией, сортировкой и CRUD операциями:

```typescript
import { MarksTable } from '@/components/MarksTable';

<MarksTable
  filters={filters}
  onBlock={(markId) => console.log('Block:', markId)}
  onBulkBlock={(markIds) => console.log('Bulk block:', markIds)}
  onExport={(format) => console.log('Export:', format)}
/>
```

**Возможности:**
- Таблица с пагинацией и сортировкой
- Продвинутые фильтры (статус, даты, GTIN, и т.д.)
- Поиск по коду метки
- Действия: просмотр, блокировка, разблокировка
- Массовые операции
- Экспорт (CSV, Excel, PDF)
- Виртуальная прокрутка для больших списков

### 3. Bulk Operations (Массовые операции)

Блокировка/разблокировка множества меток:

```typescript
import { BulkBlockModal } from '@/components/BulkOperations';

<BulkBlockModal
  visible={visible}
  marks={selectedMarks}
  onConfirm={async (reason) => {
    await bulkBlockMarks({ markCodes, reason });
  }}
  onCancel={() => setVisible(false)}
/>
```

**Возможности:**
- Выбор до 1000 меток
- Указание причины блокировки
- Прогресс операции
- Отчет о результатах (успешные/неудачные)

### 4. Analytics (Аналитика)

Страница с графиками и статистикой:

```typescript
import { Analytics } from '@/pages/Analytics';

<Analytics />
```

**Возможности:**
- Графики трендов (Recharts)
- Распределение по статусам
- Статистика валидации
- Статистика по поставщикам
- Экспорт отчетов

### 5. Audit Log (Журнал аудита)

Просмотр всех операций:

```typescript
import { AuditLog } from '@/pages/AuditLog';

<AuditLog />
```

**Возможности:**
- Фильтрация по действиям, пользователям, датам
- Детальный просмотр изменений (previous/new state)
- Экспорт логов

## 🎨 UI/UX Features

### Dark Mode

```typescript
import { useUIStore } from '@/stores/uiStore';

const { theme, toggleTheme } = useUIStore();

<Button onClick={toggleTheme}>
  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
</Button>
```

### Internationalization

```typescript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

<h1>{t('dashboard.title')}</h1>

<Select onChange={(lng) => i18n.changeLanguage(lng)}>
  <Option value="en">English</Option>
  <Option value="ru">Русский</Option>
</Select>
```

### Responsive Design

Все компоненты адаптивны и работают на планшетах:

```typescript
// Breakpoints
xs: 480px
sm: 576px
md: 768px
lg: 992px
xl: 1200px
xxl: 1600px
```

## 🔄 Real-time Updates (WebSocket)

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { connected, subscribe } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribe('marks:updated', (data) => {
    console.log('Mark updated:', data);
    // Update UI
  });

  return unsubscribe;
}, []);
```

**События:**
- `marks:created` - новая метка создана
- `marks:updated` - метка обновлена
- `marks:blocked` - метка заблокирована
- `marks:expired` - метки истекли
- `metrics:updated` - метрики обновлены

## 📤 Export Functionality

```typescript
import { useExport } from '@/hooks/useExport';

const { exportToCSV, exportToExcel, exportToPDF } = useExport();

// Export marks to CSV
await exportToCSV(marks, 'marks.csv');

// Export to Excel
await exportToExcel(marks, 'marks.xlsx');

// Export to PDF
await exportToPDF(marks, 'marks.pdf');
```

## 🧪 Тестирование

### Unit Tests (Vitest)

```bash
# Run unit tests
pnpm test

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch

# UI mode
pnpm test:ui
```

**Пример теста:**

```typescript
import { render, screen } from '@testing-library/react';
import { MetricsWidget } from '@/components/Dashboard/MetricsWidget';

describe('MetricsWidget', () => {
  it('renders metric value', () => {
    render(
      <MetricsWidget
        title="Total Marks"
        value={1000}
        trend="up"
      />
    );

    expect(screen.getByText('Total Marks')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# With UI
pnpm test:e2e:ui

# Specific test
pnpm test:e2e tests/e2e/login.spec.ts
```

**Пример E2E теста:**

```typescript
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/');
  
  // Click login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for OAuth redirect
  await page.waitForURL('/dashboard');
  
  // Check dashboard loaded
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## ⚡ Performance Optimizations

### 1. Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Analytics = lazy(() => import('@/pages/Analytics'));

<Suspense fallback={<Spinner />}>
  <Analytics />
</Suspense>
```

### 2. React Query Caching

```typescript
const { data } = useQuery({
  queryKey: ['marks', filters],
  queryFn: () => fetchMarks(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### 3. Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// For large lists of marks (10k+)
const rowVirtualizer = useVirtualizer({
  count: marks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 48,
});
```

### 4. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: blockMark,
  onMutate: async (markId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['marks']);
    
    // Snapshot previous value
    const previousMarks = queryClient.getQueryData(['marks']);
    
    // Optimistically update
    queryClient.setQueryData(['marks'], (old) =>
      updateMarkStatus(old, markId, 'blocked')
    );
    
    return { previousMarks };
  },
  onError: (err, markId, context) => {
    // Rollback on error
    queryClient.setQueryData(['marks'], context.previousMarks);
  },
});
```

## 🎯 Best Practices

1. **TypeScript** - строгая типизация для всех компонентов
2. **Error Boundaries** - обработка ошибок на уровне компонентов
3. **Loading States** - скелетоны и спиннеры для лучшего UX
4. **Accessibility** - ARIA атрибуты и keyboard navigation
5. **Responsive** - mobile-first подход
6. **Performance** - мемоизация, виртуализация, lazy loading
7. **Testing** - покрытие unit и E2E тестами

## 🐛 Отладка

### React Query Devtools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Redux Devtools (для Zustand)

```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools((set) => ({
    // ... store
  }), { name: 'AuthStore' })
);
```

## 📚 Документация API

См. Mark Service Swagger документацию:
```
http://localhost:3001/api/docs
```

## 🚀 Deployment

```bash
# Build for production
pnpm build

# Preview build
pnpm preview

# Deploy to Vercel/Netlify
# просто подключите репозиторий
```

## 🔧 Конфигурация

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📊 Production Checklist

- [ ] Environment variables настроены
- [ ] API endpoints корректные
- [ ] OAuth credentials настроены
- [ ] Build проходит без ошибок
- [ ] Все тесты зеленые
- [ ] Error tracking настроен (Sentry)
- [ ] Analytics настроен (Google Analytics)
- [ ] Performance оптимизирована
- [ ] Security headers настроены
- [ ] SSL сертификат установлен

## 🤝 Contributing

См. [CONTRIBUTING.md](../../CONTRIBUTING.md) для guidelines.

## 📄 License

MIT

## 👥 Team

Znak Lavki Development Team

---

**Note**: Этот README описывает полную архитектуру Admin Panel. Базовая реализация создана, дополнительные компоненты можно добавить по мере необходимости используя существующие паттерны и примеры.


