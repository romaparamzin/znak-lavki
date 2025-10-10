# Znak Lavki Architecture Documentation

## System Overview

Znak Lavki is a microservices-based quality mark management system built as a monorepo using pnpm workspaces.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │  Admin Panel    │              │   Mobile App    │           │
│  │  (React + Vite) │              │  (React Native) │           │
│  │  Port: 5173     │              │   + Expo        │           │
│  └────────┬────────┘              └────────┬────────┘           │
│           │                                │                     │
│           └────────────────┬───────────────┘                     │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTPS/REST
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                            ▼                                      │
│  ┌──────────────────────────────────────────────────┐           │
│  │         API Gateway (NestJS)                     │           │
│  │         Port: 3000                               │           │
│  │  • Authentication & Authorization                │           │
│  │  • Request Routing                               │           │
│  │  • Rate Limiting                                 │           │
│  │  • API Documentation (Swagger)                   │           │
│  └─────┬──────────────┬──────────────┬──────────────┘           │
│        │              │              │                           │
│        │              │              │                           │
├────────┼──────────────┼──────────────┼───────────────────────────┤
│        │              │              │   Microservices Layer     │
├────────┼──────────────┼──────────────┼───────────────────────────┤
│        │              │              │                           │
│  ┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────────┐               │
│  │   Mark     │ │Integration│ │ Notification  │               │
│  │  Service   │ │  Service  │ │   Service     │               │
│  │ Port: 3001 │ │Port: 3002 │ │  Port: 3003   │               │
│  │            │ │           │ │               │               │
│  │ • QR Code  │ │ • 1C API  │ │ • Email       │               │
│  │   Generate │ │ • WMS API │ │ • SMS         │               │
│  │ • Validate │ │ • PIM API │ │ • Push        │               │
│  │ • Storage  │ │ • Sync    │ │ • Webhooks    │               │
│  └─────┬──────┘ └────┬──────┘ └────┬──────────┘               │
│        │              │              │                           │
└────────┼──────────────┼──────────────┼───────────────────────────┘
         │              │              │
         └──────────────┴──────────────┘
                        │
┌───────────────────────┼───────────────────────────────────────────┐
│                       ▼          Data Layer                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ PostgreSQL  │    │   Redis     │    │   MinIO     │          │
│  │             │    │             │    │             │          │
│  │ Port: 5432  │    │ Port: 6379  │    │ Port: 9000  │          │
│  │             │    │             │    │             │          │
│  │ • Users     │    │ • Sessions  │    │ • QR Images │          │
│  │ • Products  │    │ • Cache     │    │ • Files     │          │
│  │ • QR Codes  │    │ • Queue     │    │ • Media     │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Components

### Frontend Layer

#### Admin Panel
- **Technology**: React 18, TypeScript, Vite, TailwindCSS
- **Port**: 5173
- **Responsibilities**:
  - Product management
  - QR code generation and management
  - User administration
  - Analytics and reporting
  - System configuration

#### Mobile App
- **Technology**: React Native, Expo
- **Responsibilities**:
  - QR code scanning
  - Product verification
  - Warehouse operations
  - Offline support

### Backend Layer

#### API Gateway
- **Technology**: NestJS, TypeScript
- **Port**: 3000
- **Responsibilities**:
  - Single entry point for all clients
  - JWT authentication and authorization
  - Request routing to microservices
  - Rate limiting and throttling
  - API documentation (Swagger)
  - CORS handling
  - Request/response transformation

#### Mark Service
- **Technology**: NestJS, TypeScript, QRCode, AWS SDK
- **Port**: 3001
- **Responsibilities**:
  - Generate QR codes for products
  - Validate QR code authenticity
  - Store QR code images in MinIO
  - Track QR code lifecycle
  - Generate batch QR codes
  - Handle QR code expiration

#### Integration Service
- **Technology**: NestJS, TypeScript, Axios, xml2js
- **Port**: 3002
- **Responsibilities**:
  - Integrate with 1C accounting system
  - Sync data with WMS (Warehouse Management System)
  - Connect to PIM (Product Information Management)
  - Scheduled data synchronization
  - Webhook handling
  - Data transformation and mapping

#### Notification Service
- **Technology**: NestJS, TypeScript, Nodemailer
- **Port**: 3003
- **Responsibilities**:
  - Send email notifications
  - SMS notifications (via third-party)
  - Push notifications to mobile apps
  - Telegram bot notifications
  - Notification templates
  - Delivery tracking
  - Notification queuing

### Data Layer

#### PostgreSQL
- **Version**: 15
- **Port**: 5432
- **Responsibilities**:
  - Primary relational database
  - Store users, products, QR codes
  - Transaction management
  - ACID compliance
  - Full-text search

#### Redis
- **Version**: 7
- **Port**: 6379
- **Responsibilities**:
  - Session storage
  - Caching layer
  - Rate limiting data
  - Pub/Sub messaging
  - Queue management

