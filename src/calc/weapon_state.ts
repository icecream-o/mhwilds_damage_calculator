import type { WeaponInput, MotionTag, DamageType, BowBinType } from '../types';

export interface WeaponStateMultipliers {
  physicalMultiplier: number;
  elementMultiplier: number;
}

/**
 * 武器固有プロパティ（ビン・弾種）に基づくモーション別補正を返す。
 * 砲撃モーション（shell-*）はこの補正を受けない（melee.ts 側で除外済み）。
 *
 * 暫定値（要Kiranico実測確認）:
 *   弓 強撃ビン ×1.30 / 接撃ビン ×1.40 / 属強ビン ×1.20（属性）
 *   スラアク 強撃ビン ×1.15（物理）/ 属性強化ビン ×1.45（属性）
 *   チャアク 榴弾ビン ×1.35（物理）/ 強属性ビン ×1.25（属性）
 */
export function resolveWeaponState(
  weapon: WeaponInput,
  motionTags: readonly MotionTag[],
  _damageType: DamageType,
): WeaponStateMultipliers {
  let physicalMultiplier = 1;
  let elementMultiplier = 1;

  if (weapon.type === 'bow' && weapon.bowBins) {
    const bins = weapon.bowBins as BowBinType[];
    if (bins.includes('強撃') && motionTags.includes('binshot-power')) {
      physicalMultiplier *= 1.30;
    }
    if (bins.includes('接撃') && motionTags.includes('binshot-close')) {
      physicalMultiplier *= 1.40;
    }
    if (bins.includes('属強') && motionTags.includes('binshot-element')) {
      elementMultiplier *= 1.20;
    }
  }

  if (weapon.type === 'switch-axe' && weapon.switchAxeBin) {
    if (motionTags.includes('phial-active')) {
      if (weapon.switchAxeBin === 'power')   physicalMultiplier *= 1.15;
      if (weapon.switchAxeBin === 'element') elementMultiplier  *= 1.45;
    }
  }

  if (weapon.type === 'charge-blade' && weapon.chargeBladeBin) {
    if (motionTags.includes('discharge')) {
      if (weapon.chargeBladeBin === 'impact')  physicalMultiplier *= 1.35;
      if (weapon.chargeBladeBin === 'element') elementMultiplier  *= 1.25;
    }
  }

  return { physicalMultiplier, elementMultiplier };
}
