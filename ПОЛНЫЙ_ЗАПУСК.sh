#!/bin/bash

# Полный запуск проекта Znak Lavki с Advanced Table
# Этот скрипт запускает все необходимые сервисы

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Запуск проекта Znak Lavki с Advanced Table${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Функция для проверки команд
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 не найден${NC}"
        echo -e "${YELLOW}   Пожалуйста, установите $1 согласно инструкции в ЗАПУСК_ПОСЛЕ_ИЗМЕНЕНИЙ.md${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 установлен${NC}"
        return 0
    fi
}

# Проверка всех необходимых команд
echo -e "${BLUE}📋 Проверка зависимостей...${NC}"
echo ""

MISSING_DEPS=0

check_command "node" || MISSING_DEPS=1
check_command "pnpm" || MISSING_DEPS=1
check_command "docker" || MISSING_DEPS=1

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ Не все зависимости установлены!${NC}"
    echo -e "${YELLOW}📖 Следуйте инструкциям в файле: ЗАПУСК_ПОСЛЕ_ИЗМЕНЕНИЙ.md${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Все зависимости установлены!${NC}"
echo ""

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Шаг 1: Проверка Docker
echo -e "${BLUE}1️⃣  Проверка Docker...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker не запущен!${NC}"
    echo -e "${YELLOW}   Запустите Docker Desktop и попробуйте снова${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker работает${NC}"
echo ""

# Шаг 2: Установка зависимостей корня (если нужно)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}2️⃣  Установка зависимостей корневого проекта...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
else
    echo -e "${GREEN}2️⃣  Зависимости корневого проекта уже установлены${NC}"
fi
echo ""

# Шаг 3: Установка зависимостей Admin Panel
echo -e "${BLUE}3️⃣  Проверка зависимостей Admin Panel...${NC}"
cd apps/admin-panel

# Проверяем наличие критичных зависимостей для Advanced Table
if ! grep -q "@mui/material" package.json 2>/dev/null; then
    echo -e "${YELLOW}   Установка зависимостей Advanced Table...${NC}"
    pnpm install @mui/material @emotion/react @emotion/styled \
                 @mui/x-date-pickers date-fns \
                 @tanstack/react-virtual lodash-es xlsx \
                 @types/lodash-es @types/xlsx --save
    echo -e "${GREEN}✅ Зависимости Advanced Table установлены${NC}"
else
    echo -e "${GREEN}✅ Зависимости Advanced Table уже установлены${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   Установка остальных зависимостей...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
fi

cd "$SCRIPT_DIR"
echo ""

# Шаг 4: Запуск Docker контейнеров
echo -e "${BLUE}4️⃣  Запуск инфраструктуры (PostgreSQL, Redis, MinIO)...${NC}"
docker-compose up -d

# Ждем пока контейнеры запустятся
echo -e "${YELLOW}   Ожидание готовности контейнеров...${NC}"
sleep 5

# Проверяем статус
docker-compose ps
echo -e "${GREEN}✅ Инфраструктура запущена${NC}"
echo ""

# Шаг 5: Информация о запуске сервисов
echo -e "${BLUE}5️⃣  Запуск сервисов...${NC}"
echo ""
echo -e "${YELLOW}📝 Для запуска всех backend сервисов, выполните в отдельном терминале:${NC}"
echo -e "${GREEN}   cd \"$SCRIPT_DIR\" && pnpm run dev${NC}"
echo ""
echo -e "${YELLOW}📝 Для запуска Admin Panel, выполните в другом терминале:${NC}"
echo -e "${GREEN}   cd \"$SCRIPT_DIR/apps/admin-panel\" && pnpm run dev${NC}"
echo ""

# Шаг 6: Информация о доступе
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📍 Доступ к приложениям после запуска:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Admin Panel:${NC}            http://localhost:5173"
echo -e "  ${GREEN}API Gateway:${NC}            http://localhost:3000"
echo -e "  ${GREEN}API Docs:${NC}               http://localhost:3000/api/docs"
echo -e "  ${GREEN}Mark Service:${NC}           http://localhost:3001"
echo -e "  ${GREEN}Integration Service:${NC}    http://localhost:3002"
echo -e "  ${GREEN}Notification Service:${NC}   http://localhost:3003"
echo -e "  ${GREEN}MinIO Console:${NC}          http://localhost:9001 ${YELLOW}(admin/minioadmin)${NC}"
echo -e "  ${GREEN}PostgreSQL:${NC}             localhost:5432 ${YELLOW}(postgres/postgres)${NC}"
echo -e "  ${GREEN}Redis:${NC}                  localhost:6379"
echo ""

# Шаг 7: Новые возможности
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✨ Новые возможности Advanced Table:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}⚡${NC} Виртуальный скроллинг - плавная работа с 100k+ строками"
echo -e "  ${GREEN}🔄${NC} Real-time обновления через WebSocket"
echo -e "  ${GREEN}📊${NC} Расширяемые строки с детальной информацией"
echo -e "  ${GREEN}🔍${NC} Продвинутые фильтры (диапазоны дат, статусы)"
echo -e "  ${GREEN}↔️${NC}  Изменение размера колонок"
echo -e "  ${GREEN}✅${NC} Выбор диапазона строк (Shift+Click)"
echo ""
echo -e "  ${YELLOW}⌨️  Горячие клавиши:${NC}"
echo -e "     • Ctrl/Cmd + A  - Выбрать все"
echo -e "     • Ctrl/Cmd + E  - Экспорт CSV"
echo -e "     • Ctrl/Cmd + R  - Обновить"
echo -e "     • Escape        - Снять выделение"
echo -e "     • Shift + Click - Выбор диапазона"
echo ""

# Шаг 8: Полезные команды
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Полезные команды:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Остановить все контейнеры:${NC}"
echo -e "  ${GREEN}docker-compose down${NC}"
echo ""
echo -e "  ${YELLOW}Посмотреть логи:${NC}"
echo -e "  ${GREEN}docker-compose logs -f${NC}"
echo ""
echo -e "  ${YELLOW}Перезапустить контейнеры:${NC}"
echo -e "  ${GREEN}docker-compose restart${NC}"
echo ""
echo -e "  ${YELLOW}Проверить статус:${NC}"
echo -e "  ${GREEN}docker-compose ps${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Инфраструктура готова к работе!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📖 Следуйте инструкциям выше для запуска сервисов${NC}"
echo -e "${YELLOW}📚 Подробная документация: apps/admin-panel/ADVANCED_TABLE_README.md${NC}"
echo ""

