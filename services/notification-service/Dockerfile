# Multi-stage build для Notification Service

# Стадия 1: Сборка
FROM node:18-alpine AS builder

RUN npm install -g pnpm@8

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY services/notification-service/package.json ./services/notification-service/
COPY packages/shared/types/package.json ./packages/shared/types/
COPY packages/shared/utils/package.json ./packages/shared/utils/

RUN pnpm install --frozen-lockfile

COPY services/notification-service ./services/notification-service
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

RUN pnpm --filter @znak-lavki/types build
RUN pnpm --filter @znak-lavki/utils build
RUN pnpm --filter @znak-lavki/notification-service build

# Стадия 2: Production
FROM node:18-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --chown=nodejs:nodejs package.json pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs services/notification-service/package.json ./services/notification-service/

RUN npm install -g pnpm@8
RUN pnpm install --frozen-lockfile --prod

COPY --chown=nodejs:nodejs --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --chown=nodejs:nodejs --from=builder /app/packages/shared ./packages/shared

USER nodejs

# Healthcheck для Notification Service
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3003

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "services/notification-service/dist/main.js"]

