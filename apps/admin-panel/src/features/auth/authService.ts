/**
 * Authentication Service
 * Handles OAuth with Yandex, token management, and permissions
 */

import { apiClient } from '../../lib/api-client';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';
import type { User, LoginResponse, Permission, OAuthConfig } from '../../types/auth.types';

export class AuthService {
  private oauthWindow: Window | null = null;

  /**
   * Initialize OAuth flow with Yandex
   */
  async login(): Promise<void> {
    const config: OAuthConfig = {
      clientId: API_CONFIG.OAUTH.YANDEX_CLIENT_ID,
      redirectUri: API_CONFIG.OAUTH.YANDEX_REDIRECT_URI,
      scope: ['login:email', 'login:info', 'login:avatar'],
    };

    const authUrl = this.buildAuthUrl(config);
    
    // Open OAuth window
    this.oauthWindow = window.open(
      authUrl,
      'yandex_oauth',
      'width=600,height=700,left=200,top=100'
    );

    // Listen for OAuth callback
    return new Promise((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'oauth_success') {
          window.removeEventListener('message', handleMessage);
          
          try {
            await this.handleOAuthCallback(event.data.code);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'oauth_error') {
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if window was closed
      const checkClosed = setInterval(() => {
        if (this.oauthWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('OAuth window was closed'));
        }
      }, 1000);
    });
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  private async handleOAuthCallback(code: string): Promise<void> {
    try {
      const response: LoginResponse = await apiClient.post(
        API_ENDPOINTS.AUTH.OAUTH_CALLBACK,
        { code }
      );

      this.saveAuthData(response);
    } catch (error) {
      throw new Error('Failed to authenticate with Yandex');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      window.location.href = '/login';
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });

    const { accessToken } = response;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  }

  /**
   * Check if user has permission
   */
  checkPermission(permission: Permission): boolean {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    try {
      const user: User = JSON.parse(userStr);
      return user.permissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Check if user has any of the permissions
   */
  checkAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.checkPermission(p));
  }

  /**
   * Check if user has all permissions
   */
  checkAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.checkPermission(p));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Get current user from storage
   */
  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Private methods

  private buildAuthUrl(config: OAuthConfig): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state: this.generateState(),
    });

    return `${API_CONFIG.OAUTH.YANDEX_AUTH_URL}?${params.toString()}`;
  }

  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  private saveAuthData(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// Export singleton instance
export const authService = new AuthService();

