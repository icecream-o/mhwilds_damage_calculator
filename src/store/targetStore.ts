import { create } from 'zustand';

interface TargetStore {
  monsterId: string | null;
  partId: string | null;
  enraged: boolean;
  wounded: boolean;
  setMonster: (id: string) => void;
  setPart: (id: string) => void;
  setEnraged: (b: boolean) => void;
  setWounded: (b: boolean) => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  monsterId: null, partId: null, enraged: false, wounded: false,
  setMonster: (id) => set({ monsterId: id, partId: null }),
  setPart:    (id) => set({ partId: id }),
  setEnraged: (b)  => set({ enraged: b }),
  setWounded: (b)  => set({ wounded: b }),
}));
