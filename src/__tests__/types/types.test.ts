import type { Weapon, Skill, MotionPattern, ThemeId } from '../../types';

test('types are importable', () => {
  const w: Weapon = {
    id: 'w1', name: 'test', type: 'longsword',
    attack: 100, affinity: 0, element: null,
    sharpness: { current: 'white', values: [] }, slots: [],
  };
  const s: Skill = { id: 's1', name: 'attack', maxLevel: 5 };
  const p: MotionPattern = { name: 'p1', motions: [], ratio: 1.0 };
  const t: ThemeId = 'ember';
  expect(w.type).toBe('longsword');
  expect(s.maxLevel).toBe(5);
  expect(p.ratio).toBe(1.0);
  expect(t).toBe('ember');
});
