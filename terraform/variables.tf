# Переменные для Terraform конфигурации Yandex Cloud

# Основные настройки
variable "yandex_cloud_id" {
  description = "ID облака в Yandex Cloud"
  type        = string
}

variable "yandex_folder_id" {
  description = "ID каталога в Yandex Cloud"
  type        = string
}

variable "yandex_token" {
  description = "OAuth токен для Yandex Cloud"
  type        = string
  sensitive   = true
}

variable "yandex_zone" {
  description = "Зона доступности"
  type        = string
  default     = "ru-central1-a"
}

# Настройки сети
variable "vpc_name" {
  description = "Имя VPC сети"
  type        = string
  default     = "znak-lavki-vpc"
}

variable "subnet_prefix" {
  description = "Префикс для подсетей"
  type        = string
  default     = "znak-lavki-subnet"
}

variable "subnet_cidrs" {
  description = "CIDR блоки для подсетей"
  type        = map(string)
  default = {
    "ru-central1-a" = "10.1.1.0/24"
    "ru-central1-b" = "10.1.2.0/24"
    "ru-central1-c" = "10.1.3.0/24"
  }
}

# PostgreSQL настройки
variable "postgres_version" {
  description = "Версия PostgreSQL"
  type        = string
  default     = "15"
}

variable "postgres_environment" {
  description = "Окружение PostgreSQL (PRODUCTION или PRESTABLE)"
  type        = string
  default     = "PRODUCTION"
}

variable "postgres_resource_preset" {
  description = "Класс ресурсов для PostgreSQL"
  type        = string
  default     = "s2.micro" # 2 vCPU, 8 GB RAM
}

variable "postgres_disk_size" {
  description = "Размер диска PostgreSQL в GB"
  type        = number
  default     = 50
}

variable "postgres_disk_type" {
  description = "Тип диска PostgreSQL"
  type        = string
  default     = "network-ssd"
}

variable "postgres_database_name" {
  description = "Имя базы данных PostgreSQL"
  type        = string
  default     = "znak_lavki"
}

variable "postgres_username" {
  description = "Имя пользователя PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "Пароль пользователя PostgreSQL"
  type        = string
  sensitive   = true
}

# Redis настройки
variable "redis_version" {
  description = "Версия Redis"
  type        = string
  default     = "7.0"
}

variable "redis_resource_preset" {
  description = "Класс ресурсов для Redis"
  type        = string
  default     = "hm1.nano" # 2 GB RAM
}

variable "redis_disk_size" {
  description = "Размер диска Redis в GB"
  type        = number
  default     = 10
}

variable "redis_password" {
  description = "Пароль для Redis"
  type        = string
  sensitive   = true
}

# Kubernetes настройки
variable "k8s_version" {
  description = "Версия Kubernetes"
  type        = string
  default     = "1.28"
}

variable "k8s_release_channel" {
  description = "Release channel для Kubernetes"
  type        = string
  default     = "STABLE"
}

variable "k8s_node_group_name" {
  description = "Имя группы нод Kubernetes"
  type        = string
  default     = "worker-nodes"
}

variable "k8s_node_count" {
  description = "Количество нод в группе"
  type        = number
  default     = 3
}

variable "k8s_node_cores" {
  description = "Количество CPU для ноды"
  type        = number
  default     = 2
}

variable "k8s_node_memory" {
  description = "Объем памяти для ноды в GB"
  type        = number
  default     = 4
}

variable "k8s_node_disk_size" {
  description = "Размер диска ноды в GB"
  type        = number
  default     = 50
}

# S3 настройки
variable "s3_bucket_name" {
  description = "Имя S3 bucket для хранения QR кодов"
  type        = string
  default     = "znak-lavki-qr-codes"
}

variable "s3_bucket_acl" {
  description = "ACL для S3 bucket"
  type        = string
  default     = "private"
}

# Теги
variable "environment" {
  description = "Окружение (production, staging, development)"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Название проекта"
  type        = string
  default     = "znak-lavki"
}

# Load Balancer настройки
variable "lb_target_port" {
  description = "Порт для Load Balancer target"
  type        = number
  default     = 30080
}

variable "lb_listener_port" {
  description = "Порт для Load Balancer listener"
  type        = number
  default     = 80
}

