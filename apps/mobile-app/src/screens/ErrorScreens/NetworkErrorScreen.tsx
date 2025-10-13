import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';

type RouteType = RouteProp<MainStackParamList, 'NetworkError'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'NetworkError'>;

const NetworkErrorScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const isOnline = useAppSelector((state) => state.offlineSync.isOnline);
  const pendingItems = useAppSelector((state) => state.offlineSync.queue.length);

  const handleRetry = () => {
    if (route.params?.onRetry) {
      route.params.onRetry();
    }
    navigation.goBack();
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📡</Text>
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          {t('errors.networkError')}
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          {t('errors.networkErrorMessage')}
        </Text>

        <Surface style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text variant="labelLarge">Connection Status:</Text>
            <View style={styles.statusIndicator}>
              <View
                style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]}
              />
              <Text
                variant="bodyMedium"
                style={[styles.statusText, { color: isOnline ? '#10B981' : '#EF4444' }]}
              >
                {isOnline ? t('sync.online') : t('sync.offline')}
              </Text>
            </View>
          </View>

          {pendingItems > 0 && (
            <View style={styles.statusRow}>
              <Text variant="labelLarge">Pending Sync:</Text>
              <Text variant="bodyMedium" style={styles.pendingText}>
                {pendingItems} {t('sync.pendingSync')}
              </Text>
            </View>
          )}
        </Surface>

        <View style={styles.infoBox}>
          <Text variant="bodyMedium" style={styles.infoText}>
            💡 <Text style={styles.boldText}>Offline Mode:</Text> You can continue scanning
            products. All data will be automatically synced when connection is restored.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button mode="contained" onPress={handleRetry} style={styles.button} icon="reload">
            {t('errors.retry')}
          </Button>
          <Button mode="outlined" onPress={handleGoHome} style={styles.button}>
            Go to Home
          </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  surface: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statusBox: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontWeight: '600',
  },
  pendingText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  infoBox: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    color: '#1E40AF',
  },
  boldText: {
    fontWeight: 'bold',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 6,
  },
});

export default NetworkErrorScreen;
