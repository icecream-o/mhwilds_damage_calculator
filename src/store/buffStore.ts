import { create } from 'zustand';

interface BuffStore {
  selected: string[]; // Buff.id の配列
  toggle: (id: string) => void;
  setSelected: (ids: string[]) => void;
}

export const useBuffStore = create<BuffStore>((set) => ({
  selected: [],
  toggle: (id) => set((s) => ({
    selected: s.selected.includes(id)
      ? s.selected.filter(x => x !== id)
      : [...s.selected, id],
  })),
  setSelected: (ids) => set({ selected: ids }),
}));
