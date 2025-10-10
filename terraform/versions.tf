# Конфигурация версий Terraform и провайдеров

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = "~> 0.100"
    }
  }

  # Backend для хранения state файла в Yandex Object Storage
  backend "s3" {
    endpoint   = "storage.yandexcloud.net"
    bucket     = "znak-lavki-terraform-state"
    region     = "ru-central1"
    key        = "terraform.tfstate"
    
    skip_region_validation      = true
    skip_credentials_validation = true
  }
}

