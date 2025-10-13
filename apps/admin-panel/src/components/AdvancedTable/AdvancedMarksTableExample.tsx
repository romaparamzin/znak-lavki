import { useState, useCallback } from 'react';
import { AdvancedMarksTable } from './AdvancedMarksTable';
import { TableColumn } from '../../types/table.types';
import { Mark } from '../../types/mark.types';
import { Box, Typography, Chip } from '@mui/material';
import { defaultMarksBulkActions } from './BulkActionsToolbar';

// Example columns configuration
const columns: TableColumn<Mark>[] = [
  {
    id: 'markCode',
    header: 'Код маркировки',
    accessor: 'markCode',
    width: 250,
    sortable: true,
    filterable: true,
    sticky: true,
    filterType: 'text',
  },
  {
    id: 'gtin',
    header: 'GTIN',
    accessor: 'gtin',
    width: 150,
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    id: 'status',
    header: 'Статус',
    accessor: 'status',
    width: 120,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { value: 'active', label: 'Активна' },
      { value: 'blocked', label: 'Заблокирована' },
      { value: 'used', label: 'Использована' },
      { value: 'expired', label: 'Просрочена' },
    ],
  },
  {
    id: 'createdAt',
    header: 'Дата создания',
    accessor: 'createdAt',
    width: 150,
    sortable: true,
    filterable: true,
    filterType: 'dateRange',
    render: (value) => new Date(value).toLocaleDateString('ru-RU'),
  },
  {
    id: 'expirationDate',
    header: 'Срок годности',
    accessor: 'expirationDate',
    width: 150,
    sortable: true,
    render: (value) => {
      if (!value) return '-';
      const date = new Date(value);
      const daysUntilExpiry = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `${date.toLocaleDateString('ru-RU')} (${daysUntilExpiry} дн.)`;
    },
  },
  {
    id: 'productName',
    header: 'Название товара',
    accessor: 'productName',
    width: 200,
    sortable: true,
    filterable: true,
    filterType: 'text',
  },
  {
    id: 'batchNumber',
    header: 'Номер партии',
    accessor: 'batchNumber',
    width: 120,
    sortable: true,
  },
];

export function AdvancedMarksTableExample() {
  const [data, setData] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch data from API
  const handleFetchData = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch marks');
      }

      const result = await response.json();
      setData(result.data);
      setTotalCount(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle row update
  const handleRowUpdate = useCallback(async (id: string, updates: Partial<Mark>) => {
    try {
      const response = await fetch(`/api/marks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update mark');
      }
    } catch (err) {
      console.error('Update failed:', err);
      throw err;
    }
  }, []);

  // Render expanded row content
  const renderExpandedRow = useCallback((row: Mark) => {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Детальная информация
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <div>
            <Typography variant="caption" color="text.secondary">
              ID
            </Typography>
            <Typography>{row.id}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Код маркировки
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
              {row.markCode}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              GTIN
            </Typography>
            <Typography>{row.gtin}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Статус
            </Typography>
            <Chip label={row.status} size="small" />
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Название товара
            </Typography>
            <Typography>{row.productName}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Номер партии
            </Typography>
            <Typography>{row.batchNumber || '-'}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Дата создания
            </Typography>
            <Typography>{new Date(row.createdAt).toLocaleString('ru-RU')}</Typography>
          </div>
          {row.expirationDate && (
            <div>
              <Typography variant="caption" color="text.secondary">
                Срок годности
              </Typography>
              <Typography>{new Date(row.expirationDate).toLocaleDateString('ru-RU')}</Typography>
            </div>
          )}
        </Box>
      </Box>
    );
  }, []);

  return (
    <AdvancedMarksTable
      data={data}
      loading={loading}
      error={error}
      totalCount={totalCount}
      onFetchData={handleFetchData}
      columns={columns}
      bulkActions={defaultMarksBulkActions}
      enableRealtime={true}
      enableInlineEdit={true}
      onRowUpdate={handleRowUpdate}
      renderExpandedRow={renderExpandedRow}
    />
  );
}
