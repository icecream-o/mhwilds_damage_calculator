import { applyConditionalUptimes } from '../../calc/conditional';

describe('applyConditionalUptimes', () => {
  test('挑戦者Lv7 at 60% uptime => +15 attack, +9 affinity', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'agitator', uptime: 0.60 }],
      [{ skillId: 'agitator', level: 7 }]
    );
    expect(result.attackBonus).toBeCloseTo(15);
    expect(result.affinityBonus).toBeCloseTo(9);
  });
  test('逆襲Lv3 at 30% uptime => +9 attack, no affinity', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'resentment', uptime: 0.30 }],
      [{ skillId: 'resentment', level: 3 }]
    );
    expect(result.attackBonus).toBeCloseTo(9);
    expect(result.affinityBonus).toBe(0);
  });
  test('0 uptime => no bonus', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'agitator', uptime: 0 }],
      [{ skillId: 'agitator', level: 7 }]
    );
    expect(result.attackBonus).toBe(0);
    expect(result.affinityBonus).toBe(0);
  });
});
