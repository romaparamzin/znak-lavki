# Руководство по установке мобильного приложения

Полное руководство по установке мобильного приложения Знак Лавки.

## Системные требования

### Необходимое программное обеспечение

1. **Node.js** (v18 или выше)

   ```bash
   node --version  # Должна быть v18+
   ```

2. **npm или Yarn**

   ```bash
   npm --version   # v9+
   ```

3. **React Native CLI**

   ```bash
   npm install -g react-native-cli
   ```

4. **Watchman** (только для macOS)
   ```bash
   brew install watchman
   ```

### Разработка для iOS (только macOS)

1. **Xcode** (v14+)
   - Установите из Mac App Store
   - Установите Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### Разработка для Android

1. **Android Studio**
   - Скачайте с https://developer.android.com/studio
   - Установите Android SDK
   - Настройте переменную окружения ANDROID_HOME:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

2. **Java Development Kit** (JDK 11)
   ```bash
   brew install openjdk@11
   ```

## Шаги установки

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd "Знак лавки/apps/mobile-app"
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка iOS

```bash
cd ios
pod install
cd ..
```

Если возникают проблемы:

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### 4. Настройка Android

Дополнительная настройка не требуется, но убедитесь, что Android SDK правильно настроен.

### 5. Конфигурация окружения

Создайте файл `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
API_BASE_URL=http://localhost:3000/api
SENTRY_DSN=your-sentry-dsn
```

## Запуск приложения

### iOS

#### Режим разработки

```bash
# Запустить Metro bundler
npm start

# В другом терминале запустить iOS
npm run ios

# Или запустить на конкретном устройстве
npm run ios -- --simulator="iPhone 14 Pro"
```

#### Физическое устройство

1. Откройте `ios/ZnakLavki.xcworkspace` в Xcode
2. Выберите ваше устройство из меню устройств
3. Настройте подписывание в настройках проекта
4. Нажмите кнопку "Run"

### Android

#### Режим разработки

```bash
# Запустить Metro bundler
npm start

# В другом терминале запустить Android
npm run android
```

#### Физическое устройство

1. Включите Режим разработчика на Android устройстве
2. Включите USB отладку
3. Подключите устройство через USB
4. Запустите:
   ```bash
   adb devices  # Проверьте, что устройство подключено
   npm run android
   ```

## Распространенные проблемы и решения

### Проблемы iOS

#### 1. Pod Install завершается с ошибкой

```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
cd ..
```

#### 2. Ошибка сборки в Xcode

- Очистите папку сборки: `Product > Clean Build Folder` (Cmd+Shift+K)
- Derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`

#### 3. Модуль не найден

```bash
npm start -- --reset-cache
```

### Проблемы Android

#### 1. Ошибка сборки Gradle

```bash
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

#### 2. Лицензии SDK

```bash
cd $ANDROID_HOME
./tools/bin/sdkmanager --licenses
```

#### 3. Устройство не обнаружено

```bash
adb kill-server
adb start-server
adb devices
```

### Общие проблемы

#### 1. Порт Metro Bundler занят

```bash
lsof -ti:8081 | xargs kill
```

#### 2. Очистка кэша

```bash
# Очистить кэш npm
npm cache clean --force

# Очистить кэш Metro
npm start -- --reset-cache

# Очистить watchman
watchman watch-del-all
```

#### 3. Переустановка зависимостей

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Настройка камеры

### iOS

Убедитесь, что `Info.plist` содержит разрешения для камеры:

```xml
<key>NSCameraUsageDescription</key>
<string>Нам нужен доступ к камере для сканирования штрих-кодов</string>
```

### Android

Убедитесь, что `AndroidManifest.xml` содержит разрешения для камеры:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Настройка Push-уведомлений

### iOS

1. Включите возможность Push Notifications в Xcode
2. Настройте сертификат APNs в Apple Developer Portal
3. Обновите `AppDelegate.m` с конфигурацией FCM

### Android

1. Добавьте `google-services.json` в `android/app/`
2. Настройте Firebase Cloud Messaging

## Настройка Deep Linking

### iOS

Настройте Associated Domains в Xcode:

```
applinks:znak-lavki.com
```

### Android

Intent filters уже настроены в `AndroidManifest.xml`

## Тестирование Deep Links

### iOS

