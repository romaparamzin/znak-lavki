import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export type PermissionType = 'camera' | 'notifications' | 'location';

export const PERMISSION_MAP: Record<PermissionType, Permission> = {
  camera: Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  })!,
  notifications: Platform.select({
    ios: PERMISSIONS.IOS.NOTIFICATIONS,
    android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  })!,
  location: Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  })!,
};

export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  const permission = PERMISSION_MAP[type];
  if (!permission) return false;

  try {
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  const permission = PERMISSION_MAP[type];
  if (!permission) return false;

  try {
    // First check current status
    const currentStatus = await check(permission);

    if (currentStatus === RESULTS.GRANTED) {
      return true;
    }

    if (currentStatus === RESULTS.BLOCKED) {
      // Show alert to open settings
      showSettingsAlert(type);
      return false;
    }

    // Request permission
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
};

const showSettingsAlert = (type: PermissionType) => {
  const messages = {
    camera: 'Camera access is required to scan barcodes. Please enable it in Settings.',
    notifications: 'Notification access is required for alerts. Please enable it in Settings.',
    location: 'Location access is required. Please enable it in Settings.',
  };

  Alert.alert('Permission Required', messages[type], [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
};

export const checkMultiplePermissions = async (
  types: PermissionType[]
): Promise<Record<PermissionType, boolean>> => {
  const results: Record<string, boolean> = {};

  for (const type of types) {
    results[type] = await checkPermission(type);
  }

  return results as Record<PermissionType, boolean>;
};

export const requestMultiplePermissions = async (
  types: PermissionType[]
): Promise<Record<PermissionType, boolean>> => {
  const results: Record<string, boolean> = {};

  for (const type of types) {
    results[type] = await requestPermission(type);
  }

  return results as Record<PermissionType, boolean>;
};
