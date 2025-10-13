import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

class PushNotificationService {
  constructor() {
    this.configure();
    this.createDefaultChannels();
  }

  configure() {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('FCM Token:', token);
        // Send token to backend
        this.sendTokenToBackend(token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);

        // Handle notification tap
        if (notification.userInteraction) {
          this.handleNotificationTap(notification);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      onAction: (notification) => {
        console.log('Notification action:', notification);
      },

      onRegistrationError: (err) => {
        console.error('Push notification registration error:', err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  createDefaultChannels() {
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: 'Default Channel',
        channelDescription: 'Default notification channel',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Default channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'alerts-channel',
        channelName: 'Alerts',
        channelDescription: 'Important alerts and warnings',
        playSound: true,
        soundName: 'alert',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created) => console.log(`Alerts channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'sync-channel',
        channelName: 'Sync Status',
        channelDescription: 'Synchronization status notifications',
        playSound: false,
        importance: Importance.LOW,
        vibrate: false,
      },
      (created) => console.log(`Sync channel created: ${created}`)
    );
  }

  async sendTokenToBackend(token: string) {
    try {
      // Send FCM token to your backend
      // await apiClient.post('/users/device-token', { token });
      console.log('Token sent to backend:', token);
    } catch (error) {
      console.error('Failed to send token to backend:', error);
    }
  }

  showLocalNotification(
    title: string,
    message: string,
    options: {
      channelId?: string;
      data?: any;
      playSound?: boolean;
      vibrate?: boolean;
    } = {}
  ) {
    const { channelId = 'default-channel', data = {}, playSound = true, vibrate = true } = options;

    PushNotification.localNotification({
      channelId,
      title,
      message,
      playSound,
      soundName: 'default',
      vibrate,
      vibration: 300,
      userInfo: data,
    });
  }

  showScanAlert(productName: string, status: 'valid' | 'expired' | 'blocked') {
    const messages = {
      valid: `${productName} is valid and ready for processing`,
      expired: `⚠️ ${productName} has expired!`,
      blocked: `🚫 ${productName} is blocked!`,
    };

    this.showLocalNotification(
      status === 'valid' ? '✅ Product Validated' : '⚠️ Product Alert',
      messages[status],
      {
        channelId: status === 'valid' ? 'default-channel' : 'alerts-channel',
        data: { type: 'scan', status },
      }
    );
  }

  showSyncNotification(status: 'start' | 'complete' | 'failed', itemCount?: number) {
    const messages = {
      start: 'Syncing data...',
      complete: `Successfully synced ${itemCount} items`,
      failed: 'Sync failed. Will retry later.',
    };

    this.showLocalNotification('Sync Status', messages[status], {
      channelId: 'sync-channel',
      playSound: false,
      vibrate: false,
    });
  }

  handleNotificationTap(notification: any) {
    const { type, ...data } = notification.data || {};

    switch (type) {
      case 'scan':
        // Navigate to scan details
        console.log('Navigate to scan:', data);
        break;
      case 'sync':
        // Navigate to sync status
        console.log('Navigate to sync:', data);
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  setBadgeNumber(number: number) {
    PushNotification.setApplicationIconBadgeNumber(number);
  }

  checkPermissions(callback: (permissions: any) => void) {
    PushNotification.checkPermissions(callback);
  }

  requestPermissions() {
    return PushNotification.requestPermissions();
  }
}

export const pushNotificationService = new PushNotificationService();
