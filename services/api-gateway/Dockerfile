# Multi-stage build для API Gateway
# Этот подход уменьшает размер финального образа и повышает безопасность

# Стадия 1: Сборка приложения
FROM node:18-alpine AS builder

# Установка pnpm
RUN npm install -g pnpm@8

# Рабочая директория
WORKDIR /app

# Копирование файлов конфигурации workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./

# Копирование всех package.json из workspace
COPY services/api-gateway/package.json ./services/api-gateway/
COPY packages/shared/types/package.json ./packages/shared/types/
COPY packages/shared/utils/package.json ./packages/shared/utils/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY services/api-gateway ./services/api-gateway
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

# Сборка shared пакетов
RUN pnpm --filter @znak-lavki/types build
RUN pnpm --filter @znak-lavki/utils build

# Сборка API Gateway
RUN pnpm --filter @znak-lavki/api-gateway build

# Стадия 2: Production образ
FROM node:18-alpine AS production

# Добавление dumb-init для корректной обработки сигналов
RUN apk add --no-cache dumb-init

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Рабочая директория
WORKDIR /app

# Копирование package.json и установка только production зависимостей
COPY --chown=nodejs:nodejs package.json pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs services/api-gateway/package.json ./services/api-gateway/

# Установка pnpm
RUN npm install -g pnpm@8

# Установка только production зависимостей
RUN pnpm install --frozen-lockfile --prod

# Копирование собранного приложения из builder
COPY --chown=nodejs:nodejs --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --chown=nodejs:nodejs --from=builder /app/packages/shared ./packages/shared

# Переключение на непривилегированного пользователя
USER nodejs

# Healthcheck для проверки работоспособности
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose порт
EXPOSE 3000

# Использование dumb-init для корректной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Запуск приложения
CMD ["node", "services/api-gateway/dist/main.js"]

