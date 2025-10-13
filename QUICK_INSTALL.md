# 🚀 Быстрая установка проекта Znak Lavki

## Шаг 1: Установка Homebrew (если не установлен)

Откройте Terminal и выполните:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

После установки для Apple Silicon (M1/M2/M3) добавьте в PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Проверка:
```bash
brew --version
```

## Шаг 2: Установка Node.js 18

```bash
brew install node@18
brew link --overwrite node@18
```

Проверка:
```bash
node --version  # должно быть >= v18.0.0
npm --version
```

## Шаг 3: Установка pnpm

```bash
npm install -g pnpm@8
```

Проверка:
```bash
pnpm --version  # должно быть >= 8.0.0
```

## Шаг 4: Установка Docker Desktop

### Вариант A: Через Homebrew (рекомендуется)

```bash
brew install --cask docker
```

### Вариант B: Скачать вручную

Скачайте и установите с https://www.docker.com/products/docker-desktop

**После установки запустите Docker Desktop из Applications!**

Проверка:
```bash
docker --version
docker compose version
```

Убедитесь, что Docker запущен:
```bash
docker info
```

## Шаг 5: Установка зависимостей проекта

Перейдите в директорию проекта:

```bash
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
```

Установите зависимости:

```bash
pnpm install
```

## Шаг 6: Запуск проекта

### Запуск инфраструктуры (PostgreSQL, Redis, MinIO)

```bash
make docker-up
# или
docker-compose up -d
```

Проверка статуса:
```bash
docker-compose ps
```

### Запуск приложения в режиме разработки

```bash
make dev
# или
pnpm run dev
```

## Доступ к приложениям

После запуска будут доступны:

- **Admin Panel:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **API Docs:** http://localhost:3000/api/docs
- **Mark Service:** http://localhost:3001
- **Integration Service:** http://localhost:3002
- **Notification Service:** http://localhost:3003
- **MinIO Console:** http://localhost:9001 (admin/minioadmin)
- **PostgreSQL:** localhost:5432 (postgres/postgres)
- **Redis:** localhost:6379

## 🔧 Автоматическая установка (альтернатива)

Вы также можете использовать автоматический скрипт:

```bash
./scripts/install-dependencies.sh
```

**Примечание:** Скрипт потребует ввод пароля администратора для установки Homebrew.

## ⚠️ Решение проблем

### Homebrew установлен, но команды не найдены

Для Intel Mac:
```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

Для Apple Silicon:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### Node.js не найден после установки

```bash
brew link --overwrite node@18
```

### Docker не запускается

1. Откройте Docker Desktop из Applications
2. Дождитесь полной загрузки (появится иконка в верхней панели)
3. Проверьте: `docker info`

### Порт уже занят

```bash
# Найти процесс на порту (например, 3000)
lsof -ti:3000 | xargs kill -9
```

### pnpm не найден

```bash
npm install -g pnpm@8
# Или перезагрузите terminal
```

## 📞 Поддержка

Если возникли проблемы, создайте issue в репозитории или обратитесь к команде разработки.

---

**Готово! Приятной разработки! 🎉**

