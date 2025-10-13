import TouchID from 'react-native-touchid';
import { Platform } from 'react-native';

class BiometricService {
  async isSupported(): Promise<boolean> {
    try {
      await TouchID.isSupported();
      return true;
    } catch (error) {
      return false;
    }
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      const optionalConfigObject = {
        title: 'Authentication Required',
        imageColor: '#4F46E5',
        imageErrorColor: '#EF4444',
        sensorDescription: 'Touch sensor',
        sensorErrorDescription: 'Failed',
        cancelText: 'Cancel',
        fallbackLabel: 'Use Passcode',
        unifiedErrors: false,
        passcodeFallback: true,
      };

      await TouchID.authenticate(reason, optionalConfigObject);
      return true;
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);

      // Handle specific error cases
      if (error.name === 'LAErrorUserCancel') {
        return false;
      }

      if (error.name === 'LAErrorUserFallback') {
        // User chose to use passcode
        return false;
      }

      throw error;
    }
  }

  async getSupportedType(): Promise<'FaceID' | 'TouchID' | 'Fingerprint' | null> {
    try {
      const biometryType = await TouchID.isSupported();
      return biometryType as any;
    } catch (error) {
      return null;
    }
  }
}

export const biometricService = new BiometricService();
