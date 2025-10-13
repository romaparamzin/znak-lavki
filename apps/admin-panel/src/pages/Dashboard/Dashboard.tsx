/**
 * Dashboard Page
 * Main dashboard with metrics and charts
 */

import { Row, Col, Card, Statistic, Typography, Spin, Space, Alert } from 'antd';
import {
  QrcodeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useDashboardMetrics } from '../../hooks/useDashboard';

const { Title } = Typography;

const Dashboard = () => {
  // Fetch real data from API
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  const MetricCard = ({
    title,
    value,
    icon,
    trend,
    suffix,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: number;
    suffix?: string;
  }) => (
    <Card bordered={false}>
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        suffix={suffix}
        valueStyle={{
          color: trend && trend > 0 ? '#3f8600' : trend && trend < 0 ? '#cf1322' : undefined,
        }}
      />
      {trend !== undefined && (
        <div style={{ marginTop: 8 }}>
          <Space>
            {trend > 0 ? (
              <ArrowUpOutlined style={{ color: '#3f8600' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#cf1322' }} />
            )}
            <span style={{ fontSize: 14, color: trend > 0 ? '#3f8600' : '#cf1322' }}>
              {Math.abs(trend)}% за сегодня
            </span>
          </Space>
        </div>
      )}
    </Card>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <div style={{ marginTop: 20, fontSize: 16 }}>Загрузка данных дашборда...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <Title level={2}>Дашборд</Title>
        <Alert
          message="Ошибка загрузки данных"
          description={(error as Error).message}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Дашборд</Title>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Всего марок"
            value={metrics?.totalMarks || 0}
            icon={<QrcodeOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Активные"
            value={metrics?.activeMarks || 0}
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Заблокированные"
            value={metrics?.blockedMarks || 0}
            icon={<StopOutlined style={{ color: '#faad14' }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Истекшие"
            value={metrics?.expiredMarks || 0}
            icon={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
          />
        </Col>
      </Row>

      {/* Activity Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <MetricCard
            title="Сгенерировано сегодня"
            value={metrics?.todayGenerated || 0}
            icon={<QrcodeOutlined />}
            trend={metrics?.generatedTrend}
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="Валидировано сегодня"
            value={metrics?.todayValidated || 0}
            icon={<CheckCircleOutlined />}
            trend={metrics?.validatedTrend}
          />
        </Col>
      </Row>

      {/* Charts Placeholders */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Тренды генерации" bordered={false}>
            <div
              style={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Add Recharts LineChart here */}
              <Typography.Text type="secondary">График трендов (добавить Recharts)</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам" bordered={false}>
            <div
              style={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Add Recharts PieChart here */}
              <Typography.Text type="secondary">Pie chart (добавить Recharts)</Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
