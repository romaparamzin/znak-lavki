/**
 * React Query Hooks for Analytics API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface TrendData {
  date: string;
  generated: number;
  validated: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface ValidationStats {
  date: string;
  validations: number;
  uniqueMarks: number;
}

export interface SupplierStats {
  supplierId: number;
  totalMarks: number;
  activeMarks: number;
  blockedMarks: number;
  avgValidations: number;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  trends: (days: number) => [...analyticsKeys.all, 'trends', days] as const,
  statusDistribution: () => [...analyticsKeys.all, 'status-distribution'] as const,
  validationStats: (days: number) => [...analyticsKeys.all, 'validation-stats', days] as const,
  supplierStats: () => [...analyticsKeys.all, 'supplier-stats'] as const,
};

/**
 * Get trends data
 */
export const useTrends = (days: number = 30) => {
  return useQuery({
    queryKey: analyticsKeys.trends(days),
    queryFn: () => apiClient.get<TrendData[]>(
      '/analytics/trends',
      { params: { days } }
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get status distribution
 */
export const useStatusDistribution = () => {
  return useQuery({
    queryKey: analyticsKeys.statusDistribution(),
    queryFn: async () => {
      const data = await apiClient.get<StatusDistribution[]>('/analytics/status-distribution');
      
      // Calculate percentages
      const total = data.reduce((sum, item) => sum + item.count, 0);
      return data.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get validation stats
 */
export const useValidationStats = (days: number = 7) => {
  return useQuery({
    queryKey: analyticsKeys.validationStats(days),
    queryFn: () => apiClient.get<ValidationStats[]>(
      '/analytics/validation-stats',
      { params: { days } }
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get supplier stats
 */
export const useSupplierStats = () => {
  return useQuery({
    queryKey: analyticsKeys.supplierStats(),
    queryFn: () => apiClient.get<SupplierStats[]>('/analytics/supplier-stats'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

