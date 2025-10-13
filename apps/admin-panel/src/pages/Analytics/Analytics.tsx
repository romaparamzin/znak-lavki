/**
 * Analytics Page
 * Charts and statistics connected to backend API
 */

import { useState } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Select, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import {
  useTrends,
  useStatusDistribution,
  useValidationStats,
} from '../../hooks/useAnalytics';

const { Title } = Typography;
const { Option } = Select;

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

const Analytics = () => {
  const [trendDays, setTrendDays] = useState(30);
  const [validationDays, setValidationDays] = useState(7);

  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useTrends(trendDays);
  const { data: statusData, isLoading: statusLoading, error: statusError } = useStatusDistribution();
  const { data: validationData, isLoading: validationLoading, error: validationError } = useValidationStats(validationDays);

  return (
    <div>
      <Title level={2}>Аналитика</Title>

      <Row gutter={[16, 16]}>
        {/* Тренды генерации марок */}
        <Col span={24}>
          <Card
            title="Тренды генерации и валидации марок"
            extra={
              <Select value={trendDays} onChange={setTrendDays} style={{ width: 120 }}>
                <Option value={7}>7 дней</Option>
                <Option value={14}>14 дней</Option>
                <Option value={30}>30 дней</Option>
                <Option value={90}>90 дней</Option>
              </Select>
            }
          >
            {trendsLoading && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              </div>
            )}

            {trendsError && (
              <Alert
                message="Ошибка загрузки"
                description={(trendsError as Error).message}
                type="error"
                showIcon
              />
            )}

            {!trendsLoading && !trendsError && trendsData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="validated"
                    stroke="#52c41a"
                    name="Валидировано"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Распределение по статусам */}
        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам">
            {statusLoading && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              </div>
            )}

            {statusError && (
              <Alert
                message="Ошибка загрузки"
                description={(statusError as Error).message}
                type="error"
                showIcon
              />
            )}

            {!statusLoading && !statusError && statusData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${STATUS_LABELS[status] || status}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry) => (
                      <Cell key={`cell-${entry.status}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} марок (${props.payload.percentage}%)`,
                      STATUS_LABELS[props.payload.status] || props.payload.status,
                    ]}
                  />
                  <Legend
                    formatter={(value, entry: any) => STATUS_LABELS[entry.payload.status] || entry.payload.status}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Статистика валидации */}
        <Col xs={24} lg={12}>
          <Card
            title="Статистика валидации"
            extra={
              <Select value={validationDays} onChange={setValidationDays} style={{ width: 120 }}>
                <Option value={7}>7 дней</Option>
                <Option value={14}>14 дней</Option>
                <Option value={30}>30 дней</Option>
              </Select>
            }
          >
            {validationLoading && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              </div>
            )}

            {validationError && (
              <Alert
                message="Ошибка загрузки"
                description={(validationError as Error).message}
                type="error"
                showIcon
              />
            )}

            {!validationLoading && !validationError && validationData && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={validationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  <Bar dataKey="validations" fill="#1890ff" name="Валидаций" />
                  <Bar dataKey="uniqueMarks" fill="#52c41a" name="Уникальных марок" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;




