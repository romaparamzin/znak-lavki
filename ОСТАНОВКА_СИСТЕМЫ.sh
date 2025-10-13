#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Остановка системы Знак Лавки        ${NC}"
echo -e "${YELLOW}========================================${NC}"

# Остановка backend (Node.js процессы на порту 3001)
echo -e "\n${YELLOW}1. Остановка backend...${NC}"
BACKEND_PIDS=$(lsof -ti:3001)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "$BACKEND_PIDS" | xargs kill -9
    echo -e "${GREEN}✅ Backend остановлен${NC}"
else
    echo -e "${YELLOW}⚠️  Backend не запущен${NC}"
fi

# Остановка frontend (Node.js процессы на порту 5173)
echo -e "\n${YELLOW}2. Остановка frontend...${NC}"
FRONTEND_PIDS=$(lsof -ti:5173)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "$FRONTEND_PIDS" | xargs kill -9
    echo -e "${GREEN}✅ Frontend остановлен${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend не запущен${NC}"
fi

# Остановка Docker контейнеров
echo -e "\n${YELLOW}3. Остановка Docker контейнеров...${NC}"
docker-compose down
echo -e "${GREEN}✅ Docker контейнеры остановлены${NC}"

# Очистка логов (опционально)
echo -e "\n${YELLOW}4. Очистка логов...${NC}"
if [ -f "backend.log" ]; then
    rm backend.log
    echo -e "${GREEN}✅ backend.log удален${NC}"
fi
if [ -f "frontend.log" ]; then
    rm frontend.log
    echo -e "${GREEN}✅ frontend.log удален${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Система остановлена!                 ${NC}"
echo -e "${GREEN}========================================${NC}"

