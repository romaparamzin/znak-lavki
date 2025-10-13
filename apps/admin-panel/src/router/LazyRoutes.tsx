/**
 * Lazy Loading Routes Configuration
 * Implements code splitting for better initial load performance
 */

import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// ============================================
// LOADING FALLBACK
// ============================================
const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
    <div style={{ fontSize: 16, color: '#666' }}>Загрузка страницы...</div>
  </div>
);

// ============================================
// LAZY LOADED PAGES
// ============================================

// Authentication
export const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));

// Main pages
export const Dashboard = lazy(() => 
  import('../pages/Dashboard/Dashboard').then(module => ({
    default: module.default,
  }))
);

export const MarksPage = lazy(() => 
  import('../pages/Marks/MarksPage').then(module => ({
    default: module.default,
  }))
);

export const Analytics = lazy(() => 
  import('../pages/Analytics/Analytics').then(module => ({
    default: module.default,
  }))
);

export const AuditLog = lazy(() => 
  import('../pages/AuditLog/AuditLog').then(module => ({
    default: module.default,
  }))
);

// Testing/Demo pages
export const ResponsiveTest = lazy(() => 
  import('../pages/ResponsiveTest').then(module => ({
    default: module.default,
  }))
);

// ============================================
// LAZY WRAPPER COMPONENT
// ============================================
interface LazyWrapperProps {
  children: React.ReactNode;
}

export const LazyWrapper = ({ children }: LazyWrapperProps) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// ============================================
// PRELOAD FUNCTIONS
// ============================================

/**
 * Preload a page component
 * Call this on hover or user interaction to speed up navigation
 */
export const preloadComponent = (componentName: string) => {
  switch (componentName) {
    case 'Dashboard':
      return import('../pages/Dashboard/Dashboard');
    case 'MarksPage':
      return import('../pages/Marks/MarksPage');
    case 'Analytics':
      return import('../pages/Analytics/Analytics');
    case 'AuditLog':
      return import('../pages/AuditLog/AuditLog');
    default:
      return Promise.resolve();
  }
};

/**
 * Preload all critical pages
 * Call this after initial app load
 */
export const preloadCriticalPages = () => {
  // Preload Dashboard and MarksPage (most frequently accessed)
  setTimeout(() => {
    preloadComponent('Dashboard');
    preloadComponent('MarksPage');
  }, 2000); // Preload after 2 seconds
};

// ============================================
// USAGE IN ROUTER
// ============================================

/*
Example usage in Router:

import { 
  Dashboard, 
  MarksPage, 
  Analytics, 
  LazyWrapper 
} from './router/LazyRoutes';

<Routes>
  <Route path="/dashboard" element={
    <LazyWrapper>
      <Dashboard />
    </LazyWrapper>
  } />
  
  <Route path="/marks" element={
    <LazyWrapper>
      <MarksPage />
    </LazyWrapper>
  } />
</Routes>

// Preload on menu hover:
<Menu.Item 
  onMouseEnter={() => preloadComponent('Dashboard')}
>
  Dashboard
</Menu.Item>
*/

