# 🚀 Запуск Backend для создания марок

## ⚡ БЫСТРОЕ РЕШЕНИЕ (Демо-режим)

**✅ Создание марок уже работает в ДЕМО-РЕЖИМЕ!**

Откройте: http://localhost:5173/marks

1. Нажмите кнопку **"Создать марки"**
2. Заполните форму:
   - GTIN: `04607177964089`
   - Количество: `10`
   - Выберите даты
3. Нажмите **"Создать"**

Вы увидите: **"✅ Демо: Создано 10 марок для GTIN 04607177964089"**

Это **демо-режим** - марки не сохраняются в базу данных, но UI работает!

---

## 🔧 ЗАПУСК ПОЛНОГО BACKEND (Опционально)

Если хотите протестировать с реальным API:

### Шаг 1: Создайте .env файл

```bash
cd services/mark-service
cat > .env << 'ENVFILE'
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/znak_lavki
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=znak_lavki

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO (S3)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=quality-marks

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Yandex OAuth
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
ENVFILE
```

### Шаг 2: Установите зависимости

```bash
cd services/mark-service
npm install
# или
pnpm install
```

### Шаг 3: Выполните миграции БД

```bash
cd services/mark-service

# Подключитесь к PostgreSQL
psql -h localhost -U postgres -d znak_lavki

# Или через docker
docker exec -it znak-lavki-postgres psql -U postgres -d znak_lavki

# Выполните миграцию
\i migrations/001_create_tables.sql
```

### Шаг 4: Запустите backend

```bash
cd services/mark-service
npm run start:dev
# или
pnpm start:dev
```

**Проверьте:**
```bash
curl http://localhost:3001/api/v1/marks
```

Должно вернуть: `{"data":[],"total":0}`

### Шаг 5: Обновите frontend .env

```bash
cd apps/admin-panel
cat > .env << 'ENVFILE'
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
ENVFILE
```

### Шаг 6: Перезапустите frontend

```bash
cd apps/admin-panel
pnpm dev
```

Теперь создание марок будет работать с реальным API! 🎉

---

## 🔍 Проверка статуса

### Frontend (Админ-панель)
```bash
# Проверить порт
lsof -i :5173

# Проверить URL
curl http://localhost:5173/
```

### Backend (API)
```bash
# Проверить порт
lsof -i :3001

# Проверить API
curl http://localhost:3001/api/v1/marks
```

### Docker (База данных)
```bash
# Проверить контейнеры
docker ps

# Проверить PostgreSQL
docker exec -it znak-lavki-postgres psql -U postgres -c "SELECT version();"

# Проверить Redis
docker exec -it znak-lavki-redis redis-cli PING
```

---

## ❌ Решение проблем

### Проблема 1: "Connection refused" на 3001

**Причина:** Backend не запущен

**Решение:**
```bash
cd services/mark-service
pnpm install
pnpm start:dev
```

### Проблема 2: "Database connection failed"

**Причина:** PostgreSQL не запущен или неправильные данные

**Решение:**
```bash
# Проверьте Docker
docker ps | grep postgres

# Если не запущен
docker-compose up -d postgres

# Проверьте подключение
docker exec -it znak-lavki-postgres psql -U postgres -c "\l"
```

### Проблема 3: "JWT_SECRET is not defined"

**Причина:** Отсутствует .env файл

**Решение:**
```bash
cd services/mark-service
cp .env.example .env
# Или создайте .env как показано в Шаге 1
```

### Проблема 4: Кнопка всё равно не работает

**Причина:** Кэш браузера

**Решение:**
1. Сделайте Hard Refresh (Cmd+Shift+R)
2. Откройте DevTools (F12) → Console
3. Проверьте ошибки
4. Проверьте Network → XHR запросы

---

## 🎯 Текущий статус

✅ **Docker контейнеры:** Запущены и работают
- PostgreSQL: `localhost:5432` ✅
- Redis: `localhost:6379` ✅
- MinIO: `localhost:9000` ✅

❌ **Backend API:** Не запущен
- Порт: `3001` ❌
- URL: `http://localhost:3001/api/v1` ❌

✅ **Frontend:** Запущен
- Порт: `5173` ✅
- URL: `http://localhost:5173` ✅
- **Демо-режим:** ✅ Активен

---

## 💡 Рекомендации

### Для локальной разработки:
1. **Используйте демо-режим** (текущее состояние) ✅
   - Быстро
   - Не требует backend
   - Тестирует UI

2. **Запустите backend** (если нужен полный функционал)
   - Следуйте инструкции выше
   - ~10 минут настройки

### Для production:
- Используйте Railway.app для backend
- Используйте Vercel.com для frontend
- См. `БЫСТРЫЙ_ДЕПЛОЙ.md`

---

## 🧪 Тестирование

### Демо-режим (текущий):
```
1. http://localhost:5173/marks
2. Кнопка "Создать марки"
3. Заполните форму
4. Нажмите "Создать"
5. ✅ Увидите успешное сообщение
```

### С Backend:
```
1. Запустите backend (см. выше)
2. http://localhost:5173/marks
3. Кнопка "Создать марки"
4. Заполните форму
5. Нажмите "Создать"
6. ✅ Марки сохранятся в БД
7. ✅ Увидите их в таблице
```

---

**Создано:** $(date)
**Демо-режим:** ✅ Активен
**Frontend:** http://localhost:5173/
**Backend:** http://localhost:3001/ (требует запуска)

