# 🚀 Руководство по развертыванию проекта "Знак Лавки"

Полное руководство по безопасному размещению проекта на хостинге с публичным доступом.

---

## 📋 Содержание

1. [Выбор хостинга](#выбор-хостинга)
2. [Подготовка к деплою](#подготовка-к-деплою)
3. [Безопасность](#безопасность)
4. [Деплой на разные платформы](#деплой-на-разные-платформы)
5. [Настройка домена и SSL](#настройка-домена-и-ssl)
6. [Мониторинг и обслуживание](#мониторинг-и-обслуживание)

---

## 🌐 Выбор хостинга

### Рекомендуемые платформы:

#### 1. **DigitalOcean / Linode / Hetzner** (VPS)
**✅ Рекомендуется для продакшена**

**Преимущества:**
- Полный контроль над сервером
- Гибкая настройка
- Хорошее соотношение цена/качество
- Поддержка Docker

**Цена:** ~$5-20/месяц

**Подходит для:** Полноценный продакшен с высокими нагрузками

---

#### 2. **Vercel / Netlify** (Frontend)
**Frontend (Admin Panel) only**

**Преимущества:**
- Бесплатный план
- Автоматический деплой из GitHub
- CDN по всему миру
- SSL из коробки

**Цена:** Бесплатно для небольших проектов

**Подходит для:** Frontend часть (Admin Panel)

---

#### 3. **Railway.app / Render.com** (Full-stack)
**✅ Самый простой вариант для начала**

**Преимущества:**
- Простой деплой
- Автоматический SSL
- База данных включена
- Docker support
- Бесплатный план (с ограничениями)

**Цена:** $0-25/месяц

**Подходит для:** Быстрый старт, MVP, тестирование

---

#### 4. **AWS / Google Cloud / Azure** (Enterprise)
**Для крупных проектов**

**Преимущества:**
- Масштабируемость
- Много сервисов
- Высокая надежность

**Цена:** От $50/месяц

**Подходит для:** Корпоративные решения

---

## 🛠️ Подготовка к деплою

### 1. Создайте production конфигурацию

#### `.env.production` (для backend):
```env
# Node Environment
NODE_ENV=production

# API URLs
API_GATEWAY_PORT=3000
MARK_SERVICE_PORT=3001
INTEGRATION_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003

# Database (используйте production БД)
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_USERNAME=postgres_user
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=znak_lavki_prod
DB_SSL=true

# Redis
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_PASSWORD_HERE

# MinIO / S3
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=YOUR_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_SECRET_KEY
MINIO_BUCKET=znak-lavki-prod

# JWT
JWT_SECRET=GENERATE_STRONG_SECRET_HERE_64_CHARS
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=ANOTHER_STRONG_SECRET_HERE

# CORS (ваш домен)
CORS_ORIGIN=https://admin.znak-lavki.com,https://znak-lavki.com

# OAuth (Yandex)
YANDEX_CLIENT_ID=your_production_client_id
YANDEX_CLIENT_SECRET=your_production_client_secret
YANDEX_REDIRECT_URI=https://admin.znak-lavki.com/auth/callback

# Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

#### `.env.production` (для frontend):
```env
# API Configuration
VITE_API_BASE_URL=https://api.znak-lavki.com
VITE_WS_URL=wss://api.znak-lavki.com

# OAuth
VITE_YANDEX_CLIENT_ID=your_production_client_id
VITE_YANDEX_REDIRECT_URI=https://admin.znak-lavki.com/auth/callback
```

---

### 2. Создайте production Docker Compose

`docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot-data:/var/www/certbot:ro
    depends_on:
      - api-gateway
      - admin-panel
    restart: always

  # API Gateway
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Mark Service
  mark-service:
    build:
      context: ./services/mark-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always

  # Integration Service
  integration-service:
    build:
      context: ./services/integration-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always

  # Notification Service
  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: always

  # Admin Panel (statically built)
  admin-panel:
    build:
      context: ./apps/admin-panel
      dockerfile: Dockerfile.prod
    restart: always

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: znak_lavki_prod
      POSTGRES_USER: postgres_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  # Certbot for SSL
  certbot:
    image: certbot/certbot
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - certbot-data:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_data:
  redis_data:
  certbot-data:
```

---

### 3. Создайте Nginx конфигурацию

`nginx/nginx.prod.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=1r/s;

    # Admin Panel
    server {
        listen 80;
        server_name admin.znak-lavki.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name admin.znak-lavki.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/live/admin.znak-lavki.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/admin.znak-lavki.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://admin-panel:80;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API Gateway
    server {
        listen 80;
        server_name api.znak-lavki.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.znak-lavki.com;

        ssl_certificate /etc/nginx/ssl/live/api.znak-lavki.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/api.znak-lavki.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # API routes
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://api-gateway:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth {
            limit_req zone=login_limit burst=5 nodelay;
            
            proxy_pass http://api-gateway:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Health check endpoint (no SSL required)
    server {
        listen 80;
        server_name health.znak-lavki.com;

        location /health {
            proxy_pass http://api-gateway:3000/health;
        }
    }
}
```

---

## 🔒 Безопасность

### 1. Обязательные меры безопасности:

#### ✅ SSL/TLS Сертификаты
```bash
# Установка Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d admin.znak-lavki.com -d api.znak-lavki.com
```

#### ✅ Сильные пароли
```bash
# Генерация секретов для JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Генерация паролей для БД
openssl rand -base64 32
```

#### ✅ Файрвол (UFW)
```bash
# Настройка файрвола
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

#### ✅ Fail2Ban (защита от брутфорса)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### ✅ Переменные окружения
**НИКОГДА не коммитьте `.env` файлы в Git!**

Добавьте в `.gitignore`:
```
.env
.env.production
.env.local
*.pem
*.key
```

#### ✅ Ограничение CORS
```typescript
// В API Gateway
app.enableCors({
  origin: [
    'https://admin.znak-lavki.com',
    'https://znak-lavki.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

#### ✅ Rate Limiting (уже в Nginx выше)

#### ✅ Security Headers (уже в Nginx выше)

---

## 🚀 Деплой на Railway.app (Самый простой вариант)

### Шаг 1: Регистрация
1. Зайдите на https://railway.app
2. Зарегистрируйтесь через GitHub
3. Подтвердите email

### Шаг 2: Создайте проект
```bash
# Установите Railway CLI
npm i -g @railway/cli

# Войдите
railway login

# Создайте проект
railway init
```

### Шаг 3: Добавьте сервисы

**PostgreSQL:**
```bash
railway add --plugin postgresql
```

**Redis:**
```bash
railway add --plugin redis
```

### Шаг 4: Настройте переменные окружения
```bash
# Через веб-интерфейс или CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_secret_here
# ... и так далее
```

### Шаг 5: Деплой
```bash
# Push в Railway
railway up
```

Railway автоматически:
- Соберет Docker образы
- Настроит SSL
- Выдаст публичные URL

**Результат:**
- `https://your-app-name.up.railway.app`

---

## 🚀 Деплой на VPS (DigitalOcean)

### Шаг 1: Создайте Droplet
1. Зайдите на https://digitalocean.com
2. Create → Droplets
3. Выберите Ubuntu 22.04 LTS
4. Выберите размер ($10-20/месяц)
5. Добавьте SSH ключ

### Шаг 2: Подключитесь к серверу
```bash
ssh root@your_server_ip
```

### Шаг 3: Установите зависимости
```bash
# Обновите систему
apt update && apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
apt install docker-compose -y

# Установите Nginx
apt install nginx -y

# Установите Certbot
apt install certbot python3-certbot-nginx -y
```

### Шаг 4: Клонируйте проект
```bash
# Установите Git
apt install git -y

# Клонируйте репозиторий
git clone https://github.com/romaparamzin/znak-lavki.git
cd znak-lavki
```

### Шаг 5: Настройте .env файлы
```bash
# Создайте .env.production
nano .env.production
# Вставьте ваши production настройки
```

### Шаг 6: Запустите проект
```bash
# Соберите и запустите
docker-compose -f docker-compose.prod.yml up -d --build

# Проверьте статус
docker-compose -f docker-compose.prod.yml ps
```

### Шаг 7: Настройте SSL
```bash
# Получите сертификат
certbot --nginx -d admin.znak-lavki.com -d api.znak-lavki.com

# Автоматическое обновление
certbot renew --dry-run
```

---

## 🌍 Настройка домена и DNS

### 1. Купите домен
- **Reg.ru** (Россия)
- **Namecheap** (международный)
- **Cloudflare** (+ CDN бесплатно)

### 2. Настройте DNS записи

В панели управления доменом добавьте:

```
Type    Name      Value                    TTL
A       @         your_server_ip           3600
A       admin     your_server_ip           3600
A       api       your_server_ip           3600
CNAME   www       znak-lavki.com           3600
```

**Пример для admin.znak-lavki.com:**
```
A       admin     123.456.789.0
```

### 3. Проверьте DNS
```bash
# Проверка DNS
dig admin.znak-lavki.com

# Проверка propagation
https://www.whatsmydns.net/
```

Ожидайте 24-48 часов для полного распространения DNS.

---

## 📊 Мониторинг и обслуживание

### 1. Настройте мониторинг

#### Sentry (ошибки):
```bash
npm install @sentry/node

# В main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production'
});
```

#### Uptime Robot (доступность):
1. Зайдите на https://uptimerobot.com
2. Add New Monitor
3. URL: https://api.znak-lavki.com/health
4. Получайте уведомления при downtime

#### Grafana + Prometheus (метрики):
Уже настроено в `monitoring/` директории проекта.

### 2. Логирование

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f docker-compose.prod.yml logs -f api-gateway

# Последние 100 строк
docker-compose -f docker-compose.prod.yml logs --tail=100 mark-service
```

### 3. Бэкапы

#### Автоматический бэкап PostgreSQL:
```bash
# Создайте скрипт backup.sh
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec znak-lavki-postgres pg_dump -U postgres_user znak_lavki_prod > \
  $BACKUP_DIR/backup_$DATE.sql

# Удалить старые бэкапы (>30 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

```bash
# Добавьте в crontab
crontab -e

# Ежедневно в 3:00 AM
0 3 * * * /root/backup.sh
```

### 4. Обновления

```bash
# На сервере
cd /path/to/znak-lavki

# Pull последние изменения
git pull origin main

# Пересоберите и перезапустите
docker-compose -f docker-compose.prod.yml up -d --build

# Проверьте что все работает
docker-compose -f docker-compose.prod.yml ps
```

---

## 📋 Чеклист перед деплоем

- [ ] **.env.production создан** с сильными паролями
- [ ] **SSL сертификаты** настроены
- [ ] **CORS** настроен на production домены
- [ ] **Rate limiting** включен
- [ ] **Security headers** добавлены
- [ ] **Файрвол** настроен
- [ ] **Fail2Ban** установлен
- [ ] **Мониторинг** настроен (Sentry, UptimeRobot)
- [ ] **Бэкапы** автоматизированы
- [ ] **DNS** записи настроены
- [ ] **Логирование** работает
- [ ] **Health checks** настроены
- [ ] **OAuth credentials** обновлены для production
- [ ] **Тестирование** на production окружении
- [ ] **Документация** обновлена

---

## 🆘 Troubleshooting

### Проблема: Сервис не запускается
```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs service_name

# Проверьте переменные окружения
docker-compose -f docker-compose.prod.yml config

# Пересоберите
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Проблема: 502 Bad Gateway
```bash
# Проверьте что backend запущен
docker-compose -f docker-compose.prod.yml ps

# Проверьте Nginx
nginx -t
systemctl status nginx

# Перезапустите Nginx
systemctl restart nginx
```

### Проблема: SSL не работает
```bash
# Проверьте сертификаты
certbot certificates

# Обновите сертификаты
certbot renew --force-renewal
```

---

## 💰 Примерная стоимость хостинга

| Вариант | Месяц | Год | Особенности |
|---------|-------|-----|-------------|
| **Railway (Hobby)** | $5 | $60 | Идеально для старта |
| **DigitalOcean Droplet** | $12 | $144 | Полный контроль |
| **Railway (Pro)** | $20 | $240 | + База данных |
| **AWS/GCP** | $50+ | $600+ | Enterprise |

**+ Домен:** ~$10-20/год

---

## 📚 Полезные ссылки

- [Railway Documentation](https://docs.railway.app/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose](https://docs.docker.com/compose/)

---

**Готово! Теперь ваш проект готов к безопасному размещению на хостинге! 🚀**

