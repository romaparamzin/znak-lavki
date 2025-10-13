#!/bin/bash

# Остановка всех сервисов проекта Znak Lavki

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Остановка всех сервисов Znak Lavki...${NC}"
echo ""

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Останавливаем backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Остановка backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # Если процесс все еще работает, принудительно завершаем
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        rm logs/backend.pid
        echo -e "${GREEN}✅ Backend остановлен${NC}"
    else
        echo -e "${YELLOW}Backend уже остановлен${NC}"
        rm logs/backend.pid
    fi
fi

# Останавливаем admin panel
if [ -f logs/admin-panel.pid ]; then
    ADMIN_PID=$(cat logs/admin-panel.pid)
    if ps -p $ADMIN_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Остановка Admin Panel (PID: $ADMIN_PID)...${NC}"
        kill $ADMIN_PID 2>/dev/null || true
        sleep 2
        # Если процесс все еще работает, принудительно завершаем
        if ps -p $ADMIN_PID > /dev/null 2>&1; then
            kill -9 $ADMIN_PID 2>/dev/null || true
        fi
        rm logs/admin-panel.pid
        echo -e "${GREEN}✅ Admin Panel остановлен${NC}"
    else
        echo -e "${YELLOW}Admin Panel уже остановлен${NC}"
        rm logs/admin-panel.pid
    fi
fi

# Останавливаем Docker контейнеры
echo ""
echo -e "${BLUE}Остановка Docker контейнеров...${NC}"
docker-compose down
echo -e "${GREEN}✅ Docker контейнеры остановлены${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Все сервисы остановлены!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Для повторного запуска используйте:${NC}"
echo -e "${GREEN}./БЫСТРЫЙ_ЗАПУСК_С_NVM.sh${NC}"
echo ""

