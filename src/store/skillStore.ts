import { create } from 'zustand';
import type { ActiveSkill } from '../types';

interface SkillStore {
  skills: ActiveSkill[];
  addSkill: (skillId: string, level: number) => void;
  updateLevel: (skillId: string, level: number) => void;
  setUptime: (skillId: string, uptime: number | undefined) => void;
  removeSkill: (skillId: string) => void;
  setAll: (skills: ActiveSkill[]) => void;
}

export const useSkillStore = create<SkillStore>((set) => ({
  skills: [
    // デフォルト発動スキル例（MH Wilds 仕様: 見切り/超会心/弱点特効/挑戦者は Lv5 が上限）
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 5 },
    { skillId: 'critical-boost', level: 5 },
    { skillId: 'weakness-exploit', level: 5 },
    { skillId: 'agitator', level: 5, uptime: 0.60 },
    { skillId: 'resentment', level: 3, uptime: 0.30 },
  ],
  addSkill: (skillId, level) => set((s) =>
    s.skills.some(x => x.skillId === skillId)
      ? s
      : { skills: [...s.skills, { skillId, level }] }
  ),
  updateLevel: (skillId, level) => set((s) => ({
    skills: s.skills.map(x => x.skillId === skillId ? { ...x, level } : x),
  })),
  setUptime: (skillId, uptime) => set((s) => ({
    skills: s.skills.map(x => x.skillId === skillId ? { ...x, uptime } : x),
  })),
  removeSkill: (skillId) => set((s) => ({
    skills: s.skills.filter(x => x.skillId !== skillId),
  })),
  setAll: (skills) => set({ skills }),
}));
