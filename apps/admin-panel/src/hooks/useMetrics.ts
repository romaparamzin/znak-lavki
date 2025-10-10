/**
 * React Query Hooks for Dashboard Metrics
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { DashboardMetrics } from '../types/mark.types';

/**
 * Get dashboard metrics
 * Auto-refetches every 30 seconds
 */
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.get<DashboardMetrics>('/dashboard/metrics'),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider stale after 15 seconds
  });
};

/**
 * Get analytics trends data
 */
export const useAnalyticsTrends = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: ['analytics-trends', period],
    queryFn: () => apiClient.get(`/analytics/trends?period=${period}`),
    staleTime: 60000, // 1 minute
  });
};

/**
 * Get status distribution for pie chart
 */
export const useStatusDistribution = () => {
  return useQuery({
    queryKey: ['status-distribution'],
    queryFn: () => apiClient.get('/analytics/status-distribution'),
    staleTime: 60000,
  });
};

/**
 * Get validation statistics
 */
export const useValidationStats = () => {
  return useQuery({
    queryKey: ['validation-stats'],
    queryFn: () => apiClient.get('/analytics/validation-stats'),
    staleTime: 60000,
  });
};


