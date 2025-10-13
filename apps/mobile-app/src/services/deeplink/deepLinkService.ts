import { Linking, Platform } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

class DeepLinkService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;
  private initialURL: string | null = null;
  private linkingListener: any = null;

  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  async initialize() {
    // Get the initial URL if the app was opened from a deep link
    this.initialURL = await Linking.getInitialURL();

    if (this.initialURL) {
      this.handleDeepLink(this.initialURL);
    }

    // Listen for deep links while the app is running
    this.linkingListener = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });
  }

  cleanup() {
    if (this.linkingListener) {
      this.linkingListener.remove();
    }
  }

  private handleDeepLink(url: string) {
    if (!this.navigationRef) {
      console.warn('Navigation ref not set');
      return;
    }

    console.log('Deep link received:', url);

    // Parse the URL
    const route = this.parseDeepLink(url);

    if (route) {
      // Navigate to the parsed route
      this.navigate(route);
    }
  }

  private parseDeepLink(url: string): { screen: string; params?: any } | null {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const params: any = {};

      // Parse query parameters
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // Route patterns
      // znak-lavki://scan
      if (path === '/scan') {
        return { screen: 'Scan', params };
      }

      // znak-lavki://product/:code
      if (path.startsWith('/product/')) {
        const code = path.split('/')[2];
        return {
          screen: 'ProductValidation',
          params: { code, ...params },
        };
      }

      // znak-lavki://history
      if (path === '/history') {
        return { screen: 'ScanHistory', params };
      }

      // znak-lavki://settings
      if (path === '/settings') {
        return { screen: 'Settings', params };
      }

      return null;
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }

  private navigate(route: { screen: string; params?: any }) {
    if (!this.navigationRef) {
      return;
    }

    try {
      // Check if user is authenticated
      const currentRoute = this.navigationRef.getCurrentRoute();

      if (currentRoute?.name === 'Auth') {
        // Store the route to navigate after login
        console.log('User not authenticated, storing route for later');
        return;
      }

      // Navigate to the route
      this.navigationRef.navigate('Main' as any, {
        screen: route.screen,
        params: route.params,
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  // Generate deep links
  generateDeepLink(screen: string, params?: Record<string, string>): string {
    const baseUrl = 'znak-lavki://';
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';

    switch (screen) {
      case 'Scan':
        return `${baseUrl}scan${queryString}`;
      case 'ProductValidation':
        return `${baseUrl}product/${params?.code || ''}${queryString}`;
      case 'ScanHistory':
        return `${baseUrl}history${queryString}`;
      case 'Settings':
        return `${baseUrl}settings${queryString}`;
      default:
        return baseUrl;
    }
  }

  // Share functionality
  async shareDeepLink(screen: string, params?: Record<string, string>) {
    const deepLink = this.generateDeepLink(screen, params);

    try {
      const { Share } = await import('react-native');
      await Share.share({
        message: deepLink,
        url: deepLink,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }
}

export const deepLinkService = new DeepLinkService();
