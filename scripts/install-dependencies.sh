#!/bin/bash

# Скрипт автоматической установки зависимостей для проекта Znak Lavki
# Для macOS

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для красивого вывода
print_step() {
    echo -e "\n${BLUE}==>${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

# Проверка macOS
if [[ "$(uname)" != "Darwin" ]]; then
    print_error "Этот скрипт предназначен только для macOS"
    exit 1
fi

print_step "Начинаем установку зависимостей для проекта Znak Lavki..."

# 1. Проверка и установка Homebrew
print_step "Проверка Homebrew..."
if command -v brew &> /dev/null; then
    print_success "Homebrew уже установлен: $(brew --version | head -n1)"
else
    print_warning "Homebrew не найден. Устанавливаем..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Добавление Homebrew в PATH для Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    print_success "Homebrew установлен"
fi

# 2. Проверка и установка Node.js
print_step "Проверка Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js уже установлен: ${NODE_VERSION}"
    
    # Проверка версии (должна быть >= 18)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_warning "Версия Node.js < 18. Обновляем до Node.js 18..."
        brew upgrade node || brew install node@18
        brew link --overwrite node@18
    fi
else
    print_warning "Node.js не найден. Устанавливаем Node.js 18..."
    brew install node@18
    brew link --overwrite node@18
    print_success "Node.js установлен: $(node --version)"
fi

# 3. Проверка и установка pnpm
print_step "Проверка pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm уже установлен: v${PNPM_VERSION}"
else
    print_warning "pnpm не найден. Устанавливаем pnpm 8..."
    npm install -g pnpm@8
    print_success "pnpm установлен: v$(pnpm --version)"
fi

# 4. Проверка и установка Docker
print_step "Проверка Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker уже установлен: ${DOCKER_VERSION}"
    
    # Проверка, запущен ли Docker
    if ! docker info &> /dev/null; then
        print_warning "Docker установлен, но не запущен. Пожалуйста, запустите Docker Desktop."
    else
        print_success "Docker запущен и работает"
    fi
else
    print_warning "Docker не найден."
    echo ""
    echo "Для установки Docker Desktop:"
    echo "1. Установка через Homebrew (рекомендуется):"
    echo "   ${BLUE}brew install --cask docker${NC}"
    echo ""
    echo "2. Или скачайте вручную с:"
    echo "   https://www.docker.com/products/docker-desktop"
    echo ""
    read -p "Хотите установить Docker через Homebrew сейчас? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install --cask docker
        print_success "Docker Desktop установлен"
        print_warning "Запустите Docker Desktop из Applications перед продолжением"
        echo "После запуска Docker Desktop нажмите Enter для продолжения..."
        read
    else
        print_warning "Пропускаем установку Docker. Установите его вручную позже."
    fi
fi

# 5. Проверка Docker Compose
if command -v docker &> /dev/null; then
    print_step "Проверка Docker Compose..."
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose установлен: ${COMPOSE_VERSION}"
    else
        print_warning "Docker Compose не найден, но обычно входит в Docker Desktop"
    fi
fi

# 6. Проверка Git
print_step "Проверка Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git установлен: ${GIT_VERSION}"
else
    print_warning "Git не найден. Устанавливаем..."
    brew install git
    print_success "Git установлен"
fi

# Итоговая сводка
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "Сводка установленных инструментов:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v brew &> /dev/null; then
    print_success "Homebrew: $(brew --version | head -n1)"
else
    print_error "Homebrew: не установлен"
fi

if command -v node &> /dev/null; then
    print_success "Node.js: $(node --version)"
else
    print_error "Node.js: не установлен"
fi

if command -v npm &> /dev/null; then
    print_success "npm: $(npm --version)"
else
    print_error "npm: не установлен"
fi

if command -v pnpm &> /dev/null; then
    print_success "pnpm: v$(pnpm --version)"
else
    print_error "pnpm: не установлен"
fi

if command -v docker &> /dev/null; then
    print_success "Docker: $(docker --version)"
    if docker info &> /dev/null; then
        print_success "Docker Status: Запущен ✓"
    else
        print_warning "Docker Status: Не запущен ⚠"
    fi
else
    print_error "Docker: не установлен"
fi

if command -v git &> /dev/null; then
    print_success "Git: $(git --version)"
else
    print_error "Git: не установлен"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Проверка всех требований
ALL_INSTALLED=true

if ! command -v node &> /dev/null; then
    ALL_INSTALLED=false
fi

if ! command -v pnpm &> /dev/null; then
    ALL_INSTALLED=false
fi

if ! command -v docker &> /dev/null; then
    ALL_INSTALLED=false
fi

if [ "$ALL_INSTALLED" = true ]; then
    echo ""
    print_success "Все необходимые инструменты установлены!"
    echo ""
    print_step "Следующие шаги:"
    echo "1. Установите зависимости проекта:"
    echo "   ${BLUE}pnpm install${NC}"
    echo ""
    echo "2. Запустите Docker сервисы:"
    echo "   ${BLUE}make docker-up${NC}"
    echo "   или"
    echo "   ${BLUE}docker-compose up -d${NC}"
    echo ""
    echo "3. Запустите проект в режиме разработки:"
    echo "   ${BLUE}make dev${NC}"
    echo "   или"
    echo "   ${BLUE}pnpm run dev${NC}"
    echo ""
    print_success "Готово к работе! 🚀"
else
    echo ""
    print_error "Некоторые инструменты не установлены."
    print_warning "Пожалуйста, установите недостающие инструменты вручную."
fi

echo ""

