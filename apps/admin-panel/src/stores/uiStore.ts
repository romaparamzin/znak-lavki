/**
 * UI Store (Zustand)
 * Manages UI state (theme, sidebar, modals, etc.)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'ru';

interface UIStore {
  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Language
  language: Language;
  setLanguage: (language: Language) => void;
  
  // Modals
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        // Theme
        theme: 'light',
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        setTheme: (theme) => set({ theme }),
        
        // Sidebar
        sidebarCollapsed: false,
        toggleSidebar: () => set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        })),
        
        // Language
        language: 'ru',
        setLanguage: (language) => set({ language }),
        
        // Modals
        modals: {},
        openModal: (modalId) => set((state) => ({ 
          modals: { ...state.modals, [modalId]: true } 
        })),
        closeModal: (modalId) => set((state) => ({ 
          modals: { ...state.modals, [modalId]: false } 
        })),
        
        // Loading
        globalLoading: false,
        setGlobalLoading: (globalLoading) => set({ globalLoading }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ 
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          language: state.language,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);




