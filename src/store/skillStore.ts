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
    // デフォルト発動スキル例（MVP の状態を維持）
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
    { skillId: 'agitator', level: 7, uptime: 0.60 },
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
