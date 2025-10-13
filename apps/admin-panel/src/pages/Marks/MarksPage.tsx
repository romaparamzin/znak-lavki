/**
 * Marks Management Page
 * Table with filters, search, and CRUD operations
 */

import { useState } from 'react';
import { Table, Card, Space, Button, Input, Select, Tag } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { MarkStatus } from '../../types/mark.types';

const { Search } = Input;
const { Option } = Select;

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
  // Add more mock data...
];

const MarksPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as MarkStatus | undefined,
    page: 1,
    limit: 20,
  });

  const statusColors = {
    active: 'success',
    blocked: 'warning',
    expired: 'default',
    used: 'processing',
  };

  const columns = [
    {
      title: 'Код марки',
      dataIndex: 'markCode',
      key: 'markCode',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'GTIN',
      dataIndex: 'gtin',
      key: 'gtin',
      width: 150,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: MarkStatus) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Валидаций',
      dataIndex: 'validationCount',
      key: 'validationCount',
      width: 120,
      align: 'center' as const,
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'active' ? (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => console.log('Block:', record.id)}
            >
              Блок
            </Button>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => console.log('Unblock:', record.id)}
            >
              Разблок
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
        title="Управление марками"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => console.log('Generate marks')}
            >
              Создать марки
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => console.log('Export')}
            >
              Экспорт
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16, width: '100%' }} size="middle">
          <Search
            placeholder="Поиск по коду марки..."
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => setFilters({ ...filters, search: value })}
          />
          
          <Select
            placeholder="Статус"
            style={{ width: 150 }}
            allowClear
            onChange={(status) => setFilters({ ...filters, status })}
          >
            <Option value="active">Активные</Option>
            <Option value="blocked">Заблокированные</Option>
            <Option value="expired">Истекшие</Option>
            <Option value="used">Использованные</Option>
          </Select>
        </Space>

        {/* Bulk actions */}
        {selectedRowKeys.length > 0 && (
          <Space style={{ marginBottom: 16 }}>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => console.log('Bulk block:', selectedRowKeys)}
            >
              Заблокировать выбранные ({selectedRowKeys.length})
            </Button>
            <Button
              onClick={() => console.log('Bulk unblock:', selectedRowKeys)}
            >
              Разблокировать выбранные ({selectedRowKeys.length})
            </Button>
          </Space>
        )}

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={mockMarks}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: mockMarks.length,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total}`,
          }}
        />
      </Card>

      {/* TODO: Add modals for generate, block, export */}
    </div>
  );
};

export default MarksPage;


