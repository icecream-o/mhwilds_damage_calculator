import type { CalcInput, DamageResult } from '../types';
import { calcMeleeDamage } from './melee';

const RANGED: ReadonlyArray<string> = ['light-bowgun', 'heavy-bowgun', 'bow'];

export function calcDamage(input: CalcInput): DamageResult {
  if (RANGED.includes(input.weapon.type)) {
    throw new Error(`Ranged weapon ${input.weapon.type} not yet supported in MVP`);
  }
  return calcMeleeDamage(input);
}
