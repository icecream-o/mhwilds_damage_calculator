import type { ConditionalSkillUptime, ActiveSkill } from '../types';

const AGITATOR_ATK:  Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 25 };
const AGITATOR_AFF:  Record<number, number> = { 1: 3, 2: 5, 3: 7, 4: 10, 5: 12, 6: 15, 7: 15 };
const RESENTMENT:    Record<number, number> = { 1: 5, 2: 10, 3: 30, 4: 35, 5: 40 };
const PEAK_PERF:     Record<number, number> = { 1: 5, 2: 10, 3: 20 };

export interface ConditionalBonus {
  attackBonus: number;
  affinityBonus: number;
}

function lookup(table: Record<number, number>, level: number): number {
  return table[level] ?? 0;
}

export function applyConditionalUptimes(
  uptimes: ConditionalSkillUptime[],
  skillLevels: ActiveSkill[],
): ConditionalBonus {
  let attackBonus = 0;
  let affinityBonus = 0;
  for (const u of uptimes) {
    const sk = skillLevels.find(s => s.skillId === u.skillId);
    if (!sk) continue;
    if (u.skillId === 'agitator') {
      attackBonus   += lookup(AGITATOR_ATK, sk.level) * u.uptime;
      affinityBonus += lookup(AGITATOR_AFF, sk.level) * u.uptime;
    } else if (u.skillId === 'resentment') {
      attackBonus   += lookup(RESENTMENT, sk.level) * u.uptime;
    } else if (u.skillId === 'peak-performance') {
      attackBonus   += lookup(PEAK_PERF, sk.level) * u.uptime;
    }
  }
  return { attackBonus, affinityBonus };
}
