# 🚀 Стратегия деплоя проекта "Знак Лавки"

## 📌 Основной вопрос: Нужна ли отдельная ветка для деплоя?

### ✅ Рекомендация: **НЕТ, используйте `main` напрямую**

Вот почему это безопасно и правильно:

---

## 🎯 Почему деплой из `main` - правильное решение

### 1. **Docker изолирует приложение**

```dockerfile
# В Dockerfile происходит multi-stage build
FROM node:18-alpine AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Итоговый образ содержит ТОЛЬКО runtime
FROM node:18-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

**Результат**: Markdown файлы, тесты, документация **не попадают** в Docker образ.

---

### 2. **`.dockerignore` фильтрует лишнее**

Я только что создал 3 файла `.dockerignore`:

- `/` - корневой (общий)
- `/services/mark-service/` - для backend
- `/apps/admin-panel/` - для frontend

Теперь при сборке Docker **игнорирует**:

- ❌ Все `*.md` файлы
- ❌ `docs/`, `k8s/`, `terraform/`
- ❌ Тесты и coverage
- ❌ `.git/` история

---

### 3. **PaaS платформы деплоят по директориям**

#### Railway:

```yaml
# railway.toml (пример)
[build]
  builder = "DOCKERFILE"
  dockerfilePath = "services/mark-service/Dockerfile"
```

Деплоит **только** `services/mark-service/`, остальное игнорирует.

#### Vercel:

```json
{
  "builds": [
    {
      "src": "apps/admin-panel",
      "use": "@vercel/static-build"
    }
  ]
}
```

Деплоит **только** `apps/admin-panel/`.

---

## 🔒 Что защищает от деплоя лишнего

| Защита          | Что блокирует                              | Статус                      |
| --------------- | ------------------------------------------ | --------------------------- |
| `.gitignore`    | `node_modules/`, `.env`, `dist/`           | ✅ Уже настроен             |
| `.dockerignore` | Документация, тесты, другие сервисы        | ✅ Только что добавил       |
| `Dockerfile`    | Multi-stage build оставляет только runtime | ✅ Уже есть                 |
| PaaS конфиг     | Деплоит конкретную директорию              | ✅ Настраивается при деплое |

---

## 🌿 Когда нужна отдельная ветка?

### Вариант 1: Production ветка (опционально)

Используется в **больших командах** для дополнительного контроля:

```bash
main → develop → staging → production
```

**Когда это нужно:**

- ✅ Команда > 5 человек
- ✅ Критичный production с SLA
- ✅ Требуется code review + QA перед деплоем
- ✅ Разные конфигурации для env

**Для вашего проекта:** ❌ Избыточно на старте

---

### Вариант 2: Деплой через GitHub Actions + отдельная ветка

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [production]
```

**Когда это нужно:**

- ✅ Автоматический CI/CD pipeline
- ✅ Разделение разработки и продакшена
- ✅ Нужен approval процесс

**Для вашего проекта:** ⚠️ Можно добавить позже

---

## 💡 Рекомендуемая стратегия (для вас)

### Phase 1: Простой деплой (сейчас)

```bash
main (одна ветка)
  ↓
Railway/Vercel деплоит автоматически
```

**Преимущества:**

- ✅ Быстро
- ✅ Просто
- ✅ Достаточно для MVP
- ✅ Не нужно управлять ветками

**Как работает:**

1. `git push origin main`
2. Railway/Vercel видит изменения
3. Собирает Docker образ (с `.dockerignore`)
4. Деплоит **только** нужные файлы

---

### Phase 2: С ростом проекта (будущее)

```bash
main → staging → production
  ↓       ↓          ↓
  dev   test env   prod env
```

**Когда переходить:**

- Появилась команда
- Нужно тестировать перед production
- Требуется разделение окружений

---

## 📂 Какие файлы попадают в деплой

### ✅ Что деплоится (нужное):

```
services/mark-service/
├── src/              ✅ Код
├── dist/             ✅ Compiled JS
├── node_modules/     ✅ Runtime dependencies
├── package.json      ✅ Dependencies
└── tsconfig.json     ✅ Build config

apps/admin-panel/
├── src/              ✅ React код
├── dist/             ✅ Compiled static
├── index.html        ✅ Entry point
└── public/           ✅ Static assets
```

### ❌ Что НЕ деплоится (благодаря `.dockerignore`):

```
/
├── README.md                    ❌ Документация
├── QUICK_DEPLOY.md              ❌ Документация
├── PROJECT_SUMMARY.md           ❌ Документация
├── docs/                        ❌ Документация
├── k8s/                         ❌ K8s конфиги (нужны только для K8s деплоя)
├── terraform/                   ❌ IaC конфиги
├── monitoring/                  ❌ Monitoring конфиги
├── tests/                       ❌ Тесты
├── .git/                        ❌ Git история
└── node_modules/ (корневые)     ❌ Dev dependencies
```

