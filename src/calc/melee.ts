import type { CalcInput, DamageResult, PatternResult, Motion } from '../types';
import { meleeSharpnessMult, elementSharpnessMult } from './sharpness';
import { clampAffinity, critCoefficient } from './affinity';
import { attackSkillBonus, affinitySkillBonus, critMultiplier } from './skills';
import { applyConditionalUptimes } from './conditional';

const WEAPON_COEF: Record<string, number> = {
  'longsword': 3.3, 'greatsword': 4.8, 'sword-and-shield': 1.4,
  'dual-blades': 1.4, 'hammer': 5.2, 'hunting-horn': 4.2,
  'lance': 2.3, 'gunlance': 2.3, 'switch-axe': 5.4,
  'charge-blade': 3.6, 'insect-glaive': 3.1,
};

function calcMotionDamage(
  motion: Motion,
  input: CalcInput,
  conditionalAttack: number,
  conditionalAffinity: number,
): { physical: number; element: number } {
  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const physicalHitzone = part.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);
  const elementHitzone  = input.weapon.element ? (part.element[input.weapon.element.type] ?? 0) : 0;

  const attackBonus = attackSkillBonus(input.passiveSkills) + conditionalAttack;
  const attack      = input.weapon.attack + attackBonus;

  const affBonus = affinitySkillBonus(input.passiveSkills,
    { hitzonePhysical: physicalHitzone, isDraw: motion.isDraw });
  const affinity = clampAffinity(input.weapon.affinity + affBonus + conditionalAffinity);

  const critMult = affinity >= 0 ? critMultiplier(input.passiveSkills) : 0.75;
  const critCoef = critCoefficient(affinity, critMult);

  const coef       = WEAPON_COEF[input.weapon.type] ?? 1.0;
  const sharpPhys  = meleeSharpnessMult(input.weapon.sharpness.current);
  const sharpElem  = elementSharpnessMult(input.weapon.sharpness.current);

  const physical = (attack / coef)
                 * (motion.motionValue / 100)
                 * sharpPhys
                 * critCoef
                 * (physicalHitzone / 100);

  const element = input.weapon.element
    ? input.weapon.element.value
      * sharpElem
      * (elementHitzone / 100)
    : 0;

  return { physical, element };
}

export function calcMeleeDamage(input: CalcInput): DamageResult {
  const cond = applyConditionalUptimes(input.conditionalUptimes, input.passiveSkills);

  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const physicalHitzone = part.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);

  let physicalSum = 0, elementSum = 0;

  const patterns: PatternResult[] = input.motionPatterns.map(p => {
    let phys = 0, elem = 0, frames = 0;
    for (const m of p.motions) {
      const d = calcMotionDamage(m, input, cond.attackBonus, cond.affinityBonus);
      phys += d.physical;
      elem += d.element;
      frames += m.frames;
    }
    const damage = Math.floor(phys + elem);
    physicalSum += phys * p.ratio;
    elementSum  += elem * p.ratio;
    return { name: p.name, damage, frames, ratio: p.ratio };
  });

  const weightedDmg  = patterns.reduce((s, r) => s + r.damage * r.ratio, 0);
  const weightedTime = patterns.reduce((s, r) => s + r.frames * r.ratio, 0);
  const dps = weightedTime > 0 ? (weightedDmg / weightedTime) * 60 : 0;

  const affBonus = affinitySkillBonus(input.passiveSkills,
    { hitzonePhysical: physicalHitzone, isDraw: false });
  const repAffinity = clampAffinity(input.weapon.affinity + affBonus + cond.affinityBonus) / 100;
  const repCritMult = repAffinity >= 0 ? critMultiplier(input.passiveSkills) : 0.75;
  const repCritCoef = critCoefficient(repAffinity * 100, repCritMult);

  return {
    expectedDPS: dps,
    physicalAvg: Math.round(physicalSum),
    elementAvg:  Math.round(elementSum),
    effectiveAffinity: repAffinity,
    critCoefficient: repCritCoef,
    patterns,
  };
}
