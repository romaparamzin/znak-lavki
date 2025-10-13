/**
 * Marks Management Page
 * Table with filters, search, and CRUD operations
 * Fully responsive for mobile, tablet, and desktop
 */

import {
  PlusOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  DownOutlined,
  FilterOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  Tag,
  Dropdown,
  message,
  Grid,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import { useState } from 'react';

import { GenerateMarksModal } from '../../components/Marks/GenerateMarksModal';
import { useExport } from '../../hooks/useExport';
import {
  useMarks,
  useGenerateMarks,
  useBulkBlockMarks,
  useBulkUnblockMarks,
  useBlockMark,
  useUnblockMark,
} from '../../hooks/useMarks';
import type { MarkStatus } from '../../types/mark.types';

const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

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

  // Fetch marks from API
  const { data: marksData, isLoading, error, refetch } = useMarks(filters);
  const marks = marksData?.data || [];
  const total = marksData?.total || 0;

  // Export hook
  const { exportData, isExporting } = useExport();

  // Generate marks mutation
  const generateMarksMutation = useGenerateMarks();

  // Bulk operations mutations
  const bulkBlockMutation = useBulkBlockMarks();
  const bulkUnblockMutation = useBulkUnblockMarks();

  // Single mark operations mutations
  const blockMarkMutation = useBlockMark();
  const unblockMarkMutation = useUnblockMark();

  const statusColors = {
    active: 'success',
    blocked: 'warning',
    expired: 'default',
    used: 'processing',
  };

  const statusLabels: Record<MarkStatus, string> = {
    active: 'Активная',
    blocked: 'Заблокирована',
    expired: 'Истекла',
    used: 'Использована',
  };

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
      // Real API mode - backend is running
      await generateMarksMutation.mutateAsync(values);
      setGenerateModalVisible(false);
      message.success(`✅ Успешно создано ${values.quantity} марок!`);
      // Reload marks list
      refetch();
    } catch (error: any) {
      // Error is handled by the mutation hook
      console.error('Generate marks error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Ошибка создания марок';
      message.error(errorMsg);
    }
  };

  // Handle bulk block
  const handleBulkBlock = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Выберите марки для блокировки');
      return;
    }

    // Get markCodes from selected rows
    const selectedMarks = marks.filter((mark) => selectedRowKeys.includes(mark.id));
    const markCodes = selectedMarks.map((mark) => mark.markCode);

    try {
      await bulkBlockMutation.mutateAsync({
        markCodes,
        reason: 'Массовая блокировка',
      });
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      console.error('Bulk block error:', error);
    }
  };

  // Handle bulk unblock
  const handleBulkUnblock = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Выберите марки для разблокировки');
      return;
    }

    // Get markCodes from selected rows
    const selectedMarks = marks.filter((mark) => selectedRowKeys.includes(mark.id));
    const markCodes = selectedMarks.map((mark) => mark.markCode);

    try {
      await bulkUnblockMutation.mutateAsync({
        markCodes,
        reason: 'Массовая разблокировка',
      });
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      console.error('Bulk unblock error:', error);
    }
  };

  // Handle single mark block
  const handleBlockMark = async (markCode: string) => {
    try {
      await blockMarkMutation.mutateAsync({
        markCode,
        reason: 'Блокировка',
      });
      refetch();
    } catch (error: any) {
      console.error('Block mark error:', error);
    }
  };

  // Handle single mark unblock
  const handleUnblockMark = async (markCode: string) => {
    try {
      await unblockMarkMutation.mutateAsync({
        markCode,
        reason: 'Разблокировка',
      });
      refetch();
    } catch (error: any) {
      console.error('Unblock mark error:', error);
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
      width: isMobile ? 120 : 140,
      render: (status: MarkStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
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
              onClick={() => handleBlockMark(record.markCode)}
              loading={blockMarkMutation.isPending}
            >
              {!isMobile && 'Блок'}
            </Button>
          ) : record.status === 'blocked' ? (
            <Button
              size="small"
              icon={isMobile ? <CheckCircleOutlined /> : undefined}
              onClick={() => handleUnblockMark(record.markCode)}
              loading={unblockMarkMutation.isPending}
            >
              {!isMobile && 'Разблок'}
            </Button>
          ) : null}
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
                style={{ width: isMobile ? '100%' : 180 }}
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
              onClick={handleBulkBlock}
              loading={bulkBlockMutation.isPending}
              size={isMobile ? 'small' : 'middle'}
              block={isMobile}
            >
              {isMobile
                ? `Блок (${selectedRowKeys.length})`
                : `Заблокировать выбранные (${selectedRowKeys.length})`}
            </Button>
            <Button
              onClick={handleBulkUnblock}
              loading={bulkUnblockMutation.isPending}
              size={isMobile ? 'small' : 'middle'}
              block={isMobile}
            >
              {isMobile
                ? `Разблок (${selectedRowKeys.length})`
                : `Разблокировать выбранные (${selectedRowKeys.length})`}
            </Button>
          </Space>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 20, fontSize: 16 }}>Загрузка марок...</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#ff4d4f' }}>
            <div style={{ fontSize: 18, marginBottom: 10 }}>❌ Ошибка загрузки данных</div>
            <div>{(error as Error).message}</div>
            <Button type="primary" onClick={() => refetch()} style={{ marginTop: 20 }}>
              Повторить попытку
            </Button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <Table
            rowSelection={isMobile ? undefined : rowSelection}
            columns={columns}
            dataSource={marks}
            rowKey="id"
            scroll={{ x: isMobile ? 600 : undefined }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              current: filters.page,
              pageSize: isMobile ? 10 : filters.limit,
              total: total,
              showSizeChanger: !isMobile,
              showTotal: (total) => `Всего: ${total}`,
              simple: isMobile,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize || 20 });
              },
            }}
          />
        )}
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
