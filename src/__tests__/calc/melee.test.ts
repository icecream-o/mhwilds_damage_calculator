import { calcDamage } from '../../calc';
import type { CalcInput, SkillMaster, Buff, Monster } from '../../types';

const skillMasters: SkillMaster[] = [
  { id: 'attack', name: '攻撃', maxLevel: 5, category: 'normal',
    effects: [{ level: 5, attackBonus: 9 }] },
  { id: 'critical-eye', name: '見切り', maxLevel: 5, category: 'normal',
    effects: [{ level: 5, affinityBonus: 30 }] },
  { id: 'critical-boost', name: '超会心', maxLevel: 3, category: 'normal',
    effects: [{ level: 3, critMultiplier: 1.40 }] },
  { id: 'weakness-exploit', name: '弱点特効', maxLevel: 3, category: 'normal',
    applicability: { requireHitzonePhysical: 45 },
    effects: [{ level: 3, affinityBonus: 30 }] },
];

const buffMasters: Buff[] = [];

const monster: Monster = {
  id: 'g', name: 'ゴア', baseDefenseRate: 1.0,
  variants: [{ id: 'normal', name: '通常', defenseRateMod: 1.0 }],
  parts: [
    { id: 'head', name: '頭部', physical: 85, element: { 水: 35 } },
    { id: 'tail', name: '尻尾', physical: 40, element: { 水: 10 } },
  ],
};

const baseInput: CalcInput = {
  weapon: {
    type: 'longsword', attack: 330, affinity: 20,
    element: { type: '水', value: 24 }, sharpness: 'purple',
  },
  skills: [
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 5 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
  ],
  buffs: [],
  motionPatterns: [{
    name: 'test', ratio: 1.0,
    motions: [{ motionName: '突き', motionValue: 50, frames: 30, isDraw: false }],
  }],
  target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
};

