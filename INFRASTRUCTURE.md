# Инфраструктура Znak Lavki

Полное руководство по инфраструктуре проекта Znak Lavki.

## 📁 Структура инфраструктуры

```
znak-lavki/
├── docker/                      # Docker конфигурации
│   ├── nginx/                   # Nginx reverse proxy
│   └── postgres/                # PostgreSQL настройки
├── k8s/                         # Kubernetes манифесты
│   ├── namespace.yaml           # Namespace для изоляции
│   ├── configmap.yaml           # Конфигурационные данные
│   ├── secrets.yaml             # Секретные данные
│   ├── postgres-statefulset.yaml
│   ├── redis-statefulset.yaml
│   ├── minio-statefulset.yaml
│   ├── api-gateway-deployment.yaml
│   ├── mark-service-deployment.yaml
│   ├── integration-service-deployment.yaml
│   ├── notification-service-deployment.yaml
│   └── ingress.yaml             # Внешний доступ
├── terraform/                   # Terraform для Yandex Cloud
│   ├── main.tf                  # Основная конфигурация
│   ├── variables.tf             # Переменные
│   ├── outputs.tf               # Выходные значения
│   └── versions.tf              # Версии провайдеров
├── monitoring/                  # Мониторинг и алертинг
│   ├── prometheus/              # Prometheus конфигурация
│   ├── grafana/                 # Grafana дашборды
│   ├── alertmanager/            # Alertmanager правила
│   └── elk/                     # ELK Stack для логов
├── docker-compose.yml           # Базовая инфраструктура
├── docker-compose.dev.yml       # Development окружение
└── docker-compose.prod.yml      # Production окружение
```

## 🚀 Быстрый старт

### Локальная разработка

```bash
# 1. Запуск базовой инфраструктуры (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 2. Установка зависимостей
pnpm install

# 3. Запуск всех сервисов
pnpm run dev
```

### Development с мониторингом

```bash
# Запуск с Prometheus и Grafana
docker-compose -f docker-compose.dev.yml --profile monitoring up -d
```

### Production (Docker Compose)

```bash
# 1. Создайте .env файл
cp .env.example .env

# 2. Соберите образы
docker-compose -f docker-compose.prod.yml build

# 3. Запустите
docker-compose -f docker-compose.prod.yml up -d
```

### Production (Kubernetes)

```bash
# 1. Создайте namespace
kubectl apply -f k8s/namespace.yaml

# 2. Создайте secrets
kubectl apply -f k8s/secrets.yaml

# 3. Создайте configmap
kubectl apply -f k8s/configmap.yaml

# 4. Разверните инфраструктуру
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-statefulset.yaml
kubectl apply -f k8s/minio-statefulset.yaml

# 5. Разверните сервисы
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/mark-service-deployment.yaml
kubectl apply -f k8s/integration-service-deployment.yaml
kubectl apply -f k8s/notification-service-deployment.yaml

# 6. Настройте ingress
kubectl apply -f k8s/ingress.yaml
```

### Yandex Cloud (Terraform)

```bash
cd terraform

# 1. Инициализация
terraform init

# 2. Создайте terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Заполните своими значениями

# 3. План
terraform plan

# 4. Применение
terraform apply
```

## 🐳 Docker

### Dockerfiles

Все сервисы используют multi-stage builds для оптимизации размера образов:

- **Stage 1 (builder)**: Сборка приложения
- **Stage 2 (production)**: Минимальный runtime образ

#### Особенности:
- Alpine базовые образы для минимального размера
- Non-root пользователь для безопасности
- Health checks для проверки работоспособности
- dumb-init для корректной обработки сигналов

### Docker Compose

#### docker-compose.yml (базовый)
- PostgreSQL 15
- Redis 7
- MinIO
- pgAdmin (опционально)

#### docker-compose.dev.yml (разработка)
- Все из базового
- Redis Commander
- Prometheus (с профилем monitoring)
- Grafana (с профилем monitoring)

#### docker-compose.prod.yml (продакшен)
- Все сервисы приложения
- Nginx reverse proxy
- Resource limits
- Restart policies
- Logging configuration

## ☸️ Kubernetes

### Компоненты

#### StatefulSets
- **PostgreSQL**: С persistent volume, 3 реплики
- **Redis**: С persistent volume, конфигурация для HA
- **MinIO**: Object storage для QR кодов

#### Deployments
- **API Gateway**: 2-10 реплик с HPA
- **Mark Service**: 2-8 реплик с HPA
- **Integration Service**: 1-4 реплики с HPA
- **Notification Service**: 1-4 реплики с HPA
- **Admin Panel**: 2 реплики

#### Services
- ClusterIP для внутренних сервисов
- Headless services для StatefulSets

#### Ingress
- Nginx Ingress Controller
- TLS/SSL сертификаты (cert-manager)
- Rate limiting
- CORS configuration

#### HPA (Horizontal Pod Autoscaler)
- CPU based scaling (70%)
- Memory based scaling (80%)
- Плавное масштабирование

