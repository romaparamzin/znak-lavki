import { useState, useCallback, useMemo } from 'react';
import { TableState, SortConfig, FilterConfig, PaginationConfig } from '../types/table.types';

interface UseTableStateOptions {
  initialPageSize?: number;
  defaultSort?: SortConfig;
  defaultFilters?: FilterConfig[];
  onStateChange?: (state: TableState) => void;
}

export function useTableState(options: UseTableStateOptions = {}) {
  const { initialPageSize = 50, defaultSort = null, defaultFilters = [], onStateChange } = options;

  const [state, setState] = useState<TableState>({
    sort: defaultSort,
    filters: defaultFilters,
    pagination: {
      page: 1,
      pageSize: initialPageSize,
      total: 0,
    },
    selectedRows: new Set(),
    expandedRows: new Set(),
    columnWidths: {},
    columnOrder: [],
    hiddenColumns: new Set(),
  });

  const updateState = useCallback(
    (updates: Partial<TableState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange],
  );

  // Sorting
  const setSort = useCallback(
    (field: string) => {
      setState((prev) => {
        const newSort: SortConfig | null =
          prev.sort?.field === field
            ? prev.sort.direction === 'asc'
              ? { field, direction: 'desc' }
              : null
            : { field, direction: 'asc' };

        const newState = { ...prev, sort: newSort };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange],
  );

  // Filtering
  const addFilter = useCallback(
    (filter: FilterConfig) => {
      setState((prev) => {
        const filters = prev.filters.filter((f) => f.field !== filter.field);
        filters.push(filter);
        const newState = { ...prev, filters, pagination: { ...prev.pagination, page: 1 } };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange],
  );

  const removeFilter = useCallback(
    (field: string) => {
      setState((prev) => {
        const filters = prev.filters.filter((f) => f.field !== field);
        const newState = { ...prev, filters, pagination: { ...prev.pagination, page: 1 } };
        onStateChange?.(newState);
        return newState;
      });
    },
    [onStateChange],
  );

  const clearFilters = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        filters: [],
        pagination: { ...prev.pagination, page: 1 },
      };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Pagination
  const setPage = useCallback(
    (page: number) => {
      updateState({ pagination: { ...state.pagination, page } });
    },
    [state.pagination, updateState],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateState({ pagination: { ...state.pagination, pageSize, page: 1 } });
    },
    [state.pagination, updateState],
  );

  const setTotal = useCallback(
    (total: number) => {
      updateState({ pagination: { ...state.pagination, total } });
    },
    [state.pagination, updateState],
  );

  // Row selection
  const toggleRowSelection = useCallback((rowId: string) => {
    setState((prev) => {
      const selectedRows = new Set(prev.selectedRows);
      if (selectedRows.has(rowId)) {
        selectedRows.delete(rowId);
      } else {
        selectedRows.add(rowId);
      }
      return { ...prev, selectedRows };
    });
  }, []);

  const selectRange = useCallback((startId: string, endId: string, allIds: string[]) => {
    setState((prev) => {
      const startIndex = allIds.indexOf(startId);
      const endIndex = allIds.indexOf(endId);
      const [from, to] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];

      const selectedRows = new Set(prev.selectedRows);
      for (let i = from; i <= to; i++) {
        selectedRows.add(allIds[i]);
      }
      return { ...prev, selectedRows };
    });
  }, []);

  const selectAll = useCallback((rowIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedRows: new Set(rowIds),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedRows: new Set(),
    }));
  }, []);

  // Row expansion
  const toggleRowExpansion = useCallback((rowId: string) => {
    setState((prev) => {
      const expandedRows = new Set(prev.expandedRows);
      if (expandedRows.has(rowId)) {
        expandedRows.delete(rowId);
      } else {
        expandedRows.add(rowId);
      }
      return { ...prev, expandedRows };
    });
  }, []);

  // Column management
  const setColumnWidth = useCallback((columnId: string, width: number) => {
    setState((prev) => ({
      ...prev,
      columnWidths: { ...prev.columnWidths, [columnId]: width },
    }));
  }, []);

  const setColumnOrder = useCallback((order: string[]) => {
    setState((prev) => ({
      ...prev,
      columnOrder: order,
    }));
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setState((prev) => {
      const hiddenColumns = new Set(prev.hiddenColumns);
      if (hiddenColumns.has(columnId)) {
        hiddenColumns.delete(columnId);
      } else {
        hiddenColumns.add(columnId);
      }
      return { ...prev, hiddenColumns };
    });
  }, []);

  // Query string for API
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: state.pagination.page,
      pageSize: state.pagination.pageSize,
    };

    if (state.sort) {
      params.sortBy = state.sort.field;
      params.sortOrder = state.sort.direction;
    }

    state.filters.forEach((filter, index) => {
      params[`filter[${index}][field]`] = filter.field;
      params[`filter[${index}][operator]`] = filter.operator;
      params[`filter[${index}][value]`] = filter.value;
    });

    return params;
  }, [state.pagination, state.sort, state.filters]);

  return {
    state,
    queryParams,
    setSort,
    addFilter,
    removeFilter,
    clearFilters,
    setPage,
    setPageSize,
    setTotal,
    toggleRowSelection,
    selectRange,
    selectAll,
    clearSelection,
    toggleRowExpansion,
    setColumnWidth,
    setColumnOrder,
    toggleColumnVisibility,
    updateState,
  };
}