---

## 🛠️ Практический пример

### Текущий деплой на Railway:

```bash
# 1. Commit и push в main
git add .
git commit -m "feat: new feature"
git push origin main

# 2. Railway автоматически:
# - Клонирует репозиторий
# - Читает services/mark-service/Dockerfile
# - Применяет .dockerignore
# - Собирает образ (без docs, тестов)
# - Деплоит ТОЛЬКО runtime файлы

# 3. Итоговый размер образа:
# БЕЗ .dockerignore: ~500MB (с docs, tests)
# С .dockerignore:   ~150MB (только код)
```

---

## 📊 Сравнение стратегий

| Стратегия                           | Сложность  | Безопасность    | Для кого            |
| ----------------------------------- | ---------- | --------------- | ------------------- |
| **main → production** (ваш вариант) | 🟢 Простая | 🟢 Достаточная  | Соло, малые команды |
| **main → staging → prod**           | 🟡 Средняя | 🟢 Высокая      | Средние команды     |
| **GitFlow (5 веток)**               | 🔴 Сложная | 🟢 Максимальная | Крупные enterprise  |

---

## ✅ Checklist: Деплой без лишних файлов

- [x] `.gitignore` настроен (игнорирует `node_modules`, `.env`)
- [x] `.dockerignore` добавлен (игнорирует `*.md`, `docs/`, `tests/`)
- [x] `Dockerfile` использует multi-stage build
- [ ] Настроить Railway/Vercel с правильной root директорией
- [ ] Проверить размер Docker образа (должен быть ~150MB, не 500MB)
- [ ] (Опционально) Добавить `railway.toml` для точной настройки

---

## 🚀 Быстрый старт (деплой из main)

### Railway:

```bash
# 1. Push код
git push origin main

# 2. В Railway UI:
# - New Project → Deploy from GitHub
# - Select repo → Choose service directory
# - Railway автоматически применит .dockerignore
# - Деплой займет 3-5 минут
```

### Vercel (Admin Panel):

```bash
# 1. Push код
git push origin main

# 2. В Vercel UI:
# - New Project → Import Git Repository
# - Root Directory: apps/admin-panel
# - Framework: Vite
# - Deploy
```

---

## 🔍 Как проверить что задеплоилось

### Проверка размера Docker образа:

```bash
# Локально соберите образ
docker build -f services/mark-service/Dockerfile -t mark-service .

# Проверьте размер
docker images mark-service

# Должно быть:
# ✅ ~150-200MB - хорошо (только runtime)
# ❌ >500MB - плохо (лишние файлы)
```

### Проверка содержимого образа:

```bash
# Запустите контейнер
docker run -it mark-service sh

# Проверьте что НЕТ:
ls docs/        # Должно быть: No such file
ls *.md         # Должно быть: No such file
ls tests/       # Должно быть: No such file
```

---

## 📝 Итоговая рекомендация

### ✅ Ваша текущая стратегия (правильная):

```bash
main (ветка)
  ↓
git push origin main
  ↓
Railway/Vercel автодеплой
  ↓
.dockerignore фильтрует лишнее
  ↓
Деплоится только нужное
```

### ❌ НЕ нужно:

- ❌ Создавать отдельную ветку `production`
- ❌ Создавать отдельную папку для деплоя
- ❌ Копировать файлы вручную
- ❌ Удалять документацию из репозитория

### ✅ Нужно (уже сделано):

- ✅ `.dockerignore` файлы созданы
- ✅ `.gitignore` уже настроен
- ✅ `Dockerfile` правильно настроены

---

## 🎯 Next Steps

1. **Проверьте `.dockerignore` файлы** (я их только что создал)
2. **Commit изменения:**
   ```bash
   git add .dockerignore services/*/. dockerignore apps/*/.dockerignore
   git commit -m "build: add .dockerignore to reduce image size"
   git push origin main
   ```
3. **Деплойте прямо из `main`** - это безопасно!
4. **Проверьте размер образа** после деплоя

---

## 📞 Дополнительные вопросы?

- **Q: Безопасно ли хранить все в `main`?**
  - A: Да! `.env` файлы в `.gitignore`, секреты не коммитятся.

- **Q: Можно ли случайно задеплоить лишнее?**
  - A: Нет! `.dockerignore` + multi-stage build защищают.

- **Q: Нужен ли GitFlow?**
  - A: Не на старте. Добавьте когда команда > 3-5 человек.

---

**Вывод**: Ваш текущий подход ✅ **правильный**. Деплой из `main` + `.dockerignore` = чистый и быстрый деплой.
