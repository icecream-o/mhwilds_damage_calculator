import { create } from 'zustand';

export interface TargetSnapshot {
  monsterId: string | null;
  variantId: string | null;
  partId: string | null;
  enraged: boolean;
  wounded: boolean;
  defenseRateOverride: number | null;
}

interface TargetStore extends TargetSnapshot {
  setMonster: (id: string) => void;
  setVariant: (id: string) => void;
  setPart:    (id: string) => void;
  setEnraged: (b: boolean) => void;
  setWounded: (b: boolean) => void;
  setDefenseRateOverride: (v: number | null) => void;
  setAll: (t: TargetSnapshot) => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  monsterId: null,
  variantId: null,
  partId: null,
  enraged: false,
  wounded: false,
  defenseRateOverride: null,
  setMonster: (id) => set({ monsterId: id, variantId: null, partId: null }),
  setVariant: (id) => set({ variantId: id }),
  setPart:    (id) => set({ partId: id }),
  setEnraged: (b)  => set({ enraged: b }),
  setWounded: (b)  => set({ wounded: b }),
  setDefenseRateOverride: (v) => set({ defenseRateOverride: v }),
  setAll: (t) => set(t),
}));
