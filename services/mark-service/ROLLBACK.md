# 🔄 Инструкция по откату изменений

## 📋 Информация о коммите

**Коммит**: Complete NestJS Mark Service Implementation
**Дата**: 2025-10-10
**Описание**: Полная реализация Mark Service с генерацией QR-кодов, валидацией, кэшированием и метриками

### Что было добавлено:
- Database schema (PostgreSQL + TypeORM)
- Сервисы генерации и валидации марок
- REST API с 11 эндпоинтами
- QR code generation с логотипом
- Redis caching
- Rate limiting
- Swagger документация
- Prometheus метрики
- Unit и E2E тесты
- SQL миграции
- Полная документация

## ⚠️ Перед откатом

**ВАЖНО**: Создайте резервную копию, если у вас есть локальные изменения:

```bash
# Сохраните текущие изменения
git stash save "Мои локальные изменения перед откатом"
```

## 🔙 Способы отката

### Способ 1: Откат последнего коммита (если еще не запушили)

```bash
# Откатить коммит, сохранив изменения в рабочей директории
git reset --soft HEAD~1

# Или откатить коммит и удалить все изменения
git reset --hard HEAD~1
```

### Способ 2: Откат после push в GitHub

```bash
# 1. Узнайте хеш коммита, к которому хотите откатиться
git log --oneline -10

# 2. Откатитесь к нужному коммиту (замените COMMIT_HASH)
git reset --hard COMMIT_HASH

# 3. Принудительно запушьте изменения (ОСТОРОЖНО!)
git push --force origin main
```

### Способ 3: Создать reverting коммит (безопасный способ)

```bash
# 1. Найдите хеш коммита, который хотите отменить
git log --oneline -10

# 2. Создайте reverting коммит (замените COMMIT_HASH)
git revert COMMIT_HASH

# 3. Запушьте изменения
git push origin main
```

### Способ 4: Откат конкретных файлов

```bash
# Откатить конкретный файл к предыдущей версии
git checkout HEAD~1 -- services/mark-service/src/main.ts

# Или к конкретному коммиту
git checkout COMMIT_HASH -- services/mark-service/src/main.ts

# Закоммитить изменения
git add .
git commit -m "Rollback specific files"
git push origin main
```

## 📦 Откат пакетов (если нужно)

```bash
cd services/mark-service

# Удалить установленные зависимости
rm -rf node_modules
rm pnpm-lock.yaml

# Вернуться к предыдущей версии package.json
git checkout HEAD~1 -- package.json

# Переустановить зависимости
pnpm install
```

## 🗄️ Откат миграций базы данных

```bash
# Откатить изменения в базе данных
psql -U postgres -d znak_lavki << EOF
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS quality_marks CASCADE;
DROP TYPE IF EXISTS mark_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
EOF
```

## 🔍 Проверка текущего состояния

```bash
# Посмотреть историю коммитов
git log --oneline -10

# Посмотреть текущий статус
git status

# Посмотреть изменения
git diff HEAD~1
```

## 💾 Создание бэкапа перед откатом

```bash
# Создать ветку с текущим состоянием
git branch backup-mark-service-$(date +%Y%m%d)

# Или создать тег
git tag -a mark-service-backup-$(date +%Y%m%d) -m "Backup before rollback"
git push origin --tags
```

## 🚀 Восстановление после отката

Если вы откатились и хотите вернуться:

```bash
# Посмотреть все действия (включая откаты)
git reflog

# Вернуться к нужному состоянию (замените COMMIT_HASH)
git reset --hard COMMIT_HASH

# Или восстановить из бэкапа
git checkout backup-mark-service-YYYYMMDD
```

## ⚡ Быстрые команды

### Полный откат (ОСТОРОЖНО - удалит все изменения!)
```bash
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
git reset --hard HEAD~1
git push --force origin main
```

### Безопасный откат (создает новый коммит)
```bash
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
git revert HEAD
git push origin main
```

## 📞 Помощь

Если что-то пошло не так:

```bash
# Отменить последнюю операцию
git reflog
git reset --hard HEAD@{1}

# Восстановить из stash
git stash list
git stash apply stash@{0}
```

## ⚠️ Важные замечания

1. **--force push опасен** - используйте только если уверены
2. **Всегда делайте бэкап** перед откатом
3. **git revert безопаснее** чем git reset для публичных репозиториев
4. **Проверяйте статус** перед каждой операцией

## 📊 Удаление только новых файлов (без изменения существующих)

```bash
# Удалить только новые файлы, сохранив изменения в существующих
git clean -fd

# Посмотреть что будет удалено (без удаления)
git clean -fd --dry-run
```

---

**Дата создания инструкции**: 2025-10-10  
**Версия**: 1.0  
**Последнее обновление**: 2025-10-10

