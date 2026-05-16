import { resolveSkills } from '../../calc/skill_resolver';
import type { SkillMaster, ActiveSkill } from '../../types';

const masters: SkillMaster[] = [
  {
    id: 'attack', name: '攻撃', maxLevel: 5, category: 'normal',
    effects: [
      { level: 1, attackBonus: 3 },
      { level: 5, attackBonus: 9 },
    ],
  },
  {
    id: 'critical-eye', name: '見切り', maxLevel: 5, category: 'normal',
    effects: [{ level: 5, affinityBonus: 30 }],
  },
  {
    id: 'critical-boost', name: '超会心', maxLevel: 3, category: 'normal',
    effects: [{ level: 3, critMultiplier: 1.40 }],
  },
  {
    id: 'weakness-exploit', name: '弱点特効', maxLevel: 3, category: 'normal',
    applicability: { requireHitzonePhysical: 45 },
    effects: [{ level: 3, affinityBonus: 30 }],
  },
  {
    id: 'punishing-draw-tech', name: '抜刀術【技】', maxLevel: 3, category: 'normal',
    applicability: { requireTags: ['draw'] },
    effects: [{ level: 3, affinityBonus: 30 }],
  },
  {
    id: 'agitator', name: '挑戦者', maxLevel: 5, category: 'normal',
    effects: [{ level: 5, attackBonus: 25, affinityBonus: 15 }],
  },
  {
    id: 'fire-attack', name: '火属性攻撃強化', maxLevel: 3, category: 'normal',
    effects: [
      { level: 1, elementBonus: 40 },
      { level: 2, elementBonus: 50, elementMultiplier: 1.1 },
      { level: 3, elementBonus: 60, elementMultiplier: 1.2 },
    ],
  },
  {
    id: 'mind-eye', name: '心眼', maxLevel: 3, category: 'normal',
    applicability: { requireHitzonePhysicalMax: 45 },
    effects: [
      { level: 1, physicalMultiplier: 1.1 },
      { level: 2, physicalMultiplier: 1.15 },
      { level: 3, physicalMultiplier: 1.3 },
    ],
  },
];

describe('resolveSkills - 基本ボーナス集計', () => {
  test('攻撃Lv5 → +9 attack', () => {
    const skills: ActiveSkill[] = [{ skillId: 'attack', level: 5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
  });

  test('見切りLv5 → +30 affinity', () => {
    const skills: ActiveSkill[] = [{ skillId: 'critical-eye', level: 5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.affinityBonus).toBe(30);
  });

  test('超会心Lv3 → critMultiplier 1.40', () => {
    const skills: ActiveSkill[] = [{ skillId: 'critical-boost', level: 3 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.critMultiplier).toBe(1.40);
  });
});

describe('resolveSkills - applicability', () => {
  test('弱点特効Lv3 は肉質45以上で発動', () => {
    const skills: ActiveSkill[] = [{ skillId: 'weakness-exploit', level: 3 }];
    const ctx = { tags: [] as const, damageType: 'physical' as const };
    expect(resolveSkills(skills, masters, { hitzonePhysical: 50, ...ctx }).affinityBonus).toBe(30);
    expect(resolveSkills(skills, masters, { hitzonePhysical: 40, ...ctx }).affinityBonus).toBe(0);
  });

  test('抜刀術【技】Lv3 は draw タグ時のみ', () => {
    const skills: ActiveSkill[] = [{ skillId: 'punishing-draw-tech', level: 3 }];
    expect(resolveSkills(skills, masters,
      { hitzonePhysical: 30, tags: ['draw'], damageType: 'physical' }).affinityBonus).toBe(30);
    expect(resolveSkills(skills, masters,
      { hitzonePhysical: 30, tags: [], damageType: 'physical' }).affinityBonus).toBe(0);
  });
});

describe('resolveSkills - uptime 重み付け', () => {
  test('挑戦者Lv5 at 60% uptime → +15 attack, +9 affinity', () => {
    const skills: ActiveSkill[] = [{ skillId: 'agitator', level: 5, uptime: 0.60 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBeCloseTo(15);
    expect(r.affinityBonus).toBeCloseTo(9);
  });

  test('uptime 未指定は常時発動扱い (uptime=1)', () => {
    const skills: ActiveSkill[] = [{ skillId: 'attack', level: 5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
  });
});

describe('resolveSkills - elementBonus / requireHitzonePhysicalMax', () => {
  test('火属性攻撃強化Lv1 → elementBonus +40', () => {
    const skills: ActiveSkill[] = [{ skillId: 'fire-attack', level: 1 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.elementBonus).toBe(40);
    expect(r.elementMultiplier).toBe(1);
  });

  test('火属性攻撃強化Lv3 → elementBonus +60 と elementMultiplier 1.2 が併用', () => {
    const skills: ActiveSkill[] = [{ skillId: 'fire-attack', level: 3 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.elementBonus).toBe(60);
    expect(r.elementMultiplier).toBeCloseTo(1.2);
  });

  test('心眼Lv3 は肉質≤45の部位のみ発動（≤45で1.3倍）', () => {
    const skills: ActiveSkill[] = [{ skillId: 'mind-eye', level: 3 }];
    const ctx = { tags: [] as const, damageType: 'physical' as const };
    expect(resolveSkills(skills, masters, { hitzonePhysical: 30, ...ctx }).physicalMultiplier).toBeCloseTo(1.3);
    expect(resolveSkills(skills, masters, { hitzonePhysical: 45, ...ctx }).physicalMultiplier).toBeCloseTo(1.3);
    expect(resolveSkills(skills, masters, { hitzonePhysical: 50, ...ctx }).physicalMultiplier).toBe(1);
  });

  test('elementBonus は uptime で重み付けされる', () => {
    const skills: ActiveSkill[] = [{ skillId: 'fire-attack', level: 1, uptime: 0.5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.elementBonus).toBe(20);
  });
});

describe('resolveSkills - 複合', () => {
  test('攻撃Lv5 + 見切りLv5 + 弱点特効Lv3 (肉質85)', () => {
    const skills: ActiveSkill[] = [
      { skillId: 'attack', level: 5 },
      { skillId: 'critical-eye', level: 5 },
      { skillId: 'weakness-exploit', level: 3 },
    ];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 85, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
    expect(r.affinityBonus).toBe(60);
  });
});
