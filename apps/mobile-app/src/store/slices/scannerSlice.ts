import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ScanResult {
  id: string;
  code: string;
  type: 'barcode' | 'qr';
  productInfo?: ProductInfo;
  timestamp: string;
  synced: boolean;
}

export interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  expiryDate?: string;
  status: 'valid' | 'expired' | 'blocked' | 'unknown';
  manufacturer?: string;
  category?: string;
  imageUrl?: string;
  validationStatus?: 'pending' | 'accepted' | 'rejected' | 'reported';
}

interface ScannerState {
  isScanning: boolean;
  torchEnabled: boolean;
  scanHistory: ScanResult[];
  currentScan: ScanResult | null;
  totalScansToday: number;
  totalScans: number;
}

const initialState: ScannerState = {
  isScanning: false,
  torchEnabled: false,
  scanHistory: [],
  currentScan: null,
  totalScansToday: 0,
  totalScans: 0,
};

const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    startScanning: (state) => {
      state.isScanning = true;
    },
    stopScanning: (state) => {
      state.isScanning = false;
    },
    toggleTorch: (state) => {
      state.torchEnabled = !state.torchEnabled;
    },
    addScanResult: (state, action: PayloadAction<ScanResult>) => {
      state.scanHistory.unshift(action.payload);
      state.currentScan = action.payload;
      state.totalScans += 1;
      state.totalScansToday += 1;

      // Keep only last 100 scans in history
      if (state.scanHistory.length > 100) {
        state.scanHistory = state.scanHistory.slice(0, 100);
      }
    },
    updateScanResult: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ScanResult> }>
    ) => {
      const index = state.scanHistory.findIndex((scan) => scan.id === action.payload.id);
      if (index !== -1) {
        state.scanHistory[index] = { ...state.scanHistory[index], ...action.payload.updates };
      }
      if (state.currentScan?.id === action.payload.id) {
        state.currentScan = { ...state.currentScan, ...action.payload.updates };
      }
    },
    updateProductInfo: (
      state,
      action: PayloadAction<{ scanId: string; productInfo: ProductInfo }>
    ) => {
      const index = state.scanHistory.findIndex((scan) => scan.id === action.payload.scanId);
      if (index !== -1) {
        state.scanHistory[index].productInfo = action.payload.productInfo;
      }
      if (state.currentScan?.id === action.payload.scanId) {
        state.currentScan.productInfo = action.payload.productInfo;
      }
    },
    setCurrentScan: (state, action: PayloadAction<ScanResult | null>) => {
      state.currentScan = action.payload;
    },
    clearScanHistory: (state) => {
      state.scanHistory = [];
    },
    resetDailyCount: (state) => {
      state.totalScansToday = 0;
    },
  },
});

export const {
  startScanning,
  stopScanning,
  toggleTorch,
  addScanResult,
  updateScanResult,
  updateProductInfo,
  setCurrentScan,
  clearScanHistory,
  resetDailyCount,
} = scannerSlice.actions;

export default scannerSlice.reducer;
