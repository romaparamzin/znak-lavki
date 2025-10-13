import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Surface, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setLanguage,
  setSoundEnabled,
  setVibrationEnabled,
  setAutoSyncEnabled,
  setTheme,
  setAnalyticsEnabled,
} from '../store/slices/settingsSlice';
import { setBiometricEnabled } from '../store/slices/authSlice';
import { logout } from '../store/slices/authSlice';
import { syncService } from '../services/offline/syncService';
import DeviceInfo from 'react-native-device-info';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const settings = useAppSelector((state) => state.settings);
  const biometricEnabled = useAppSelector((state) => state.auth.biometricEnabled);
  const user = useAppSelector((state) => state.auth.user);

  const handleLanguageChange = (lang: 'en' | 'ru' | 'es') => {
    dispatch(setLanguage(lang));
    i18n.changeLanguage(lang);
  };

  const handleSyncNow = async () => {
    try {
      await syncService.forceSyncNow();
      Alert.alert(t('common.success'), t('sync.syncComplete'));
    } catch (error) {
      Alert.alert(t('common.error'), t('sync.syncFailed'));
    }
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), 'Are you sure you want to logout?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <Surface style={styles.userSection}>
        <Text variant="titleLarge" style={styles.userName}>
          {user?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>
          {user?.email}
        </Text>
        <Text variant="bodySmall" style={styles.userRole}>
          {user?.role} • Warehouse {user?.warehouseId}
        </Text>
      </Surface>

      {/* General Settings */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          General
        </Text>

        <List.Section>
          <List.Accordion
            title={t('settings.language')}
            left={(props) => <List.Icon {...props} icon="translate" />}
          >
            <List.Item
              title="English"
              onPress={() => handleLanguageChange('en')}
              right={() => (settings.language === 'en' ? <List.Icon icon="check" /> : null)}
            />
            <List.Item
              title="Русский"
              onPress={() => handleLanguageChange('ru')}
              right={() => (settings.language === 'ru' ? <List.Icon icon="check" /> : null)}
            />
            <List.Item
              title="Español"
              onPress={() => handleLanguageChange('es')}
              right={() => (settings.language === 'es' ? <List.Icon icon="check" /> : null)}
            />
          </List.Accordion>
        </List.Section>

        <Divider />

        <List.Item
          title={t('settings.sound')}
          left={(props) => <List.Icon {...props} icon="volume-high" />}
          right={() => (
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => dispatch(setSoundEnabled(value))}
            />
          )}
        />

        <List.Item
          title={t('settings.vibration')}
          left={(props) => <List.Icon {...props} icon="vibrate" />}
          right={() => (
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => dispatch(setVibrationEnabled(value))}
            />
          )}
        />
      </Surface>

      {/* Security Settings */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Security
        </Text>

        <List.Item
          title={t('settings.biometric')}
          description="Use fingerprint or face recognition"
          left={(props) => <List.Icon {...props} icon="fingerprint" />}
          right={() => (
            <Switch
              value={biometricEnabled}
              onValueChange={(value) => dispatch(setBiometricEnabled(value))}
            />
          )}
        />
      </Surface>

      {/* Sync Settings */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('sync.syncing')}
        </Text>

        <List.Item
          title={t('settings.autoSync')}
          description="Automatically sync when online"
          left={(props) => <List.Icon {...props} icon="sync" />}
          right={() => (
            <Switch
              value={settings.autoSyncEnabled}
              onValueChange={(value) => dispatch(setAutoSyncEnabled(value))}
            />
          )}
        />

        <Button mode="outlined" onPress={handleSyncNow} style={styles.syncButton}>
          Sync Now
        </Button>
      </Surface>

      {/* Privacy Settings */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Privacy
        </Text>

        <List.Item
          title={t('settings.analytics')}
          description="Help improve the app"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={() => (
            <Switch
              value={settings.analyticsEnabled}
              onValueChange={(value) => dispatch(setAnalyticsEnabled(value))}
            />
          )}
        />
      </Surface>

      {/* About */}
      <Surface style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('settings.about')}
        </Text>

        <List.Item
          title={t('settings.version')}
          description={DeviceInfo.getVersion()}
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </Surface>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button mode="contained" onPress={handleLogout} style={styles.logoutButton} icon="logout">
          {t('auth.logout')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  userSection: {
    padding: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    color: '#999',
  },
  section: {
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  syncButton: {
    marginTop: 12,
  },
  logoutSection: {
    padding: 16,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
  },
});

export default SettingsScreen;
