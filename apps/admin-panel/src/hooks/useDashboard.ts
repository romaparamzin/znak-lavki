/**
 * React Query Hooks for Dashboard API
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface DashboardMetrics {
  totalMarks: number;
  activeMarks: number;
  blockedMarks: number;
  expiredMarks: number;
  usedMarks: number;
  todayGenerated: number;
  todayValidated: number;
  generatedTrend?: number;
  validatedTrend?: number;
}

/**
 * Get dashboard metrics
 */
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.get<DashboardMetrics>('/dashboard/metrics'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
