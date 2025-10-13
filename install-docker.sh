#!/bin/bash

# Скрипт установки Docker Desktop на macOS
# Требуется пароль администратора

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Установка Docker Desktop для macOS               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}✗ Этот скрипт работает только на macOS${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Система: macOS $(sw_vers -productVersion)${NC}"
echo ""

# Шаг 1: Проверка и установка Homebrew
echo -e "${BLUE}[1/3] Проверка Homebrew...${NC}"

if command -v brew &> /dev/null; then
    echo -e "${GREEN}✓ Homebrew уже установлен${NC}"
    BREW_PATH=$(which brew)
    echo -e "  Путь: ${BREW_PATH}"
    echo -e "  Версия: $(brew --version | head -n1)"
else
    echo -e "${YELLOW}⚠ Homebrew не найден. Начинаем установку...${NC}"
    echo ""
    echo -e "${YELLOW}ВНИМАНИЕ: Сейчас откроется установщик Homebrew${NC}"
    echo -e "${YELLOW}Вам нужно будет:${NC}"
    echo -e "  1. Ввести пароль администратора"
    echo -e "  2. Нажать Enter для подтверждения"
    echo ""
    read -p "Продолжить установку Homebrew? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ Установка отменена${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Устанавливаем Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Добавление Homebrew в PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        # Apple Silicon (M1/M2/M3)
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo -e "${GREEN}✓ Homebrew добавлен в PATH для Apple Silicon${NC}"
    else
        # Intel Mac
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
        echo -e "${GREEN}✓ Homebrew добавлен в PATH для Intel Mac${NC}"
    fi
    
    echo -e "${GREEN}✓ Homebrew успешно установлен!${NC}"
fi

echo ""

# Шаг 2: Проверка и установка Docker Desktop
echo -e "${BLUE}[2/3] Проверка Docker Desktop...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker уже установлен${NC}"
    echo -e "  Версия: $(docker --version)"
    
    # Проверка, запущен ли Docker
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓ Docker запущен и работает${NC}"
    else
        echo -e "${YELLOW}⚠ Docker установлен, но не запущен${NC}"
        echo -e "${YELLOW}  Запустите Docker Desktop из Applications${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker не найден. Начинаем установку...${NC}"
    echo ""
    echo -e "${BLUE}Устанавливаем Docker Desktop через Homebrew...${NC}"
    echo -e "${YELLOW}Это может занять несколько минут...${NC}"
    echo ""
    
    brew install --cask docker
    
    echo -e "${GREEN}✓ Docker Desktop успешно установлен!${NC}"
    echo ""
    echo -e "${YELLOW}ВАЖНО: Теперь нужно запустить Docker Desktop:${NC}"
    echo -e "  1. Откройте Finder"
    echo -e "  2. Перейдите в Applications (Программы)"
    echo -e "  3. Найдите и запустите Docker"
    echo -e "  4. Дождитесь запуска (иконка появится в верхней панели)"
    echo ""
    
    read -p "Открыть Docker Desktop сейчас? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Открываем Docker Desktop...${NC}"
        open -a Docker
        echo -e "${GREEN}✓ Docker Desktop запущен${NC}"
        echo -e "${YELLOW}Ожидайте завершения инициализации...${NC}"
    fi
fi

echo ""

# Шаг 3: Проверка Docker Compose
echo -e "${BLUE}[3/3] Проверка Docker Compose...${NC}"

if docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose установлен${NC}"
    echo -e "  Версия: $(docker compose version)"
else
    echo -e "${YELLOW}⚠ Docker Compose будет доступен после запуска Docker Desktop${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Итоговая информация                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Финальная проверка
ALL_OK=true

if command -v brew &> /dev/null; then
    echo -e "${GREEN}✓ Homebrew: Установлен${NC}"
else
    echo -e "${RED}✗ Homebrew: Не установлен${NC}"
    ALL_OK=false
fi

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker: Установлен${NC}"
    
    if docker info &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker: Запущен${NC}"
    else
        echo -e "${YELLOW}⚠ Docker: Установлен, но не запущен${NC}"
        echo -e "${YELLOW}  → Запустите Docker Desktop из Applications${NC}"
        ALL_OK=false
    fi
else
    echo -e "${RED}✗ Docker: Не установлен${NC}"
    ALL_OK=false
fi

if docker compose version &> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker Compose: Доступен${NC}"
else
    echo -e "${YELLOW}⚠ Docker Compose: Будет доступен после запуска Docker${NC}"
fi

echo ""

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✓ Установка успешно завершена!                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Следующие шаги:${NC}"
    echo ""
    echo -e "1. Установите зависимости проекта:"
    echo -e "   ${YELLOW}cd \"/Users/rparamzin/Desktop/репозиторий/Знак лавки\"${NC}"
    echo -e "   ${YELLOW}./scripts/install-dependencies.sh${NC}"
    echo ""
    echo -e "2. Запустите инфраструктуру:"
    echo -e "   ${YELLOW}make docker-up${NC}"
    echo -e "   или"
    echo -e "   ${YELLOW}docker-compose up -d${NC}"
    echo ""
    echo -e "3. Установите зависимости проекта:"
    echo -e "   ${YELLOW}pnpm install${NC}"
    echo ""
    echo -e "4. Запустите проект:"
    echo -e "   ${YELLOW}make dev${NC}"
    echo -e "   или"
    echo -e "   ${YELLOW}pnpm run dev${NC}"
    echo ""
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║    Установка завершена с предупреждениями              ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Пожалуйста, выполните действия, отмеченные выше,${NC}"
    echo -e "${YELLOW}и запустите скрипт снова для проверки.${NC}"
    echo ""
fi

# Информация о тестировании
echo -e "${BLUE}Для тестирования без установки откройте:${NC}"
echo -e "  ${YELLOW}demo-admin-panel.html${NC} в браузере"
echo ""

echo -e "${GREEN}Готово! 🚀${NC}"

