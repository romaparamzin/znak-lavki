# 🚀 Полное руководство по развертыванию Znak Lavki на Yandex Cloud

Пошаговая инструкция по подготовке и развертыванию проекта "Знак Лавки" на Yandex Cloud.

---

## 📋 Содержание

1. [Предварительная подготовка](#предварительная-подготовка)
2. [Настройка Yandex Cloud](#настройка-yandex-cloud)
3. [Развертывание инфраструктуры через Terraform](#развертывание-инфраструктуры-через-terraform)
4. [Настройка Kubernetes кластера](#настройка-kubernetes-кластера)
5. [Подготовка Docker образов](#подготовка-docker-образов)
6. [Деплой приложения](#деплой-приложения)
7. [Настройка домена и SSL](#настройка-домена-и-ssl)
8. [Мониторинг и логирование](#мониторинг-и-логирование)
9. [Бэкапы и disaster recovery](#бэкапы-и-disaster-recovery)
10. [Оптимизация затрат](#оптимизация-затрат)

---

## 💰 Стоимость инфраструктуры

### Минимальная конфигурация (MVP)
| Ресурс | Конфигурация | Цена/месяц |
|--------|--------------|------------|
| PostgreSQL | s2.micro (2 vCPU, 8GB RAM, 50GB SSD) | ~3,000₽ |
| Redis | hm1.nano (2GB RAM, 10GB SSD) | ~1,500₽ |
| Kubernetes | 3 ноды (2 vCPU, 4GB RAM каждая) | ~6,000₽ |
| Object Storage | ~20GB хранилище | ~50₽ |
| Load Balancer | Network LB | ~500₽ |
| **ИТОГО** | | **~11,000₽/месяц** |

### Производственная конфигурация
| Ресурс | Конфигурация | Цена/месяц |
|--------|--------------|------------|
| PostgreSQL | s2.small (4 vCPU, 16GB RAM, 100GB SSD) | ~6,000₽ |
| Redis | hm1.micro (4GB RAM, 20GB SSD) | ~3,000₽ |
| Kubernetes | 5 нод (4 vCPU, 8GB RAM каждая) | ~15,000₽ |
| Object Storage | ~100GB хранилище | ~250₽ |
| Load Balancer | Application LB + CDN | ~2,000₽ |
| **ИТОГО** | | **~26,250₽/месяц** |

---

## 🔧 Предварительная подготовка

### 1. Установите необходимые инструменты

#### Yandex Cloud CLI
```bash
# macOS
brew install yandex-cloud/tap/yc

# Linux
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Перезапустите терминал и проверьте установку
yc --version
```

#### Terraform
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Проверка
terraform --version
```

#### kubectl
```bash
# macOS
brew install kubernetes-cli

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Проверка
kubectl version --client
```

#### Docker
```bash
# Уже должен быть установлен, проверьте
docker --version
docker-compose --version
```

#### Helm (опционально, для мониторинга)
```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Проверка
helm version
```

---

## ☁️ Настройка Yandex Cloud

### 1. Создайте аккаунт

1. Перейдите на https://cloud.yandex.ru
2. Нажмите "Войти" или "Зарегистрироваться"
3. Войдите через Yandex ID
4. Активируйте пробный период (4,000₽ на 60 дней)

### 2. Создайте Cloud и Folder

```bash
# Инициализируйте CLI
yc init

# Следуйте инструкциям:
# 1. Получите OAuth токен (откроется браузер)
# 2. Выберите облако (или создайте новое)
# 3. Выберите каталог (или создайте новый)
# 4. Выберите зону доступности (ru-central1-a рекомендуется)
```

### 3. Получите необходимые ID

```bash
# Cloud ID
yc config list
# Запишите cloud-id

# Folder ID
yc config get folder-id
# Запишите folder-id

# OAuth токен
yc config get token
# Запишите token
```

### 4. Проверьте квоты

```bash
# Просмотр текущих квот
yc resource-manager quota list
```

**Минимальные требования для проекта:**
- ✅ CPU: 10+ vCPU
- ✅ RAM: 32+ GB
- ✅ SSD: 200+ GB
- ✅ HDD: опционально
- ✅ Managed PostgreSQL: 1 кластер
- ✅ Managed Redis: 1 кластер
- ✅ Managed Kubernetes: 1 кластер

Если квот недостаточно, создайте [заявку на увеличение](https://console.cloud.yandex.ru/quotas).

---

## 🏗️ Развертывание инфраструктуры через Terraform

### 1. Подготовка конфигурации

```bash
cd terraform/

# Создайте файл с переменными
cp terraform.tfvars.example terraform.tfvars

# Откройте файл для редактирования
nano terraform.tfvars
```

### 2. Заполните terraform.tfvars

```hcl
# Yandex Cloud credentials
yandex_cloud_id  = "b1g..." # Ваш cloud-id
yandex_folder_id = "b1g..." # Ваш folder-id
yandex_token     = "y0_..." # Ваш OAuth токен
yandex_zone      = "ru-central1-a"

# PostgreSQL
postgres_password = "YourStrongPasswordHere123!" # Придумайте сильный пароль
postgres_username = "postgres"
postgres_database_name = "znak_lavki"
postgres_resource_preset = "s2.micro" # MVP: s2.micro, Prod: s2.small
postgres_disk_size = 50 # GB

# Redis
redis_password = "AnotherStrongPasswordHere456!" # Придумайте сильный пароль
redis_resource_preset = "hm1.nano" # MVP: hm1.nano, Prod: hm1.micro
redis_disk_size = 10 # GB

# Kubernetes
k8s_version = "1.28"
k8s_node_count = 3 # MVP: 3, Prod: 5
k8s_node_cores = 2 # MVP: 2, Prod: 4
k8s_node_memory = 4 # GB, MVP: 4, Prod: 8
k8s_node_disk_size = 50 # GB

# S3
s3_bucket_name = "znak-lavki-qr-codes-prod" # Должно быть уникальным

# Общие настройки
environment = "production"
project = "znak-lavki"
```

### 3. Инициализация Terraform

```bash
# Инициализация
terraform init

# Вы увидите
# Terraform has been successfully initialized!
```

### 4. Проверка плана

```bash
# Создайте план развертывания
terraform plan

# Сохраните план в файл
terraform plan -out=tfplan

# Изучите план - он покажет все ресурсы, которые будут созданы
```

**Будут созданы:**
- ✅ VPC сеть и 3 подсети
- ✅ Security Groups (для PostgreSQL, Redis, Kubernetes)
- ✅ PostgreSQL кластер с 3 хостами (multi-AZ)
- ✅ Redis кластер с 3 хостами (multi-AZ)
- ✅ Kubernetes кластер + Node Group
- ✅ S3 bucket для QR кодов
- ✅ Network Load Balancer
- ✅ Service Accounts и IAM роли

### 5. Применение конфигурации

```bash
# ВНИМАНИЕ: После этого начнется списание средств!
terraform apply

# Или примените сохраненный план
terraform apply tfplan

# Подтвердите: yes

# Процесс займет 15-30 минут
```

### 6. Получите выходные данные

```bash
# Посмотрите все outputs
terraform output

# Вы получите:
# - postgres_host
# - redis_host  
# - k8s_cluster_id
# - k8s_cluster_endpoint
# - s3_bucket_name
# - s3_access_key
# - s3_secret_key
# - load_balancer_ip

# Сохраните эти данные - они понадобятся для настройки приложения
```

**Сохраните outputs в файл:**
```bash
terraform output -json > ../yandex-cloud-outputs.json
```

---

## ☸️ Настройка Kubernetes кластера

### 1. Подключение к кластеру

```bash
# Получите credentials для kubectl
yc managed-kubernetes cluster get-credentials znak-lavki-k8s --external

# Проверьте подключение
kubectl cluster-info
kubectl get nodes

# Вы должны увидеть 3 ноды в статусе Ready
```

### 2. Установка Ingress Controller

```bash
# Установите NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml

# Проверьте установку
kubectl get pods -n ingress-nginx

# Дождитесь, пока все поды будут Running
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Получите External IP ingress controller
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Запишите EXTERNAL-IP - это ваш IP для домена
```

### 3. Установка cert-manager (для SSL)

```bash
# Установите cert-manager для автоматических SSL сертификатов
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml

# Проверьте установку
kubectl get pods -n cert-manager

# Создайте ClusterIssuer для Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com # Замените на ваш email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 4. Создание namespace для приложения

```bash
# Создайте namespace
kubectl apply -f k8s/namespace.yaml

# Проверьте
kubectl get namespace znak-lavki
```

---

## 🔐 Настройка секретов

### 1. Создайте файл с секретами

```bash
cd k8s/

# Отредактируйте secrets.yaml
nano secrets.yaml
```

### 2. Заполните secrets.yaml

**ВАЖНО:** Используйте base64 encoded значения!

```bash
# Генерация JWT секретов
echo -n "your-jwt-secret-64-chars-long-string-here" | base64

# Кодирование паролей
echo -n "your-postgres-password" | base64
echo -n "your-redis-password" | base64
```

**secrets.yaml:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: znak-lavki-secrets
  namespace: znak-lavki
type: Opaque
data:
  # Database (base64 encoded)
  DB_USERNAME: cG9zdGdyZXM= # postgres
  DB_PASSWORD: <ваш_base64_пароль_postgres>
  
  # Redis (base64 encoded)
  REDIS_PASSWORD: <ваш_base64_пароль_redis>
  
  # JWT (base64 encoded)
  JWT_SECRET: <ваш_base64_jwt_secret>
  JWT_REFRESH_SECRET: <ваш_base64_jwt_refresh_secret>
  
  # S3 (base64 encoded) - из terraform output
  MINIO_ACCESS_KEY: <base64_s3_access_key>
  MINIO_SECRET_KEY: <base64_s3_secret_key>
  
  # SMTP (опционально, base64 encoded)
  SMTP_PASSWORD: <ваш_base64_smtp_password>
```

```bash
# Примените секреты
kubectl apply -f secrets.yaml

# Проверьте
kubectl get secrets -n znak-lavki
```

### 3. Создайте ConfigMap

```bash
# Отредактируйте configmap.yaml
nano configmap.yaml
```

**configmap.yaml:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: znak-lavki-config
  namespace: znak-lavki
data:
  # Database Configuration (из terraform output)
  DB_HOST: "c-<cluster-id>.rw.mdb.yandexcloud.net" # Ваш postgres_host
  DB_PORT: "6432"
  DB_NAME: "znak_lavki"
  DB_SSL: "true"
  
  # Redis Configuration (из terraform output)
  REDIS_HOST: "c-<cluster-id>.rw.mdb.yandexcloud.net" # Ваш redis_host
  REDIS_PORT: "6379"
  
  # MinIO/S3 Configuration
  MINIO_ENDPOINT: "storage.yandexcloud.net"
  MINIO_PORT: "443"
  MINIO_USE_SSL: "true"
  MINIO_BUCKET: "znak-lavki-qr-codes-prod"
  
  # Application Configuration
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  
  # CORS
  CORS_ORIGIN: "https://admin.znak-lavki.com,https://znak-lavki.com"
  
  # JWT
  JWT_EXPIRES_IN: "24h"
  
  # SMTP (опционально)
  SMTP_HOST: "smtp.yandex.ru"
  SMTP_PORT: "465"
  SMTP_USER: "noreply@znak-lavki.com"
  EMAIL_FROM: "Znak Lavki <noreply@znak-lavki.com>"
```

```bash
# Примените ConfigMap
kubectl apply -f configmap.yaml

# Проверьте
kubectl get configmap -n znak-lavki
```

---

## 🐳 Подготовка Docker образов

### Вариант 1: Yandex Container Registry (рекомендуется)

#### 1. Создайте Container Registry

```bash
# Создайте registry
yc container registry create --name znak-lavki-registry

# Получите ID registry
yc container registry list

# Настройте Docker для работы с registry
yc container registry configure-docker
```

#### 2. Соберите и запушите образы

```bash
cd /path/to/znak-lavki

# Получите ID registry
REGISTRY_ID=$(yc container registry list --format json | jq -r '.[0].id')

# Постройте образы для каждого сервиса
docker build -t cr.yandex/${REGISTRY_ID}/api-gateway:latest -f services/api-gateway/Dockerfile .
docker build -t cr.yandex/${REGISTRY_ID}/mark-service:latest -f services/mark-service/Dockerfile .
docker build -t cr.yandex/${REGISTRY_ID}/integration-service:latest -f services/integration-service/Dockerfile .
docker build -t cr.yandex/${REGISTRY_ID}/notification-service:latest -f services/notification-service/Dockerfile .
docker build -t cr.yandex/${REGISTRY_ID}/admin-panel:latest -f apps/admin-panel/Dockerfile .

# Запушите образы
docker push cr.yandex/${REGISTRY_ID}/api-gateway:latest
docker push cr.yandex/${REGISTRY_ID}/mark-service:latest
docker push cr.yandex/${REGISTRY_ID}/integration-service:latest
docker push cr.yandex/${REGISTRY_ID}/notification-service:latest
docker push cr.yandex/${REGISTRY_ID}/admin-panel:latest

# Проверьте образы в registry
yc container image list --registry-id=${REGISTRY_ID}
```

#### 3. Обновите манифесты Kubernetes

Замените в файлах `k8s/*-deployment.yaml` образы на свои:

```yaml
# Было:
image: znak-lavki/api-gateway:latest

# Стало:
image: cr.yandex/<YOUR_REGISTRY_ID>/api-gateway:latest
```

### Вариант 2: Docker Hub (публичный)

```bash
# Логин в Docker Hub
docker login

# Тегируйте образы
docker tag znak-lavki/api-gateway:latest yourusername/znak-lavki-api-gateway:latest
docker tag znak-lavki/mark-service:latest yourusername/znak-lavki-mark-service:latest
# ... и так далее

# Запушите
docker push yourusername/znak-lavki-api-gateway:latest
docker push yourusername/znak-lavki-mark-service:latest
# ... и так далее
```

---

## 🚀 Деплой приложения

### 1. Разверните StatefulSets (БД уже managed, но MinIO может понадобиться)

```bash
# Если вам нужен MinIO в кластере (альтернатива S3)
# Но рекомендуется использовать Yandex Object Storage

# kubectl apply -f k8s/minio-statefulset.yaml
```

### 2. Разверните сервисы приложения

```bash
cd k8s/

# API Gateway
kubectl apply -f api-gateway-deployment.yaml

# Mark Service
kubectl apply -f mark-service-deployment.yaml

# Integration Service
kubectl apply -f integration-service-deployment.yaml

# Notification Service
kubectl apply -f notification-service-deployment.yaml

# Проверьте деплоймент
kubectl get deployments -n znak-lavki
kubectl get pods -n znak-lavki

# Дождитесь, пока все поды будут Running
kubectl get pods -n znak-lavki -w
```

### 3. Проверьте логи

```bash
# Логи API Gateway
kubectl logs -f deployment/api-gateway -n znak-lavki

# Логи Mark Service
kubectl logs -f deployment/mark-service -n znak-lavki

# Если есть ошибки, проверьте
kubectl describe pod <pod-name> -n znak-lavki
```

### 4. Настройте Horizontal Pod Autoscaler

```bash
# Примените HPA для автомасштабирования
kubectl apply -f k8s/hpa-autoscaling.yaml

# Проверьте HPA
kubectl get hpa -n znak-lavki

# Вы должны увидеть метрики CPU/Memory
```

---

## 🌐 Настройка домена и SSL

### 1. Купите домен

Зарегистрируйте домен, например:
- **Reg.ru** (российский регистратор)
- **Timeweb** (российский регистратор)
- **Namecheap** (международный)

### 2. Настройте DNS записи

В панели управления доменом добавьте A-записи:

```
Type    Name      Value                        TTL
A       @         <EXTERNAL-IP-INGRESS>        3600
A       admin     <EXTERNAL-IP-INGRESS>        3600
A       api       <EXTERNAL-IP-INGRESS>        3600
CNAME   www       znak-lavki.com               3600
```

**Где взять EXTERNAL-IP-INGRESS:**
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
# Используйте EXTERNAL-IP из вывода
```

### 3. Настройте Ingress с SSL

Отредактируйте `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: znak-lavki-ingress
  namespace: znak-lavki
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - admin.znak-lavki.com
    - api.znak-lavki.com
    secretName: znak-lavki-tls
  rules:
  - host: admin.znak-lavki.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-panel
            port:
              number: 80
  - host: api.znak-lavki.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

```bash
# Примените Ingress
kubectl apply -f k8s/ingress.yaml

# Проверьте статус
kubectl get ingress -n znak-lavki

# Проверьте сертификаты (cert-manager автоматически получит SSL)
kubectl get certificate -n znak-lavki

# Статус должен быть Ready=True
```

### 4. Проверьте доступность

```bash
# Проверьте DNS
dig admin.znak-lavki.com
dig api.znak-lavki.com

# Проверьте HTTP -> HTTPS redirect
curl -I http://admin.znak-lavki.com

# Проверьте SSL
curl https://admin.znak-lavki.com
curl https://api.znak-lavki.com/api/health
```

---

## 📊 Мониторинг и логирование

### 1. Установите Prometheus и Grafana

```bash
# Добавьте Helm репозиторий
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Установите kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin

# Проверьте установку
kubectl get pods -n monitoring
```

### 2. Настройте доступ к Grafana

```bash
# Port-forward для доступа к Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Откройте браузер: http://localhost:3000
# Login: admin
# Password: admin (или тот, что указали при установке)
```

### 3. Импортируйте дашборды

В Grafana импортируйте дашборды:
- Kubernetes Cluster: ID 15760
- Node Exporter: ID 1860
- PostgreSQL: ID 9628

### 4. Настройте алерты

Используйте Alertmanager для уведомлений:

```bash
# Создайте AlertmanagerConfig
kubectl apply -f monitoring/alertmanager/alertmanager-config.yaml

# Проверьте алерты
kubectl get prometheusrules -n monitoring
```

### 5. Настройте логирование (ELK Stack - опционально)

```bash
# Установите ELK Stack
helm repo add elastic https://helm.elastic.co
helm repo update

# Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace

# Kibana
helm install kibana elastic/kibana --namespace logging

# Filebeat
helm install filebeat elastic/filebeat --namespace logging

# Доступ к Kibana
kubectl port-forward -n logging svc/kibana-kibana 5601
```

---

## 💾 Бэкапы и Disaster Recovery

### 1. Автоматические бэкапы Managed Services

**PostgreSQL:**
```bash
# Бэкапы уже настроены через Terraform
# По умолчанию: ежедневно в 3:00 AM, хранение 7 дней

# Просмотр бэкапов
yc managed-postgresql cluster list-backups --cluster-name znak-lavki-postgres

# Восстановление из бэкапа
yc managed-postgresql cluster restore \
  --backup-id=<backup-id> \
  --name=znak-lavki-postgres-restored \
  --network-name=znak-lavki-vpc
```

**Redis:**
```bash
# Бэкапы настроены автоматически
yc managed-redis cluster list-backups --cluster-name znak-lavki-redis
```

### 2. Ручные бэкапы PostgreSQL

```bash
# Создайте pod для бэкапа
kubectl run pg-backup --rm -i --tty \
  --image=postgres:15-alpine \
  --env="PGHOST=<postgres_host>" \
  --env="PGPORT=6432" \
  --env="PGUSER=postgres" \
  --env="PGPASSWORD=<your_password>" \
  -- pg_dump znak_lavki > backup_$(date +%Y%m%d).sql

# Или через managed-postgresql
yc managed-postgresql cluster backup znak-lavki-postgres
```

### 3. Бэкап Kubernetes конфигурации

```bash
# Установите Velero для бэкапов K8s
kubectl apply -f https://github.com/vmware-tanzu/velero/releases/download/v1.12.1/velero-v1.12.1-linux-amd64.tar.gz

# Создайте бэкап namespace
velero backup create znak-lavki-backup --include-namespaces znak-lavki

# Восстановление
velero restore create --from-backup znak-lavki-backup
```

### 4. Бэкап S3 данных

```bash
# Используйте s3cmd или aws-cli
aws s3 sync s3://znak-lavki-qr-codes-prod /backup/qr-codes --endpoint-url=https://storage.yandexcloud.net

# Или настройте репликацию в другой bucket
```

---

## 💡 Оптимизация затрат

### 1. Используйте Preemptible VM (до 70% экономии)

```hcl
# В terraform/main.tf
resource "yandex_kubernetes_node_group" "main" {
  # ...
  instance_template {
    scheduling_policy {
      preemptible = true # Включить preemptible ноды
    }
  }
}
```

**⚠️ Внимание:** Preemptible VM могут быть остановлены в любой момент (макс. 24 часа работы). Подходит для stateless сервисов.

### 2. Настройте автомасштабирование

```yaml
# HPA уже настроен в k8s/hpa-autoscaling.yaml
# Минимум 2 реплики, максимум 10
# Масштабирование по CPU > 70%
```

### 3. Оптимизируйте Storage

```bash
# Используйте lifecyle policies для S3
# Удаление старых версий QR кодов (уже настроено в Terraform)

# Очистка неиспользуемых Docker образов
yc container image list --registry-id=${REGISTRY_ID}
yc container image delete <image-id>
```

### 4. Используйте Reserved Capacity (до 20% экономии)

Если вы планируете использовать ресурсы долгосрочно:
1. Перейдите в [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Billing → Committed Use Discounts
3. Оформите commitment на 1 или 3 года

### 5. Мониторинг затрат

```bash
# Просмотр текущих затрат
yc billing accounts list
yc billing account get <account-id>

# Установите бюджеты и алерты в консоли
# Billing → Budgets → Create Budget
```

---

## 🔍 Troubleshooting

### Проблема: Pod не запускается

```bash
# Проверьте статус
kubectl describe pod <pod-name> -n znak-lavki

# Проверьте логи
kubectl logs <pod-name> -n znak-lavki

# Проверьте события
kubectl get events -n znak-lavki --sort-by='.lastTimestamp'

# Проверьте ресурсы
kubectl top pods -n znak-lavki
```

### Проблема: Не могу подключиться к PostgreSQL

```bash
# Проверьте, что хост правильный
yc managed-postgresql hosts list --cluster-name znak-lavki-postgres

# Проверьте Security Group
yc vpc security-group list

# Тест подключения из pod
kubectl run -it --rm pg-test --image=postgres:15-alpine --restart=Never -- \
  psql "host=<postgres_host> port=6432 dbname=znak_lavki user=postgres sslmode=verify-full"
```

### Проблема: SSL сертификат не выдается

```bash
# Проверьте cert-manager
kubectl logs -n cert-manager deployment/cert-manager

# Проверьте Certificate
kubectl describe certificate znak-lavki-tls -n znak-lavki

# Проверьте Challenge
kubectl get challenges -n znak-lavki

# Проверьте, что домен доступен
curl -I http://admin.znak-lavki.com/.well-known/acme-challenge/test
```

### Проблема: Высокая нагрузка на базу

```bash
# Проверьте активные запросы
yc managed-postgresql cluster list-ops --cluster-name znak-lavki-postgres

# Увеличьте ресурсы PostgreSQL
# Отредактируйте terraform/terraform.tfvars
postgres_resource_preset = "s2.small" # было s2.micro

terraform apply
```

---

## 📋 Чеклист развертывания

### Перед развертыванием
- [ ] Аккаунт Yandex Cloud создан и верифицирован
- [ ] Пробный период активирован (4,000₽)
- [ ] Yandex CLI установлен и настроен
- [ ] Terraform установлен
- [ ] kubectl установлен
- [ ] Docker установлен
- [ ] Квоты проверены и увеличены при необходимости

### Terraform
- [ ] `terraform.tfvars` создан и заполнен
- [ ] Сильные пароли сгенерированы
- [ ] `terraform init` выполнен успешно
- [ ] `terraform plan` проверен
- [ ] `terraform apply` выполнен успешно
- [ ] Outputs сохранены

### Kubernetes
- [ ] kubectl подключен к кластеру
- [ ] Ingress Controller установлен
- [ ] cert-manager установлен
- [ ] Namespace создан
- [ ] Secrets созданы и применены
- [ ] ConfigMap создан и применен

### Docker образы
- [ ] Container Registry создан
- [ ] Образы собраны
- [ ] Образы запушены в registry
- [ ] Манифесты обновлены с правильными образами

### Деплой приложения
- [ ] Deployments применены
- [ ] Все поды в статусе Running
- [ ] Services созданы
- [ ] HPA настроен
- [ ] Логи проверены на ошибки

### Домен и SSL
- [ ] Домен куплен
- [ ] DNS записи настроены
- [ ] DNS propagation завершен (24-48 часов)
- [ ] Ingress применен
- [ ] SSL сертификаты выданы
- [ ] HTTPS работает

### Мониторинг
- [ ] Prometheus установлен
- [ ] Grafana настроена
- [ ] Дашборды импортированы
- [ ] Алерты настроены
- [ ] Логирование работает

### Безопасность
- [ ] Security Groups настроены
- [ ] Файрвол правила применены
- [ ] Secrets не закоммичены в Git
- [ ] CORS настроен правильно
- [ ] Rate limiting включен

### Бэкапы
- [ ] Автоматические бэкапы PostgreSQL включены
- [ ] Автоматические бэкапы Redis включены
- [ ] S3 версионирование включено
- [ ] Ручной бэкап протестирован
- [ ] Процедура восстановления задокументирована

### Финальная проверка
- [ ] Админ-панель доступна
- [ ] API отвечает
- [ ] Можно создать марку
- [ ] QR-коды генерируются
- [ ] Email уведомления работают
- [ ] Мобильное приложение подключается

---

## 📚 Полезные команды

### Yandex Cloud
```bash
# Список всех ресурсов
yc resource-manager folder list-resources

# Статус кластеров
yc managed-postgresql cluster list
yc managed-redis cluster list
yc managed-kubernetes cluster list

# Мониторинг затрат
yc billing accounts list
```

### Kubernetes
```bash
# Быстрый просмотр
kubectl get all -n znak-lavki

# Логи всех подов
kubectl logs -l app=api-gateway -n znak-lavki --tail=100

# Выполнить команду в поде
kubectl exec -it <pod-name> -n znak-lavki -- /bin/sh

# Проброс портов
kubectl port-forward svc/api-gateway 3000:3000 -n znak-lavki
```

### Terraform
```bash
# Обновление ресурсов
terraform apply -target=yandex_kubernetes_node_group.main

# Импорт существующего ресурса
terraform import yandex_vpc_network.main <network-id>

# Просмотр state
terraform state list
terraform state show yandex_kubernetes_cluster.main
```

---

## 🆘 Поддержка

### Документация
- [Yandex Cloud Docs](https://cloud.yandex.ru/docs)
- [Yandex Managed PostgreSQL](https://cloud.yandex.ru/docs/managed-postgresql/)
- [Yandex Managed Kubernetes](https://cloud.yandex.ru/docs/managed-kubernetes/)
- [Terraform Yandex Provider](https://registry.terraform.io/providers/yandex-cloud/yandex/latest/docs)

### Комьюнити
- [Yandex Cloud Community](https://t.me/yandexcloud)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/yandex-cloud)

### Техподдержка
- Консоль: https://console.cloud.yandex.ru → Support
- Email: cloud@support.yandex.ru
- Telegram: @YandexCloudSupport

---

## ✅ Готово!

После выполнения всех шагов ваше приложение будет:
- ✅ Развернуто на Yandex Cloud
- ✅ Доступно по HTTPS с автоматическими SSL сертификатами
- ✅ Отказоустойчиво (multi-AZ, автомасштабирование)
- ✅ Мониторится (Prometheus + Grafana)
- ✅ Защищено (Security Groups, CORS, Rate Limiting)
- ✅ С автоматическими бэкапами

**Следующие шаги:**
1. Настройте CI/CD для автоматического деплоя
2. Оптимизируйте производительность
3. Настройте алерты в Telegram/Slack
4. Проведите нагрузочное тестирование
5. Запустите в продакшн! 🚀

---

_Документ создан: 14 октября 2025_  
_Версия: 1.0.0_  
_Автор: Znak Lavki Team_

