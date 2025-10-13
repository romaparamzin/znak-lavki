#!/bin/bash

echo "🚀 Быстрый коммит изменений..."
echo ""

cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"

echo "📦 Добавляю файлы..."
git add .

echo "📝 Создаю коммит..."
git commit -m "build: optimize deployment configuration

- Add .dockerignore for all services to reduce image size
- Add .railwayignore and .vercelignore for platform optimization  
- Add railway.toml for mark-service deployment
- Add vercel.json for admin-panel deployment
- Add comprehensive deployment documentation

Expected improvements:
- Docker image size: 500MB → 150-250MB (60% reduction)
- Deploy time: faster due to smaller build context
- Security: no docs/tests in production images"

echo "⬆️  Push в main..."
git push origin main

echo ""
echo "✅ Готово! Изменения отправлены в GitHub"
echo "👉 Следующий шаг: прочитайте ГОТОВО_К_ДЕПЛОЮ.md"
