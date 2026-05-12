import { create } from 'zustand';
import type { Weapon, ArmorPiece, Talisman, ConditionalSkillUptime } from '../types';

interface BuildStore {
  weapon: Weapon | null;
  armor: Partial<Record<ArmorPiece['part'], { piece: ArmorPiece; decorations: (string | null)[] }>>;
  talisman: Talisman;
  conditionalUptimes: ConditionalSkillUptime[];

  setWeapon: (w: Weapon | null) => void;
  setArmor: (part: ArmorPiece['part'], piece: ArmorPiece | null) => void;
  setArmorDeco: (part: ArmorPiece['part'], slotIdx: number, decoId: string | null) => void;
  setTalisman: (t: Talisman) => void;
  setConditionalUptime: (skillId: string, uptime: number) => void;
}

const defaultTalisman: Talisman = {
  type: 'custom', skills: [], decorations: [],
};

export const useBuildStore = create<BuildStore>((set) => ({
  weapon: null,
  armor: {},
  talisman: defaultTalisman,
  conditionalUptimes: [
    { skillId: 'agitator', uptime: 0.60 },
    { skillId: 'resentment', uptime: 0.30 },
  ],
  setWeapon: (w) => set({ weapon: w }),
  setArmor: (part, piece) => set((s) => ({
    armor: piece
      ? { ...s.armor, [part]: { piece, decorations: piece.slots.map(() => null) } }
      : { ...s.armor, [part]: undefined },
  })),
  setArmorDeco: (part, slotIdx, decoId) => set((s) => {
    const cur = s.armor[part];
    if (!cur) return s;
    const decorations = [...cur.decorations];
    decorations[slotIdx] = decoId;
    return { armor: { ...s.armor, [part]: { ...cur, decorations } } };
  }),
  setTalisman: (t) => set({ talisman: t }),
  setConditionalUptime: (skillId, uptime) => set((s) => ({
    conditionalUptimes: s.conditionalUptimes.some(c => c.skillId === skillId)
      ? s.conditionalUptimes.map(c => c.skillId === skillId ? { ...c, uptime } : c)
      : [...s.conditionalUptimes, { skillId, uptime }],
  })),
}));
