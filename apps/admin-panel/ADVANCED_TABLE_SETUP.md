# Setup Instructions for Advanced Table

## Требуемые зависимости

Компонент Advanced Table требует установки следующих пакетов:

```bash
cd apps/admin-panel

# MUI компоненты
npm install @mui/material @emotion/react @emotion/styled

# MUI Date Pickers
npm install @mui/x-date-pickers date-fns

# Виртуализация для производительности
npm install @tanstack/react-virtual

# Утилиты
npm install lodash-es

# TypeScript типы
npm install -D @types/lodash-es
```

## Опциональные зависимости

Для полной функциональности экспорта в Excel:

```bash
npm install xlsx
npm install -D @types/xlsx
```

## Уже установленные зависимости

Следующие пакеты уже присутствуют в проекте:

- ✅ socket.io-client (для WebSocket)
- ✅ react
- ✅ react-dom
- ✅ typescript

## Структура файлов

После установки зависимостей, структура будет следующей:

```
apps/admin-panel/src/
├── components/
│   └── AdvancedTable/
│       ├── AdvancedMarksTable.tsx      # Основной компонент
│       ├── FilterPanel.tsx             # Панель фильтров
│       ├── BulkActionsToolbar.tsx      # Toolbar для bulk операций
│       ├── AdvancedMarksTableExample.tsx # Пример использования
│       └── index.ts                     # Экспорты
├── hooks/
│   ├── useTableState.ts                # Управление состоянием таблицы
│   ├── useTableExport.ts               # Экспорт данных
│   ├── useTablePerformance.ts          # Оптимизации
│   └── useWebSocket.ts                 # (уже существует)
└── types/
    ├── table.types.ts                   # TypeScript типы
    └── mark.types.ts                    # (уже существует)
```

## Быстрый старт

### 1. Установите зависимости

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/x-date-pickers date-fns @tanstack/react-virtual lodash-es
npm install -D @types/lodash-es
```

### 2. Импортируйте компонент

```tsx
import { AdvancedMarksTable } from './components/AdvancedTable';
import { TableColumn } from './types/table.types';
```

### 3. Используйте в своём компоненте

См. файл `AdvancedMarksTableExample.tsx` для полного примера.

## Интеграция с существующим кодом

### Замена существующей таблицы

Если у вас уже есть компонент таблицы марок:

```tsx
// Было:
import { VirtualTable } from './components/VirtualTable';

// Стало:
import { AdvancedMarksTable } from './components/AdvancedTable';
```

### Миграция данных

```tsx
// Старый формат данных остается совместимым
// Просто добавьте колонки и настройки

const columns: TableColumn<Mark>[] = [
  {
    id: 'markCode',
    header: 'Код маркировки',
    accessor: 'markCode',
    sortable: true,
    filterable: true,
  },
  // ... остальные колонки
];

<AdvancedMarksTable
  data={marks}
  columns={columns}
  totalCount={totalMarks}
  onFetchData={fetchMarks}
/>;
```

## Конфигурация WebSocket

Убедитесь, что в `.env` файле указан правильный URL:

```env
VITE_WS_URL=ws://localhost:3001
```

Или в коде:

```tsx
// В хуке useWebSocket уже настроено:
const { connected } = useWebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:3001');
```

## Настройка темы MUI (опционально)

Если хотите кастомизировать внешний вид:

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AdvancedMarksTable {...props} />
    </ThemeProvider>
  );
}
```

## Проверка установки

После установки зависимостей, запустите:

```bash
npm run typecheck
```

Не должно быть ошибок TypeScript, связанных с новыми компонентами.

## Production Build

Для production сборки:

```bash
npm run build
```

Размер бандла с новыми компонентами:

- MUI core: ~100KB (gzipped)
- Date pickers: ~20KB (gzipped)
- React Virtual: ~5KB (gzipped)
- **Total**: ~125KB дополнительно

## Performance Tips

1. **Lazy loading** - загружайте таблицу только когда нужно:

```tsx
const AdvancedMarksTable = lazy(() => import('./components/AdvancedTable'));
```

2. **Code splitting** - разделите по routes:

```tsx
{
  path: '/marks',
  component: lazy(() => import('./pages/Marks/MarksPage')),
}
```

3. **Tree shaking** - импортируйте только нужное:

```tsx
import { Button } from '@mui/material/Button';
// вместо
import { Button } from '@mui/material';
```

## Troubleshooting

### Ошибка: "Cannot find module '@mui/material'"

```bash
npm install @mui/material @emotion/react @emotion/styled
```

### Ошибка: "useVirtualizer is not a function"

```bash
npm install @tanstack/react-virtual
```

### Ошибка: "debounce is not defined"

```bash
npm install lodash-es
```

### Конфликт с Ant Design

Проект использует Ant Design, но MUI используется только для таблицы.
Это нормально и не создает конфликтов, так как библиотеки изолированы.

Если хотите использовать только Ant Design, можно переписать компоненты:

- `@mui/material` → `antd`
- `<Box>` → `<div>` с className
- `<Stack>` → Ant Design `<Space>`
- `<Chip>` → Ant Design `<Tag>`

## Дополнительные ресурсы

- [MUI Documentation](https://mui.com/)
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [Date-fns Documentation](https://date-fns.org/)
- [Advanced Table README](./ADVANCED_TABLE_README.md)

## Support

Если возникли проблемы, создайте issue в репозитории или обратитесь к команде разработки.
