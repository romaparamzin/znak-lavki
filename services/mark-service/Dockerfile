# Multi-stage build для Mark Service (QR код сервис)

# Стадия 1: Сборка приложения
FROM node:18-alpine AS builder

RUN npm install -g pnpm@8

WORKDIR /app

# Копирование конфигурации workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Копирование package.json файлов
COPY services/mark-service/package.json ./services/mark-service/
COPY packages/shared/types/package.json ./packages/shared/types/
COPY packages/shared/utils/package.json ./packages/shared/utils/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY services/mark-service ./services/mark-service
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

# Сборка shared пакетов
RUN pnpm --filter @znak-lavki/types build
RUN pnpm --filter @znak-lavki/utils build

# Сборка Mark Service
RUN pnpm --filter @znak-lavki/mark-service build

# Стадия 2: Production образ
FROM node:18-alpine AS production

# Установка необходимых системных пакетов
RUN apk add --no-cache dumb-init

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Копирование конфигурации
COPY --chown=nodejs:nodejs package.json pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs services/mark-service/package.json ./services/mark-service/

# Установка pnpm
RUN npm install -g pnpm@8

# Установка production зависимостей
RUN pnpm install --frozen-lockfile --prod

# Копирование собранного приложения
COPY --chown=nodejs:nodejs --from=builder /app/services/mark-service/dist ./services/mark-service/dist
COPY --chown=nodejs:nodejs --from=builder /app/packages/shared ./packages/shared

USER nodejs

# Healthcheck для Mark Service
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/mark-service/dist/main.js"]

