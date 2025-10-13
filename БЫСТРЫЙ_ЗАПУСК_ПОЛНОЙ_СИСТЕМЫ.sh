#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Запуск системы Знак Лавки           ${NC}"
echo -e "${GREEN}========================================${NC}"

# Проверка Docker
echo -e "\n${YELLOW}1. Проверка Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker не установлен${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker установлен${NC}"

# Запуск базы данных и Redis
echo -e "\n${YELLOW}2. Запуск PostgreSQL и Redis...${NC}"
docker-compose up -d postgres redis
sleep 5
echo -e "${GREEN}✅ База данных и Redis запущены${NC}"

# Установка зависимостей backend (если нужно)
echo -e "\n${YELLOW}3. Проверка зависимостей backend...${NC}"
cd services/mark-service
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Установка зависимостей backend...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Зависимости backend готовы${NC}"

# Запуск backend
echo -e "\n${YELLOW}4. Запуск backend сервера...${NC}"
npm run build
nohup npm run start:prod > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend запущен (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}   Логи: backend.log${NC}"
sleep 3

# Проверка backend
echo -e "\n${YELLOW}5. Проверка backend...${NC}"
if curl -s http://localhost:3001/api/v1/dashboard/metrics > /dev/null; then
    echo -e "${GREEN}✅ Backend работает на http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend не отвечает${NC}"
    echo -e "${YELLOW}Проверьте логи: tail -f backend.log${NC}"
fi

# Переход к frontend
cd ../../apps/admin-panel

# Установка зависимостей frontend (если нужно)
echo -e "\n${YELLOW}6. Проверка зависимостей frontend...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Установка зависимостей frontend...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Зависимости frontend готовы${NC}"

# Запуск frontend
echo -e "\n${YELLOW}7. Запуск frontend...${NC}"
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend запущен (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}   Логи: frontend.log${NC}"

# Итоговая информация
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Система запущена!                     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}Backend:${NC}  http://localhost:3001"
echo -e "${YELLOW}API Docs:${NC} http://localhost:3001/api"
echo -e ""
echo -e "${YELLOW}Чтобы остановить систему:${NC}"
echo -e "  kill $BACKEND_PID $FRONTEND_PID"
echo -e "  docker-compose down"
echo -e ""
echo -e "${YELLOW}Логи:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo -e ""
echo -e "${GREEN}Готово! Откройте браузер:${NC} http://localhost:5173"
echo -e "${YELLOW}Используйте кнопку '🔧 Режим разработки' для входа${NC}"

