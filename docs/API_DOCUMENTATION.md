# API Documentation - Znak Lavki

Complete API reference with examples and best practices.

---

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.znak-lavki.ru/api/v1
```

## Authentication

All API requests require Bearer token authentication (except OAuth endpoints).

```bash
Authorization: Bearer <your_jwt_token>
```

### Get Token

```bash
POST /auth/oauth/yandex
Content-Type: application/json

{
  "code": "authorization_code",
  "redirect_uri": "https://app.znak-lavki.ru/callback"
}

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600
}
```

---

## Endpoints

### 1. Marks Management

#### 1.1 Get All Marks (Paginated)

```http
GET /marks?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=DESC
```

**Query Parameters:**

- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 20, max: 100
- `status` (optional): Filter by status (active, blocked, expired, used)
- `productId` (optional): Filter by product ID
- `supplierId` (optional): Filter by supplier ID
- `search` (optional): Search by mark code
- `sortBy` (optional): Sort field (createdAt, status, etc.)
- `sortOrder` (optional): Sort order (ASC, DESC)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "markCode": "99LAV123456789",
      "qrData": "https://znak-lavki.ru/qr/99LAV123456789",
      "status": "active",
      "productId": 100,
      "supplierId": 50,
      "batchId": "BATCH-2025-001",
      "expiresAt": "2026-01-01T00:00:00.000Z",
      "lastValidatedAt": null,
      "validationCount": 0,
      "metadata": {
        "idr": 98.5,
        "manufacturer": "ООО Лавка",
        "productionDate": "2025-10-01"
      },
      "createdAt": "2025-10-13T12:00:00.000Z",
      "updatedAt": "2025-10-13T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Example:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/marks?page=1&limit=10&status=active' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

#### 1.2 Get Mark by Code

```http
GET /marks/code/:markCode
```

**Parameters:**

- `markCode` (required): Unique mark code

**Response:**

```json
{
  "id": 1,
  "markCode": "99LAV123456789",
  "qrData": "https://znak-lavki.ru/qr/99LAV123456789",
  "status": "active",
  "expiresAt": "2026-01-01T00:00:00.000Z",
  "validationCount": 0,
  "createdAt": "2025-10-13T12:00:00.000Z"
}
```

**Example:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/marks/code/99LAV123456789' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

#### 1.3 Generate Marks (Batch)

```http
POST /marks/generate
Content-Type: application/json
```

**Request Body:**

```json
{
  "count": 100,
  "productId": 100,
  "supplierId": 50,
  "batchId": "BATCH-2025-001",
  "expiresAt": "2026-01-01T00:00:00.000Z",
  "metadata": {
    "manufacturer": "ООО Лавка",
    "productionDate": "2025-10-01"
  }
}
```

**Response:**

```json
{
  "success": true,
  "generated": 100,
  "batchId": "BATCH-2025-001",
  "marks": [
    {
      "markCode": "99LAV123456789",
      "qrData": "https://znak-lavki.ru/qr/99LAV123456789"
    }
  ]
}
```

**Example:**

```bash
curl -X POST \
  'http://localhost:3001/api/v1/marks/generate' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "count": 10,
    "productId": 100,
    "expiresAt": "2026-01-01T00:00:00.000Z"
  }'
```

---

#### 1.4 Block Mark

```http
PUT /marks/:markCode/block
Content-Type: application/json
```

**Request Body:**

```json
{
  "reason": "Suspected counterfeit"
}
```

**Response:**

```json
{
  "success": true,
  "markCode": "99LAV123456789",
  "status": "blocked",
  "reason": "Suspected counterfeit"
}
```

---

#### 1.5 Unblock Mark

```http
PUT /marks/:markCode/unblock
```

**Response:**

```json
{
  "success": true,
  "markCode": "99LAV123456789",
  "status": "active"
}
```

---

#### 1.6 Bulk Block Marks

```http
POST /marks/bulk-block
Content-Type: application/json
```

**Request Body:**

```json
{
  "markCodes": ["99LAV123456789", "99LAV987654321"],
  "reason": "Quality control issues"
}
```

**Response:**

```json
{
  "success": true,
  "blocked": 2,
  "failed": 0,
  "results": [
    {
      "markCode": "99LAV123456789",
      "success": true
    },
    {
      "markCode": "99LAV987654321",
      "success": true
    }
  ]
}
```

---

#### 1.7 Validate Mark

```http
POST /marks/validate
Content-Type: application/json
```

**Request Body:**

```json
{
  "markCode": "99LAV123456789",
  "location": {
    "latitude": 55.7558,
    "longitude": 37.6173
  }
}
```

**Response:**

```json
{
  "valid": true,
  "markCode": "99LAV123456789",
  "status": "active",
  "productInfo": {
    "name": "Organic Honey",
    "manufacturer": "ООО Лавка"
  },
  "validatedAt": "2025-10-13T12:00:00.000Z",
  "validationCount": 1
}
```

---

### 2. Dashboard

#### 2.1 Get Dashboard Metrics

```http
GET /dashboard/metrics
```

**Response:**

```json
{
  "totalMarks": 1000,
  "activeMarks": 850,
  "blockedMarks": 50,
  "expiredMarks": 75,
  "usedMarks": 25,
  "todayGenerated": 100,
  "todayValidated": 50,
  "generatedTrend": 15,
  "validatedTrend": -5
}
```

**Example:**

```bash
curl -X GET \
  'http://localhost:3001/api/v1/dashboard/metrics' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### 3. Analytics

