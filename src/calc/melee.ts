import type {
  CalcInput, DamageResult, PatternResult, Motion, Monster, MonsterPart,
  SkillMaster, Buff, MotionTag, DamageType, WeaponType,
} from '../types';
import { meleeSharpnessMult, elementSharpnessMult } from './sharpness';
import { clampAffinity, critCoefficient } from './affinity';
import { resolveSkills } from './skill_resolver';
import { resolveBuffs } from './buffs';
import { shellDamage } from './shelling';
import { resolveWeaponState } from './weapon_state';

const WEAPON_COEF: Record<string, number> = {
  'longsword': 3.3, 'greatsword': 4.8, 'sword-and-shield': 1.4,
  'dual-blades': 1.4, 'hammer': 5.2, 'hunting-horn': 4.2,
  'lance': 2.3, 'gunlance': 2.3, 'switch-axe': 5.4,
  'charge-blade': 3.6, 'insect-glaive': 3.1,
  'bow': 1.2, 'light-bowgun': 1.3, 'heavy-bowgun': 1.5,
};

function isRanged(type: WeaponType): boolean {
  return type === 'bow' || type === 'light-bowgun' || type === 'heavy-bowgun';
}

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

  // モーションタグ・ダメージタイプ（v1互換: isDraw → 'draw' タグ）
  const tags: readonly MotionTag[] = (motion.tags ?? (motion.isDraw ? ['draw'] : [])) as readonly MotionTag[];
  const damageType: DamageType = motion.damageType ?? 'physical';

  // スキル解決（タグ・肉質・ダメージタイプ条件付き）
  const skills = resolveSkills(input.skills, skillMasters, {
    hitzonePhysical: physicalHitzone, tags, damageType,
  });

  const weaponState = resolveWeaponState(input.weapon, tags, damageType);

  // 攻撃力期待値
  const attack = (input.weapon.attack + skills.attackBonus + buffAgg.attackBonus)
               * skills.attackMultiplier * buffAgg.attackMultiplier;

  // 会心期待値
  const affinity = clampAffinity(
    input.weapon.affinity + skills.affinityBonus + buffAgg.affinityBonus
  );
  const critMult = affinity >= 0 ? skills.critMultiplier : 0.75;
  const critCoef = critCoefficient(affinity, critMult);

  const coef = WEAPON_COEF[input.weapon.type] ?? 1.0;
  // 弓・弾系は斬れ味補正なし（斬れ味ゲージ自体が存在しない）
  const ranged = isRanged(input.weapon.type);
  const sharpPhys = ranged ? 1.0 : meleeSharpnessMult(input.weapon.sharpness);
  const sharpElem = ranged ? 1.0 : elementSharpnessMult(input.weapon.sharpness);

  let physical: number;
  if (damageType === 'fixed') {
    // 固定値ダメージ（スキル・肉質・会心・斬れ味なし）
    physical = motion.motionValue;
  } else if (damageType.startsWith('shell-')) {
    // 砲撃ダメージ: テーブル値 × 砲術倍率。攻撃力・会心・斬れ味・肉質は無効
    const shell = input.weapon.gunlanceShell;
    physical = shell ? shellDamage(shell.type, shell.level, skills.physicalMultiplier) : 0;
  } else {
    // 通常物理・弓矢・弾系
    physical = (attack / coef)
             * (motion.motionValue / 100)
             * sharpPhys
             * critCoef
             * skills.physicalMultiplier
             * weaponState.physicalMultiplier
             * (physicalHitzone / 100);
  }

  // 属性ダメージ（砲撃・固定値は属性なし）
  // 計算式: min((属性値 + elementBonus) * elementMultiplier, cap)
  // elementBonus は属性攻撃強化Lv1等の絶対値ボーナス。属性0の武器には適用しない。
  let element = 0;
  if (input.weapon.element && damageType !== 'fixed' && !damageType.startsWith('shell-')) {
    const baseValue = input.weapon.element.value;
    const cap = elementCap(baseValue, input.weapon.elementCap);
    const effectiveElementValue = Math.min(
      (baseValue + skills.elementBonus) * skills.elementMultiplier,
      cap,
    );
    element = effectiveElementValue
            * sharpElem
            * (elementHitzone / 100)
            * weaponState.elementMultiplier;
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

  // 代表値（表示用）: 常時スキルのみ・タグなし
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
