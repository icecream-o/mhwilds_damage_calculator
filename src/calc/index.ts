import type { CalcInput, DamageResult, SkillMaster, Buff } from '../types';
import { calcMeleeDamage } from './melee';

const RANGED: ReadonlyArray<string> = ['light-bowgun', 'heavy-bowgun', 'bow'];

export function calcDamage(
  input: CalcInput,
  skillMasters: SkillMaster[],
  buffMasters: Buff[],
): DamageResult {
  if (RANGED.includes(input.weapon.type)) {
    throw new Error(`Ranged weapon ${input.weapon.type} not yet supported in Plan A`);
  }
  return calcMeleeDamage(input, skillMasters, buffMasters);
}
