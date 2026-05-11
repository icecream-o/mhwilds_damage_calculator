import type { ActiveSkill } from '../types';

interface MotionContext {
  hitzonePhysical: number;
  isDraw: boolean;
}

const ATTACK_BONUSES: Record<number, number>     = { 1: 3, 2: 5, 3: 6, 4: 7, 5: 9 };
const CRITICAL_EYE: Record<number, number>       = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 25, 7: 30 };
const WEAKNESS_EXPLOIT: Record<number, number>   = { 1: 10, 2: 20, 3: 30 };
const PUNISH_DRAW_TECH: Record<number, number>   = { 1: 10, 2: 20, 3: 30 };
const CRIT_BOOST: Record<number, number>         = { 1: 1.30, 2: 1.35, 3: 1.40, 4: 1.40, 5: 1.40 };

function lookup(table: Record<number, number>, level: number): number {
  return table[level] ?? 0;
}

export function attackSkillBonus(skills: ActiveSkill[]): number {
  return skills
    .filter(s => s.skillId === 'attack')
    .reduce((sum, s) => sum + lookup(ATTACK_BONUSES, s.level), 0);
}

export function affinitySkillBonus(skills: ActiveSkill[], ctx: MotionContext): number {
  let bonus = 0;
  for (const s of skills) {
    if (s.skillId === 'critical-eye') bonus += lookup(CRITICAL_EYE, s.level);
    if (s.skillId === 'weakness-exploit' && ctx.hitzonePhysical >= 45) bonus += lookup(WEAKNESS_EXPLOIT, s.level);
    if (s.skillId === 'punishing-draw-technique' && ctx.isDraw) bonus += lookup(PUNISH_DRAW_TECH, s.level);
  }
  return bonus;
}

export function critMultiplier(skills: ActiveSkill[]): number {
  const boost = skills.find(s => s.skillId === 'critical-boost');
  return boost ? (CRIT_BOOST[boost.level] ?? 1.25) : 1.25;
}
