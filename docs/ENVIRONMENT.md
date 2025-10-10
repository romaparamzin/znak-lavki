# Environment Variables Documentation

This document describes all environment variables used across the Znak Lavki monorepo.

## Core Configuration

### NODE_ENV
- **Description**: Node environment
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Used in**: All services

## Database Configuration

### DB_HOST
- **Description**: PostgreSQL host address
- **Default**: `localhost`
- **Used in**: All backend services

### DB_PORT
- **Description**: PostgreSQL port
- **Default**: `5432`
- **Used in**: All backend services

### DB_USERNAME
- **Description**: PostgreSQL username
- **Default**: `postgres`
- **Used in**: All backend services

### DB_PASSWORD
- **Description**: PostgreSQL password
- **Default**: `postgres`
- **Used in**: All backend services
- **Security**: Change in production!

### DB_NAME
- **Description**: PostgreSQL database name
- **Default**: `znak_lavki`
- **Used in**: All backend services

## Redis Configuration

### REDIS_HOST
- **Description**: Redis host address
- **Default**: `localhost`
- **Used in**: api-gateway, mark-service

### REDIS_PORT
- **Description**: Redis port
- **Default**: `6379`
- **Used in**: api-gateway, mark-service

### REDIS_PASSWORD
- **Description**: Redis password
- **Default**: `redis123`
- **Used in**: api-gateway, mark-service
- **Security**: Change in production!

## MinIO/S3 Configuration

### MINIO_ENDPOINT
- **Description**: MinIO server endpoint
- **Default**: `localhost`
- **Used in**: mark-service

### MINIO_PORT
- **Description**: MinIO server port
- **Default**: `9000`
- **Used in**: mark-service

### MINIO_ROOT_USER
- **Description**: MinIO root username
- **Default**: `minioadmin`
- **Used in**: mark-service
- **Security**: Change in production!

### MINIO_ROOT_PASSWORD
- **Description**: MinIO root password
- **Default**: `minioadmin`
- **Used in**: mark-service
- **Security**: Change in production!

### MINIO_USE_SSL
- **Description**: Use SSL for MinIO connection
- **Values**: `true`, `false`
- **Default**: `false`
- **Used in**: mark-service

## JWT Configuration

### JWT_SECRET
- **Description**: Secret key for JWT token generation
- **Default**: (none - must be set)
- **Used in**: api-gateway
- **Security**: Must be a strong random string in production!

### JWT_EXPIRES_IN
- **Description**: JWT token expiration time
- **Default**: `24h`
- **Used in**: api-gateway
- **Format**: Time string (e.g., "1h", "7d", "60s")

### JWT_REFRESH_SECRET
- **Description**: Secret key for refresh token generation
- **Default**: (none - must be set)
- **Used in**: api-gateway
- **Security**: Must be a strong random string in production!

### JWT_REFRESH_EXPIRES_IN
- **Description**: Refresh token expiration time
- **Default**: `7d`
- **Used in**: api-gateway

## Service Ports

### API_GATEWAY_PORT
- **Description**: API Gateway service port
- **Default**: `3000`
- **Used in**: api-gateway

### MARK_SERVICE_PORT
- **Description**: Mark Service port
- **Default**: `3001`
- **Used in**: mark-service

### INTEGRATION_SERVICE_PORT
- **Description**: Integration Service port
- **Default**: `3002`
- **Used in**: integration-service

### NOTIFICATION_SERVICE_PORT
- **Description**: Notification Service port
- **Default**: `3003`
- **Used in**: notification-service

## External Integrations

### INTEGRATION_1C_URL
- **Description**: 1C system API URL
- **Used in**: integration-service

### INTEGRATION_1C_USERNAME
- **Description**: 1C system username
- **Used in**: integration-service

### INTEGRATION_1C_PASSWORD
- **Description**: 1C system password
- **Used in**: integration-service
- **Security**: Store securely!

### INTEGRATION_WMS_URL
- **Description**: WMS system API URL
- **Used in**: integration-service

### INTEGRATION_WMS_API_KEY
- **Description**: WMS system API key
- **Used in**: integration-service
- **Security**: Store securely!

### INTEGRATION_PIM_URL
- **Description**: PIM system API URL
- **Used in**: integration-service

### INTEGRATION_PIM_API_KEY
- **Description**: PIM system API key
- **Used in**: integration-service
- **Security**: Store securely!

## Email Configuration

### SMTP_HOST
- **Description**: SMTP server host
- **Default**: `smtp.gmail.com`
- **Used in**: notification-service

### SMTP_PORT
- **Description**: SMTP server port
- **Default**: `587`
- **Used in**: notification-service

### SMTP_SECURE
- **Description**: Use secure connection
- **Values**: `true`, `false`
- **Default**: `false`
- **Used in**: notification-service

### SMTP_USER
- **Description**: SMTP username/email
- **Used in**: notification-service

### SMTP_PASSWORD
- **Description**: SMTP password
- **Used in**: notification-service
- **Security**: Use app-specific password for Gmail!

### EMAIL_FROM
- **Description**: Default sender email address
- **Default**: `noreply@znak-lavki.com`
- **Used in**: notification-service

## Frontend Configuration

### VITE_API_URL
- **Description**: Backend API URL for admin panel
- **Default**: `http://localhost:3000`
- **Used in**: admin-panel

### EXPO_PUBLIC_API_URL
- **Description**: Backend API URL for mobile app
- **Default**: `http://localhost:3000`
- **Used in**: mobile-app

## CORS Configuration

### CORS_ORIGIN
- **Description**: Allowed CORS origins (comma-separated)
- **Default**: `http://localhost:5173,http://localhost:3000`
- **Used in**: api-gateway
- **Format**: Comma-separated URLs

## Security Configuration

### BCRYPT_ROUNDS
- **Description**: Number of bcrypt hashing rounds
- **Default**: `10`
- **Used in**: api-gateway
- **Recommendation**: Use 12-14 in production

### RATE_LIMIT_TTL
- **Description**: Rate limit time window (seconds)
- **Default**: `60`
- **Used in**: api-gateway

### RATE_LIMIT_MAX
- **Description**: Max requests per time window
- **Default**: `100`
- **Used in**: api-gateway

## Logging Configuration

### LOG_LEVEL
- **Description**: Logging level
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `debug`
- **Used in**: All services

### LOG_FORMAT
- **Description**: Log output format
- **Values**: `json`, `text`
- **Default**: `json`
- **Used in**: All services

## Best Practices

1. **Never commit `.env` files** - They contain sensitive data
2. **Use strong secrets** - Generate JWT secrets using `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially in production
4. **Use environment-specific files** - `.env.development`, `.env.production`
5. **Document all variables** - Keep this file updated
6. **Use secret management** - Consider using AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault in production
7. **Validate on startup** - Services should validate required environment variables on startup
8. **Use defaults wisely** - Only use defaults for non-sensitive, development values

## Environment File Examples

### Development
```env
NODE_ENV=development
DB_HOST=localhost
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-change-me
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_PASSWORD=strong-random-password
JWT_SECRET=very-strong-random-secret-32-chars+
LOG_LEVEL=info
RATE_LIMIT_MAX=50
```

### Testing
```env
NODE_ENV=test
DB_NAME=znak_lavki_test
LOG_LEVEL=error
```


