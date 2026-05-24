// ═══════════════════════════════════════════════════════
//  APP UI STORE (Zustand)
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ToastMessage, ThemeMode, AppSettings, ModalType } from '../types/app';
import { DEFAULT_APP_SETTINGS } from '../types/app';

interface AppState {
  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  deviceId: string;

  // Toasts
  toasts: ToastMessage[];
  addToast: (text: string, type?: ToastMessage['type'], duration?: number) => void;
  removeToast: (id: number) => void;

  // Modals
  activeModal: ModalType;
  modalData: unknown;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;

  // Onboarding
  isFirstRun: boolean;
  completeOnboarding: () => void;

  // PWA
  deferredInstallPrompt: Event | null;
  setDeferredPrompt: (e: Event | null) => void;
  installDismissed: boolean;
  dismissInstall: () => void;
  
  // Reset
  factoryResetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_APP_SETTINGS,
      deviceId: Math.random().toString(36).substring(2, 15),
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      toasts: [],
      addToast: (text, type = 'info', duration = 2500) => {
        const id = Date.now() + Math.random();
        set((state) => ({
          toasts: [...state.toasts, { id, text, type, duration }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, duration);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      activeModal: null,
      modalData: null,
      openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      isFirstRun: true,
      completeOnboarding: () => set({ isFirstRun: false }),

      deferredInstallPrompt: null,
      setDeferredPrompt: (e) => set({ deferredInstallPrompt: e }),
      installDismissed: false,
      dismissInstall: () => set({ installDismissed: true }),
      
      factoryResetApp: () => set({ settings: DEFAULT_APP_SETTINGS, isFirstRun: true }),
    }),
    {
      name: 'cricket-app-settings',
      partialize: (state) => ({
        settings: state.settings,
        deviceId: state.deviceId,
        isFirstRun: state.isFirstRun,
        installDismissed: state.installDismissed,
      }),
    }
  )
);
