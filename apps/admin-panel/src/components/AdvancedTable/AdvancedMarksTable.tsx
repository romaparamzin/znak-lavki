import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  TextField,
  Button,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  Edit,
  Save,
  Cancel,
  Refresh,
  Settings,
} from '@mui/icons-material';
import { TableColumn, BulkAction } from '../../types/table.types';
import { useTableState } from '../../hooks/useTableState';
import { useTableExport } from '../../hooks/useTableExport';
import { useTablePerformance } from '../../hooks/useTablePerformance';
import { useWebSocket } from '../../hooks/useWebSocket';
import { FilterPanel } from './FilterPanel';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { Mark } from '../../types/mark.types';
import { useVirtualizer } from '@tanstack/react-virtual';

interface AdvancedMarksTableProps {
  data: Mark[];
  loading?: boolean;
  error?: string | null;
  totalCount: number;
  onFetchData: (params: any) => Promise<void>;
  columns: TableColumn<Mark>[];
  bulkActions?: BulkAction[];
  enableRealtime?: boolean;
  enableInlineEdit?: boolean;
  onRowUpdate?: (id: string, updates: Partial<Mark>) => Promise<void>;
  renderExpandedRow?: (row: Mark) => React.ReactNode;
}

export function AdvancedMarksTable({
  data,
  loading = false,
  error = null,
  totalCount,
  onFetchData,
  columns,
  bulkActions,
  enableRealtime = true,
  enableInlineEdit = false,
  onRowUpdate,
  renderExpandedRow,
}: AdvancedMarksTableProps) {
  const tableState = useTableState({
    initialPageSize: 50,
    onStateChange: (state) => {
      onFetchData(state);
    },
  });

  const { exportData } = useTableExport<Mark>();
  const { getCached, setCache, invalidateCache, getAbortController, createDebouncedSearch } =
    useTablePerformance<Mark[]>(5 * 60 * 1000);

  // WebSocket for real-time updates
  const { connected, subscribe, unsubscribe } = useWebSocket(
    import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  );

  // Refs
  const parentRef = useRef<HTMLDivElement>(null);
  const [lastClickedRow, setLastClickedRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Mark>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  // WebSocket subscriptions
  useEffect(() => {
    if (enableRealtime && connected) {
      const handleMarkUpdate = (update: any) => {
        console.log('Mark updated:', update);
        invalidateCache('marks');
        if (autoRefresh) {
          onFetchData(tableState.queryParams);
        }
      };

      const handleNewMark = (mark: Mark) => {
        console.log('New mark:', mark);
        invalidateCache('marks');
        if (autoRefresh) {
          onFetchData(tableState.queryParams);
        }
      };

      subscribe('mark:updated', handleMarkUpdate);
      subscribe('mark:created', handleNewMark);

      return () => {
        unsubscribe('mark:updated', handleMarkUpdate);
        unsubscribe('mark:created', handleNewMark);
      };
    }
  }, [
    enableRealtime,
    connected,
    subscribe,
    unsubscribe,
    invalidateCache,
    autoRefresh,
    onFetchData,
    tableState.queryParams,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        tableState.selectAll(data.map((row) => row.id));
      }

      // Escape - Clear selection
      if (e.key === 'Escape') {
        tableState.clearSelection();
        setEditingRow(null);
      }

      // Ctrl/Cmd + E - Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport('csv');
      }

      // Ctrl/Cmd + R - Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data, tableState]);

  // Handlers
  const handleRowClick = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      if (event.shiftKey && lastClickedRow) {
        // Shift+click for range selection
        const allIds = data.map((row) => row.id);
        tableState.selectRange(lastClickedRow, rowId, allIds);
      } else {
        tableState.toggleRowSelection(rowId);
      }
      setLastClickedRow(rowId);
    },
    [lastClickedRow, data, tableState],
  );

  const handleSort = useCallback(
    (field: string) => {
      tableState.setSort(field);
    },
    [tableState],
  );

  const handleRefresh = useCallback(() => {
    invalidateCache();
    onFetchData(tableState.queryParams);
  }, [invalidateCache, onFetchData, tableState.queryParams]);

  const handleExport = useCallback(
    (format: 'csv' | 'xlsx' | 'json') => {
      const selectedData =
        tableState.state.selectedRows.size > 0
          ? data.filter((row) => tableState.state.selectedRows.has(row.id))
          : data;

      exportData(selectedData, columns, {
        format,
        fileName: `marks-${new Date().toISOString().split('T')[0]}`,
        selectedOnly: tableState.state.selectedRows.size > 0,
      });
    },
    [data, columns, tableState.state.selectedRows, exportData],
  );

  // Inline editing
  const handleEditStart = useCallback((row: Mark) => {
    setEditingRow(row.id);
    setEditValues(row);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (editingRow && onRowUpdate) {
      try {
        await onRowUpdate(editingRow, editValues);
        setEditingRow(null);
        setEditValues({});
        handleRefresh();
      } catch (error) {
        console.error('Failed to update row:', error);
      }
    }
  }, [editingRow, editValues, onRowUpdate, handleRefresh]);

  const handleEditCancel = useCallback(() => {
    setEditingRow(null);
    setEditValues({});
  }, []);

  // Column resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  const handleColumnResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
      tableState.setColumnWidth(columnId, width);
    },
    [tableState],
  );

  // Render cell content
  const renderCell = useCallback(
    (column: TableColumn<Mark>, row: Mark) => {
      const isEditing = editingRow === row.id && column.id !== 'actions';
      const value =
        typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor];

      if (isEditing && enableInlineEdit) {
        return (
          <TextField
            value={editValues[column.accessor as keyof Mark] || ''}
            onChange={(e) =>
              setEditValues((prev) => ({ ...prev, [column.accessor]: e.target.value }))
            }
            size="small"
            fullWidth
          />
        );
      }

      if (column.render) {
        return column.render(value, row);
      }

      // Default rendering with conditional formatting
      if (column.id === 'status') {
        const statusColors = {
          active: 'success',
          blocked: 'error',
          used: 'info',
          expired: 'warning',
        } as const;
        return (
          <Chip
            label={value}
            color={statusColors[value as keyof typeof statusColors]}
            size="small"
          />
        );
      }

      if (column.id === 'expirationDate' && value) {
        const date = new Date(value);
        const daysUntilExpiry = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const color = daysUntilExpiry < 7 ? 'error' : daysUntilExpiry < 30 ? 'warning' : 'default';
        return (
          <Chip
            label={date.toLocaleDateString('ru-RU')}
            color={color as any}
            size="small"
            variant="outlined"
          />
        );
      }

      return value;
    },
    [editingRow, editValues, enableInlineEdit],
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filter Panel */}
      <FilterPanel
        filters={tableState.state.filters}
        onFilterChange={(filters) => {
          tableState.updateState({
            filters,
            pagination: { ...tableState.state.pagination, page: 1 },
          });
        }}
        onClearFilters={tableState.clearFilters}
      />

      {/* Toolbar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Обновить (Ctrl+R)">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Настройки">
            <IconButton>
              <Settings />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" size="small" onClick={() => handleExport('csv')}>
            Экспорт CSV
          </Button>
          <Button variant="outlined" size="small" onClick={() => handleExport('xlsx')}>
            Экспорт Excel
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {enableRealtime && (
            <>
              <Chip
                label={connected ? 'Подключено' : 'Отключено'}
                color={connected ? 'success' : 'default'}
                size="small"
              />
              <Button
                variant={autoRefresh ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Авто-обновление
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Bulk Actions Toolbar */}
      {tableState.state.selectedRows.size > 0 && (
        <BulkActionsToolbar
          selectedCount={tableState.state.selectedRows.size}
          totalCount={data.length}
          onSelectAll={() => tableState.selectAll(data.map((row) => row.id))}
          onDeselectAll={tableState.clearSelection}
          isAllSelected={tableState.state.selectedRows.size === data.length}
          bulkActions={bulkActions}
          selectedIds={Array.from(tableState.state.selectedRows)}
        />
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        ref={parentRef}
        sx={{
          height: 600,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Table stickyHeader sx={{ minWidth: 650 }} aria-label="advanced marks table" role="grid">
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}
              >
                <Checkbox
                  indeterminate={
                    tableState.state.selectedRows.size > 0 &&
                    tableState.state.selectedRows.size < data.length
                  }
                  checked={data.length > 0 && tableState.state.selectedRows.size === data.length}
                  onChange={() => {
                    if (tableState.state.selectedRows.size === data.length) {
                      tableState.clearSelection();
                    } else {
                      tableState.selectAll(data.map((row) => row.id));
                    }
                  }}
                  inputProps={{ 'aria-label': 'select all marks' }}
                />
              </TableCell>
              {renderExpandedRow && <TableCell sx={{ width: 50 }} />}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    width: columnWidths[column.id] || column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    position: column.sticky ? 'sticky' : 'relative',
                    left: column.sticky ? 48 : 'auto',
                    zIndex: column.sticky ? 2 : 1,
                    bgcolor: column.sticky ? 'background.paper' : 'transparent',
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                  aria-sort={
                    tableState.state.sort?.field === column.id
                      ? tableState.state.sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {column.header}
                  {tableState.state.sort?.field === column.id && (
                    <Box component="span" sx={{ ml: 1 }}>
                      {tableState.state.sort.direction === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </TableCell>
              ))}
              {enableInlineEdit && <TableCell>Действия</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              <Box
                style={{
                  height: `${totalSize}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const row = data[virtualRow.index];
                  const isSelected = tableState.state.selectedRows.has(row.id);
                  const isExpanded = tableState.state.expandedRows.has(row.id);

                  return (
                    <Box
                      key={row.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableRow
                        hover
                        selected={isSelected}
                        onClick={(e) => handleRowClick(row.id, e)}
                        role="row"
                        aria-selected={isSelected}
                        tabIndex={0}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell
                          padding="checkbox"
                          sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper' }}
                        >
                          <Checkbox
                            checked={isSelected}
                            inputProps={{ 'aria-labelledby': row.id }}
                          />
                        </TableCell>
                        {renderExpandedRow && (
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                tableState.toggleRowExpansion(row.id);
                              }}
                            >
                              {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                            </IconButton>
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            align={column.align || 'left'}
                            sx={{
                              position: column.sticky ? 'sticky' : 'relative',
                              left: column.sticky ? 48 : 'auto',
                              bgcolor: column.sticky ? 'background.paper' : 'transparent',
                            }}
                          >
                            {renderCell(column, row)}
                          </TableCell>
                        ))}
                        {enableInlineEdit && (
                          <TableCell>
                            {editingRow === row.id ? (
                              <Stack direction="row" spacing={1}>
                                <IconButton size="small" onClick={handleEditSave} color="primary">
                                  <Save />
                                </IconButton>
                                <IconButton size="small" onClick={handleEditCancel}>
                                  <Cancel />
                                </IconButton>
                              </Stack>
                            ) : (
                              <IconButton size="small" onClick={() => handleEditStart(row)}>
                                <Edit />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && renderExpandedRow && (
                        <TableRow>
                          <TableCell colSpan={columns.length + (enableInlineEdit ? 3 : 2)}>
                            {renderExpandedRow(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={tableState.state.pagination.page - 1}
        onPageChange={(_, newPage) => tableState.setPage(newPage + 1)}
        rowsPerPage={tableState.state.pagination.pageSize}
        onRowsPerPageChange={(e) => tableState.setPageSize(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[25, 50, 100, 200]}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
      />

      {/* Keyboard shortcuts help */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Горячие клавиши:</strong> Ctrl+A (Выбрать все) | Escape (Снять выделение) | Ctrl+E
          (Экспорт) | Ctrl+R (Обновить) | Shift+Click (Выбор диапазона)
        </Typography>
      </Box>
    </Box>
  );
}
