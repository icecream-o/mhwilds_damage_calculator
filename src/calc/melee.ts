import type {
  CalcInput, DamageResult, PatternResult, Motion, Monster, MonsterPart,
  SkillMaster, Buff, MotionTag, DamageType,
} from '../types';
import { meleeSharpnessMult, elementSharpnessMult } from './sharpness';
import { clampAffinity, critCoefficient } from './affinity';
import { resolveSkills } from './skill_resolver';
import { resolveBuffs } from './buffs';

const WEAPON_COEF: Record<string, number> = {
  'longsword': 3.3, 'greatsword': 4.8, 'sword-and-shield': 1.4,
  'dual-blades': 1.4, 'hammer': 5.2, 'hunting-horn': 4.2,
  'lance': 2.3, 'gunlance': 2.3, 'switch-axe': 5.4,
  'charge-blade': 3.6, 'insect-glaive': 3.1,
};

function effectivePart(part: MonsterPart, enraged: boolean): {
  physical: number;
  element: MonsterPart['element'];
} {
  return {
    physical: enraged && part.enragedPhysical !== undefined ? part.enragedPhysical : part.physical,
    element: enraged && part.enragedElement !== undefined ? part.enragedElement : part.element,
  };
}

function computeDefenseRate(monster: Monster, variantId: string, override?: number): number {
  if (override !== undefined) return override;
  const variant = monster.variants.find(v => v.id === variantId);
  const mod = variant?.defenseRateMod ?? 1.0;
  return monster.baseDefenseRate * mod;
}

function elementCap(baseValue: number, override?: number): number {
  if (override !== undefined) return override;
  return Math.max(baseValue * 2.3, baseValue + 400);
}

interface MotionDamage { physical: number; element: number; }

function calcMotionDamage(
  motion: Motion,
  input: CalcInput,
  skillMasters: SkillMaster[],
  buffAgg: ReturnType<typeof resolveBuffs>,
): MotionDamage {
  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const eff = effectivePart(part, input.target.enraged);
  const physicalHitzone = eff.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);
  const elementHitzone  = input.weapon.element ? (eff.element[input.weapon.element.type] ?? 0) : 0;

  // モーションタグ・ダメージタイプ
  const tags: readonly MotionTag[] = (motion.tags ?? (motion.isDraw ? ['draw'] : [])) as readonly MotionTag[];
  const damageType: DamageType = motion.damageType ?? 'physical';

  // スキル解決
  const skills = resolveSkills(input.skills, skillMasters, {
    hitzonePhysical: physicalHitzone, tags, damageType,
  });

  // 攻撃力期待値
  const attack = (input.weapon.attack + skills.attackBonus + buffAgg.attackBonus)
               * skills.attackMultiplier * buffAgg.attackMultiplier;

  // 会心率期待値
  const affinity = clampAffinity(
    input.weapon.affinity + skills.affinityBonus + buffAgg.affinityBonus
  );

  // 会心倍率
  const critMult = affinity >= 0 ? skills.critMultiplier : 0.75;
  const critCoef = critCoefficient(affinity, critMult);

  // 物理ダメージ
  const coef = WEAPON_COEF[input.weapon.type] ?? 1.0;
  const sharpPhys = meleeSharpnessMult(input.weapon.sharpness);
  const sharpElem = elementSharpnessMult(input.weapon.sharpness);

  let physical: number;
  if (damageType === 'fixed') {
    physical = motion.motionValue;
  } else {
    physical = (attack / coef)
             * (motion.motionValue / 100)
             * sharpPhys
             * critCoef
             * skills.physicalMultiplier
             * (physicalHitzone / 100);
  }

  // 属性ダメージ
  let element = 0;
  if (input.weapon.element && damageType !== 'fixed') {
    const baseValue = input.weapon.element.value;
    const cap = elementCap(baseValue, input.weapon.elementCap);
    const effectiveElementValue = Math.min(baseValue * skills.elementMultiplier, cap);
    element = effectiveElementValue
            * sharpElem
            * (elementHitzone / 100);
  }

  return { physical, element };
}

export function calcMeleeDamage(
  input: CalcInput,
  skillMasters: SkillMaster[],
  buffMasters: Buff[],
): DamageResult {
  const buffAgg = resolveBuffs(input.buffs, buffMasters);
  const defenseRate = computeDefenseRate(input.target.monster, input.target.variantId, input.target.defenseRateOverride);

  let physicalSum = 0, elementSum = 0;

  const patterns: PatternResult[] = input.motionPatterns.map(p => {
    let phys = 0, elem = 0, frames = 0;
    for (const m of p.motions) {
      const d = calcMotionDamage(m, input, skillMasters, buffAgg);
      phys += d.physical;
      elem += d.element;
      frames += m.frames;
    }
    const damage = Math.floor((phys + elem) * defenseRate);
    physicalSum += phys * p.ratio;
    elementSum  += elem * p.ratio;
    return { name: p.name, damage, frames, ratio: p.ratio };
  });

  const weightedDmg  = patterns.reduce((s, r) => s + r.damage * r.ratio, 0);
  const weightedTime = patterns.reduce((s, r) => s + r.frames * r.ratio, 0);
  const dps = weightedTime > 0 ? (weightedDmg / weightedTime) * 60 : 0;

  // 代表値（表示用）: 頭部 / 抜刀無し
  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const eff = effectivePart(part, input.target.enraged);
  const physicalHitzone = eff.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);
  const repSkills = resolveSkills(input.skills, skillMasters, {
    hitzonePhysical: physicalHitzone, tags: [], damageType: 'physical',
  });
  const repAff = clampAffinity(input.weapon.affinity + repSkills.affinityBonus + buffAgg.affinityBonus) / 100;
  const repCritMult = repAff >= 0 ? repSkills.critMultiplier : 0.75;
  const repCritCoef = critCoefficient(repAff * 100, repCritMult);

  return {
    expectedDPS: dps,
    physicalAvg: Math.round(physicalSum),
    elementAvg:  Math.round(elementSum),
    effectiveAffinity: repAff,
    critCoefficient: repCritCoef,
    defenseRate,
    patterns,
  };
}
