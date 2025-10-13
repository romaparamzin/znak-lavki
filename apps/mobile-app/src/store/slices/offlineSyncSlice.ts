import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SyncQueueItem {
  id: string;
  type: 'scan' | 'validation' | 'report';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  queue: SyncQueueItem[];
  lastSyncTime: string | null;
  failedItems: SyncQueueItem[];
}

const initialState: OfflineSyncState = {
  isOnline: true,
  isSyncing: false,
  queue: [],
  lastSyncTime: null,
  failedItems: [],
};

const offlineSyncSlice = createSlice({
  name: 'offlineSync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addToQueue: (state, action: PayloadAction<Omit<SyncQueueItem, 'retryCount'>>) => {
      state.queue.push({
        ...action.payload,
        retryCount: 0,
      });
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },
    startSync: (state) => {
      state.isSyncing = true;
    },
    finishSync: (state) => {
      state.isSyncing = false;
      state.lastSyncTime = new Date().toISOString();
    },
    incrementRetry: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const item = state.queue.find((item) => item.id === action.payload.id);
      if (item) {
        item.retryCount += 1;
        item.lastError = action.payload.error;

        // Move to failed items if retry count exceeds 3
        if (item.retryCount > 3) {
          state.failedItems.push(item);
          state.queue = state.queue.filter((i) => i.id !== action.payload.id);
        }
      }
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    clearFailedItems: (state) => {
      state.failedItems = [];
    },
    retryFailedItem: (state, action: PayloadAction<string>) => {
      const item = state.failedItems.find((item) => item.id === action.payload);
      if (item) {
        item.retryCount = 0;
        item.lastError = undefined;
        state.queue.push(item);
        state.failedItems = state.failedItems.filter((i) => i.id !== action.payload);
      }
    },
  },
});

export const {
  setOnlineStatus,
  addToQueue,
  removeFromQueue,
  startSync,
  finishSync,
  incrementRetry,
  clearQueue,
  clearFailedItems,
  retryFailedItem,
} = offlineSyncSlice.actions;

export default offlineSyncSlice.reducer;
