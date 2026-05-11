import { attackSkillBonus, affinitySkillBonus, critMultiplier } from '../../calc/skills';

describe('attackSkillBonus', () => {
  test('攻撃Lv5 => +9', () => {
    expect(attackSkillBonus([{ skillId: 'attack', level: 5 }])).toBe(9);
  });
  test('攻撃Lv3 => +6', () => {
    expect(attackSkillBonus([{ skillId: 'attack', level: 3 }])).toBe(6);
  });
  test('no skills => 0', () => {
    expect(attackSkillBonus([])).toBe(0);
  });
});

describe('affinitySkillBonus', () => {
  test('見切りLv7 => +30', () => {
    expect(affinitySkillBonus(
      [{ skillId: 'critical-eye', level: 7 }],
      { hitzonePhysical: 0, isDraw: false }
    )).toBe(30);
  });
  test('弱点特効Lv3 applies only when hitzone>=45', () => {
    const skills = [{ skillId: 'weakness-exploit', level: 3 }];
    expect(affinitySkillBonus(skills, { hitzonePhysical: 50, isDraw: false })).toBe(30);
    expect(affinitySkillBonus(skills, { hitzonePhysical: 40, isDraw: false })).toBe(0);
  });
  test('抜刀術【技】Lv3 applies only to draw motions', () => {
    const skills = [{ skillId: 'punishing-draw-technique', level: 3 }];
    expect(affinitySkillBonus(skills, { hitzonePhysical: 0, isDraw: true })).toBe(30);
    expect(affinitySkillBonus(skills, { hitzonePhysical: 0, isDraw: false })).toBe(0);
  });
});

describe('critMultiplier', () => {
  test('default 1.25', () => {
    expect(critMultiplier([])).toBe(1.25);
  });
  test('超会心Lv3 => 1.40', () => {
    expect(critMultiplier([{ skillId: 'critical-boost', level: 3 }])).toBe(1.40);
  });
});
