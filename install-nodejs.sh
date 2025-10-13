#!/bin/bash

# Быстрая установка Node.js и pnpm для проекта

set -e

echo "🚀 Установка Node.js и pnpm..."
echo ""

# Проверка Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew не найден. Устанавливаю..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Добавление в PATH
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        BREW_PATH="/opt/homebrew/bin/brew"
    else
        eval "$(/usr/local/bin/brew shellenv)"
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        BREW_PATH="/usr/local/bin/brew"
    fi
    echo "✅ Homebrew установлен"
else
    if [[ $(uname -m) == 'arm64' ]]; then
        BREW_PATH="/opt/homebrew/bin/brew"
    else
        BREW_PATH="/usr/local/bin/brew"
    fi
    echo "✅ Homebrew уже установлен"
fi

# Установка Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Устанавливаю Node.js 18..."
    $BREW_PATH install node@18
    $BREW_PATH link --overwrite node@18
    echo "✅ Node.js установлен"
else
    echo "✅ Node.js уже установлен: $(node --version)"
fi

# Установка pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Устанавливаю pnpm..."
    npm install -g pnpm@8
    echo "✅ pnpm установлен"
else
    echo "✅ pnpm уже установлен: v$(pnpm --version)"
fi

echo ""
echo "✅ Все готово!"
echo ""
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: v$(pnpm --version)"

