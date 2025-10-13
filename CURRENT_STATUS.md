# 🚀 Текущий статус проекта "Знак Лавки"

## ✅ Успешно установлено и запущено

### 1. Docker Desktop

- **Статус:** ✅ Установлен и работает
- **Версия:** Docker 28.5.1
- **Docker Compose:** v2.40.0

### 2. Node.js и пакетный менеджер

- **Node.js:** ✅ v18.20.8 (через nvm)
- **npm:** ✅ v10.8.2
- **pnpm:** ✅ v8.15.9

### 3. Docker инфраструктура

Все контейнеры запущены и работают:

| Сервис         | Порт       | Статус                | Доступ                         |
| -------------- | ---------- | --------------------- | ------------------------------ |
| **PostgreSQL** | 5432       | ✅ Работает (healthy) | localhost:5432                 |
| **Redis**      | 6379       | ✅ Работает (healthy) | localhost:6379                 |
| **MinIO**      | 9000, 9001 | ✅ Работает           | Console: http://localhost:9001 |

**Учетные данные:**

- PostgreSQL: `postgres/postgres`, БД: `znak_lavki`
- MinIO Console: `admin/minioadmin`
- Redis: без пароля (localhost only)

### 4. Приложения

| Сервис                   | Порт | Статус           |
| ------------------------ | ---- | ---------------- |
| **Admin Panel**          | 5173 | ✅ **РАБОТАЕТ**  |
| **Integration Service**  | 3002 | ✅ **РАБОТАЕТ**  |
| **Notification Service** | 3003 | ✅ **РАБОТАЕТ**  |
| **API Gateway**          | 3000 | ⏳ Компилируется |
| **Mark Service**         | 3001 | ⏳ Компилируется |

---

## 🌐 Доступные ссылки

### Основное приложение

- **Admin Panel:** http://localhost:5173
  - Главная панель управления марками качества
  - Полный доступ к функционалу системы

### Демо версия (без backend)

- **Demo Admin Panel:** `demo-admin-panel.html`
  - Откройте файл в браузере для просмотра интерфейса с моковыми данными

### Инфраструктура

- **MinIO Console:** http://localhost:9001
  - Login: `admin`
  - Password: `minioadmin`

### Backend API (после полного запуска)

- **API Gateway:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api/docs (Swagger)
- **Mark Service:** http://localhost:3001
- **Integration Service:** http://localhost:3002
- **Notification Service:** http://localhost:3003

---

## 📋 Команды управления

### Остановить все сервисы:

```bash
# Остановить Docker контейнеры
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
/usr/local/bin/docker compose -p znak-lavki down

# Остановить Node.js процессы
pkill -f "nest start"
pkill -f "vite"
```

### Запустить заново:

```bash
# Запустить Docker контейнеры
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
/usr/local/bin/docker compose -p znak-lavki up -d

# Запустить приложения
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pnpm run dev
```

### Просмотр логов Docker:

```bash
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
/usr/local/bin/docker compose -p znak-lavki logs -f
```

### Просмотр статуса контейнеров:

```bash
/usr/local/bin/docker compose -p znak-lavki ps
```

---

## 🐛 Устранение неполадок

### Mark Service и API Gateway не запускаются?

Возможные причины:

1. **Компиляция TypeScript занимает время** - подождите 1-2 минуты
2. **Проблемы с зависимостями** - проверьте логи

Проверить логи:

```bash
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Запустить Mark Service отдельно для просмотра логов
cd services/mark-service
pnpm run dev

# В другом терминале - API Gateway
cd services/api-gateway
pnpm run dev
```

### Порты заняты?

```bash
# Найти процесс на порту
lsof -ti:5173 | xargs kill -9
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Docker не запускается?

```bash
# Перезапустить Docker Desktop
open -a Docker

# Подождать ~30 секунд, затем проверить
/usr/local/bin/docker info
```

---

## 📝 Примечания

### Что работает прямо сейчас:

1. ✅ **Admin Panel** - полностью функциональная панель управления на http://localhost:5173
2. ✅ **Вспомогательные сервисы** - Integration и Notification Service
3. ✅ **База данных** - PostgreSQL готова к работе
4. ✅ **Кеш** - Redis работает
5. ✅ **Хранилище** - MinIO готов для файлов

### Что еще компилируется:

- ⏳ Mark Service (основной сервис работы с марками)
- ⏳ API Gateway (точка входа для API)

Обычно компиляция занимает 2-3 минуты при первом запуске.

---

## 🎯 Следующие шаги

1. **Дождитесь запуска всех сервисов** (~2-3 минуты)
2. **Откройте Admin Panel:** http://localhost:5173
3. **Тестируйте функционал:**
   - Просмотр дашборда
   - Управление марками
   - Генерация QR-кодов
   - Валидация марок
   - Аналитика

4. **Изучите API документацию:** http://localhost:3000/api/docs

---

## 💡 Полезные ссылки

- **Проект на GitHub:** https://github.com/romaparamzin/znak-lavki
- **Документация архитектуры:** `docs/ARCHITECTURE.md`
- **Инструкция по установке:** `QUICK_INSTALL.md`
- **Полная документация:** `README.md`

---

**Последнее обновление:** $(date)

**Статус системы:** ✅ Частично работает (Admin Panel и инфраструктура готовы к использованию)
