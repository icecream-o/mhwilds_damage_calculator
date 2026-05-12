import { create } from 'zustand';
import type { MotionPattern } from '../types';

interface MotionStore {
  patterns: MotionPattern[];
  addPattern: (p: MotionPattern) => void;
  updatePattern: (idx: number, patch: Partial<MotionPattern>) => void;
  removePattern: (idx: number) => void;
  setRatio: (idx: number, ratio: number) => void;
  duplicatePattern: (idx: number) => void;
  setPatterns: (patterns: MotionPattern[]) => void;
}

export const useMotionStore = create<MotionStore>((set) => ({
  patterns: [],
  addPattern: (p) => set((s) => ({ patterns: [...s.patterns, p] })),
  updatePattern: (idx, patch) => set((s) => ({
    patterns: s.patterns.map((p, i) => i === idx ? { ...p, ...patch } : p),
  })),
  removePattern: (idx) => set((s) => ({
    patterns: s.patterns.filter((_, i) => i !== idx),
  })),
  setRatio: (idx, ratio) => set((s) => ({
    patterns: s.patterns.map((p, i) => i === idx ? { ...p, ratio } : p),
  })),
  duplicatePattern: (idx) => set((s) => {
    const src = s.patterns[idx];
    if (!src) return s;
    const copy: MotionPattern = {
      ...src,
      name: `${src.name} (コピー)`,
      motions: [...src.motions],
    };
    return { patterns: [...s.patterns, copy] };
  }),
  setPatterns: (patterns) => set({ patterns }),
}));