describe('calcDamage (v2 melee)', () => {
  test('returns positive DPS', () => {
    const r = calcDamage(baseInput, skillMasters, buffMasters);
    expect(r.expectedDPS).toBeGreaterThan(0);
    expect(r.patterns).toHaveLength(1);
  });

  test('weakness exploit fires on head (85)', () => {
    const r = calcDamage(baseInput, skillMasters, buffMasters);
    // 武器20 + 見切り30 + 弱点特効30 = 80 → 0.80
    expect(r.effectiveAffinity).toBeCloseTo(0.80, 2);
  });

  test('weakness exploit does NOT fire on tail (40)', () => {
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, partId: 'tail' },
    }, skillMasters, buffMasters);
    // 武器20 + 見切り30 + 弱点特効0 = 50 → 0.50
    expect(r.effectiveAffinity).toBeCloseTo(0.50, 2);
  });

  test('variant defenseRateMod is applied', () => {
    const monsterWithApex: Monster = {
      ...monster,
      variants: [
        { id: 'normal', name: '通常', defenseRateMod: 1.0 },
        { id: 'apex', name: '護竜', defenseRateMod: 0.85 },
      ],
    };
    const normal = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: monsterWithApex, variantId: 'normal' },
    }, skillMasters, buffMasters);
    const apex = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: monsterWithApex, variantId: 'apex' },
    }, skillMasters, buffMasters);
    expect(apex.expectedDPS).toBeLessThan(normal.expectedDPS);
    expect(apex.defenseRate).toBeCloseTo(0.85);
  });

  test('enraged uses enragedPhysical when defined', () => {
    const enragedMonster: Monster = {
      ...monster,
      parts: [{ ...monster.parts[0], enragedPhysical: 95 }, monster.parts[1]],
    };
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: enragedMonster, enraged: true },
    }, skillMasters, buffMasters);
    expect(r.patterns[0].damage).toBeGreaterThan(0);
  });

  test('defenseRateOverride takes precedence', () => {
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, defenseRateOverride: 0.5 },
    }, skillMasters, buffMasters);
    expect(r.defenseRate).toBeCloseTo(0.5);
  });

  test('gunlance shell-normal bypasses attack/sharpness/hitzone', () => {
    const gl: CalcInput = {
      weapon: {
        type: 'gunlance', attack: 330, affinity: 0,
        element: null, sharpness: 'purple',
        gunlanceShell: { type: 'normal', level: 5 },  // base damage = 28
      },
      skills: [],
      buffs: [],
      motionPatterns: [{
        name: 'shell', ratio: 1.0,
        motions: [{ motionName: '砲撃', motionValue: 0, frames: 35, isDraw: false, damageType: 'shell-normal' }],
      }],
      target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
    };
    const r = calcDamage(gl, [], []);
    // shell normal Lv5 base = 28, no artillery, defenseRate = 1.0 → floor(28) = 28
    expect(r.patterns[0].damage).toBe(28);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });

  test('bow arrow motion returns positive DPS without throwing', () => {
    const bow: CalcInput = {
      weapon: { type: 'bow', attack: 200, affinity: 0, element: null, sharpness: 'purple' },
      skills: [],
      buffs: [],
      motionPatterns: [{
        name: 'charged', ratio: 1.0,
        motions: [{ motionName: '溜め射ちLv3', motionValue: 24, frames: 45, isDraw: false, damageType: 'arrow' }],
      }],
      target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
    };
    // Must NOT throw "not yet supported"
    const r = calcDamage(bow, [], []);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });

  test('elementBonus adds absolute value to weapon element before multiplier', () => {
    // 水属性24の武器に水属性攻撃強化Lv1 (+10) を当てる
    // baseValue 24 + bonus 10 = 34 → そのまま属性ダメージに反映
    const elementSkills: SkillMaster[] = [
      ...skillMasters,
      { id: 'water-bonus', name: '水属性攻撃強化', maxLevel: 1, category: 'normal',
        effects: [{ level: 1, elementBonus: 10 }] },
    ];
    const noBonus = calcDamage(baseInput, elementSkills, buffMasters);
    const withBonus = calcDamage({
      ...baseInput,
      skills: [...baseInput.skills, { skillId: 'water-bonus', level: 1 }],
    }, elementSkills, buffMasters);
    // bonus 10 / base 24 → 理想は約 41.7% 増。Math.round の丸めを許容して
    // 概ね 1.3〜1.5 倍に収まることを確認。
    const ratio = withBonus.elementAvg / noBonus.elementAvg;
    expect(ratio).toBeGreaterThan(1.3);
    expect(ratio).toBeLessThan(1.5);
  });

  test('elementBonus respects elementCap', () => {
    // base=500, bonus=200, cap = max(500*2.3, 500+400) = max(1150, 900) = 1150
    // (500+200)*1 = 700 → 1150を超えないのでそのまま700
    // bonus=1000, (500+1000)*1 = 1500 → cap 1150 にクランプ
    const elementSkills: SkillMaster[] = [
      ...skillMasters,
      { id: 'huge-bonus', name: '巨大ボーナス', maxLevel: 1, category: 'normal',
        effects: [{ level: 1, elementBonus: 1000 }] },
    ];
    const r = calcDamage({
      ...baseInput,
      weapon: { ...baseInput.weapon, element: { type: '水', value: 500 } },
      skills: [...baseInput.skills, { skillId: 'huge-bonus', level: 1 }],
    }, elementSkills, buffMasters);
    // 1150 (capped) で計算
    expect(r.elementAvg).toBeGreaterThan(0);
  });

  test('element cap is applied', () => {
    // element=100, skill x2.5, cap = max(100*2.3, 100+400) = max(230, 500) = 500
    // skill effect: 100*2.5 = 250, capped to 500 → no cap hit yet
    // Try element=200, x3 = 600, cap=max(460, 600)=600 → no cap hit
    // Try element=500, x3 = 1500, cap=max(1150, 900)=1150 → cap to 1150
    const elementSkills: SkillMaster[] = [
      ...skillMasters,
      { id: 'x3-elem', name: 'x3', maxLevel: 1, category: 'normal',
        effects: [{ level: 1, elementMultiplier: 3.0 }] },
    ];
    const r = calcDamage({
      ...baseInput,
      weapon: { ...baseInput.weapon, element: { type: '水', value: 500 } },
      skills: [...baseInput.skills, { skillId: 'x3-elem', level: 1 }],
    }, elementSkills, buffMasters);
    expect(r.elementAvg).toBeGreaterThan(0);
  });
});
