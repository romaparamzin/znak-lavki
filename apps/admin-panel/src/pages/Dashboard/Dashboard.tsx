/**
 * Dashboard Page
 * Main dashboard with metrics and charts
 */

import { Row, Col, Card, Statistic, Typography, Spin, Space } from 'antd';
import {
  QrcodeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

// Mock data - replace with real API calls
const mockMetrics = {
  totalMarks: 45230,
  activeMarks: 38920,
  blockedMarks: 1250,
  expiredMarks: 5060,
  todayGenerated: 1240,
  todayValidated: 3450,
  generatedTrend: 12.5, // %
  validatedTrend: -3.2, // %
};

const Dashboard = () => {
  // In real app, fetch data with React Query:
  // const { data, isLoading } = useQuery(['dashboard-metrics'], fetchMetrics);

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

  return (
    <div>
      <Title level={2}>Дашборд</Title>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Всего марок"
            value={mockMetrics.totalMarks}
            icon={<QrcodeOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Активные"
            value={mockMetrics.activeMarks}
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Заблокированные"
            value={mockMetrics.blockedMarks}
            icon={<StopOutlined style={{ color: '#faad14' }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Истекшие"
            value={mockMetrics.expiredMarks}
            icon={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
          />
        </Col>
      </Row>

      {/* Activity Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <MetricCard
            title="Сгенерировано сегодня"
            value={mockMetrics.todayGenerated}
            icon={<QrcodeOutlined />}
            trend={mockMetrics.generatedTrend}
          />
        </Col>
        <Col xs={24} sm={12}>
          <MetricCard
            title="Валидировано сегодня"
            value={mockMetrics.todayValidated}
            icon={<CheckCircleOutlined />}
            trend={mockMetrics.validatedTrend}
          />
        </Col>
      </Row>

      {/* Charts Placeholders */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Тренды генерации" bordered={false}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Add Recharts LineChart here */}
              <Typography.Text type="secondary">
                График трендов (добавить Recharts)
              </Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам" bordered={false}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Add Recharts PieChart here */}
              <Typography.Text type="secondary">
                Pie chart (добавить Recharts)
              </Typography.Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;


