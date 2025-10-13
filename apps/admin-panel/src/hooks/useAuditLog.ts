/**
 * React Query Hooks for Audit Log API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

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

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  markCode?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogResponse {
  data: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Query keys
export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (filters: AuditLogFilters) => [...auditLogKeys.lists(), filters] as const,
};

/**
 * Get paginated audit logs with filters
 */
export const useAuditLogs = (filters: AuditLogFilters) => {
  return useQuery({
    queryKey: auditLogKeys.list(filters),
    queryFn: () => apiClient.get<PaginatedAuditLogResponse>(
      '/audit/logs',
      { params: filters }
    ),
    staleTime: 30 * 1000, // 30 seconds
  });
};

