/**
 * Audit Log Page
 * Connected to backend API
 */

import { useState } from 'react';
import { Card, Typography, Table, Spin, Alert, Tag, Space, Input, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuditLogs } from '../../hooks/useAuditLog';
import type { AuditLogFilters } from '../../hooks/useAuditLog';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Русские названия действий
const actionLabels: Record<string, string> = {
  mark_generated: 'Марка создана',
  mark_blocked: 'Марка заблокирована',
  mark_unblocked: 'Марка разблокирована',
  mark_validated: 'Марка валидирована',
  mark_expired: 'Марка истекла',
  mark_used: 'Марка использована',
  bulk_block: 'Массовая блокировка',
  bulk_unblock: 'Массовая разблокировка',
};

// Цвета для типов действий
const actionColors: Record<string, string> = {
  mark_generated: 'green',
  mark_blocked: 'red',
  mark_unblocked: 'blue',
  mark_validated: 'cyan',
  mark_expired: 'orange',
  mark_used: 'purple',
  bulk_block: 'volcano',
  bulk_unblock: 'geekblue',
};

const AuditLog = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
  });

  const { data: auditData, isLoading, error } = useAuditLogs(filters);
  const logs = auditData?.data || [];
  const total = auditData?.total || 0;

  const columns = [
    {
      title: 'Дата и время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <span>
            {d.toLocaleDateString('ru-RU')} {d.toLocaleTimeString('ru-RU')}
          </span>
        );
      },
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (action: string) => (
        <Tag color={actionColors[action] || 'default'}>
          {actionLabels[action] || action}
        </Tag>
      ),
    },
    {
      title: 'Код марки',
      dataIndex: 'markCode',
      key: 'markCode',
      ellipsis: true,
      render: (markCode: string) => markCode || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'Пользователь',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      render: (userId: string) => userId || <span style={{ color: '#999' }}>Система</span>,
    },
    {
      title: 'IP адрес',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      responsive: ['lg' as const],
      render: (ip: string) => ip || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      responsive: ['xl' as const],
      render: (reason: string) => reason || <span style={{ color: '#999' }}>—</span>,
    },
  ];

  return (
    <div>
      <Title level={2}>Журнал аудита</Title>

      <Card>
        {/* Filters */}
        <Space style={{ marginBottom: 16, width: '100%' }} size="middle" direction="vertical">
          <Space wrap>
            <Search
              placeholder="Поиск по коду марки..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setFilters({ ...filters, markCode: value, page: 1 })}
            />
            
            <Select
              placeholder="Тип действия"
              style={{ width: 200 }}
              allowClear
              onChange={(action) => setFilters({ ...filters, action, page: 1 })}
            >
              <Option value="mark_generated">Марка создана</Option>
              <Option value="mark_blocked">Марка заблокирована</Option>
              <Option value="mark_unblocked">Марка разблокирована</Option>
              <Option value="mark_validated">Марка валидирована</Option>
              <Option value="bulk_block">Массовая блокировка</Option>
              <Option value="bulk_unblock">Массовая разблокировка</Option>
            </Select>

            <Input
              placeholder="ID пользователя"
              allowClear
              style={{ width: 200 }}
              onChange={(e) => {
                if (!e.target.value) {
                  setFilters({ ...filters, userId: undefined, page: 1 });
                }
              }}
              onPressEnter={(e) => {
                const value = (e.target as HTMLInputElement).value;
                setFilters({ ...filters, userId: value, page: 1 });
              }}
            />
          </Space>
        </Space>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div style={{ marginTop: 20, fontSize: 16 }}>Загрузка журнала аудита...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert
            message="Ошибка загрузки"
            description={(error as Error).message}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Table */}
        {!isLoading && !error && (
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `Всего: ${total} записей`,
              onChange: (page, pageSize) => {
                setFilters({ ...filters, page, limit: pageSize });
              },
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default AuditLog;




