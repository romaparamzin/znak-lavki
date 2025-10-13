/**
 * Login Page
 * OAuth login with Yandex
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Typography, Space, message } from 'antd';
import { LoginOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, isAuthenticated } = useAuthStore();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_success', code }, window.location.origin);
        window.close();
      }
    }

    const error = searchParams.get('error');
    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_error', error }, window.location.origin);
        window.close();
      }
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      message.success('Вход выполнен успешно!');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.message || 'Ошибка входа');
    }
  };

  // Development mode: bypass OAuth
  const handleDevLogin = () => {
    // Mock user data for development
    const mockUser = {
      id: 'dev-user',
      email: 'admin@znak-lavki.com',
      name: 'Admin User',
      avatar: '',
      role: 'admin' as const,
      permissions: [
        'marks:read',
        'marks:write',
        'marks:delete',
        'analytics:read',
        'settings:write',
      ] as any[],
    };

    const mockTokens = {
      accessToken: 'dev-mock-token',
      refreshToken: 'dev-mock-refresh-token',
    };

    // Save to localStorage
    localStorage.setItem('accessToken', mockTokens.accessToken);
    localStorage.setItem('refreshToken', mockTokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    message.success('Вход в режиме разработки');
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
            <QrcodeOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2} style={{ marginTop: 16 }}>
              Знак Лавки
            </Title>
            <Text type="secondary">Административная панель управления марками</Text>
          </div>

          {/* Login button */}
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            loading={isLoading}
            onClick={handleLogin}
            block
          >
            Войти через Yandex
          </Button>

          {/* Development Mode Login */}
          <Button
            size="large"
            onClick={handleDevLogin}
            block
            style={{
              marginTop: 8,
              borderStyle: 'dashed',
              backgroundColor: '#f0f2f5',
            }}
          >
            🔧 Режим разработки (без OAuth)
          </Button>

          {/* Info */}
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Вход осуществляется через OAuth Yandex
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11, color: '#ff4d4f' }}>
              Режим разработки для тестирования без OAuth
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
