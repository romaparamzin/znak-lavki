import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip, Searchbar, Surface } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { useScanHistory } from '../services/api/queries';

const ScanHistoryScreen = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const localHistory = useAppSelector((state) => state.scanner.scanHistory);
  const { data: remoteHistory, isLoading } = useScanHistory(page, 20);

  // Combine local and remote history
  const history = localHistory.length > 0 ? localHistory : remoteHistory?.scans || [];

  const filteredHistory = history.filter(
    (item: any) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.productInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'accepted':
        return '#10B981';
      case 'expired':
      case 'rejected':
        return '#EF4444';
      case 'blocked':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const renderItem = ({ item }: any) => {
    const productInfo = item.productInfo || {};
    const status = productInfo.validationStatus || productInfo.status || 'unknown';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text variant="titleMedium" style={styles.productName}>
                {productInfo.name || 'Unknown Product'}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
                textStyle={styles.statusChipText}
              >
                {t(`product.${status}`) || status}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text variant="bodyMedium" style={styles.code}>
              {item.code}
            </Text>
            {productInfo.sku && (
              <Text variant="bodySmall" style={styles.sku}>
                SKU: {productInfo.sku}
              </Text>
            )}
          </View>

          {!item.synced && (
            <Chip icon="sync" style={styles.syncChip} textStyle={styles.syncChipText} compact>
              Pending Sync
            </Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Searchbar
          placeholder="Search by code or product name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </Surface>

      {filteredHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyIcon}>
            📋
          </Text>
          <Text variant="titleMedium" style={styles.emptyText}>
            No scan history
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Your scanned products will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={() => setPage(1)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: 'white',
    fontSize: 11,
  },
  timestamp: {
    color: '#666',
  },
  cardInfo: {
    marginTop: 8,
  },
  code: {
    fontFamily: 'monospace',
    color: '#4F46E5',
  },
  sku: {
    color: '#666',
    marginTop: 4,
  },
  syncChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FEF3C7',
  },
  syncChipText: {
    color: '#92400E',
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
});

export default ScanHistoryScreen;
