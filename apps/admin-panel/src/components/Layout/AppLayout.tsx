/**
 * Main Application Layout
 * Contains sidebar, header, and content area
 * Fully responsive for mobile, tablet, and desktop
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Space,
  Typography,
  Switch,
  Drawer,
  Grid,
} from 'antd';
import {
  DashboardOutlined,
  QrcodeOutlined,
  BarChartOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const screens = useBreakpoint();

  // Determine if we're on mobile/tablet
  const isMobile = !screens.md; // md breakpoint is 768px
  const isTablet = screens.md && !screens.lg; // lg breakpoint is 992px

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Дашборд',
    },
    {
      key: '/marks',
      icon: <QrcodeOutlined />,
      label: 'Марки',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Аналитика',
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: 'Аудит',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Handle menu navigation
  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false); // Close drawer on mobile after navigation
    }
  };

  // Sidebar/Menu content
  const menuContent = (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Text strong style={{ fontSize: isMobile ? 18 : sidebarCollapsed ? 16 : 18 }}>
          {isMobile || !sidebarCollapsed ? 'Знак Лавки' : 'ZL'}
        </Text>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ borderRight: 0 }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          theme={theme === 'dark' ? 'dark' : 'light'}
          breakpoint="lg"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          {menuContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        title="Знак Лавки"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        bodyStyle={{ padding: 0 }}
        width={250}
      >
        {menuContent}
      </Drawer>

      {/* Main Layout */}
      <Layout style={{ marginLeft: isMobile ? 0 : sidebarCollapsed ? 80 : 200 }}>
        {/* Header */}
        <Header
          style={{
            padding: isMobile ? '0 16px' : '0 24px',
            background: theme === 'dark' ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuUnfoldOutlined />
                ) : sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={isMobile ? () => setMobileDrawerOpen(true) : toggleSidebar}
              style={{ fontSize: 16 }}
            />
            {isMobile && (
              <Text strong style={{ fontSize: 16 }}>
                Знак Лавки
              </Text>
            )}
          </Space>

          <Space size={isMobile ? 'small' : 'large'}>
            {/* Theme toggle - Hidden on small mobile */}
            {!isMobile && (
              <Space>
                <SunOutlined />
                <Switch
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                />
              </Space>
            )}

            {/* User menu */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={isMobile ? 'small' : 'default'}
                  icon={<UserOutlined />}
                  src={user?.avatarUrl}
                />
                {!isMobile && <Text>{user?.name || 'User'}</Text>}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: isMobile ? '16px 8px' : isTablet ? '20px 16px' : '24px',
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: theme === 'dark' ? '#1f1f1f' : '#f0f2f5',
            borderRadius: isMobile ? 4 : 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
