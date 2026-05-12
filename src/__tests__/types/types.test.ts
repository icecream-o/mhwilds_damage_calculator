import type { WeaponInput, ActiveSkill, MotionPattern, ThemeId, SkillMaster } from '../../types';

test('v2 types are importable', () => {
  const w: WeaponInput = {
    type: 'longsword', attack: 100, affinity: 0, element: null, sharpness: 'white',
  };
  const s: ActiveSkill = { skillId: 'attack', level: 5 };
  const p: MotionPattern = { name: 'p', motions: [], ratio: 1.0 };
  const t: ThemeId = 'ember';
  const m: SkillMaster = { id: 'x', name: 'X', maxLevel: 1, category: 'normal', effects: [] };
  expect(w.type).toBe('longsword');
  expect(s.skillId).toBe('attack');
  expect(p.ratio).toBe(1.0);
  expect(t).toBe('ember');
  expect(m.category).toBe('normal');
});