### ConfigMaps и Secrets

#### ConfigMap
- Не-секретные конфигурации
- Database hosts и ports
- Feature flags
- Service URLs

#### Secrets
- Пароли баз данных
- API keys
- JWT secrets
- SMTP credentials

## 🌩️ Yandex Cloud (Terraform)

### Создаваемые ресурсы

#### Сеть
- VPC с подсетями в 3 зонах доступности
- Security Groups для каждого сервиса

#### Managed Services
- **PostgreSQL Cluster**: High availability, auto backups
- **Redis Cluster**: High availability
- **Kubernetes Cluster**: Managed K8s с auto-upgrade
- **Object Storage**: S3-compatible для QR кодов

#### Load Balancer
- Network Load Balancer с health checks
- Распределение трафика между зонами

#### Service Accounts
- Отдельные SA для K8s и S3
- IAM роли с минимальными правами

### Стоимость

Примерная месячная стоимость:
- PostgreSQL (s2.micro): ~3,000₽
- Redis (hm1.nano): ~1,500₽
- Kubernetes (3 ноды): ~6,000₽
- Object Storage: ~50₽
- Load Balancer: ~500₽
- **Итого**: ~11,000₽/месяц

## 📊 Мониторинг

### Prometheus
- Сбор метрик с всех сервисов
- Retention: 15 дней
- Scrape interval: 30s (production)

### Grafana
- Дашборды для сервисов и инфраструктуры
- Автоматический provisioning datasources
- Предустановленные дашборды

### Alertmanager
- Email уведомления
- Поддержка Telegram/Slack
- Routing rules по severity
- Inhibit rules для уменьшения шума

### ELK Stack
- Elasticsearch: Хранение логов (30 дней)
- Logstash: Обработка и парсинг логов
- Kibana: Визуализация и поиск
- Filebeat: Сбор логов с контейнеров

## 🔒 Безопасность

### Network Security
- Security Groups в Yandex Cloud
- NetworkPolicies в Kubernetes
- Private subnets для баз данных

### Application Security
- Non-root containers
- Read-only root filesystem (где возможно)
- Security contexts в K8s
- Secrets encryption at rest

### TLS/SSL
- Let's Encrypt сертификаты через cert-manager
- TLS termination на Ingress
- Внутренний трафик через mTLS (опционально)

## 📈 Масштабирование

### Horizontal Scaling
- HPA для автоматического масштабирования подов
- Load Balancer для распределения трафика
- Managed services автоматически масштабируются

### Vertical Scaling
- Resource requests/limits в K8s
- Изменение resource_preset в Terraform

### Database Scaling
- Read replicas для PostgreSQL
- Redis Sentinel для HA
- Connection pooling (PgBouncer)

## 🔧 Обслуживание

### Бэкапы

#### Автоматические
- PostgreSQL: Ежедневные, 7 дней хранения
- Redis: Snapshot каждые 6 часов
- S3: Версионирование включено

#### Ручные
```bash
# PostgreSQL backup
kubectl exec -it postgres-0 -- pg_dump -U postgres znak_lavki > backup.sql

# MinIO backup
mc mirror minio/qr-codes /backup/qr-codes
```

### Обновления

#### Rolling Updates
- Zero-downtime deployments в K8s
- maxUnavailable: 0, maxSurge: 1

#### Database Updates
```bash
# Managed PostgreSQL обновляется автоматически
# В maintenance window (воскресенье 03:00-07:00)
```

### Мониторинг здоровья

```bash
# Проверка всех подов
kubectl get pods -n znak-lavki

# Проверка HPA
kubectl get hpa -n znak-lavki

# Проверка ingress
kubectl get ingress -n znak-lavki

# Логи сервиса
kubectl logs -f deployment/api-gateway -n znak-lavki
```

## 🐛 Troubleshooting

### Pod не запускается

```bash
# Описание пода
kubectl describe pod <pod-name> -n znak-lavki

# События
kubectl get events -n znak-lavki --sort-by='.lastTimestamp'

# Логи init containers
kubectl logs <pod-name> -c <init-container> -n znak-lavki
```

### База данных недоступна

```bash
# Проверка PostgreSQL статуса
kubectl exec -it postgres-0 -n znak-lavki -- pg_isready

# Проверка соединений
kubectl exec -it postgres-0 -n znak-lavki -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Высокая нагрузка

```bash
# Top pods по CPU
kubectl top pods -n znak-lavki --sort-by=cpu

# Top pods по памяти
kubectl top pods -n znak-lavki --sort-by=memory

# HPA статус
kubectl describe hpa <hpa-name> -n znak-lavki
```

## 📚 Дополнительные ресурсы

- [Docker Documentation](/docker/)
- [Kubernetes Manifests](/k8s/)
- [Terraform Configuration](/terraform/)
- [Monitoring Setup](/monitoring/)

## 🤝 Поддержка

Для вопросов по инфраструктуре:
- Создайте issue с меткой `infrastructure`
- Свяжитесь с DevOps командой

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025-01-10

