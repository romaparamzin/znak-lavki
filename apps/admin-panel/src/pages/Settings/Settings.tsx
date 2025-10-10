/**
 * Settings Page
 */

import { Card, Typography } from 'antd';

const { Title } = Typography;

const Settings = () => {
  return (
    <div>
      <Title level={2}>Настройки</Title>
      <Card>
        <Typography.Text>Страница настроек (TODO: добавить форму настроек)</Typography.Text>
      </Card>
    </div>
  );
};

export default Settings;


