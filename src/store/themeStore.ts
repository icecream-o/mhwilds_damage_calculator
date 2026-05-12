import { create } from 'zustand';
import type { ThemeId } from '../types';
import { db } from '../db/database';

interface ThemeStore {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  applyTheme: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'ember',
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.setAttribute('data-theme', t);
    db.themePref.put({ id: 'current', theme: t });
  },
  applyTheme: () => {
    document.documentElement.setAttribute('data-theme', get().theme);
  },
  hydrate: async () => {
    const pref = await db.themePref.get('current');
    if (pref) {
      set({ theme: pref.theme });
      document.documentElement.setAttribute('data-theme', pref.theme);
    }
  },
}));
