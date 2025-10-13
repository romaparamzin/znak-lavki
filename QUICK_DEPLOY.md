# ⚡ Быстрый деплой за 10 минут

Самый простой способ разместить проект "Знак Лавки" онлайн.

---

## 🚀 Вариант 1: Railway.app (Рекомендуется)

### Почему Railway?
- ✅ Бесплатный план для старта
- ✅ Автоматический SSL
- ✅ Деплой за 5 минут
- ✅ База данных включена
- ✅ Не нужен VPS

### Шаг 1: Регистрация (2 минуты)
1. Откройте https://railway.app
2. Нажмите **"Start a New Project"**
3. Войдите через **GitHub**

### Шаг 2: Создайте проект (3 минуты)
1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Выберите репозиторий `znak-lavki`
4. Railway автоматически определит Docker конфигурацию

### Шаг 3: Добавьте базы данных (2 минуты)
1. В проекте нажмите **"+ New"**
2. Выберите **"Database" → "PostgreSQL"**
3. Повторите для **"Redis"**

Railway автоматически создаст переменные окружения:
- `DATABASE_URL`
- `REDIS_URL`

### Шаг 4: Настройте переменные окружения (3 минуты)

Нажмите на сервис → **"Variables"** → добавьте:

```
NODE_ENV=production
JWT_SECRET=ваш_секретный_ключ_64_символа
CORS_ORIGIN=*
```

**Генерация JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Шаг 5: Готово! ✅

Railway выдаст вам URL:
- **Admin Panel:** `https://your-app.up.railway.app`
- **API:** `https://your-api.up.railway.app`

**Стоимость:** $0-5/месяц (бесплатно для небольших нагрузок)

---

## 🌐 Вариант 2: Vercel (Frontend) + Railway (Backend)

### Frontend на Vercel (Бесплатно)

#### Шаг 1: Деплой Admin Panel
1. Откройте https://vercel.com
2. Войдите через GitHub
3. **"New Project"** → выберите `znak-lavki`
4. Настройте:
   - **Root Directory:** `apps/admin-panel`
   - **Framework Preset:** Vite

#### Шаг 2: Переменные окружения
```
VITE_API_BASE_URL=https://your-api.up.railway.app
VITE_WS_URL=wss://your-api.up.railway.app
```

#### Шаг 3: Deploy
Vercel автоматически соберет и выдаст URL:
- `https://znak-lavki.vercel.app`

### Backend на Railway (см. Вариант 1)

**Итого:**
- Frontend: Бесплатно (Vercel)
- Backend: $5/месяц (Railway)

---

## 🏢 Вариант 3: VPS (Для продакшена)

### Выберите хостинг:
- **Hetzner:** €4/месяц (Европа)
- **DigitalOcean:** $6/месяц (США)
- **Timeweb:** 300₽/месяц (Россия)

### Быстрая установка:

```bash
# 1. Подключитесь к серверу
ssh root@your_server_ip

# 2. Установите Docker
curl -fsSL https://get.docker.com | sh

# 3. Клонируйте проект
git clone https://github.com/romaparamzin/znak-lavki.git
cd znak-lavki

# 4. Создайте .env
nano .env.production
# Вставьте настройки (см. ниже)

# 5. Запустите
docker-compose -f docker-compose.prod.yml up -d

# 6. Установите SSL (опционально)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

### Минимальный .env.production:
```env
NODE_ENV=production
DB_HOST=postgres
DB_PASSWORD=strong_password_here
REDIS_PASSWORD=redis_password_here
JWT_SECRET=64_char_secret_here
CORS_ORIGIN=*
```

**Ваш сайт будет доступен:**
- `http://your_server_ip` (Admin Panel)
- `http://your_server_ip:3000/api` (API)

---

## 📱 Как сделать красивый URL?

### 1. Купите домен (~$10/год)
- **Namecheap:** https://namecheap.com
- **Reg.ru:** https://reg.ru (Россия)

### 2. Настройте DNS

В панели домена добавьте **A-запись**:

```
Type: A
Name: @
Value: ваш_server_ip (или Railway URL)
TTL: 3600
```

Для поддоменов:
```
admin.znak-lavki.com  →  ваш_server_ip
api.znak-lavki.com    →  ваш_server_ip
```

### 3. Подождите 24 часа
DNS распространяется по всему миру.

### 4. Готово!
Теперь доступно по адресу:
- **https://znak-lavki.com**

---

## 🔒 Базовая безопасность

### 1. SSL сертификат (бесплатно)

**На Railway/Vercel:** автоматически включен ✅

**На VPS:**
```bash
certbot --nginx -d your-domain.com
```

### 2. Сильные пароли

**Генерация:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Database password
openssl rand -base64 32
```

### 3. Файрвол (VPS)

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## ✅ Чеклист перед деплоем

- [ ] Создал аккаунт на хостинге
- [ ] Настроил `.env.production` с сильными паролями
- [ ] Задеплоил проект
- [ ] Проверил что сайт открывается
- [ ] (Опционально) Купил домен
- [ ] (Опционально) Настроил SSL

---

## 🆘 Если что-то не работает

### Проблема: Не открывается сайт
1. Проверьте логи: `railway logs` или `docker-compose logs`
2. Проверьте переменные окружения
3. Подождите 5-10 минут (первый деплой может быть долгим)

### Проблема: 502 Bad Gateway
- Backend еще запускается, подождите 2-3 минуты
- Проверьте что все сервисы запущены

### Проблема: Ошибка подключения к БД
- Проверьте `DATABASE_URL` в переменных окружения
- На Railway она создается автоматически

---

## 💰 Стоимость

| Вариант | Цена | Для кого |
|---------|------|----------|
| Railway (Free) | **$0** | Тестирование, MVP |
| Railway (Hobby) | **$5/мес** | Небольшие проекты |
| Vercel + Railway | **$5/мес** | Рекомендуется |
| VPS (Hetzner) | **€4/мес** | Продакшен |
| DigitalOcean | **$12/мес** | Продакшен с поддержкой |

**+ Домен:** ~$10/год

---

## 📚 Подробная документация

Полное руководство смотрите в [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

---

**Готово! Ваш проект онлайн за 10 минут! 🚀**

**Следующие шаги:**
1. Откройте ваш сайт
2. Войдите через "🔧 Режим разработки"
3. Протестируйте функционал
4. Настройте OAuth для продакшена (опционально)