#### 3.1 Get Trends

```http
GET /analytics/trends?days=30
```

**Query Parameters:**

- `days` (optional): Number of days, default: 30

**Response:**

```json
[
  {
    "date": "2025-10-01",
    "generated": 100,
    "validated": 50
  },
  {
    "date": "2025-10-02",
    "generated": 120,
    "validated": 60
  }
]
```

---

#### 3.2 Get Status Distribution

```http
GET /analytics/status-distribution
```

**Response:**

```json
[
  {
    "status": "active",
    "count": 850,
    "percentage": 85
  },
  {
    "status": "blocked",
    "count": 50,
    "percentage": 5
  },
  {
    "status": "expired",
    "count": 75,
    "percentage": 7.5
  },
  {
    "status": "used",
    "count": 25,
    "percentage": 2.5
  }
]
```

---

### 4. Audit Logs

#### 4.1 Get Audit Logs

```http
GET /audit/logs?page=1&limit=20&action=mark_blocked&startDate=2025-10-01&endDate=2025-10-13
```

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `markCode` (optional): Filter by mark code
- `action` (optional): Filter by action type
- `userId` (optional): Filter by user ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "markCode": "99LAV123456789",
      "action": "mark_blocked",
      "userId": "user-123",
      "metadata": {
        "reason": "Suspected counterfeit",
        "ip": "192.168.1.1"
      },
      "createdAt": "2025-10-13T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 500,
  "totalPages": 25
}
```

---

## Rate Limiting

All endpoints are rate-limited:

- **Standard endpoints**: 100 requests/minute per IP
- **Login endpoint**: 5 requests/minute per IP
- **Bulk operations**: 10 requests/minute per IP

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634123456
```

---

## Error Responses

All errors follow the same format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-10-13T12:00:00.000Z",
  "path": "/api/v1/marks"
}
```

### Common Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Pagination

All list endpoints support pagination:

```
GET /marks?page=2&limit=50
```

**Response includes:**

```json
{
  "data": [...],
  "page": 2,
  "limit": 50,
  "total": 1000,
  "totalPages": 20,
  "hasNextPage": true,
  "hasPreviousPage": true
}
```

---

## Filtering & Sorting

**Filtering:**

```
GET /marks?status=active&supplierId=50
```

**Sorting:**

```
GET /marks?sortBy=createdAt&sortOrder=DESC
```

**Search:**

```
GET /marks?search=99LAV
```

---

## WebSocket Events (Real-time)

Connect to WebSocket for real-time updates:

```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});

// Listen for mark events
socket.on('mark:created', (data) => {
  console.log('New mark:', data);
});

socket.on('mark:blocked', (data) => {
  console.log('Mark blocked:', data);
});

socket.on('mark:validated', (data) => {
  console.log('Mark validated:', data);
});
```

---

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @znak-lavki/sdk
```

```typescript
import { ZnakLavkiClient } from '@znak-lavki/sdk';

const client = new ZnakLavkiClient({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'http://localhost:3001/api/v1',
});

// Get marks
const marks = await client.marks.list({ page: 1, limit: 10 });

// Generate marks
const result = await client.marks.generate({
  count: 100,
  productId: 100,
});
```

---

## Best Practices

### 1. Use Pagination

Always use pagination for list endpoints to avoid large responses.

### 2. Cache Responses

Cache dashboard and analytics responses for 30-60 seconds.

### 3. Handle Rate Limits

Implement exponential backoff when rate limited.

### 4. Validate Input

Always validate input on client side before sending.

### 5. Use Bulk Operations

Use bulk endpoints for blocking/unblocking multiple marks.

---

## Testing

### cURL Examples

**Get Marks:**

```bash
curl -X GET 'http://localhost:3001/api/v1/marks' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Generate Marks:**

```bash
curl -X POST 'http://localhost:3001/api/v1/marks/generate' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"count": 10, "productId": 100}'
```

---

## Support

- **Swagger UI**: http://localhost:3001/api/docs
- **API Status**: http://localhost:3001/health
- **Metrics**: http://localhost:3001/metrics

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
