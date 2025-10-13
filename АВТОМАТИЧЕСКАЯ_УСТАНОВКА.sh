#!/bin/bash

# Скрипт автоматической установки всех необходимых инструментов
# для мобильного приложения Знак Лавки

set -e  # Остановить при ошибке

echo "🚀 Начинаем установку инструментов для React Native приложения..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки успешности команды
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ Ошибка при $1${NC}"
        exit 1
    fi
}

# Функция для проверки установлен ли инструмент
is_installed() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

echo -e "${BLUE}📋 Шаг 1: Проверка Homebrew...${NC}"
if is_installed brew; then
    echo -e "${GREEN}✅ Homebrew уже установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Homebrew не найден. Устанавливаю...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    check_success "установки Homebrew"
    
    # Добавить Homebrew в PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo -e "${GREEN}✅ Homebrew установлен и добавлен в PATH${NC}"
fi
echo ""

echo -e "${BLUE}📋 Шаг 2: Проверка Node.js...${NC}"
if is_installed node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js уже установлен: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js не найден. Устанавливаю...${NC}"
    brew install node@18
    check_success "установки Node.js"
    
    # Добавить node в PATH
    echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zprofile
    export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
    
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js установлен: $NODE_VERSION${NC}"
fi
echo ""

echo -e "${BLUE}📋 Шаг 3: Проверка npm...${NC}"
if is_installed npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm установлен: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm не найден (должен быть установлен с Node.js)${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}📋 Шаг 4: Проверка Watchman...${NC}"
if is_installed watchman; then
    WATCHMAN_VERSION=$(watchman --version)
    echo -e "${GREEN}✅ Watchman уже установлен: $WATCHMAN_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Watchman не найден. Устанавливаю...${NC}"
    brew install watchman
    check_success "установки Watchman"
fi
echo ""

echo -e "${BLUE}📋 Шаг 5: Проверка CocoaPods (для iOS)...${NC}"
if is_installed pod; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✅ CocoaPods уже установлен: $POD_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  CocoaPods не найден. Устанавливаю...${NC}"
    brew install cocoapods
    check_success "установки CocoaPods"
fi
echo ""

echo -e "${BLUE}📋 Шаг 6: Установка зависимостей проекта...${NC}"
if [ -d "apps/mobile-app" ]; then
    cd apps/mobile-app
    
    echo -e "${YELLOW}⚠️  Устанавливаю npm зависимости...${NC}"
    npm install
    check_success "установки npm зависимостей"
    
    # Установить iOS зависимости если на macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}⚠️  Устанавливаю iOS зависимости (pods)...${NC}"
        if [ -d "ios" ]; then
            cd ios
            pod install
            check_success "установки CocoaPods зависимостей"
            cd ..
        fi
    fi
    
    cd ../..
else
    echo -e "${RED}❌ Папка apps/mobile-app не найдена${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}📋 Шаг 7: Проверка установки...${NC}"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Watchman: $(watchman --version 2>/dev/null || echo 'не установлен')"
echo "CocoaPods: $(pod --version 2>/dev/null || echo 'не установлен')"
echo ""

echo -e "${GREEN}🎉 Установка завершена успешно!${NC}"
echo ""
echo -e "${BLUE}📱 Следующие шаги:${NC}"
echo ""
echo "1. Для запуска на iOS:"
echo "   cd apps/mobile-app"
echo "   npm run ios"
echo ""
echo "2. Для запуска на Android:"
echo "   cd apps/mobile-app"
echo "   npm run android"
echo ""
echo "3. Прочитайте документацию:"
echo "   - apps/mobile-app/БЫСТРЫЙ_СТАРТ.md"
echo "   - apps/mobile-app/README_RU.md"
echo ""
echo -e "${YELLOW}⚠️  Для разработки iOS требуется Xcode из Mac App Store${NC}"
echo -e "${YELLOW}⚠️  Для разработки Android требуется Android Studio${NC}"
echo ""
echo -e "${GREEN}✅ Готово!${NC}"

