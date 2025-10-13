import * as Sentry from '@sentry/react-native';
import { store } from '../../store';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private enabled: boolean = true;

  initialize() {
    const analyticsEnabled = store.getState().settings.analyticsEnabled;
    this.enabled = analyticsEnabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Track screen views
  trackScreenView(screenName: string, params?: Record<string, any>) {
    if (!this.enabled) return;

    console.log(`[Analytics] Screen View: ${screenName}`, params);

    // Here you would integrate with your analytics provider (e.g., Firebase Analytics, Amplitude)
    // Example: analytics().logScreenView({ screen_name: screenName, ...params });

    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Viewed ${screenName}`,
      level: 'info',
      data: params,
    });
  }

  // Track events
  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    const { category, action, label, value, metadata } = event;

    console.log(`[Analytics] Event:`, {
      category,
      action,
      label,
      value,
      metadata,
    });

    // Example: analytics().logEvent(action, { category, label, value, ...metadata });

    Sentry.addBreadcrumb({
      category: 'user-action',
      message: `${category}: ${action}`,
      level: 'info',
      data: { label, value, ...metadata },
    });
  }

  // Track scan events
  trackScan(code: string, productName?: string, status?: string) {
    this.trackEvent({
      category: 'scanner',
      action: 'scan_product',
      label: productName || code,
      metadata: {
        code,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track validation events
  trackValidation(action: 'accept' | 'reject' | 'report', productId: string) {
    this.trackEvent({
      category: 'validation',
      action: `product_${action}`,
      label: productId,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track sync events
  trackSync(itemCount: number, success: boolean) {
    this.trackEvent({
      category: 'sync',
      action: success ? 'sync_success' : 'sync_failed',
      value: itemCount,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    console.error('[Analytics] Error:', error, context);

    Sentry.captureException(error, {
      extra: context,
    });
  }

  // Track user properties
  setUserProperties(userId: string, properties: Record<string, any>) {
    if (!this.enabled) return;

    console.log(`[Analytics] User Properties:`, { userId, properties });

    // Example: analytics().setUserId(userId);
    // Example: analytics().setUserProperties(properties);

    Sentry.setUser({
      id: userId,
      ...properties,
    });
  }

  // Track performance
  trackTiming(category: string, variable: string, duration: number) {
    if (!this.enabled) return;

    console.log(`[Analytics] Timing:`, { category, variable, duration });

    // Example: analytics().logTiming({ category, variable, duration });
  }
}

export const analyticsService = new AnalyticsService();
