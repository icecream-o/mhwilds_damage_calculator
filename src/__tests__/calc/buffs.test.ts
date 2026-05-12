import { resolveBuffs } from '../../calc/buffs';
import type { Buff } from '../../types';

const masters: Buff[] = [
  { id: 'demon-drug-g', name: '鬼人薬グレート', category: 'item', exclusiveGroup: 'atk-large', attackBonus: 7 },
  { id: 'demon-drug',   name: '鬼人薬',         category: 'item', exclusiveGroup: 'atk-large', attackBonus: 5 },
  { id: 'might-seed',   name: '怪力の種',       category: 'item', exclusiveGroup: 'atk-small', attackBonus: 10 },
  { id: 'powercharm',   name: '力の護符',       category: 'item', attackBonus: 6 },
  { id: 'horn-atk-l',   name: '笛攻撃力UP【大】', category: 'horn', exclusiveGroup: 'horn-atk', attackMultiplier: 1.15 },
  { id: 'horn-atk-m',   name: '笛攻撃力UP【中】', category: 'horn', exclusiveGroup: 'horn-atk', attackMultiplier: 1.10 },
];

describe('resolveBuffs', () => {
  test('排他グループ内は最強値だけ採用 (鬼人薬グレート + 鬼人薬)', () => {
    const r = resolveBuffs(['demon-drug-g', 'demon-drug'], masters);
    expect(r.attackBonus).toBe(7); // グレートのみ
  });

  test('別グループ + 護符 (3バフ合算)', () => {
    const r = resolveBuffs(['demon-drug-g', 'might-seed', 'powercharm'], masters);
    expect(r.attackBonus).toBe(7 + 10 + 6); // 23
  });

  test('笛バフは attackMultiplier として集計', () => {
    const r = resolveBuffs(['horn-atk-l', 'horn-atk-m'], masters);
    expect(r.attackMultiplier).toBeCloseTo(1.15); // L のみ
  });

  test('空入力 → 全部デフォルト', () => {
    const r = resolveBuffs([], masters);
    expect(r.attackBonus).toBe(0);
    expect(r.attackMultiplier).toBe(1);
    expect(r.affinityBonus).toBe(0);
  });

  test('未知のIDは無視', () => {
    const r = resolveBuffs(['unknown-buff'], masters);
    expect(r.attackBonus).toBe(0);
  });
});
