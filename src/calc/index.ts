import type { CalcInput, DamageResult, SkillMaster, Buff } from '../types';
import { calcMeleeDamage } from './melee';

export function calcDamage(
  input: CalcInput,
  skillMasters: SkillMaster[],
  buffMasters: Buff[],
): DamageResult {
  return calcMeleeDamage(input, skillMasters, buffMasters);
}
