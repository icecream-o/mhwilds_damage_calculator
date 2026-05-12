import { create } from 'zustand';
import type { MotionPattern } from '../types';

interface MotionStore {
  patterns: MotionPattern[];
  addPattern: (p: MotionPattern) => void;
  updatePattern: (idx: number, patch: Partial<MotionPattern>) => void;
  removePattern: (idx: number) => void;
  setRatio: (idx: number, ratio: number) => void;
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
}));
