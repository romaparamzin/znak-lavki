# Terraform конфигурация для Znak Lavki в Yandex Cloud

Эта директория содержит Terraform конфигурацию для развертывания инфраструктуры проекта Znak Lavki в Yandex Cloud.

## Компоненты инфраструктуры

- **VPC и сети**: Виртуальная сеть с подсетями в трех зонах доступности
- **Managed PostgreSQL**: Высокодоступный PostgreSQL кластер
- **Managed Redis**: Redis кластер для кеширования
- **Managed Kubernetes**: Kubernetes кластер с автоматическим масштабированием
- **Object Storage (S3)**: S3-совместимое хранилище для QR кодов
- **Network Load Balancer**: Балансировщик нагрузки

## Предварительные требования

1. Установите [Terraform](https://www.terraform.io/downloads.html) >= 1.5.0
2. Установите [Yandex Cloud CLI](https://cloud.yandex.ru/docs/cli/quickstart)
3. Создайте [OAuth токен](https://cloud.yandex.ru/docs/iam/operations/iam-token/create)

## Быстрый старт

### 1. Инициализация

```bash
# Скопируйте example файл
cp terraform.tfvars.example terraform.tfvars

# Отредактируйте terraform.tfvars со своими значениями
vim terraform.tfvars

# Инициализируйте Terraform
terraform init
```

### 2. Планирование

```bash
# Просмотрите план изменений
terraform plan

# Сохраните план в файл
terraform plan -out=tfplan
```

### 3. Применение

```bash
# Примените изменения
terraform apply

# Или примените сохраненный план
terraform apply tfplan
```

### 4. Получение выходных данных

```bash
# Просмотреть все outputs
terraform output

# Получить конкретное значение
terraform output postgres_host
terraform output k8s_cluster_endpoint
```

## Структура файлов

```
terraform/
├── main.tf                    # Основная конфигурация ресурсов
├── variables.tf               # Определение переменных
├── outputs.tf                 # Выходные значения
├── versions.tf                # Версии провайдеров и backend
├── terraform.tfvars.example   # Пример файла с переменными
└── README.md                  # Эта документация
```

## Основные переменные

### Обязательные переменные

- `yandex_cloud_id` - ID облака Yandex Cloud
- `yandex_folder_id` - ID каталога
- `yandex_token` - OAuth токен для аутентификации
- `postgres_password` - Пароль для PostgreSQL
- `redis_password` - Пароль для Redis

### Опциональные переменные

Смотрите `variables.tf` для полного списка переменных с описаниями и значениями по умолчанию.

## Настройка после развертывания

### Подключение к Kubernetes

```bash
# Получите credentials для kubectl
yc managed-kubernetes cluster get-credentials znak-lavki-k8s --external

# Проверьте подключение
kubectl get nodes
```

### Подключение к PostgreSQL

```bash
# Получите хост из outputs
POSTGRES_HOST=$(terraform output -raw postgres_host)

# Подключитесь через psql
psql "host=$POSTGRES_HOST \
     port=6432 \
     sslmode=verify-full \
     dbname=znak_lavki \
     user=postgres"
```

### Подключение к Redis

```bash
# Получите хост из outputs
REDIS_HOST=$(terraform output -raw redis_host)

# Подключитесь через redis-cli
redis-cli -h $REDIS_HOST -p 6379 -a YOUR_REDIS_PASSWORD
```

## Безопасность

### Управление секретами

1. **НЕ КОММИТЬТЕ** `terraform.tfvars` с реальными паролями
2. Используйте Yandex Lockbox или другой secret manager
3. Регулярно ротируйте пароли и ключи доступа

### Backend для state файла

State файл хранится в Yandex Object Storage. Для настройки:

```bash
# Создайте bucket для state
yc storage bucket create --name znak-lavki-terraform-state

# Backend настроен в versions.tf
```

## Стоимость

Примерная месячная стоимость инфраструктуры:

- PostgreSQL (s2.micro, 50GB): ~3,000₽
- Redis (hm1.nano, 10GB): ~1,500₽
- Kubernetes (3 ноды standard-v2): ~6,000₽
- Object Storage (20GB): ~50₽
- Load Balancer: ~500₽

**Итого: ~11,000₽/месяц**

Цены могут меняться. Проверяйте актуальные цены на [сайте Yandex Cloud](https://cloud.yandex.ru/prices).

## Масштабирование

### Увеличение нод Kubernetes

```bash
# Отредактируйте k8s_node_count в terraform.tfvars
k8s_node_count = 5

# Примените изменения
terraform apply
```

### Изменение ресурсов PostgreSQL

```bash
# Обновите в terraform.tfvars
postgres_resource_preset = "s2.small" # 4 vCPU, 16 GB RAM
postgres_disk_size = 100

terraform apply
```

## Обслуживание

### Бэкапы

- PostgreSQL: автоматические бэкапы включены (7 дней хранения)
- Redis: автоматические бэкапы включены
- S3: версионирование включено

### Мониторинг

Используйте Yandex Monitoring или настройте Prometheus/Grafana через Kubernetes.

## Удаление инфраструктуры

```bash
# ВНИМАНИЕ: Это удалит ВСЕ ресурсы!
terraform destroy

# С подтверждением
terraform destroy -auto-approve
```

## Troubleshooting

### Ошибка: insufficient quotas

Увеличьте квоты в Yandex Cloud Console

### Ошибка: cluster version not supported

Обновите `k8s_version` в variables.tf до поддерживаемой версии

### Ошибка подключения к state

Проверьте настройки backend в `versions.tf` и наличие bucket

## Поддержка

Для вопросов и проблем создавайте issue в репозитории проекта.

