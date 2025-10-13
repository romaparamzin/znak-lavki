#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🚀 УСТАНОВКА GITHUB CLI И PUSH                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Проверка Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew не установлен. Устанавливаю..."
    echo ""
    echo "⚠️  Вам потребуется:"
    echo "   1. Ввести пароль администратора"
    echo "   2. Нажать Enter для подтверждения"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Добавляем Homebrew в PATH (для Apple Silicon)
    if [ -f "/opt/homebrew/bin/brew" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew уже установлен"
fi

echo ""
echo "📦 Устанавливаю GitHub CLI..."
brew install gh

echo ""
echo "🔐 Авторизация в GitHub..."
echo ""
echo "⚠️  Следуйте инструкциям:"
echo "   1. Выберите: GitHub.com"
echo "   2. Выберите: HTTPS"
echo "   3. Выберите: Login with a web browser"
echo "   4. Скопируйте код и откройте браузер"
echo "   5. Вставьте код на GitHub"
echo ""

gh auth login

echo ""
echo "⬆️  Отправляю изменения в GitHub..."
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
git push origin main

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ ГОТОВО! Проект отправлен на GitHub! 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Проверьте: https://github.com/romaparamzin/znak-lavki"



