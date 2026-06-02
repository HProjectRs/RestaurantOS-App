import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type SettingsState = { restaurantName: string; currency: string; taxRate: number; language: string; theme: string; timezone: string; updateSettings: (data: any) => void; resetSettings: () => void }
export const useSettingsStore = create<SettingsState>()(persist(
  (set) => ({ restaurantName: 'مطعمي', currency: 'DZD', taxRate: 0.19, language: 'ar', theme: 'light', timezone: 'Africa/Algiers',
    updateSettings: (data) => set((state) => ({ ...state, ...data })),
    resetSettings: () => set({ restaurantName: 'مطعمي', currency: 'DZD', taxRate: 0.19, language: 'ar', theme: 'light', timezone: 'Africa/Algiers' }),
  }), { name: 'settings-storage', partialize: (state) => ({ restaurantName: state.restaurantName, currency: state.currency, taxRate: state.taxRate, language: state.language, theme: state.theme, timezone: state.timezone }) }
));
