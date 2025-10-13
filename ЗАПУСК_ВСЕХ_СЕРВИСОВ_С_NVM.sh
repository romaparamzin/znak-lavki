#!/bin/bash

# Запуск всех сервисов проекта Znak Lavki (с NVM)
# Backend сервисы и Admin Panel запускаются в фоне

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Запуск всех сервисов Znak Lavki...${NC}"
echo ""

# Получаем директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Загружаем NVM
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
else
    echo "❌ NVM не найден!"
    exit 1
fi

# Создаем директорию для логов
mkdir -p logs

echo -e "${BLUE}1️⃣  Запуск backend сервисов...${NC}"

# Запускаем backend в фоне
nohup pnpm run dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend запущен (PID: $BACKEND_PID)${NC}"
echo $BACKEND_PID > logs/backend.pid

# Ждем немного чтобы backend запустился
sleep 3

echo -e "${BLUE}2️⃣  Запуск Admin Panel...${NC}"

# Запускаем admin panel в фоне
cd apps/admin-panel
nohup pnpm run dev > ../../logs/admin-panel.log 2>&1 &
ADMIN_PID=$!
echo -e "${GREEN}✅ Admin Panel запущен (PID: $ADMIN_PID)${NC}"
echo $ADMIN_PID > ../../logs/admin-panel.pid

cd "$SCRIPT_DIR"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Все сервисы запущены!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 Приложения будут доступны через ~30 секунд:${NC}"
echo ""
echo -e "  ${GREEN}Admin Panel:${NC}     http://localhost:5173"
echo -e "  ${GREEN}API Gateway:${NC}     http://localhost:3000"
echo -e "  ${GREEN}API Docs:${NC}        http://localhost:3000/api/docs"
echo ""
echo -e "${YELLOW}📝 Полезные команды:${NC}"
echo ""
echo -e "  ${GREEN}Посмотреть логи backend:${NC}"
echo -e "  tail -f logs/backend.log"
echo ""
echo -e "  ${GREEN}Посмотреть логи admin panel:${NC}"
echo -e "  tail -f logs/admin-panel.log"
echo ""
echo -e "  ${GREEN}Остановить все сервисы:${NC}"
echo -e "  ./ОСТАНОВКА_СЕРВИСОВ.sh"
echo ""
echo -e "  ${GREEN}Проверить статус:${NC}"
echo -e "  ps aux | grep 'pnpm\\|node' | grep -v grep"
echo ""

