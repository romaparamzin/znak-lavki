/**
 * Quality Mark Types
 * Shared types for mark management
 */

export enum MarkStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  USED = 'used',
}

export interface QualityMark {
  id: string;
  markCode: string;
  gtin: string;
  status: MarkStatus;
  productionDate: string;
  expiryDate: string;
  supplierId?: number;
  manufacturerId?: number;
  orderId?: string;
  blockedReason?: string;
  blockedBy?: string;
  blockedAt?: string;
  validationCount: number;
  lastValidatedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MarkFilters {
  page?: number;
  limit?: number;
  status?: MarkStatus;
  gtin?: string;
  supplierId?: number;
  manufacturerId?: number;
  orderId?: string;
  createdFrom?: string;
  createdTo?: string;
  expiryFrom?: string;
  expiryTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedMarksResponse {
  data: QualityMark[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GenerateMarkRequest {
  gtin: string;
  quantity: number;
  productionDate: string;
  expiryDate: string;
  supplierId?: number;
  manufacturerId?: number;
  orderId?: string;
  generateQrCodes?: boolean;
  metadata?: Record<string, any>;
}

export interface GenerateMarkResponse {
  marks: QualityMark[];
  count: number;
  qrCodes?: string[];
  processingTimeMs: number;
}

export interface BlockMarkRequest {
  reason: string;
  blockedBy?: string;
}

export interface BulkBlockRequest {
  markCodes: string[];
  reason: string;
  blockedBy?: string;
}

export interface BulkOperationResponse {
  successCount: number;
  failureCount: number;
  successfulMarkCodes: string[];
  failures: Array<{
    markCode: string;
    reason: string;
  }>;
  processingTimeMs: number;
}

export interface ValidateMarkRequest {
  markCode: string;
  location?: string;
  userId?: string;
}

export interface ValidateMarkResponse {
  isValid: boolean;
  mark: QualityMark | null;
  reason?: string;
  validatedAt: string;
}

export interface DashboardMetrics {
  totalMarks: number;
  activeMarks: number;
  blockedMarks: number;
  expiredMarks: number;
  usedMarks: number;
  todayGenerated: number;
  todayValidated: number;
  expiringIn30Days: number;
  validationRate: number;
  blockRate: number;
  trends: {
    generated: number[];
    validated: number[];
    blocked: number[];
  };
}

export interface AuditLogEntry {
  id: string;
  markCode?: string;
  action: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata?: Record<string, any>;
  reason?: string;
  createdAt: string;
}

export interface ExpiringMarksDto {
  daysBeforeExpiry?: number;
  page?: number;
  limit?: number;
}
