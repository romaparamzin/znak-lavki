/**
 * React Query Hooks for Marks API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { apiClient } from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  MarkFilters,
  PaginatedMarksResponse,
  GenerateMarkRequest,
  GenerateMarkResponse,
  BlockMarkRequest,
  BulkBlockRequest,
  BulkOperationResponse,
  ValidateMarkRequest,
  ValidateMarkResponse,
  QualityMark,
  ExpiringMarksDto,
} from '../types/mark.types';

// Query keys
export const markKeys = {
  all: ['marks'] as const,
  lists: () => [...markKeys.all, 'list'] as const,
  list: (filters: MarkFilters) => [...markKeys.lists(), filters] as const,
  details: () => [...markKeys.all, 'detail'] as const,
  detail: (id: string) => [...markKeys.details(), id] as const,
  expiring: (days: number) => [...markKeys.all, 'expiring', days] as const,
};

/**
 * Get paginated marks list with filters
 */
export const useMarks = (filters: MarkFilters) => {
  return useQuery({
    queryKey: markKeys.list(filters),
    queryFn: () => apiClient.get<PaginatedMarksResponse>(
      API_ENDPOINTS.MARKS.LIST,
      { params: filters }
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get single mark by ID
 */
export const useMark = (id: string) => {
  return useQuery({
    queryKey: markKeys.detail(id),
    queryFn: () => apiClient.get<QualityMark>(API_ENDPOINTS.MARKS.GET(id)),
    enabled: !!id,
  });
};

/**
 * Get mark by code
 */
export const useMarkByCode = (code: string) => {
  return useQuery({
    queryKey: ['mark-code', code],
    queryFn: () => apiClient.get<QualityMark>(API_ENDPOINTS.MARKS.GET_BY_CODE(code)),
    enabled: !!code,
  });
};

/**
 * Get expiring marks
 */
export const useExpiringMarks = (dto: ExpiringMarksDto) => {
  return useQuery({
    queryKey: markKeys.expiring(dto.daysBeforeExpiry || 30),
    queryFn: () => apiClient.get<PaginatedMarksResponse>(
      API_ENDPOINTS.MARKS.EXPIRING,
      { params: dto }
    ),
  });
};

/**
 * Generate new marks
 */
export const useGenerateMarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateMarkRequest) =>
      apiClient.post<GenerateMarkResponse>(API_ENDPOINTS.MARKS.GENERATE, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.success(`Успешно создано ${data.count} марок`);
    },
    onError: (error: Error) => {
      message.error(`Ошибка создания марок: ${error.message}`);
    },
  });
};

/**
 * Block single mark
 */
export const useBlockMark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ markCode, reason }: { markCode: string; reason: string }) =>
      apiClient.put(
        API_ENDPOINTS.MARKS.BLOCK(markCode),
        { reason } as BlockMarkRequest
      ),
    onMutate: async ({ markCode }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: markKeys.lists() });

      // Snapshot previous value
      const previousMarks = queryClient.getQueryData(markKeys.lists());

      // Optimistically update (optional)
      // queryClient.setQueryData(markKeys.lists(), (old: any) => {
      //   // Update logic here
      // });

      return { previousMarks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.success('Марка успешно заблокирована');
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousMarks) {
        queryClient.setQueryData(markKeys.lists(), context.previousMarks);
      }
      message.error(`Ошибка блокировки: ${error.message}`);
    },
  });
};

/**
 * Unblock single mark
 */
export const useUnblockMark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ markCode, reason }: { markCode: string; reason?: string }) =>
      apiClient.put(
        API_ENDPOINTS.MARKS.UNBLOCK(markCode),
        { reason }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.success('Марка разблокирована');
    },
    onError: (error: Error) => {
      message.error(`Ошибка разблокировки: ${error.message}`);
    },
  });
};

/**
 * Bulk block marks
 */
export const useBulkBlockMarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkBlockRequest) =>
      apiClient.post<BulkOperationResponse>(API_ENDPOINTS.MARKS.BULK_BLOCK, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.success(
        `Заблокировано: ${data.successCount}, Ошибок: ${data.failureCount}`
      );
    },
    onError: (error: Error) => {
      message.error(`Ошибка массовой блокировки: ${error.message}`);
    },
  });
};

/**
 * Bulk unblock marks
 */
export const useBulkUnblockMarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { markCodes: string[]; reason?: string }) =>
      apiClient.post<BulkOperationResponse>(API_ENDPOINTS.MARKS.BULK_UNBLOCK, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: markKeys.lists() });
      message.success(
        `Разблокировано: ${data.successCount}, Ошибок: ${data.failureCount}`
      );
    },
    onError: (error: Error) => {
      message.error(`Ошибка массовой разблокировки: ${error.message}`);
    },
  });
};

/**
 * Validate mark
 */
export const useValidateMark = () => {
  return useMutation({
    mutationFn: (data: ValidateMarkRequest) =>
      apiClient.post<ValidateMarkResponse>(API_ENDPOINTS.MARKS.VALIDATE, data),
    onSuccess: (data) => {
      if (data.isValid) {
        message.success('Марка валидна');
      } else {
        message.warning(`Марка невалидна: ${data.reason}`);
      }
    },
    onError: (error: Error) => {
      message.error(`Ошибка валидации: ${error.message}`);
    },
  });
};