```bash
xcrun simctl openurl booted znak-lavki://scan
```

### Android

```bash
adb shell am start -W -a android.intent.action.VIEW -d "znak-lavki://scan" com.znakllavki
```

## Production сборка

### iOS

1. Откройте Xcode
2. Выберите "Any iOS Device (arm64)"
3. Product > Archive
4. Distribute App > App Store Connect

### Android

```bash
cd android
./gradlew bundleRelease
```

Вывод: `android/app/build/outputs/bundle/release/app-release.aab`

## Сборки для разных окружений

### Development

```bash
npm run ios -- --configuration Debug
npm run android -- --variant=debug
```

### Staging

```bash
npm run ios -- --configuration Staging
npm run android -- --variant=staging
```

### Production

```bash
npm run ios -- --configuration Release
npm run android -- --variant=release
```

## Отладка

### React Native Debugger

1. Установите React Native Debugger
2. Откройте приложение в режиме разработки
3. Встряхните устройство > "Debug"

### Chrome DevTools

1. Откройте приложение в режиме разработки
2. Встряхните устройство > "Debug"
3. Откройте Chrome: `chrome://inspect`

### Flipper

1. Установите Flipper: https://fbflipper.com/
2. Откройте приложение в режиме разработки
3. Flipper автоматически подключится

## Мониторинг производительности

### Включение метрик производительности

```typescript
// В App.tsx
import { enableScreens } from 'react-native-screens';
enableScreens();
```

### Производительность Sentry

```typescript
Sentry.init({
  tracesSampleRate: 1.0,
  enableAutoSessionTracking: true,
});
```

## Подписывание кода (iOS)

1. Откройте Xcode
2. Выберите проект в навигаторе
3. Перейдите в "Signing & Capabilities"
4. Выберите вашу команду
5. Включите "Automatically manage signing"

## Следующие шаги

1. Настройте endpoint backend API
2. Настройте проект Sentry
3. Настройте Firebase для push-уведомлений
4. Настройте домены для deep linking
5. Настройте платформы аналитики
6. Протестируйте на физических устройствах

## Дополнительные ресурсы

- [Документация React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://tanstack.com/query)

## Поддержка

Для вопросов или проблем:

- Создайте issue в репозитории
- Контакт: support@znak-lavki.com
- Telegram: @znak-lavki-support

## Полезные команды

### Очистка проекта

```bash
# Полная очистка
rm -rf node_modules ios/Pods ios/Podfile.lock
npm install
cd ios && pod install && cd ..
```

### Проверка кода

```bash
# Линтинг
npm run lint

# Проверка типов
npm run typecheck

# Форматирование
npm run format
```

### Логи

```bash
# iOS логи
npx react-native log-ios

# Android логи
npx react-native log-android

# Metro bundler логи
npm start -- --verbose
```

### Информация о устройстве

```bash
# iOS симуляторы
xcrun simctl list devices

# Android устройства
adb devices

# Android эмуляторы
emulator -list-avds
```

## Контрольный список готовности

Перед началом разработки убедитесь, что:

- [ ] Node.js установлен (v18+)
- [ ] npm/yarn установлен
- [ ] React Native CLI установлен
- [ ] Xcode установлен и настроен (для iOS)
- [ ] Android Studio установлен и настроен (для Android)
- [ ] CocoaPods установлен (для iOS)
- [ ] Зависимости установлены (`npm install`)
- [ ] Pods установлены (для iOS: `cd ios && pod install`)
- [ ] Файл `.env` создан и настроен
- [ ] Устройство/эмулятор готов для тестирования

## Часто задаваемые вопросы (FAQ)

**Q: Приложение не запускается на iOS**
A: Убедитесь, что вы запускаете `.xcworkspace`, а не `.xcodeproj` файл

**Q: Metro bundler показывает ошибку порта**
A: Запустите `lsof -ti:8081 | xargs kill` для освобождения порта

**Q: Изменения не применяются**
A: Очистите кэш: `npm start -- --reset-cache`

**Q: Ошибка при pod install**
A: Попробуйте `pod deintegrate` затем `pod install`

**Q: Android сборка завершается с ошибкой**
A: Выполните `cd android && ./gradlew clean`

---

**Документация обновлена**: Октябрь 2025  
**Версия приложения**: 1.0.0
