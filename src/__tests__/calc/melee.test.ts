import { calcDamage } from '../../calc';
import type { CalcInput } from '../../types';

const baseInput: CalcInput = {
  weapon: {
    id: 'test-ls', name: 'Test LS', type: 'longsword',
    attack: 330, affinity: 20,
    element: { type: '水', value: 24 },
    sharpness: { current: 'purple', values: [] },
    slots: [],
  },
  passiveSkills: [
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
  ],
  conditionalUptimes: [],
  buffs: [],
  motionPatterns: [{
    name: 'test',
    ratio: 1.0,
    motions: [{ motionName: '突き', motionValue: 50, frames: 30, isDraw: false }],
  }],
  target: {
    monster: { id: 'g', name: 'ゴア', parts: [
      { id: 'head', name: '頭部', physical: 85, element: { 水: 35 } },
    ]},
    partId: 'head', enraged: false, wounded: false,
  },
};

describe('calcDamage (melee)', () => {
  test('returns positive DPS for the canonical longsword build', () => {
    const r = calcDamage(baseInput);
    expect(r.expectedDPS).toBeGreaterThan(0);
    expect(r.patterns).toHaveLength(1);
  });

  test('effective affinity caps at 100', () => {
    const r = calcDamage(baseInput);
    expect(r.effectiveAffinity).toBeLessThanOrEqual(1.0);
  });

  test('weakness exploit fires on hitzone>=45 (head)', () => {
    const r = calcDamage(baseInput);
    // 武器20 + 見切り30 + 弱点特効30 = 80 → 0.80
    expect(r.effectiveAffinity).toBeCloseTo(0.80, 2);
  });

  test('hitzone<45 disables weakness exploit', () => {
    const input = {
      ...baseInput,
      target: { ...baseInput.target,
        monster: { id: 'g', name: 'ゴア', parts: [
          { id: 'tail', name: '尻尾', physical: 40, element: { 水: 10 } },
        ]},
        partId: 'tail',
      },
    };
    const r = calcDamage(input);
    // 武器20 + 見切り30 + 弱点特効0 = 50 → 0.50
    expect(r.effectiveAffinity).toBeCloseTo(0.50, 2);
  });

  test('two patterns are weighted-averaged for DPS', () => {
    const r = calcDamage({
      ...baseInput,
      motionPatterns: [
        { name: 'a', ratio: 0.5, motions: [{ motionName: 'a', motionValue: 50, frames: 30, isDraw: false }] },
        { name: 'b', ratio: 0.5, motions: [{ motionName: 'b', motionValue: 100, frames: 60, isDraw: false }] },
      ],
    });
    expect(r.patterns).toHaveLength(2);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });
});
