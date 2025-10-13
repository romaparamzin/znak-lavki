# Мобильное приложение Знак Лавки

Мобильное приложение React Native для складских работников для сканирования и валидации товаров.

## Возможности

✅ **Сканирование штрих-кодов и QR-кодов**

- Сканирование через камеру с использованием react-native-vision-camera
- Ручной ввод кода как запасной вариант
- Переключатель фонарика
- История сканирования

✅ **Валидация товаров**

- Отображение информации о товаре в реальном времени
- Действия: Принять/Отклонить/Сообщить о проблеме
- Предупреждения о сроке годности
- Индикаторы статуса товара

✅ **Работа офлайн**

- AsyncStorage для локального хранения данных
- Автоматическая очередь синхронизации при отсутствии сети
- Фоновая синхронизация при восстановлении соединения
- Индикатор офлайн режима

✅ **Аутентификация и безопасность**

- Биометрическая аутентификация (Face ID / Touch ID)
- Управление JWT токенами с автообновлением
- Безопасное хранение учетных данных

✅ **Push-уведомления**

- Оповещения о товарах
- Уведомления о статусе синхронизации
- Настраиваемые каналы уведомлений

✅ **Многоязычность**

- Английский, русский, испанский
- i18next для интернационализации

✅ **Аналитика и мониторинг**

- Sentry для отчетов о сбоях
- Пользовательские события аналитики
- Отслеживание просмотров экранов
- Мониторинг производительности

✅ **A/B тестирование**

- Фреймворк для экспериментов
- Назначение вариантов
- Отслеживание конверсий

✅ **Deep linking**

