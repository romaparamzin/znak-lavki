/**
 * Responsive Test Page
 * For debugging responsive design
 */

import { Card, Tag, Grid, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ResponsiveTest = () => {
  const screens = useBreakpoint();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Тест адаптивности</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Window Size */}
        <Card title="Размер окна" size="small">
          <Space direction="vertical">
            <Text>
              <strong>Ширина:</strong> {windowSize.width}px
            </Text>
            <Text>
              <strong>Высота:</strong> {windowSize.height}px
            </Text>
          </Space>
        </Card>

        {/* Breakpoints */}
        <Card title="Breakpoints Ant Design" size="small">
          <Space wrap>
            <Tag color={screens.xs ? 'green' : 'default'}>
              xs (&lt;576px): {screens.xs ? '✅' : '❌'}
            </Tag>
            <Tag color={screens.sm ? 'green' : 'default'}>
              sm (≥576px): {screens.sm ? '✅' : '❌'}
            </Tag>
            <Tag color={screens.md ? 'green' : 'default'}>
              md (≥768px): {screens.md ? '✅' : '❌'}
            </Tag>
            <Tag color={screens.lg ? 'green' : 'default'}>
              lg (≥992px): {screens.lg ? '✅' : '❌'}
            </Tag>
            <Tag color={screens.xl ? 'green' : 'default'}>
              xl (≥1200px): {screens.xl ? '✅' : '❌'}
            </Tag>
            <Tag color={screens.xxl ? 'green' : 'default'}>
              xxl (≥1600px): {screens.xxl ? '✅' : '❌'}
            </Tag>
          </Space>
        </Card>

        {/* Device Type */}
        <Card title="Тип устройства" size="small">
          <Space direction="vertical">
            <Tag color={isMobile ? 'blue' : 'default'} style={{ fontSize: 16 }}>
              📱 Мобильное: {isMobile ? '✅ ДА' : '❌ НЕТ'}
            </Tag>
            <Tag color={isTablet ? 'blue' : 'default'} style={{ fontSize: 16 }}>
              💻 Планшет: {isTablet ? '✅ ДА' : '❌ НЕТ'}
            </Tag>
            <Tag color={isDesktop ? 'blue' : 'default'} style={{ fontSize: 16 }}>
              🖥️ Десктоп: {isDesktop ? '✅ ДА' : '❌ НЕТ'}
            </Tag>
          </Space>
        </Card>

        {/* CSS Media Queries */}
        <Card title="CSS Media Queries" size="small">
          <Space direction="vertical">
            <div className="mobile-only" style={{ display: 'none' }}>
              <Tag color="blue">Мобильная версия CSS</Tag>
            </div>
            <div className="desktop-only" style={{ display: 'none' }}>
              <Tag color="green">Десктоп версия CSS</Tag>
            </div>
            <style>{`
              @media (max-width: 767px) {
                .mobile-only { display: block !important; }
              }
              @media (min-width: 992px) {
                .desktop-only { display: block !important; }
              }
            `}</style>
          </Space>
        </Card>

        {/* Responsive Behavior */}
        <Card title="Поведение интерфейса" size="small">
          <Space direction="vertical">
            <Text>• Сайдбар: {isMobile ? 'Drawer (выдвижное меню)' : 'Fixed (фиксированное)'}</Text>
            <Text>• Таблица: {isMobile ? 'Scroll + скрытые колонки' : 'Полная'}</Text>
            <Text>• Кнопки: {isMobile ? 'Компактные / Иконки' : 'Полные'}</Text>
            <Text>• Фильтры: {isMobile ? 'Скрываемые (кнопка)' : 'Видимые'}</Text>
            <Text>• Пагинация: {isMobile ? 'Простая' : 'Полная'}</Text>
          </Space>
        </Card>

        {/* Instructions */}
        <Card title="Как тестировать" type="inner">
          <Space direction="vertical">
            <Text>1. Откройте DevTools (F12 или Cmd+Opt+I)</Text>
            <Text>2. Включите Device Toolbar (Cmd+Shift+M)</Text>
            <Text>3. Выберите устройство:</Text>
            <Text style={{ paddingLeft: 20 }}>• iPhone SE (375px) - должно быть Мобильное ✅</Text>
            <Text style={{ paddingLeft: 20 }}>• iPad (768px) - должно быть Планшет ✅</Text>
            <Text style={{ paddingLeft: 20 }}>• Desktop (1920px) - должно быть Десктоп ✅</Text>
            <Text>4. Вернитесь на страницу /marks и проверьте:</Text>
            <Text style={{ paddingLeft: 20 }}>• На мобильном: бургер-меню, скрытые колонки</Text>
            <Text style={{ paddingLeft: 20 }}>• На десктопе: полный сайдбар, все колонки</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ResponsiveTest;
