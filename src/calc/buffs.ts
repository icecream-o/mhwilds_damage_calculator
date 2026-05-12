import type { Buff } from '../types';

export interface ResolvedBuffs {
  attackBonus: number;
  attackMultiplier: number;
  affinityBonus: number;
}

/**
 * 選択されたバフIDから効果値を集計する。
 * exclusiveGroup が同じバフは最も効果が大きい1つだけ採用する。
 * 効果の大きさ判定: attackBonus + attackMultiplier×100 + affinityBonus の単純合計。
 */
export function resolveBuffs(buffIds: string[], masters: Buff[]): ResolvedBuffs {
  const selected = buffIds
    .map(id => masters.find(b => b.id === id))
    .filter((b): b is Buff => b !== undefined);

  // exclusiveGroup ごとに最強を選ぶ
  const groupBest = new Map<string, Buff>();
  const independent: Buff[] = [];

  const strength = (b: Buff): number =>
    (b.attackBonus ?? 0) + (b.attackMultiplier ? (b.attackMultiplier - 1) * 100 : 0) + (b.affinityBonus ?? 0);

  for (const b of selected) {
    if (b.exclusiveGroup) {
      const cur = groupBest.get(b.exclusiveGroup);
      if (!cur || strength(b) > strength(cur)) {
        groupBest.set(b.exclusiveGroup, b);
      }
    } else {
      independent.push(b);
    }
  }

  const active = [...groupBest.values(), ...independent];

  const result: ResolvedBuffs = { attackBonus: 0, attackMultiplier: 1, affinityBonus: 0 };
  for (const b of active) {
    if (b.attackBonus !== undefined) result.attackBonus += b.attackBonus;
    if (b.attackMultiplier !== undefined) result.attackMultiplier *= b.attackMultiplier;
    if (b.affinityBonus !== undefined) result.affinityBonus += b.affinityBonus;
  }
  return result;
}
