/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  createdAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum Permission {
  // Marks
  MARKS_VIEW = 'marks:view',
  MARKS_CREATE = 'marks:create',
  MARKS_BLOCK = 'marks:block',
  MARKS_UNBLOCK = 'marks:unblock',
  MARKS_DELETE = 'marks:delete',
  MARKS_EXPORT = 'marks:export',
  MARKS_BULK_OPS = 'marks:bulk_ops',
  
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  
  // Audit
  AUDIT_VIEW = 'audit:view',
  
  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  
  // Users
  USERS_VIEW = 'users:view',
  USERS_MANAGE = 'users:manage',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}




