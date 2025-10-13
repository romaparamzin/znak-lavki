import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  language: 'en' | 'ru' | 'es';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  scannerDelay: number; // milliseconds
  autoSyncEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  analyticsEnabled: boolean;
}

const initialState: SettingsState = {
  language: 'en',
  soundEnabled: true,
  vibrationEnabled: true,
  scannerDelay: 1000,
  autoSyncEnabled: true,
  theme: 'light',
  analyticsEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'ru' | 'es'>) => {
      state.language = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.vibrationEnabled = action.payload;
    },
    setScannerDelay: (state, action: PayloadAction<number>) => {
      state.scannerDelay = action.payload;
    },
    setAutoSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSyncEnabled = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setAnalyticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.analyticsEnabled = action.payload;
    },
  },
});

export const {
  setLanguage,
  setSoundEnabled,
  setVibrationEnabled,
  setScannerDelay,
  setAutoSyncEnabled,
  setTheme,
  setAnalyticsEnabled,
} = settingsSlice.actions;

export default settingsSlice.reducer;
