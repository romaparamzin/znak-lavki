/**
 * Audit Log Page
 */

import { Card, Typography, Table } from 'antd';

const { Title } = Typography;

const AuditLog = () => {
  return (
    <div>
      <Title level={2}>Журнал аудита</Title>
      <Card>
        <Table
          columns={[
            { title: 'Действие', dataIndex: 'action', key: 'action' },
            { title: 'Пользователь', dataIndex: 'userId', key: 'userId' },
            { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt' },
          ]}
          dataSource={[]}
          locale={{ emptyText: 'Нет данных (TODO: подключить API)' }}
        />
      </Card>
    </div>
  );
};

export default AuditLog;




