/**
 * Trends Chart Component
 * Line chart showing marks generation and validation trends
 */

import { Card } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendsChartProps {
  data: Array<{
    date: string;
    generated: number;
    validated: number;
    blocked: number;
  }>;
  loading?: boolean;
}

export const TrendsChart = ({ data, loading }: TrendsChartProps) => {
  return (
    <Card title="Тренды" loading={loading} bordered={false}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="generated"
            stroke="#1890ff"
            strokeWidth={2}
            name="Создано"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="validated"
            stroke="#52c41a"
            strokeWidth={2}
            name="Валидировано"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="blocked"
            stroke="#ff4d4f"
            strokeWidth={2}
            name="Заблокировано"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

