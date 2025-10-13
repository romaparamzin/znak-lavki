/**
 * Validation Bar Chart
 * Shows validation statistics
 */

import { Card } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ValidationBarChartProps {
  data: Array<{
    date: string;
    valid: number;
    invalid: number;
  }>;
  loading?: boolean;
}

export const ValidationBarChart = ({ data, loading }: ValidationBarChartProps) => {
  return (
    <Card title="Статистика валидации" loading={loading} bordered={false}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="valid" fill="#52c41a" name="Валидные" />
          <Bar dataKey="invalid" fill="#ff4d4f" name="Невалидные" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};




