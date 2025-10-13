import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ProductInfo } from '../../store/slices/scannerSlice';
import { addToQueue } from '../../store/slices/offlineSyncSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

// Query Keys
export const queryKeys = {
  product: (code: string) => ['product', code] as const,
  scanHistory: ['scanHistory'] as const,
  stats: ['stats'] as const,
  user: ['user'] as const,
};

// Product API
interface ProductResponse {
  product: ProductInfo;
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

export const useProductQuery = (code: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.product(code),
    queryFn: () => apiClient.get<ProductResponse>(`/products/validate/${code}`),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Validation Mutations
interface ValidationPayload {
  scanId: string;
  code: string;
  status: 'accepted' | 'rejected' | 'reported';
  reason?: string;
  notes?: string;
}

export const useValidateProduct = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector((state) => state.offlineSync.isOnline);

  return useMutation({
    mutationFn: (payload: ValidationPayload) => apiClient.post('/validations', payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(variables.code) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scanHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
    onError: (error, variables) => {
      // If offline or network error, add to sync queue
      if (!isOnline || error.message.includes('Network')) {
        dispatch(
          addToQueue({
            id: `validation-${variables.scanId}-${Date.now()}`,
            type: 'validation',
            data: variables,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
  });
};

// Report Issue
interface ReportPayload {
  scanId: string;
  code: string;
  issueType: 'counterfeit' | 'damaged' | 'expired' | 'other';
  description: string;
  photos?: string[];
}

export const useReportIssue = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector((state) => state.offlineSync.isOnline);

  return useMutation({
    mutationFn: (payload: ReportPayload) => apiClient.post('/reports', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scanHistory });
    },
    onError: (error, variables) => {
      if (!isOnline || error.message.includes('Network')) {
        dispatch(
          addToQueue({
            id: `report-${variables.scanId}-${Date.now()}`,
            type: 'report',
            data: variables,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
  });
};

// Scan History
interface ScanHistoryResponse {
  scans: Array<{
    id: string;
    code: string;
    productName: string;
    status: string;
    timestamp: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const useScanHistory = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: [...queryKeys.scanHistory, page, limit] as const,
    queryFn: () => apiClient.get<ScanHistoryResponse>(`/scans?page=${page}&limit=${limit}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Stats
interface StatsResponse {
  today: number;
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

export const useStats = () => {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => apiClient.get<StatsResponse>('/stats'),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Auth
interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  user: any;
  token: string;
  refreshToken: string;
}

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => apiClient.post<LoginResponse>('/auth/login', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
