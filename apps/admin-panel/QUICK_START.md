# 🚀 Admin Panel - Quick Start

## ✅ Что уже создано

### Готовая инфраструктура (40% complete):

1. **⚙️ Configuration**
   - ✅ `package.json` - все зависимости (Ant Design, React Query, Zustand, etc.)
   - ✅ `vite.config.ts` - Vite конфигурация
   - ✅ `tsconfig.json` - TypeScript конфигурация
   - ✅ `vitest.config.ts` - тестирование
   - ✅ `playwright.config.ts` - E2E тесты

2. **📐 Types & Config**
   - ✅ `types/mark.types.ts` - полные типы марок
   - ✅ `types/auth.types.ts` - типы аутентификации
   - ✅ `config/api.config.ts` - API endpoints и настройки

3. **🔧 Core Services**
   - ✅ `lib/api-client.ts` - API клиент с interceptors
   - ✅ `features/auth/authService.ts` - OAuth с Yandex

4. **🗄️ State Management**
   - ✅ `stores/authStore.ts` - аутентификация
   - ✅ `stores/uiStore.ts` - UI состояние (theme, sidebar, modals)

5. **🎨 UI Components**
   - ✅ `components/Layout/AppLayout.tsx` - главный layout
   - ✅ `App.tsx` - routing setup

6. **📄 Pages**
   - ✅ `pages/Auth/LoginPage.tsx` - OAuth login
   - ✅ `pages/Dashboard/Dashboard.tsx` - дашборд с метриками
   - ✅ `pages/Marks/MarksPage.tsx` - управление марками
   - ✅ `pages/Analytics/Analytics.tsx` - аналитика
   - ✅ `pages/Settings/Settings.tsx` - настройки
   - ✅ `pages/AuditLog/AuditLog.tsx` - аудит

## 🚀 Запуск проекта

### 1. Установка зависимостей

```bash
cd apps/admin-panel
pnpm install
```

### 2. Настройка окружения

Создайте `.env`:

```bash
cp .env.example .env
```

Заполните значения:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_YANDEX_CLIENT_ID=your_client_id
VITE_YANDEX_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Запуск

```bash
pnpm dev
```

Откройте http://localhost:5173

## 📋 Что нужно доработать

### High Priority (Критично для работы):

#### 1. React Query Hooks (15 минут)

Создайте `src/hooks/useMarks.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api.config';
import type { MarkFilters, PaginatedMarksResponse } from '../types/mark.types';

export const useMarks = (filters: MarkFilters) => {
  return useQuery({
    queryKey: ['marks', filters],
    queryFn: () => apiClient.get<PaginatedMarksResponse>(
      API_ENDPOINTS.MARKS.LIST,
      { params: filters }
    ),
  });
};

export const useBlockMark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ markCode, reason }: { markCode: string; reason: string }) =>
      apiClient.put(API_ENDPOINTS.MARKS.BLOCK(markCode), { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['marks']);
    },
  });
};

// Add more hooks: useGenerateMarks, useBulkBlock, etc.
```

Используйте в `MarksPage.tsx`:
```typescript
const { data, isLoading } = useMarks(filters);
const blockMark = useBlockMark();
```

#### 2. Dashboard Metrics Hook (10 минут)

Создайте `src/hooks/useMetrics.ts`:

```typescript
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.get('/dashboard/metrics'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
```

### Medium Priority (Улучшит UX):

#### 3. Bulk Operations Modal (20 минут)

Создайте `src/components/BulkOperations/BulkBlockModal.tsx`:

```typescript
import { Modal, Form, Input } from 'antd';

interface Props {
  visible: boolean;
  marks: string[];
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export const BulkBlockModal = ({ visible, marks, onConfirm, onCancel }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { reason: string }) => {
    setLoading(true);
    try {
      await onConfirm(values.reason);
      form.resetFields();
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Заблокировать ${marks.length} марок`}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
    >
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item
          name="reason"
          label="Причина"
          rules={[{ required: true, message: 'Укажите причину' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

#### 4. Export Functionality (20 минут)

Создайте `src/lib/export.ts`:

```typescript
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marks');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
};

export const exportToPDF = (data: any[], filename: string) => {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [['Mark Code', 'GTIN', 'Status']],
    body: data.map(m => [m.markCode, m.gtin, m.status]),
  });
  doc.save(`${filename}.pdf`);
};
```

### Low Priority (Nice to have):

#### 5. Charts (Recharts) (30 минут)

Добавьте в Dashboard:

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const TrendsChart = ({ data }) => (
  <LineChart width={600} height={300} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="generated" stroke="#8884d8" />
    <Line type="monotone" dataKey="validated" stroke="#82ca9d" />
  </LineChart>
);
```

#### 6. WebSocket (30 минут)

Создайте `src/lib/websocket.ts`:

```typescript
import io from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

export const socket = io(API_CONFIG.WS_URL, {
  autoConnect: false,
});

export const connectWebSocket = () => {
  socket.connect();
};

export const subscribeToMarks = (callback: (data: any) => void) => {
  socket.on('marks:updated', callback);
  return () => socket.off('marks:updated', callback);
};
```

#### 7. i18n (30 минут)

Создайте `src/i18n/config.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: 'ru',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

## 🧪 Тестирование

### Unit Tests

Пример теста для компонента:

```typescript
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../pages/Dashboard/Dashboard';

describe('Dashboard', () => {
  it('renders metrics', () => {
    render(<Dashboard />);
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
  });
});
```

### E2E Tests

Пример E2E теста:

```typescript
import { test, expect } from '@playwright/test';

test('user can navigate to marks page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Марки');
  await expect(page).toHaveURL('/marks');
});
```

## 📝 Следующие шаги

1. **Установите зависимости**: `pnpm install`
2. **Настройте .env**: добавьте Yandex OAuth credentials
3. **Запустите dev server**: `pnpm dev`
4. **Добавьте React Query hooks** для API calls
5. **Добавьте Recharts** для графиков
6. **Добавьте Export** functionality
7. **Напишите тесты**

## 📚 Документация

- **Полная документация**: [ADMIN_PANEL_README.md](./ADMIN_PANEL_README.md)
- **Статус реализации**: [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
- **Mark Service API**: [../mark-service/README.md](../../services/mark-service/README.md)

## 🎯 Текущий статус

**Progress: 40% Complete**

✅ **Done**:
- Project setup
- Types & API client
- Auth service
- Stores
- Layout & routing
- Basic pages

⏳ **TODO**:
- React Query hooks
- Bulk operations modals
- Charts (Recharts)
- Export functionality
- WebSocket
- i18n
- Tests

## 💡 Примеры использования

### Вызов API

```typescript
import { useMarks } from './hooks/useMarks';

const { data, isLoading, error } = useMarks({ page: 1, limit: 20 });
```

### Mutations

```typescript
const blockMark = useBlockMark();

await blockMark.mutateAsync({ 
  markCode: '99LAV...', 
  reason: 'Test block' 
});
```

### Store usage

```typescript
const { theme, toggleTheme } = useUIStore();
const { user, logout } = useAuthStore();
```

---

**Last Updated**: 2025-10-10  
**Status**: Foundation Complete - Ready for API Integration




