/**
 * API Configuration
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  API_VERSION: '/api/v1',
  TIMEOUT: 30000,
  
  // WebSocket
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // OAuth
  OAUTH: {
    YANDEX_CLIENT_ID: import.meta.env.VITE_YANDEX_CLIENT_ID || '',
    YANDEX_REDIRECT_URI: import.meta.env.VITE_YANDEX_REDIRECT_URI || 'http://localhost:5173/auth/callback',
    YANDEX_AUTH_URL: 'https://oauth.yandex.ru/authorize',
    YANDEX_TOKEN_URL: 'https://oauth.yandex.ru/token',
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  
  // Export
  EXPORT_FORMATS: ['csv', 'excel', 'pdf'] as const,
  
  // Polling intervals (ms)
  METRICS_POLL_INTERVAL: 30000, // 30 seconds
  AUDIT_LOG_POLL_INTERVAL: 60000, // 1 minute
  
  // Cache TTL (seconds)
  CACHE_TTL: {
    MARKS: 300, // 5 minutes
    METRICS: 60, // 1 minute
    USER: 3600, // 1 hour
  },
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    OAUTH_CALLBACK: '/auth/oauth/callback',
  },
  
  // Marks
  MARKS: {
    LIST: '/marks',
    GET: (id: string) => `/marks/${id}`,
    GET_BY_CODE: (code: string) => `/marks/code/${code}`,
    GENERATE: '/marks/generate',
    BLOCK: (markCode: string) => `/marks/${markCode}/block`,
    UNBLOCK: (markCode: string) => `/marks/${markCode}/unblock`,
    BULK_BLOCK: '/marks/bulk-block',
    BULK_UNBLOCK: '/marks/bulk-unblock',
    VALIDATE: '/marks/validate',
    EXPIRING: '/marks/expiring/list',
    EXPORT: '/marks/export',
  },
  
  // Dashboard
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
  },
  
  // Analytics
  ANALYTICS: {
    TRENDS: '/analytics/trends',
    STATUS_DISTRIBUTION: '/analytics/status-distribution',
    VALIDATION_STATS: '/analytics/validation-stats',
    SUPPLIER_STATS: '/analytics/supplier-stats',
  },
  
  // Audit
  AUDIT: {
    LIST: '/audit/logs',
    EXPORT: '/audit/export',
  },
  
  // Settings
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
  },
} as const;

