import { create } from 'zustand';
import type { WeaponInput, WeaponType, Element, SharpnessColor } from '../types';

interface WeaponStore {
  weapon: WeaponInput;
  setWeaponType: (type: WeaponType) => void;
  setAttack: (v: number) => void;
  setAffinity: (v: number) => void;
  setElement: (e: Element | null) => void;
  setSharpness: (c: SharpnessColor) => void;
  setGunlanceShell: (shell: WeaponInput['gunlanceShell']) => void;
  setBowBins: (bins: WeaponInput['bowBins']) => void;
  setBowgunAmmo: (ammo: WeaponInput['bowgunAmmo']) => void;
  setChargeBladeBin: (bin: WeaponInput['chargeBladeBin']) => void;
  setSwitchAxeBin: (bin: WeaponInput['switchAxeBin']) => void;
  setWeapon: (w: WeaponInput) => void;
}

const defaultWeapon: WeaponInput = {
  type: 'longsword',
  attack: 330,
  affinity: 20,
  element: { type: '水', value: 24 },
  sharpness: 'white',
};

export const useWeaponStore = create<WeaponStore>((set) => ({
  weapon: defaultWeapon,
  setWeaponType: (type) => set((s) => ({ weapon: { ...s.weapon, type } })),
  setAttack:     (v)    => set((s) => ({ weapon: { ...s.weapon, attack: v } })),
  setAffinity:   (v)    => set((s) => ({ weapon: { ...s.weapon, affinity: v } })),
  setElement:    (e)    => set((s) => ({ weapon: { ...s.weapon, element: e } })),
  setSharpness:  (c)    => set((s) => ({ weapon: { ...s.weapon, sharpness: c } })),
  setGunlanceShell:  (shell) => set((s) => ({ weapon: { ...s.weapon, gunlanceShell: shell } })),
  setBowBins:        (bins)  => set((s) => ({ weapon: { ...s.weapon, bowBins: bins } })),
  setBowgunAmmo:     (ammo)  => set((s) => ({ weapon: { ...s.weapon, bowgunAmmo: ammo } })),
  setChargeBladeBin: (bin)   => set((s) => ({ weapon: { ...s.weapon, chargeBladeBin: bin } })),
  setSwitchAxeBin:   (bin)   => set((s) => ({ weapon: { ...s.weapon, switchAxeBin: bin } })),
  setWeapon:         (w)     => set({ weapon: w }),
}));