- Поддержка универсальных ссылок
- Пользовательская URL-схема (znak-lavki://)
- Навигация из внешних источников

## Технологический стек

- **React Native** 0.73+
- **TypeScript** 5.3+
- **React Navigation** 6
- **React Native Paper** (Material Design)
- **Redux Toolkit** с Redux Persist
- **React Query** (TanStack Query)
- **React Native Vision Camera** 3
- **AsyncStorage**
- **Sentry** для отслеживания ошибок
- **i18next** для интернационализации

## Требования

- Node.js 18+
- npm 9+ или Yarn
- React Native CLI
- Xcode 14+ (для iOS)
- Android Studio (для Android)
- CocoaPods (для iOS)

## Установка

### 1. Установка зависимостей

```bash
cd apps/mobile-app
npm install
```

### 2. Настройка iOS

```bash
cd ios
pod install
cd ..
```

### 3. Настройка Android

Дополнительная настройка для Android не требуется.

## Запуск приложения

### iOS

```bash
npm run ios
```

Или откройте `ios/ZnakLavki.xcworkspace` в Xcode и запустите.

### Android

```bash
npm run android
```

## Структура проекта

```
apps/mobile-app/
├── src/
│   ├── navigation/          # Конфигурация навигации
│   │   ├── types.ts
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/             # Компоненты экранов
│   │   ├── Auth/
│   │   ├── ErrorScreens/
│   │   ├── HomeScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   ├── ProductValidationScreen.tsx
│   │   ├── ScanHistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── store/               # Redux хранилище
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── scannerSlice.ts
│   │       ├── offlineSyncSlice.ts
│   │       └── settingsSlice.ts
│   ├── services/            # Слои сервисов
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── queries.ts
│   │   ├── biometric/
│   │   ├── feedback/
│   │   ├── i18n/
│   │   ├── notifications/
│   │   ├── offline/
│   │   ├── analytics/
│   │   ├── deeplink/
│   │   └── ab-testing/
│   └── utils/               # Утилиты
├── android/                 # Нативный код Android
├── ios/                     # Нативный код iOS
├── App.tsx                  # Корневой компонент
├── package.json
└── README.md
```

## Основные возможности

### Сканирование штрих-кодов

```typescript
import { Camera, useCodeScanner } from 'react-native-vision-camera';

const codeScanner = useCodeScanner({
  codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128'],
  onCodeScanned: (codes) => {
    // Обработка отсканированного кода
  },
});
```

### Офлайн синхронизация

```typescript
// Добавить в очередь синхронизации
dispatch(
  addToQueue({
    id: 'unique-id',
    type: 'scan',
    data: scanData,
    timestamp: new Date().toISOString(),
  })
);

// Автоматическая синхронизация при подключении
syncService.startAutoSync();
```

### Deep linking

```bash
# Открыть экран сканирования
znak-lavki://scan

# Открыть валидацию товара
znak-lavki://product/12345

# Открыть настройки
znak-lavki://settings
```

### Аналитика

```typescript
import { analyticsService } from '@services/analytics/analyticsService';

// Отслеживание события
analyticsService.trackEvent({
  category: 'scanner',
  action: 'scan_product',
  label: productName,
});

// Отслеживание просмотра экрана
analyticsService.trackScreenView('ProductValidation');
```

### A/B тестирование

```typescript
import { abTestService, EXPERIMENTS } from '@services/ab-testing/abTestService';

// Получить вариант
const buttonColor = abTestService.getVariant(EXPERIMENTS.SCAN_BUTTON_COLOR);

// Отследить конверсию
abTestService.trackConversion(EXPERIMENTS.SCAN_BUTTON_COLOR, 'button_clicked');
```

## Конфигурация

### Переменные окружения

Создайте файл `.env`:

```env
API_BASE_URL=https://api.znak-lavki.com
SENTRY_DSN=your-sentry-dsn
```

### Конфигурация API

Обновите `src/services/api/client.ts`:

```typescript
const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : process.env.API_BASE_URL;
```

## Тестирование

```bash
# Запустить тесты
npm test

# Запустить тесты с покрытием
npm run test:coverage

# Проверка линтером
npm run lint

# Проверка типов
npm run typecheck
```

## Сборка

### iOS

```bash
# Debug сборка
npm run ios

# Release сборка
cd ios
xcodebuild -workspace ZnakLavki.xcworkspace -scheme ZnakLavki -configuration Release
```

### Android

```bash
# Debug сборка
npm run android

# Release сборка
cd android
./gradlew assembleRelease
```

## Устранение неполадок

### Проблемы с разрешениями камеры

Убедитесь, что разрешения для камеры правильно настроены:

- iOS: Проверьте `Info.plist` для `NSCameraUsageDescription`
- Android: Проверьте `AndroidManifest.xml` для разрешения `CAMERA`

### Ошибки сборки

```bash
# Очистить сборку iOS
cd ios
pod deintegrate
pod install
cd ..

# Очистить сборку Android
cd android
./gradlew clean
cd ..
```

### Проблемы с Metro Bundler

```bash
# Сбросить кэш Metro bundler
npm start -- --reset-cache
```

## Оптимизация производительности

- **Разделение кода**: Динамические импорты для больших экранов
- **Оптимизация изображений**: Использование правильных форматов и размеров
- **Мемоизация**: React.memo и useMemo для дорогостоящих вычислений
- **Оптимизация списков**: FlatList с правильными keyExtractor и getItemLayout

## Лучшие практики безопасности

✅ API токены хранятся безопасно с шифрованием Redux Persist
✅ Биометрическая аутентификация для чувствительных операций
✅ Только HTTPS для production API вызовов
✅ Нет конфиденциальных данных в логах
✅ Регулярные проверки безопасности с npm audit

## Участие в разработке

1. Сделайте Fork репозитория
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## Лицензия

Проприетарная - Знак Лавки

## Поддержка

Для поддержки отправьте email на support@znak-lavki.com или создайте issue в репозитории.

## Документация

- [README.md](./README.md) - Английская версия
- [SETUP_RU.md](./SETUP_RU.md) - Руководство по установке
- [FEATURES.md](./FEATURES.md) - Список возможностей
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Руководство по развертыванию
- [PROJECT_SUMMARY_RU.md](./PROJECT_SUMMARY_RU.md) - Краткое описание проекта

## Скриншоты

### Главный экран

- Быстрый доступ к сканированию
- Статистика за день
- Индикатор онлайн/офлайн

### Экран сканирования

- Сканирование в реальном времени
- Фонарик
- Ручной ввод

### Валидация товара

- Детальная информация
- Действия с товаром
- Заметки

### Настройки

- Язык интерфейса
- Звук и вибрация
- Биометрия
- Синхронизация

## Возможности для будущего развития

- [ ] Пакетный режим сканирования
- [ ] Экспорт истории в CSV
- [ ] Расширенная фильтрация
- [ ] Поиск товаров
- [ ] Офлайн карты склада
- [ ] Голосовые команды
- [ ] Улучшение темной темы
- [ ] Поддержка виджетов
- [ ] Приложение для Apple Watch
- [ ] Поддержка Android Wear

## Контакты

- **Email**: support@znak-lavki.com
- **Telegram**: @znak-lavki-support
- **GitHub**: [Создать issue](https://github.com/your-repo/issues)

---

**Версия**: 1.0.0  
**Последнее обновление**: Октябрь 2025  
**Статус**: ✅ Готово к производству
