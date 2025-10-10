# Multi-stage build для Admin Panel (React + Vite)

# Стадия 1: Сборка приложения
FROM node:18-alpine AS builder

RUN npm install -g pnpm@8

WORKDIR /app

# Копирование конфигурации workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/admin-panel/package.json ./apps/admin-panel/
COPY packages/shared/types/package.json ./packages/shared/types/
COPY packages/shared/utils/package.json ./packages/shared/utils/
COPY packages/shared/ui/package.json ./packages/shared/ui/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY apps/admin-panel ./apps/admin-panel
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

# Сборка shared пакетов
RUN pnpm --filter @znak-lavki/types build
RUN pnpm --filter @znak-lavki/utils build
RUN pnpm --filter @znak-lavki/ui build

# Сборка Admin Panel
# ARG используется для передачи API URL во время сборки
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @znak-lavki/admin-panel build

# Стадия 2: Production образ с nginx
FROM nginx:alpine AS production

# Копирование собранного приложения
COPY --from=builder /app/apps/admin-panel/dist /usr/share/nginx/html

# Копирование кастомной конфигурации nginx
COPY apps/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf

# Создание непривилегированного пользователя
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Healthcheck для nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

