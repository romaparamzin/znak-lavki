/**
 * Marks Management Page with Advanced Table
 * Enhanced with virtual scrolling, real-time updates, and advanced features
 */

import { PlusOutlined, ExportOutlined, DownOutlined } from '@ant-design/icons';
import { Card, Space, Button, Dropdown, message, Grid } from 'antd';
import type { MenuProps } from 'antd';
import { useState, useCallback } from 'react';
import { Block, CheckCircle, Delete, Edit, FileDownload } from '@mui/icons-material';

import { GenerateMarksModal } from '../../components/Marks/GenerateMarksModal';
import { AdvancedMarksTable } from '../../components/AdvancedTable';
import { BulkAction, TableColumn } from '../../types/table.types';
import { useExport } from '../../hooks/useExport';
import {
  useMarks,
  useGenerateMarks,
  useBulkBlockMarks,
  useBulkUnblockMarks,
  useBlockMark,
  useUnblockMark,
} from '../../hooks/useMarks';
import type { Mark, MarkStatus } from '../../types/mark.types';
import { Box, Chip, Typography } from '@mui/material';

const { useBreakpoint } = Grid;

const MarksPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as MarkStatus | undefined,
    page: 1,
    limit: 50,
  });
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Fetch marks from API
  const { data: marksData, isLoading, error, refetch } = useMarks(filters);
  const marks = marksData?.data || [];
  const total = marksData?.total || 0;

  // Export hook
  const { exportData, isExporting } = useExport();

  // Mutations
  const generateMarksMutation = useGenerateMarks();
  const bulkBlockMutation = useBulkBlockMarks();
  const bulkUnblockMutation = useBulkUnblockMarks();
  const blockMarkMutation = useBlockMark();
  const unblockMarkMutation = useUnblockMark();

  // Define columns for Advanced Table
  const columns: TableColumn<Mark>[] = [
    {
      id: 'markCode',
      header: 'Код маркировки',
      accessor: 'markCode',
      width: 280,
      sortable: true,
      filterable: true,
      sticky: true,
      filterType: 'text',
      render: (value) => (
        <Typography
          sx={{ fontFamily: 'monospace', fontSize: '0.9em', wordBreak: 'break-all' }}
        >
          {value}
        </Typography>
      ),
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
      width: 140,
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Активная' },
        { value: 'blocked', label: 'Заблокирована' },
        { value: 'expired', label: 'Истекла' },
        { value: 'used', label: 'Использована' },
      ],
      render: (value: MarkStatus) => {
        const statusConfig = {
          active: { label: 'Активная', color: 'success' as const },
          blocked: { label: 'Заблокирована', color: 'warning' as const },
          expired: { label: 'Истекла', color: 'default' as const },
          used: { label: 'Использована', color: 'info' as const },
        };
        const config = statusConfig[value] || statusConfig.active;
        return <Chip label={config.label} color={config.color} size="small" />;
      },
    },
    {
      id: 'validationCount',
      header: 'Валидаций',
      accessor: 'validationCount',
      width: 120,
      align: 'center',
      sortable: true,
      render: (value) => <Chip label={value || 0} size="small" variant="outlined" />,
    },
    {
      id: 'createdAt',
      header: 'Дата создания',
      accessor: 'createdAt',
      width: 150,
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value: string) => new Date(value).toLocaleDateString('ru-RU'),
    },
    {
      id: 'productName',
      header: 'Название товара',
      accessor: (row) => row.productName || '-',
      width: 200,
      sortable: false,
    },
  ];

  // Bulk actions for Advanced Table
  const bulkActions: BulkAction[] = [
    {
      id: 'block',
      label: 'Заблокировать',
      icon: <Block />,
      onClick: async (selectedIds) => {
        const selectedMarks = marks.filter((mark) => selectedIds.includes(mark.id));
        const markCodes = selectedMarks.map((mark) => mark.markCode);
        
        try {
          await bulkBlockMutation.mutateAsync({
            markCodes,
            reason: 'Массовая блокировка',
          });
          message.success(`Заблокировано ${markCodes.length} марок`);
          refetch();
        } catch (error: any) {
          message.error('Ошибка блокировки марок');
          console.error('Bulk block error:', error);
        }
      },
      requiresConfirmation: true,
      confirmMessage: 'Вы уверены, что хотите заблокировать выбранные марки?',
    },
    {
      id: 'unblock',
      label: 'Разблокировать',
      icon: <CheckCircle />,
      onClick: async (selectedIds) => {
        const selectedMarks = marks.filter((mark) => selectedIds.includes(mark.id));
        const markCodes = selectedMarks.map((mark) => mark.markCode);
        
        try {
          await bulkUnblockMutation.mutateAsync({
            markCodes,
            reason: 'Массовая разблокировка',
          });
          message.success(`Разблокировано ${markCodes.length} марок`);
          refetch();
        } catch (error: any) {
          message.error('Ошибка разблокировки марок');
          console.error('Bulk unblock error:', error);
        }
      },
      requiresConfirmation: true,
      confirmMessage: 'Вы уверены, что хотите разблокировать выбранные марки?',
    },
    {
      id: 'export',
      label: 'Экспортировать',
      icon: <FileDownload />,
      onClick: async (selectedIds) => {
        const selectedMarks = marks.filter((mark) => selectedIds.includes(mark.id));
        exportData(selectedMarks, 'csv', 'selected-marks');
        message.success(`Экспортировано ${selectedMarks.length} марок`);
      },
    },
  ];

  // Handle fetch data for Advanced Table
  const handleFetchData = useCallback(async (params: any) => {
    // Transform Advanced Table params to our API format
    const newFilters = {
      search: filters.search,
      status: filters.status,
      page: params.page || 1,
      limit: params.pageSize || 50,
    };
    
    setFilters(newFilters);
  }, [filters.search, filters.status]);

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (marks.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }
    exportData(marks, format, 'quality-marks');
  };

  // Handle generate marks
  const handleGenerateMarks = async (values: any) => {
    try {
      await generateMarksMutation.mutateAsync(values);
      setGenerateModalVisible(false);
      message.success(`✅ Успешно создано ${values.quantity} марок!`);
      refetch();
    } catch (error: any) {
      console.error('Generate marks error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Ошибка создания марок';
      message.error(errorMsg);
    }
  };

  // Export menu items
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Экспорт в CSV',
      onClick: () => handleExport('csv'),
    },
    {
      key: 'excel',
      label: 'Экспорт в Excel',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      label: 'Экспорт в PDF',
      onClick: () => handleExport('pdf'),
    },
  ];

  // Render expanded row with details
  const renderExpandedRow = useCallback((row: Mark) => {
    return (
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Детальная информация о марке
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
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9em', wordBreak: 'break-all' }}>
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
            <Typography>{row.status}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Количество валидаций
            </Typography>
            <Typography>{row.validationCount || 0}</Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Дата создания
            </Typography>
            <Typography>{new Date(row.createdAt).toLocaleString('ru-RU')}</Typography>
          </div>
          {row.productName && (
            <div>
              <Typography variant="caption" color="text.secondary">
                Название товара
              </Typography>
              <Typography>{row.productName}</Typography>
            </div>
          )}
          {row.batchNumber && (
            <div>
              <Typography variant="caption" color="text.secondary">
                Номер партии
              </Typography>
              <Typography>{row.batchNumber}</Typography>
            </div>
          )}
        </Box>
      </Box>
    );
  }, []);

  return (
    <div>
      <Card
        title={isMobile ? 'Марки' : 'Управление марками (Advanced Table)'}
        extra={
          <Space size={isMobile ? 'small' : 'middle'} wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setGenerateModalVisible(true)}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && 'Создать марки'}
            </Button>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button
                icon={<ExportOutlined />}
                loading={isExporting}
                size={isMobile ? 'small' : 'middle'}
              >
                {!isMobile && 'Экспорт'} <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        {/* Advanced Table */}
        <AdvancedMarksTable
          data={marks}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          totalCount={total}
          onFetchData={handleFetchData}
          columns={columns}
          bulkActions={bulkActions}
          enableRealtime={true}
          renderExpandedRow={renderExpandedRow}
        />
      </Card>

      {/* Generate Marks Modal */}
      <GenerateMarksModal
        visible={generateModalVisible}
        onConfirm={handleGenerateMarks}
        onCancel={() => setGenerateModalVisible(false)}
        loading={generateMarksMutation.isPending}
      />
    </div>
  );
};

export default MarksPage;
