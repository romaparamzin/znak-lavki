export interface TableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  sticky?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  filterType?: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  filterOptions?: Array<{ value: string; label: string }>;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface TableState {
  sort: SortConfig | null;
  filters: FilterConfig[];
  pagination: PaginationConfig;
  selectedRows: Set<string>;
  expandedRows: Set<string>;
  columnWidths: Record<string, number>;
  columnOrder: string[];
  hiddenColumns: Set<string>;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterConfig[];
  isDefault?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmMessage?: string;
  disabled?: (selectedIds: string[]) => boolean;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fileName?: string;
  selectedOnly?: boolean;
  includeHeaders?: boolean;
  columns?: string[];
}

export interface TableKeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface VirtualScrollConfig {
  rowHeight: number;
  overscan: number;
  estimatedRowHeight?: number;
}

export interface TablePerformanceConfig {
  enableVirtualScroll: boolean;
  debounceSearch: number;
  cacheTimeout: number;
  maxCacheSize: number;
}
