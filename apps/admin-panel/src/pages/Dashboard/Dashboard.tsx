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
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardMetrics } from '../../hooks/useDashboard';
import { useTrends, useStatusDistribution } from '../../hooks/useAnalytics';

const { Title } = Typography;

// Цвета для статусов
const STATUS_COLORS: Record<string, string> = {
  active: '#52c41a',
  blocked: '#faad14',
  expired: '#ff4d4f',
  used: '#1890ff',
};

// Русские названия статусов
const STATUS_LABELS: Record<string, string> = {
  active: 'Активные',
  blocked: 'Заблокированные',
  expired: 'Истекшие',
  used: 'Использованные',
};

const Dashboard = () => {
  // Fetch real data from API
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const { data: trendsData, isLoading: trendsLoading } = useTrends(7);
  const { data: statusData, isLoading: statusLoading } = useStatusDistribution();

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

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Тренды генерации (7 дней)" bordered={false}>
            {trendsLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
              </div>
            ) : trendsData && trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('ru-RU');
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="generated"
                    stroke="#1890ff"
                    name="Сгенерировано"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="validated"
                    stroke="#52c41a"
                    name="Валидировано"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Typography.Text type="secondary">Нет данных за последние 7 дней</Typography.Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам" bordered={false}>
            {statusLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
              </div>
            ) : statusData && statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) =>
                      percentage > 0 ? `${STATUS_LABELS[status] || status}: ${percentage}%` : ''
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry) => (
                      <Cell key={`cell-${entry.status}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value} марок (${props.payload.percentage}%)`,
                      STATUS_LABELS[props.payload.status] || props.payload.status,
                    ]}
                  />
                  <Legend
                    formatter={(_value, entry: any) =>
                      STATUS_LABELS[entry.payload.status] || entry.payload.status
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Typography.Text type="secondary">Нет данных для отображения</Typography.Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
