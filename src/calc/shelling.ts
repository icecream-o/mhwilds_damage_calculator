import type { GunlanceShellType } from '../types';

const SHELLING_TABLE: Record<GunlanceShellType, Record<number, number>> = {
  normal: { 1: 12, 2: 16, 3: 20, 4: 24, 5: 28, 6: 32 },
  spread: { 1: 14, 2: 18, 3: 22, 4: 26, 5: 30, 6: 34 },
  long:   { 1: 13, 2: 17, 3: 21, 4: 25, 5: 29, 6: 33 },
};

/**
 * 砲撃ダメージ = 砲撃値テーブル[type][level] × 砲術倍率
 * 攻撃力・会心率・斬れ味補正・肉質は影響しない。
 * @param artilleryMultiplier - 砲術スキルの physicalMultiplier（スキルなし時は 1.0）
 */
export function shellDamage(
  shellType: GunlanceShellType,
  level: number,
  artilleryMultiplier: number,
): number {
  const base = SHELLING_TABLE[shellType]?.[level] ?? 0;
  return base * artilleryMultiplier;
}
