/**
 * Analytics Page
 * Charts and statistics
 */

import { Card, Row, Col, Typography } from 'antd';

const { Title } = Typography;

const Analytics = () => {
  return (
    <div>
      <Title level={2}>Аналитика</Title>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Тренды генерации марок">
            {/* TODO: Add Recharts LineChart */}
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Здесь будет график трендов (Recharts)
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Распределение по статусам">
            {/* TODO: Add Recharts PieChart */}
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Pie Chart (Recharts)
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Статистика валидации">
            {/* TODO: Add Recharts BarChart */}
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Bar Chart (Recharts)
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;


