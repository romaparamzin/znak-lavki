import { store } from '../../store';
import {
  startSync,
  finishSync,
  removeFromQueue,
  incrementRetry,
  SyncQueueItem,
} from '../../store/slices/offlineSyncSlice';
import { apiClient } from '../api/client';
import * as Sentry from '@sentry/react-native';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  startAutoSync(intervalMs: number = 60000) {
    if (this.syncInterval) {
      return;
    }

    this.syncInterval = setInterval(() => {
      this.syncQueue();
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncQueue() {
    if (this.isSyncing) {
      return;
    }

    const state = store.getState();
    const { isOnline, queue } = state.offlineSync;

    if (!isOnline || queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    store.dispatch(startSync());

    try {
      const syncPromises = queue.map((item) => this.syncItem(item));
      await Promise.allSettled(syncPromises);
    } catch (error) {
      console.error('Sync queue error:', error);
      Sentry.captureException(error);
    } finally {
      this.isSyncing = false;
      store.dispatch(finishSync());
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      switch (item.type) {
        case 'scan':
          await this.syncScan(item);
          break;
        case 'validation':
          await this.syncValidation(item);
          break;
        case 'report':
          await this.syncReport(item);
          break;
        default:
          console.warn('Unknown sync item type:', item.type);
      }

      // Success - remove from queue
      store.dispatch(removeFromQueue(item.id));
    } catch (error: any) {
      console.error(`Failed to sync item ${item.id}:`, error);

      // Increment retry count
      store.dispatch(
        incrementRetry({
          id: item.id,
          error: error.message || 'Unknown error',
        })
      );
    }
  }

  private async syncScan(item: SyncQueueItem): Promise<void> {
    await apiClient.post('/scans', item.data);
  }

  private async syncValidation(item: SyncQueueItem): Promise<void> {
    await apiClient.post('/validations', item.data);
  }

  private async syncReport(item: SyncQueueItem): Promise<void> {
    await apiClient.post('/reports', item.data);
  }

  async forceSyncNow(): Promise<void> {
    await this.syncQueue();
  }
}

export const syncService = new SyncService();
