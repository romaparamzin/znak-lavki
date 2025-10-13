/**
 * Marks Management Page
 * Table with filters, search, and CRUD operations
 * Fully responsive for mobile, tablet, and desktop
 */

import { useState } from 'react';
import { Table, Card, Space, Button, Input, Select, Tag, Dropdown, message, Grid } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  DownOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { MarkStatus } from '../../types/mark.types';
import { useExport } from '../../hooks/useExport';
import { useGenerateMarks } from '../../hooks/useMarks';
import { GenerateMarksModal } from '../../components/Marks/GenerateMarksModal';

const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Mock data - replace with React Query
const mockMarks = [
  {
    id: '1',
    markCode: '99LAV0460717796408966LAV1234567890ABCDEF',
    gtin: '04607177964089',
    status: 'active' as MarkStatus,
    productionDate: '2025-10-10',
    expiryDate: '2026-10-10',
    validationCount: 5,
    createdAt: '2025-10-10T12:00:00Z',
  },
  {
    id: '2',
    markCode: '99LAV0460717796408966LAV9876543210FEDCBA',
    gtin: '04607177964089',
    status: 'blocked' as MarkStatus,
    productionDate: '2025-10-09',
    expiryDate: '2026-10-09',
    validationCount: 12,
    createdAt: '2025-10-09T10:30:00Z',
  },
  {
    id: '3',
    markCode: '99LAV0460717796408966LAV5555666677778888',
    gtin: '04607177964089',
    status: 'active' as MarkStatus,
    productionDate: '2025-10-08',
    expiryDate: '2026-10-08',
    validationCount: 3,
    createdAt: '2025-10-08T14:15:00Z',
  },
  {
    id: '4',
    markCode: '99LAV0460717796408966LAV9999000011112222',
    gtin: '04607177964089',
    status: 'used' as MarkStatus,
    productionDate: '2025-10-07',
    expiryDate: '2026-10-07',
    validationCount: 25,
    createdAt: '2025-10-07T09:20:00Z',
  },
  {
    id: '5',
    markCode: '99LAV0460717796408966LAV3333444455556666',
    gtin: '04607177964089',
    status: 'expired' as MarkStatus,
    productionDate: '2024-01-01',
    expiryDate: '2025-01-01',
    validationCount: 0,
    createdAt: '2024-01-01T08:00:00Z',
  },
];

const MarksPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as MarkStatus | undefined,
    page: 1,
    limit: 20,
  });
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const screens = useBreakpoint();

  // Determine if we're on mobile/tablet
  const isMobile = !screens.md; // md breakpoint is 768px
  const isTablet = screens.md && !screens.lg; // lg breakpoint is 992px

  // Export hook
  const { exportData, isExporting } = useExport();

  // Generate marks mutation
  const generateMarksMutation = useGenerateMarks();

  const statusColors = {
    active: 'success',
    blocked: 'warning',
    expired: 'default',
    used: 'processing',
  };

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (mockMarks.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }
    exportData(mockMarks, format, 'quality-marks');
  };

  // Handle generate marks
  const handleGenerateMarks = async (values: any) => {
    try {
      await generateMarksMutation.mutateAsync(values);
      setGenerateModalVisible(false);
      // Reload marks list here when using real API
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Generate marks error:', error);
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

  // Responsive columns - hide some columns on mobile
  const columns = [
    {
      title: 'Код марки',
      dataIndex: 'markCode',
      key: 'markCode',
      ellipsis: true,
      width: isMobile ? 200 : 300,
      fixed: isMobile ? false : undefined,
    },
    {
      title: 'GTIN',
      dataIndex: 'gtin',
      key: 'gtin',
      width: 150,
      responsive: ['md'] as any, // Hide on mobile
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 100 : 120,
      render: (status: MarkStatus) => (
        <Tag color={statusColors[status]}>
          {isMobile ? status.charAt(0).toUpperCase() : status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Валидаций',
      dataIndex: 'validationCount',
      key: 'validationCount',
      width: 120,
      align: 'center' as const,
      responsive: ['lg'] as any, // Hide on mobile and tablet
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return isMobile
          ? d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
          : d.toLocaleDateString('ru-RU');
      },
      responsive: ['md'] as any, // Hide on mobile
    },
    {
      title: 'Действия',
      key: 'actions',
      width: isMobile ? 80 : 150,
      fixed: isMobile ? ('right' as const) : undefined,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'active' ? (
            <Button
              size="small"
              danger
              icon={isMobile ? <StopOutlined /> : undefined}
              onClick={() => console.log('Block:', record.id)}
            >
              {!isMobile && 'Блок'}
            </Button>
          ) : (
            <Button
              size="small"
              icon={isMobile ? <CheckCircleOutlined /> : undefined}
              onClick={() => console.log('Unblock:', record.id)}
            >
              {!isMobile && 'Разблок'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  return (
    <div>
      <Card
        title={isMobile ? 'Марки' : 'Управление марками'}
        extra={
          <Space size={isMobile ? 'small' : 'middle'} wrap>
            {!isMobile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setGenerateModalVisible(true)}
              >
                Создать марки
              </Button>
            )}
            {isMobile && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setGenerateModalVisible(true)}
                size="small"
              />
            )}
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
        {/* Filters */}
        <Space
          style={{ marginBottom: 16, width: '100%' }}
          size={isMobile ? 'small' : 'middle'}
          direction={isMobile ? 'vertical' : 'horizontal'}
        >
          {isMobile && (
            <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)} block>
              {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            </Button>
          )}

          {(!isMobile || showFilters) && (
            <>
              <Search
                placeholder="Поиск по коду..."
                allowClear
                style={{ width: isMobile ? '100%' : 300 }}
                size={isMobile ? 'middle' : 'large'}
                onSearch={(value) => setFilters({ ...filters, search: value })}
              />

              <Select
                placeholder="Статус"
                style={{ width: isMobile ? '100%' : 150 }}
                size={isMobile ? 'middle' : 'large'}
                allowClear
                onChange={(status) => setFilters({ ...filters, status })}
              >
                <Option value="active">Активные</Option>
                <Option value="blocked">Заблокированные</Option>
                <Option value="expired">Истекшие</Option>
                <Option value="used">Использованные</Option>
              </Select>
            </>
          )}
        </Space>

        {/* Bulk actions */}
        {selectedRowKeys.length > 0 && (
          <Space
            style={{ marginBottom: 16 }}
            size={isMobile ? 'small' : 'middle'}
            direction={isMobile ? 'vertical' : 'horizontal'}
            wrap
          >
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => console.log('Bulk block:', selectedRowKeys)}
              size={isMobile ? 'small' : 'middle'}
              block={isMobile}
            >
              {isMobile
                ? `Блок (${selectedRowKeys.length})`
                : `Заблокировать выбранные (${selectedRowKeys.length})`}
            </Button>
            <Button
              onClick={() => console.log('Bulk unblock:', selectedRowKeys)}
              size={isMobile ? 'small' : 'middle'}
              block={isMobile}
            >
              {isMobile
                ? `Разблок (${selectedRowKeys.length})`
                : `Разблокировать выбранные (${selectedRowKeys.length})`}
            </Button>
          </Space>
        )}

        {/* Table */}
        <Table
          rowSelection={isMobile ? undefined : rowSelection}
          columns={columns}
          dataSource={mockMarks}
          rowKey="id"
          scroll={{ x: isMobile ? 600 : undefined }}
          size={isMobile ? 'small' : 'middle'}
          pagination={{
            current: filters.page,
            pageSize: isMobile ? 10 : filters.limit,
            total: mockMarks.length,
            showSizeChanger: !isMobile,
            showTotal: (total) => `Всего: ${total}`,
            simple: isMobile,
          }}
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