#### MinIO
- **Port**: 9000 (API), 9001 (Console)
- **Responsibilities**:
  - S3-compatible object storage
  - Store QR code images
  - File uploads
  - Product images
  - Document storage

### Shared Packages

#### @znak-lavki/types
- Shared TypeScript types and interfaces
- API request/response types
- Entity definitions
- Enum definitions

#### @znak-lavki/utils
- Common utility functions
- Date/time utilities
- String manipulation
- Validation helpers
- Format helpers

#### @znak-lavki/ui
- Shared React components
- Button, Card, Spinner, etc.
- Consistent UI across apps
- Reusable component library

## Communication Patterns

### Synchronous Communication
- **REST APIs**: HTTP/HTTPS requests between services
- **Request/Response**: Client ↔ API Gateway ↔ Microservices

### Asynchronous Communication
- **Message Queue**: Redis-based queue for background jobs
- **Events**: Pub/Sub pattern for service-to-service events
- **Webhooks**: External system integrations

## Data Flow Examples

### QR Code Generation Flow
```
1. User (Admin Panel) → API Gateway → Mark Service
2. Mark Service generates QR code
3. Mark Service stores image in MinIO
4. Mark Service saves metadata to PostgreSQL
5. Response with QR code URL returned to user
```

### Product Synchronization Flow
```
1. Scheduler triggers Integration Service
2. Integration Service fetches data from 1C/WMS/PIM
3. Integration Service transforms data
4. Integration Service updates PostgreSQL
5. Integration Service publishes event to Redis
6. Notification Service sends update notifications
```

### Mobile Scanning Flow
```
1. Warehouse worker scans QR code with mobile app
2. Mobile app → API Gateway → Mark Service
3. Mark Service validates QR code
4. Mark Service fetches product data from PostgreSQL
5. Response with product details returned
6. Mobile app displays product information
```

## Security Architecture

### Authentication
- JWT-based authentication
- Access tokens (short-lived, 24h)
- Refresh tokens (long-lived, 7d)
- Token rotation on refresh

### Authorization
- Role-based access control (RBAC)
- Roles: Admin, Manager, Warehouse Worker, Viewer
- Permission checks at API Gateway
- Resource-level permissions

### Data Security
- Passwords hashed with bcrypt
- Encrypted communication (HTTPS)
- Environment variable protection
- SQL injection prevention (TypeORM)
- Input validation (class-validator)
- Rate limiting to prevent abuse

## Scalability Considerations

### Horizontal Scaling
- Stateless services (can run multiple instances)
- Load balancer (nginx/AWS ALB) in front of API Gateway
- Database connection pooling
- Redis cluster for high availability

### Caching Strategy
- Redis for frequently accessed data
- HTTP caching headers
- CDN for static assets (QR codes, images)

### Database Optimization
- Indexes on frequently queried fields
- Query optimization
- Connection pooling
- Read replicas for read-heavy operations

## Monitoring and Observability

### Logging
- Structured JSON logging
- Log levels (debug, info, warn, error)
- Centralized log aggregation (future: ELK stack)

### Metrics
- Application metrics (request count, response time)
- System metrics (CPU, memory, disk)
- Business metrics (QR codes generated, scans per day)

### Health Checks
- `/health` endpoint on each service
- Database connectivity check
- Redis connectivity check
- MinIO connectivity check

## Deployment Architecture

### Development
- Local Docker Compose setup
- Hot reload for all services
- Debug ports exposed

### Production (Future)
- Kubernetes cluster (EKS/GKE/AKS)
- Managed PostgreSQL (RDS/Cloud SQL)
- Managed Redis (ElastiCache/Cloud Memorystore)
- S3 or cloud storage for objects
- CI/CD pipeline (GitHub Actions)
- Blue-green deployment
- Auto-scaling based on load

## Technology Choices Rationale

### Why NestJS?
- TypeScript-first framework
- Built-in dependency injection
- Excellent documentation
- Microservices support
- OpenAPI/Swagger integration

### Why pnpm?
- Faster than npm/yarn
- Efficient disk space usage
- Strict dependency resolution
- Great monorepo support

### Why PostgreSQL?
- ACID compliance
- Rich feature set
- JSON support
- Full-text search
- Excellent performance

### Why Redis?
- In-memory speed
- Multiple data structures
- Pub/Sub support
- TTL support
- Lua scripting

### Why MinIO?
- S3-compatible API
- Self-hosted option
- High performance
- Easy migration to AWS S3

## Future Enhancements

1. **GraphQL API**: Add GraphQL layer alongside REST
2. **Event Sourcing**: Implement event sourcing for audit trail
3. **Machine Learning**: QR code fraud detection
4. **Real-time Updates**: WebSocket support for live updates
5. **Analytics Engine**: Advanced reporting and analytics
6. **Mobile Offline Mode**: Full offline support for mobile app
7. **Multi-tenancy**: Support for multiple organizations
8. **Blockchain Integration**: Immutable product history


