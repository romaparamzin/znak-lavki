# Основная конфигурация Terraform для Yandex Cloud

# Провайдер Yandex Cloud
provider "yandex" {
  token     = var.yandex_token
  cloud_id  = var.yandex_cloud_id
  folder_id = var.yandex_folder_id
  zone      = var.yandex_zone
}

# ==============================================
# VPC и сети
# ==============================================

# Создание VPC сети
resource "yandex_vpc_network" "main" {
  name        = var.vpc_name
  description = "VPC сеть для проекта Znak Lavki"
  
  labels = {
    project     = var.project
    environment = var.environment
  }
}

# Создание подсетей в разных зонах доступности
resource "yandex_vpc_subnet" "subnets" {
  for_each = var.subnet_cidrs

  name           = "${var.subnet_prefix}-${each.key}"
  zone           = each.key
  network_id     = yandex_vpc_network.main.id
  v4_cidr_blocks = [each.value]
  
  labels = {
    project     = var.project
    environment = var.environment
    zone        = each.key
  }
}

# Security Group для PostgreSQL
resource "yandex_vpc_security_group" "postgres_sg" {
  name        = "${var.project}-postgres-sg"
  description = "Security group для PostgreSQL кластера"
  network_id  = yandex_vpc_network.main.id

  ingress {
    protocol       = "TCP"
    description    = "PostgreSQL"
    v4_cidr_blocks = values(var.subnet_cidrs)
    port           = 6432
  }

  egress {
    protocol       = "ANY"
    description    = "Разрешить весь исходящий трафик"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group для Redis
resource "yandex_vpc_security_group" "redis_sg" {
  name        = "${var.project}-redis-sg"
  description = "Security group для Redis кластера"
  network_id  = yandex_vpc_network.main.id

  ingress {
    protocol       = "TCP"
    description    = "Redis"
    v4_cidr_blocks = values(var.subnet_cidrs)
    port           = 6379
  }

  egress {
    protocol       = "ANY"
    description    = "Разрешить весь исходящий трафик"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group для Kubernetes
resource "yandex_vpc_security_group" "k8s_sg" {
  name        = "${var.project}-k8s-sg"
  description = "Security group для Kubernetes кластера"
  network_id  = yandex_vpc_network.main.id

  ingress {
    protocol       = "TCP"
    description    = "Kubernetes API"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 443
  }

  ingress {
    protocol       = "TCP"
    description    = "Kubernetes API (альтернативный)"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 6443
  }

  ingress {
    protocol       = "TCP"
    description    = "NodePort Services"
    v4_cidr_blocks = ["0.0.0.0/0"]
    from_port      = 30000
    to_port        = 32767
  }

  ingress {
    protocol       = "ANY"
    description    = "Внутренний трафик между узлами"
    v4_cidr_blocks = values(var.subnet_cidrs)
  }

  egress {
    protocol       = "ANY"
    description    = "Разрешить весь исходящий трафик"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==============================================
# Managed PostgreSQL
# ==============================================

resource "yandex_mdb_postgresql_cluster" "main" {
  name        = "${var.project}-postgres"
  environment = var.postgres_environment
  network_id  = yandex_vpc_network.main.id

  config {
    version = var.postgres_version
    resources {
      resource_preset_id = var.postgres_resource_preset
      disk_type_id       = var.postgres_disk_type
      disk_size          = var.postgres_disk_size
    }

    # Настройки производительности PostgreSQL
    postgresql_config = {
      max_connections                = 100
      shared_buffers                 = 268435456  # 256 MB
      effective_cache_size           = 1073741824 # 1 GB
      maintenance_work_mem           = 67108864   # 64 MB
      checkpoint_completion_target   = 0.9
      wal_buffers                    = 16777216   # 16 MB
      default_statistics_target      = 100
      random_page_cost               = 1.1
      effective_io_concurrency       = 200
      work_mem                       = 4194304    # 4 MB
      min_wal_size                   = 1073741824 # 1 GB
      max_wal_size                   = 4294967296 # 4 GB
      max_worker_processes           = 2
      max_parallel_workers_per_gather = 1
      max_parallel_workers           = 2
      max_parallel_maintenance_workers = 1
    }
  }

  # Создание хостов в разных зонах для высокой доступности
  dynamic "host" {
    for_each = var.subnet_cidrs
    content {
      zone      = host.key
      subnet_id = yandex_vpc_subnet.subnets[host.key].id
    }
  }

  security_group_ids = [yandex_vpc_security_group.postgres_sg.id]

  labels = {
    project     = var.project
    environment = var.environment
  }
}

# Создание базы данных
resource "yandex_mdb_postgresql_database" "main" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = var.postgres_database_name
  owner      = var.postgres_username
  lc_collate = "ru_RU.UTF-8"
  lc_type    = "ru_RU.UTF-8"

  # Расширения PostgreSQL
  extension {
    name = "uuid-ossp"
  }

  extension {
    name = "pgcrypto"
  }
}

# Создание пользователя
resource "yandex_mdb_postgresql_user" "main" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = var.postgres_username
  password   = var.postgres_password

  permission {
    database_name = yandex_mdb_postgresql_database.main.name
  }

  conn_limit = 50

  settings = {
    default_transaction_isolation = "read committed"
    log_min_duration_statement    = 1000 # Логировать запросы > 1 сек
  }
}

# ==============================================
# Managed Redis
# ==============================================

resource "yandex_mdb_redis_cluster" "main" {
  name        = "${var.project}-redis"
  environment = "PRODUCTION"
  network_id  = yandex_vpc_network.main.id

  config {
    password = var.redis_password
    version  = var.redis_version
  }

  resources {
    resource_preset_id = var.redis_resource_preset
    disk_size          = var.redis_disk_size
    disk_type_id       = "network-ssd"
  }

  # Создание хостов в разных зонах
  dynamic "host" {
    for_each = var.subnet_cidrs
    content {
      zone      = host.key
      subnet_id = yandex_vpc_subnet.subnets[host.key].id
    }
  }

  security_group_ids = [yandex_vpc_security_group.redis_sg.id]

  labels = {
    project     = var.project
    environment = var.environment
  }
}

# ==============================================
# Managed Kubernetes
# ==============================================

# Service Account для Kubernetes
resource "yandex_iam_service_account" "k8s_sa" {
  name        = "${var.project}-k8s-sa"
  description = "Service account для Kubernetes кластера"
}

# Роли для service account
resource "yandex_resourcemanager_folder_iam_member" "k8s_editor" {
  folder_id = var.yandex_folder_id
  role      = "editor"
  member    = "serviceAccount:${yandex_iam_service_account.k8s_sa.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "k8s_images_puller" {
  folder_id = var.yandex_folder_id
  role      = "container-registry.images.puller"
  member    = "serviceAccount:${yandex_iam_service_account.k8s_sa.id}"
}

# Kubernetes Cluster
resource "yandex_kubernetes_cluster" "main" {
  name        = "${var.project}-k8s"
  description = "Kubernetes кластер для Znak Lavki"
  network_id  = yandex_vpc_network.main.id

  master {
    version = var.k8s_version
    
    zonal {
      zone      = var.yandex_zone
      subnet_id = yandex_vpc_subnet.subnets[var.yandex_zone].id
    }

    public_ip = true

    maintenance_policy {
      auto_upgrade = true

      maintenance_window {
        day        = "sunday"
        start_time = "03:00"
        duration   = "4h"
      }
    }

    security_group_ids = [yandex_vpc_security_group.k8s_sg.id]
  }

  service_account_id      = yandex_iam_service_account.k8s_sa.id
  node_service_account_id = yandex_iam_service_account.k8s_sa.id

  release_channel = var.k8s_release_channel
  network_policy_provider = "CALICO"

  labels = {
    project     = var.project
    environment = var.environment
  }

  depends_on = [
    yandex_resourcemanager_folder_iam_member.k8s_editor,
    yandex_resourcemanager_folder_iam_member.k8s_images_puller,
  ]
}

# Kubernetes Node Group
resource "yandex_kubernetes_node_group" "main" {
  cluster_id  = yandex_kubernetes_cluster.main.id
  name        = var.k8s_node_group_name
  description = "Группа worker нод"
  version     = var.k8s_version

  instance_template {
    platform_id = "standard-v2"

    network_interface {
      nat        = true
      subnet_ids = [for subnet in yandex_vpc_subnet.subnets : subnet.id]
      security_group_ids = [yandex_vpc_security_group.k8s_sg.id]
    }

    resources {
      memory = var.k8s_node_memory
      cores  = var.k8s_node_cores
    }

    boot_disk {
      type = "network-ssd"
      size = var.k8s_node_disk_size
    }

    scheduling_policy {
      preemptible = false
    }

    metadata = {
      ssh-keys = "ubuntu:${file("~/.ssh/id_rsa.pub")}" # Замените на ваш SSH ключ
    }
  }

  scale_policy {
    fixed_scale {
      size = var.k8s_node_count
    }
  }

  allocation_policy {
    location {
      zone = var.yandex_zone
    }
  }

  maintenance_policy {
    auto_upgrade = true
    auto_repair  = true

    maintenance_window {
      day        = "sunday"
      start_time = "03:00"
      duration   = "4h"
    }
  }

  labels = {
    project     = var.project
    environment = var.environment
  }
}

# ==============================================
# Object Storage (S3)
# ==============================================

# Service Account для S3
resource "yandex_iam_service_account" "s3_sa" {
  name        = "${var.project}-s3-sa"
  description = "Service account для Object Storage"
}

# Роль для S3
resource "yandex_resourcemanager_folder_iam_member" "s3_admin" {
  folder_id = var.yandex_folder_id
  role      = "storage.admin"
  member    = "serviceAccount:${yandex_iam_service_account.s3_sa.id}"
}

# Access Key для S3
resource "yandex_iam_service_account_static_access_key" "s3_key" {
  service_account_id = yandex_iam_service_account.s3_sa.id
  description        = "Static access key для Object Storage"
}

# S3 Bucket для QR кодов
resource "yandex_storage_bucket" "qr_codes" {
  bucket     = var.s3_bucket_name
  access_key = yandex_iam_service_account_static_access_key.s3_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.s3_key.secret_key
  acl        = var.s3_bucket_acl

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "delete-old-versions"
    enabled = true

    noncurrent_version_expiration {
      days = 90
    }
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "aws:kms"
      }
    }
  }
}

# ==============================================
# Application Load Balancer
# ==============================================

# Target Group для Load Balancer
resource "yandex_lb_target_group" "main" {
  name      = "${var.project}-tg"
  region_id = "ru-central1"

  dynamic "target" {
    for_each = yandex_vpc_subnet.subnets
    content {
      subnet_id = target.value.id
      address   = cidrhost(target.value.v4_cidr_blocks[0], 10)
    }
  }
}

# Network Load Balancer
resource "yandex_lb_network_load_balancer" "main" {
  name = "${var.project}-lb"
  type = "external"

  listener {
    name = "http-listener"
    port = var.lb_listener_port
    external_address_spec {
      ip_version = "ipv4"
    }
  }

  attached_target_group {
    target_group_id = yandex_lb_target_group.main.id

    healthcheck {
      name = "http-healthcheck"
      http_options {
        port = var.lb_target_port
        path = "/health"
      }
    }
  }

  labels = {
    project     = var.project
    environment = var.environment
  }
}

