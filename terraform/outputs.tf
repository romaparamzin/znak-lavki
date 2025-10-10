# Output значения Terraform конфигурации

# VPC и сети
output "vpc_id" {
  description = "ID VPC сети"
  value       = yandex_vpc_network.main.id
}

output "subnet_ids" {
  description = "IDs подсетей"
  value       = { for k, v in yandex_vpc_subnet.subnets : k => v.id }
}

# PostgreSQL
output "postgres_cluster_id" {
  description = "ID PostgreSQL кластера"
  value       = yandex_mdb_postgresql_cluster.main.id
}

output "postgres_host" {
  description = "Хост для подключения к PostgreSQL"
  value       = yandex_mdb_postgresql_cluster.main.host[0].fqdn
  sensitive   = false
}

output "postgres_port" {
  description = "Порт PostgreSQL"
  value       = 6432
}

output "postgres_database" {
  description = "Имя базы данных PostgreSQL"
  value       = yandex_mdb_postgresql_database.main.name
}

# Redis
output "redis_cluster_id" {
  description = "ID Redis кластера"
  value       = yandex_mdb_redis_cluster.main.id
}

output "redis_host" {
  description = "Хост для подключения к Redis"
  value       = yandex_mdb_redis_cluster.main.host[0].fqdn
  sensitive   = false
}

output "redis_port" {
  description = "Порт Redis"
  value       = 6379
}

# Kubernetes
output "k8s_cluster_id" {
  description = "ID Kubernetes кластера"
  value       = yandex_kubernetes_cluster.main.id
}

output "k8s_cluster_endpoint" {
  description = "Endpoint Kubernetes API"
  value       = yandex_kubernetes_cluster.main.master[0].external_v4_endpoint
  sensitive   = false
}

output "k8s_cluster_ca_certificate" {
  description = "CA сертификат Kubernetes кластера"
  value       = yandex_kubernetes_cluster.main.master[0].cluster_ca_certificate
  sensitive   = true
}

output "k8s_node_group_id" {
  description = "ID группы нод Kubernetes"
  value       = yandex_kubernetes_node_group.main.id
}

# S3
output "s3_bucket_name" {
  description = "Имя S3 bucket"
  value       = yandex_storage_bucket.qr_codes.bucket
}

output "s3_bucket_domain" {
  description = "Домен S3 bucket"
  value       = yandex_storage_bucket.qr_codes.bucket_domain_name
}

output "s3_access_key" {
  description = "Access Key для S3"
  value       = yandex_iam_service_account_static_access_key.s3_key.access_key
  sensitive   = true
}

output "s3_secret_key" {
  description = "Secret Key для S3"
  value       = yandex_iam_service_account_static_access_key.s3_key.secret_key
  sensitive   = true
}

# Load Balancer
output "lb_external_ip" {
  description = "Внешний IP Load Balancer"
  value       = yandex_lb_network_load_balancer.main.listener[0].external_address_spec[0].address
}

output "lb_id" {
  description = "ID Load Balancer"
  value       = yandex_lb_network_load_balancer.main.id
}

# Общая информация
output "deployment_info" {
  description = "Информация о развертывании"
  value = {
    project     = var.project
    environment = var.environment
    zone        = var.yandex_zone
    vpc_name    = var.vpc_name
  }
}

# Команда для подключения к Kubernetes
output "kubectl_config_command" {
  description = "Команда для настройки kubectl"
  value       = "yc managed-kubernetes cluster get-credentials ${yandex_kubernetes_cluster.main.name} --external"
}

