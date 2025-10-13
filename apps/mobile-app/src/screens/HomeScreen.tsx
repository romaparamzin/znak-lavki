import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Surface, Chip, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { useStats } from '../services/api/queries';
import { syncService } from '../services/offline/syncService';
import NetInfo from '@react-native-community/netinfo';
import { setOnlineStatus } from '../store/slices/offlineSyncSlice';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const scanStats = useAppSelector((state) => ({
    today: state.scanner.totalScansToday,
    total: state.scanner.totalScans,
  }));
  const syncState = useAppSelector((state) => state.offlineSync);
  const autoSyncEnabled = useAppSelector((state) => state.settings.autoSyncEnabled);

  const { data: statsData, isLoading, refetch } = useStats();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(setOnlineStatus(state.isConnected ?? false));
    });

    // Start auto sync if enabled
    if (autoSyncEnabled) {
      syncService.startAutoSync();
    }

    return () => {
      unsubscribe();
      syncService.stopAutoSync();
    };
  }, [autoSyncEnabled, dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    if (syncState.isOnline) {
      await syncService.forceSyncNow();
    }
    setRefreshing(false);
  }, [refetch, syncState.isOnline]);

  const handleScan = () => {
    navigation.navigate('Scan');
  };

  const handleViewHistory = () => {
    navigation.navigate('ScanHistory');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text variant="headlineMedium" style={styles.greeting}>
                Welcome back,
              </Text>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.name || 'User'}
              </Text>
            </View>
            <Button icon="cog" mode="outlined" onPress={handleSettings}>
              {t('settings.title')}
            </Button>
          </View>

          {/* Status Bar */}
          <View style={styles.statusBar}>
            <Chip
              icon={syncState.isOnline ? 'wifi' : 'wifi-off'}
              style={[
                styles.statusChip,
                { backgroundColor: syncState.isOnline ? '#DEF7EC' : '#FEE2E2' },
              ]}
              textStyle={{
                color: syncState.isOnline ? '#03543F' : '#991B1B',
              }}
            >
              {syncState.isOnline ? t('sync.online') : t('sync.offline')}
            </Chip>
            {syncState.queue.length > 0 && (
              <Chip
                icon="sync"
                style={[styles.statusChip, { backgroundColor: '#FEF3C7' }]}
                textStyle={{ color: '#92400E' }}
              >
                {syncState.queue.length} {t('sync.pendingSync')}
              </Chip>
            )}
          </View>
        </Surface>

        {/* Quick Action */}
        <View style={styles.content}>
          <Card style={styles.scanCard}>
            <Card.Content style={styles.scanCardContent}>
              <View>
                <Text variant="headlineSmall" style={styles.scanTitle}>
                  {t('scanner.scanBarcode')}
                </Text>
                <Text variant="bodyMedium" style={styles.scanSubtitle}>
                  Scan products to validate quality
                </Text>
              </View>
              <Button
                mode="contained"
                icon="barcode-scan"
                onPress={handleScan}
                style={styles.scanButton}
              >
                {t('scanner.title')}
              </Button>
            </Card.Content>
          </Card>

          {/* Statistics */}
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t('stats.today')}
          </Text>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="displaySmall" style={styles.statNumber}>
                  {scanStats.today}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  {t('stats.scannedToday')}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="displaySmall" style={styles.statNumber}>
                  {scanStats.total}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  {t('stats.totalScans')}
                </Text>
              </Card.Content>
            </Card>
          </View>

          {statsData && (
            <View style={styles.statsGrid}>
              <Card style={[styles.statCard, styles.acceptedCard]}>
                <Card.Content>
                  <Text variant="headlineMedium" style={styles.acceptedNumber}>
                    {statsData.accepted}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('stats.accepted')}
                  </Text>
                </Card.Content>
              </Card>

              <Card style={[styles.statCard, styles.rejectedCard]}>
                <Card.Content>
                  <Text variant="headlineMedium" style={styles.rejectedNumber}>
                    {statsData.rejected}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('stats.rejected')}
                  </Text>
                </Card.Content>
              </Card>

              <Card style={[styles.statCard, styles.pendingCard]}>
                <Card.Content>
                  <Text variant="headlineMedium" style={styles.pendingNumber}>
                    {statsData.pending}
                  </Text>
                  <Text variant="bodyMedium" style={styles.statLabel}>
                    {t('stats.pending')}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.recentSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Activity
            </Text>
            <Button mode="outlined" onPress={handleViewHistory} icon="history">
              {t('scanner.scanHistory')}
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB icon="barcode-scan" style={styles.fab} onPress={handleScan} label="Scan" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: '#666',
  },
  userName: {
    color: '#111',
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  content: {
    padding: 16,
  },
  scanCard: {
    marginBottom: 24,
    backgroundColor: '#4F46E5',
  },
  scanCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanTitle: {
    color: 'white',
    marginBottom: 4,
  },
  scanSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scanButton: {
    backgroundColor: 'white',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statNumber: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  acceptedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  acceptedNumber: {
    color: '#10B981',
  },
  rejectedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectedNumber: {
    color: '#EF4444',
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingNumber: {
    color: '#F59E0B',
  },
  recentSection: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
});

export default HomeScreen;
