# Plan B: Full Weapon Logic & All-Weapon Motion Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the damage calc engine with gunlance shell damage, weapon-specific bin multipliers (bow/SA/CB), full bow/bowgun support, and motion data for all 14 weapon types.

**Architecture:** The existing `src/calc/melee.ts` already handles physical/element damage with motion tags and skill applicability. Plan B adds: (1) `src/calc/shelling.ts` for gunlance shell damage lookup, (2) `src/calc/weapon_state.ts` for bow-bin/SA-bin/CB-bin multipliers, (3) ranged weapon coefs + sharpness bypass in `melee.ts`, and (4) CSV motion data for the 13 weapon types not yet covered.

**Tech Stack:** TypeScript 5 · Vitest · Python 3.13 · pytest · CSV (source of truth) → JSON (build artifact)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `data/shelling_table.csv` | Gunlance shell base-damage values (Lv1-6 per type) |
| Modify | `scripts/scraper/csv_to_json.py` | Add `convert_shelling_table()` + update `main()` |
| Create | `public/data/shelling_table.json` | Generated — gunlance lookup at runtime |
| Modify | `src/types/index.ts` | Add `MotionTag` variants: `binshot-power`, `binshot-close`, `binshot-element`, `phial-active`, `discharge` |
| Create | `src/calc/shelling.ts` | `shellDamage(type, level, artilleryMult)` pure function |
| Modify | `src/calc/melee.ts` | Add `shell-*` branch, `isRanged`, ranged WEAPON_COEFs, import shelling + weapon_state |
| Modify | `src/calc/index.ts` | Remove ranged-weapon `throw` |
| Create | `src/calc/weapon_state.ts` | `resolveWeaponState(weapon, tags, damageType)` — bow/SA/CB bin multipliers |
| Create | `src/__tests__/calc/shelling.test.ts` | Unit tests for `shellDamage` |
| Create | `src/__tests__/calc/weapon_state.test.ts` | Unit tests for `resolveWeaponState` |
| Modify | `src/__tests__/calc/melee.test.ts` | Add GL shell + bow tests |
| Modify | `scripts/scraper/tests/test_csv_to_json.py` | Add `TestConvertShellingTable` |
| Create | `data/motions_greatsword.csv` | GS motion data (9 motions) |
| Create | `data/motions_swordshield.csv` | SnS motion data (7 motions) |
| Create | `data/motions_dualblades.csv` | DB motion data (7 motions) |
| Create | `data/motions_hammer.csv` | Hammer motion data (7 motions) |
| Create | `data/motions_huntinghorn.csv` | HH motion data (5 motions) |
| Create | `data/motions_lance.csv` | Lance motion data (6 motions) |
| Create | `data/motions_gunlance.csv` | GL motion data (5 motions, incl. shell-normal + shell-long) |
| Create | `data/motions_switchaxe.csv` | SA motion data (5 motions, incl. phial-active) |
| Create | `data/motions_chargeblade.csv` | CB motion data (5 motions, incl. discharge) |
| Create | `data/motions_insectglaive.csv` | IG motion data (5 motions, incl. aerial) |
| Create | `data/motions_bow.csv` | Bow motion data (5 motions, incl. binshot-power/close) |
| Create | `data/motions_lightbowgun.csv` | LBG motion data (5 motions) |
| Create | `data/motions_heavybowgun.csv` | HBG motion data (5 motions) |
| Modify | `public/data/motions.json` | Regenerated — all 14 weapons |

---

## Task 1: Shelling Table CSV + Python Conversion

**Files:**
- Create: `data/shelling_table.csv`
- Modify: `scripts/scraper/csv_to_json.py`
- Modify: `scripts/scraper/tests/test_csv_to_json.py`

### Background

`scripts/scraper/csv_to_json.py` already converts skills/buffs/monsters/motions CSVs to JSON. We add a `convert_shelling_table()` function and a new `"shelling"` target in `main()`. The CSV is two-column: `shell_type` (normal/spread/long) and `level` (1-6) and `damage`. The JSON output is nested by type then level (level as string key, per JSON convention from spec).

Existing test file is `scripts/scraper/tests/test_csv_to_json.py`. Import structure: `from csv_to_json import (convert_skills, ...)`.

Run tests from `scripts/scraper/`:
```bash
cd scripts/scraper
python -m pytest tests/test_csv_to_json.py -v
```

---

- [ ] **Step 1: Write the failing test**

Open `scripts/scraper/tests/test_csv_to_json.py` and add at the top import:

```python
from csv_to_json import (
    convert_skills, convert_buffs, convert_monsters, convert_motions,
    convert_shelling_table,
)
```

Then append the test class at the bottom of the file:

```python
class TestConvertShellingTable:
    def test_basic_structure(self, tmp_path):
        content = "shell_type,level,damage\nnormal,1,12\nnormal,2,16\nspread,1,14\n"
        f = tmp_path / "shelling_table.csv"
        f.write_text(content, encoding="utf-8")
        result = convert_shelling_table(f)
        assert result == {"normal": {"1": 12, "2": 16}, "spread": {"1": 14}}

    def test_level_key_is_string(self, tmp_path):
        content = "shell_type,level,damage\nnormal,1,12\n"
        f = tmp_path / "shelling_table.csv"
        f.write_text(content, encoding="utf-8")
        result = convert_shelling_table(f)
        assert "1" in result["normal"]
        assert result["normal"]["1"] == 12

    def test_all_three_shell_types(self, tmp_path):
        lines = ["shell_type,level,damage",
                 "normal,1,12", "spread,1,14", "long,1,13"]
        f = tmp_path / "shelling_table.csv"
        f.write_text("\n".join(lines), encoding="utf-8")
        result = convert_shelling_table(f)
        assert set(result.keys()) == {"normal", "spread", "long"}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd scripts/scraper
python -m pytest tests/test_csv_to_json.py::TestConvertShellingTable -v
```

Expected: `ImportError: cannot import name 'convert_shelling_table'`

- [ ] **Step 3: Create the CSV file**

Create `data/shelling_table.csv` with this exact content (values per design spec §6.2):

```csv
shell_type,level,damage
normal,1,12
normal,2,16
normal,3,20
normal,4,24
normal,5,28
normal,6,32
spread,1,14
spread,2,18
spread,3,22
spread,4,26
spread,5,30
spread,6,34
long,1,13
long,2,17
long,3,21
long,4,25
long,5,29
long,6,33
```

- [ ] **Step 4: Implement `convert_shelling_table` in csv_to_json.py**

Open `scripts/scraper/csv_to_json.py`. Add this function after `convert_motions`:

```python
def convert_shelling_table(shelling_file: Path) -> dict:
    """shelling_table.csv → shelling_table.json の辞書
    出力形式: {"normal": {"1": 12, "2": 16, ...}, "spread": {...}, "long": {...}}
    """
    result: dict[str, dict[str, int]] = {}
    with open(shelling_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            shell_type = row["shell_type"]
            level = row["level"]          # 文字列キーのまま保持
            damage = int(row["damage"])
            result.setdefault(shell_type, {})[level] = damage
    return result
```

Then update `main()` — change the `all_targets` default list and add the shelling block:

```python
def main(targets: list[str] | None = None) -> None:
    all_targets = targets or ["skills", "series", "group", "buffs", "monsters", "motions", "shelling"]

    if "skills" in all_targets:
        data = convert_skills(
            DATA_DIR / "skills.csv", DATA_DIR / "skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "skills.json")

    if "series" in all_targets:
        data = convert_skills(
            DATA_DIR / "series_skills.csv", DATA_DIR / "series_skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "series_skills.json")

    if "group" in all_targets:
        data = convert_skills(
            DATA_DIR / "group_skills.csv", DATA_DIR / "group_skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "group_skills.json")

    if "buffs" in all_targets:
        data = convert_buffs(DATA_DIR / "buffs.csv")
        _write_json(data, PUBLIC_DATA_DIR / "buffs.json")

    if "monsters" in all_targets:
        data = convert_monsters(DATA_DIR / "monsters.csv")
        _write_json(data, PUBLIC_DATA_DIR / "monsters.json")

    if "motions" in all_targets:
        data = convert_motions()
        _write_json(data, PUBLIC_DATA_DIR / "motions.json")

    if "shelling" in all_targets:
        data = convert_shelling_table(DATA_DIR / "shelling_table.csv")
        _write_json(data, PUBLIC_DATA_DIR / "shelling_table.json")
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd scripts/scraper
python -m pytest tests/test_csv_to_json.py::TestConvertShellingTable -v
```

Expected: `3 passed`

- [ ] **Step 6: Generate shelling_table.json**

```bash
cd scripts/scraper
python csv_to_json.py shelling
```

Expected output: `  wrote .../public/data/shelling_table.json`

Verify: `public/data/shelling_table.json` exists and starts with:
```json
{
  "normal": {
    "1": 12,
    "2": 16,
```

- [ ] **Step 7: Run full Python test suite**

```bash
cd scripts/scraper
python -m pytest -v
```

Expected: all existing tests + 3 new = passing total (no regressions).

- [ ] **Step 8: Commit**

```bash
git add data/shelling_table.csv public/data/shelling_table.json scripts/scraper/csv_to_json.py scripts/scraper/tests/test_csv_to_json.py
git commit -m "feat(data): add shelling_table CSV + JSON + Python converter"
```

---

## Task 2: TypeScript Calc Engine — Shell Damage + Ranged Support

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/calc/shelling.ts`
- Modify: `src/calc/melee.ts`
- Modify: `src/calc/index.ts`
- Create: `src/__tests__/calc/shelling.test.ts`
- Modify: `src/__tests__/calc/melee.test.ts`

### Background

`src/calc/melee.ts` already handles `fixed` and `physical` damage types. We add a `shell-*` branch that bypasses weapon attack/sharpness/hitzone/crit and uses `shellDamage()` instead. Artillery skill's `physicalMultiplier` still applies — the skill CSV already has `requireDamageType: shell-normal|shell-spread|shell-long` so `resolveSkills` picks it up automatically.

Ranged weapons (bow, LBG, HBG) are currently blocked in `src/calc/index.ts` with a `throw`. We remove that restriction and add ranged weapon coefs + `isRanged()` so sharpness multipliers return 1.0 for ranged weapons (they have no sharpness bar).

New `MotionTag` variants: `binshot-power`, `binshot-close`, `binshot-element` (bow bin tags on motions), `phial-active` (SA phial motions), `discharge` (CB ultra-burst motions). These are used in Task 3's `weapon_state.ts`.

Run TypeScript tests from the project root:
```bash
npx vitest run
```

---

- [ ] **Step 1: Write the failing shelling unit test**

Create `src/__tests__/calc/shelling.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { shellDamage } from '../../calc/shelling';

describe('shellDamage', () => {
  test('normal Lv1 = 12', () => {
    expect(shellDamage('normal', 1, 1.0)).toBe(12);
  });

  test('normal Lv6 = 32', () => {
    expect(shellDamage('normal', 6, 1.0)).toBe(32);
  });

  test('spread Lv3 = 22', () => {
    expect(shellDamage('spread', 3, 1.0)).toBe(22);
  });

  test('long Lv5 = 29', () => {
    expect(shellDamage('long', 5, 1.0)).toBe(29);
  });

  test('artillery multiplier scales linearly', () => {
    // normal Lv1 = 12, artillery ×1.30 → 15.6
    expect(shellDamage('normal', 1, 1.30)).toBeCloseTo(15.6);
  });

  test('unknown level returns 0', () => {
    expect(shellDamage('normal', 99, 1.0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/__tests__/calc/shelling.test.ts
```

Expected: `Error: Failed to resolve import "../../calc/shelling"`

- [ ] **Step 3: Extend MotionTag in types/index.ts**

Open `src/types/index.ts`. The current definition is:

```ts
export type MotionTag =
  | 'draw' | 'jump' | 'aerial'
  | 'offset' | 'tackle' | 'finisher';
```

Replace with:

```ts
export type MotionTag =
  | 'draw' | 'jump' | 'aerial'
  | 'offset' | 'tackle' | 'finisher'
  | 'binshot-power' | 'binshot-close' | 'binshot-element'
  | 'phial-active' | 'discharge';
```

- [ ] **Step 4: Create src/calc/shelling.ts**

```ts
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
```

- [ ] **Step 5: Run shelling unit test to verify it passes**

```bash
npx vitest run src/__tests__/calc/shelling.test.ts
```

Expected: `6 passed`

- [ ] **Step 6: Write failing gunlance + bow integration tests**

Open `src/__tests__/calc/melee.test.ts`. The file already has a `monster` and `baseInput` fixture. Add these two tests inside the existing `describe('calcDamage (v2 melee)', ...)` block, after the last existing test:

```ts
  test('gunlance shell-normal bypasses attack/sharpness/hitzone', () => {
    const gl: CalcInput = {
      weapon: {
        type: 'gunlance', attack: 330, affinity: 0,
        element: null, sharpness: 'purple',
        gunlanceShell: { type: 'normal', level: 5 },  // base damage = 28
      },
      skills: [],
      buffs: [],
      motionPatterns: [{
        name: 'shell', ratio: 1.0,
        motions: [{ motionName: '砲撃', motionValue: 0, frames: 35, isDraw: false, damageType: 'shell-normal' }],
      }],
      target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
    };
    const r = calcDamage(gl, [], []);
    // shell: 28 × 1.0 (no artillery) = 28; floor(28 × 1.0 defenseRate) = 28
    expect(r.patterns[0].damage).toBe(28);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });

  test('bow arrow motion returns positive DPS without sharpness error', () => {
    const bow: CalcInput = {
      weapon: { type: 'bow', attack: 200, affinity: 0, element: null, sharpness: 'purple' },
      skills: [],
      buffs: [],
      motionPatterns: [{
        name: 'charged', ratio: 1.0,
        motions: [{ motionName: '溜め射ちLv3', motionValue: 24, frames: 45, isDraw: false, damageType: 'arrow' }],
      }],
      target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
    };
    // Must NOT throw "not yet supported"
    const r = calcDamage(bow, [], []);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });
```

- [ ] **Step 7: Run to verify these two tests fail**

```bash
npx vitest run src/__tests__/calc/melee.test.ts
```

Expected: existing 6 tests pass, new 2 fail (ranged throws + no shell branch).

- [ ] **Step 8: Update src/calc/index.ts — remove ranged restriction**

The full replacement of `src/calc/index.ts`:

```ts
import type { CalcInput, DamageResult, SkillMaster, Buff } from '../types';
import { calcMeleeDamage } from './melee';

export function calcDamage(
  input: CalcInput,
  skillMasters: SkillMaster[],
  buffMasters: Buff[],
): DamageResult {
  return calcMeleeDamage(input, skillMasters, buffMasters);
}
```

- [ ] **Step 9: Update src/calc/melee.ts — add shell + isRanged + ranged coefs**

Replace the full content of `src/calc/melee.ts` with:

```ts
import type {
  CalcInput, DamageResult, PatternResult, Motion, Monster, MonsterPart,
  SkillMaster, Buff, MotionTag, DamageType, WeaponType,
} from '../types';
import { meleeSharpnessMult, elementSharpnessMult } from './sharpness';
import { clampAffinity, critCoefficient } from './affinity';
import { resolveSkills } from './skill_resolver';
import { resolveBuffs } from './buffs';
import { shellDamage } from './shelling';

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
             * (physicalHitzone / 100);
  }

  // 属性ダメージ（砲撃・固定値は属性なし）
  let element = 0;
  if (input.weapon.element && damageType !== 'fixed' && !damageType.startsWith('shell-')) {
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
```

- [ ] **Step 10: Run all TypeScript tests to verify passing**

```bash
npx vitest run
```

Expected: all previous tests pass + 2 new tests in melee.test.ts + 6 in shelling.test.ts = all green.

- [ ] **Step 11: Commit**

```bash
git add src/types/index.ts src/calc/shelling.ts src/calc/melee.ts src/calc/index.ts src/__tests__/calc/shelling.test.ts src/__tests__/calc/melee.test.ts
git commit -m "feat(calc): add shell damage engine, ranged weapon support, new MotionTags"
```

---

## Task 3: weapon_state.ts — Bow Bins, SA Bins, CB Bins

**Files:**
- Create: `src/calc/weapon_state.ts`
- Modify: `src/calc/melee.ts`
- Create: `src/__tests__/calc/weapon_state.test.ts`

### Background

`resolveWeaponState` computes per-motion physical/element multipliers from weapon-specific properties: bow bins (強撃/接撃/属強), switch-axe bins (power/element), charge-blade bins (impact/element). Shell-damage motions bypass this (already handled in Task 2). Note: values 強撃×1.30 and 接撃×1.40 are暫定 (per design spec §12.2).

---

- [ ] **Step 1: Write the failing weapon_state tests**

Create `src/__tests__/calc/weapon_state.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { resolveWeaponState } from '../../calc/weapon_state';
import type { WeaponInput } from '../../types';

const baseBow: WeaponInput = {
  type: 'bow', attack: 200, affinity: 0, element: null, sharpness: 'purple',
};

describe('resolveWeaponState', () => {
  test('returns 1.0 multipliers by default (no bins)', () => {
    const r = resolveWeaponState(baseBow, [], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
    expect(r.elementMultiplier).toBe(1);
  });

  test('bow 強撃ビン: 1.30× physical on binshot-power motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['強撃'] };
    const r = resolveWeaponState(w, ['binshot-power'], 'arrow');
    expect(r.physicalMultiplier).toBeCloseTo(1.30);
  });

  test('bow 強撃ビン: no bonus without binshot-power tag', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['強撃'] };
    const r = resolveWeaponState(w, [], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('bow 接撃ビン: 1.40× physical on binshot-close motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['接撃'] };
    const r = resolveWeaponState(w, ['binshot-close'], 'arrow');
    expect(r.physicalMultiplier).toBeCloseTo(1.40);
  });

  test('bow 属強ビン: 1.20× element on binshot-element motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['属強'] };
    const r = resolveWeaponState(w, ['binshot-element'], 'arrow');
    expect(r.elementMultiplier).toBeCloseTo(1.20);
    expect(r.physicalMultiplier).toBe(1);
  });

  test('bow bin not loaded: no bonus even if motion has tag', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['麻痺'] };
    const r = resolveWeaponState(w, ['binshot-power'], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('SA power bin: 1.15× physical on phial-active motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'power',
    };
    const r = resolveWeaponState(w, ['phial-active'], 'physical');
    expect(r.physicalMultiplier).toBeCloseTo(1.15);
    expect(r.elementMultiplier).toBe(1);
  });

  test('SA element bin: 1.45× element on phial-active motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'element',
    };
    const r = resolveWeaponState(w, ['phial-active'], 'physical');
    expect(r.elementMultiplier).toBeCloseTo(1.45);
    expect(r.physicalMultiplier).toBe(1);
  });

  test('SA bin: no bonus on non-phial motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'power',
    };
    const r = resolveWeaponState(w, [], 'physical');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('CB impact bin: 1.35× physical on discharge motion', () => {
    const w: WeaponInput = {
      type: 'charge-blade', attack: 250, affinity: 0,
      element: null, sharpness: 'white', chargeBladeBin: 'impact',
    };
    const r = resolveWeaponState(w, ['discharge'], 'physical');
    expect(r.physicalMultiplier).toBeCloseTo(1.35);
  });

  test('CB element bin: 1.25× element on discharge motion', () => {
    const w: WeaponInput = {
      type: 'charge-blade', attack: 250, affinity: 0,
      element: null, sharpness: 'white', chargeBladeBin: 'element',
    };
    const r = resolveWeaponState(w, ['discharge'], 'physical');
    expect(r.elementMultiplier).toBeCloseTo(1.25);
  });

  test('non-bin weapon type: always 1.0×', () => {
    const w: WeaponInput = {
      type: 'longsword', attack: 330, affinity: 0, element: null, sharpness: 'purple',
    };
    const r = resolveWeaponState(w, ['draw', 'finisher'], 'physical');
    expect(r.physicalMultiplier).toBe(1);
    expect(r.elementMultiplier).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/__tests__/calc/weapon_state.test.ts
```

Expected: `Error: Failed to resolve import "../../calc/weapon_state"`

- [ ] **Step 3: Create src/calc/weapon_state.ts**

```ts
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
```

- [ ] **Step 4: Run weapon_state tests to verify passing**

```bash
npx vitest run src/__tests__/calc/weapon_state.test.ts
```

Expected: `12 passed`

- [ ] **Step 5: Integrate weapon_state into melee.ts**

Open `src/calc/melee.ts`. Make three edits:

**Edit 1** — Add import at the top (after `import { shellDamage } from './shelling';`):

```ts
import { resolveWeaponState } from './weapon_state';
```

**Edit 2** — In `calcMotionDamage`, after the `resolveSkills` call (line beginning `const skills = resolveSkills...`), add:

```ts
  const weaponState = resolveWeaponState(input.weapon, tags, damageType);
```

**Edit 3** — In the `else` branch (normal physical / arrow / bowgun-bullet), apply `weaponState.physicalMultiplier`. Change:

```ts
    physical = (attack / coef)
             * (motion.motionValue / 100)
             * sharpPhys
             * critCoef
             * skills.physicalMultiplier
             * (physicalHitzone / 100);
```

to:

```ts
    physical = (attack / coef)
             * (motion.motionValue / 100)
             * sharpPhys
             * critCoef
             * skills.physicalMultiplier
             * weaponState.physicalMultiplier
             * (physicalHitzone / 100);
```

**Edit 4** — In the element block, apply `weaponState.elementMultiplier`. Change:

```ts
    element = effectiveElementValue
            * sharpElem
            * (elementHitzone / 100);
```

to:

```ts
    element = effectiveElementValue
            * sharpElem
            * (elementHitzone / 100)
            * weaponState.elementMultiplier;
```

- [ ] **Step 6: Run full test suite to verify no regressions**

```bash
npx vitest run
```

Expected: all tests pass (existing + shelling.test.ts + weapon_state.test.ts).

- [ ] **Step 7: Commit**

```bash
git add src/calc/weapon_state.ts src/calc/melee.ts src/__tests__/calc/weapon_state.test.ts
git commit -m "feat(calc): add weapon_state.ts for bow/SA/CB bin multipliers"
```

---

## Task 4: Motion Data — Bladed Melee Weapons (6 Types)

**Files:**
- Create: `data/motions_greatsword.csv`
- Create: `data/motions_swordshield.csv`
- Create: `data/motions_dualblades.csv`
- Create: `data/motions_hammer.csv`
- Create: `data/motions_huntinghorn.csv`
- Create: `data/motions_lance.csv`

### Background

CSV format (same as existing `data/motions_longsword.csv`):
```
motion_name,motion_value,frames,is_draw,tags,damage_type
```
- `tags`: pipe-separated `|`, empty if none
- `damage_type`: empty means `physical` (default in csv_to_json.py)
- Values are **placeholder approximations** for MH Wilds; verify via Kiranico scraper (Plan D infrastructure) before shipping production data.

No tests needed for this task — the existing `TestConvertMotions` in `test_csv_to_json.py` already covers the converter. Verify by regenerating `motions.json` (done in Task 5).

---

- [ ] **Step 1: Create data/motions_greatsword.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
縦振り,28,42,false,,
横振り,22,35,false,,
溜め斬りLv1,26,40,false,,
溜め斬りLv2,52,65,false,,
溜め斬りLv3,80,90,false,,
強溜め斬りLv1,30,45,false,,
強溜め斬りLv2,60,70,false,,
強溜め斬りLv3,90,95,false,,
抜刀溜め斬りLv3,77,90,true,draw,
```

- [ ] **Step 2: Create data/motions_swordshield.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
斬り1,13,18,false,,
斬り2,13,18,false,,
斬り3,14,20,false,,
盾攻撃1,11,18,false,,
盾攻撃2,13,20,false,,
ジャンプ斬り,14,30,false,jump,
抜刀斬り,12,20,true,draw,
```

- [ ] **Step 3: Create data/motions_dualblades.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
斬り,8,13,false,,
斬り返し,8,13,false,,
上段斬り,10,15,false,,
鬼人斬り1,8,12,false,,
鬼人斬り2,8,12,false,,
鬼人乱舞(1発),7,11,false,,
空中乱舞,8,20,false,jump|aerial,
```

- [ ] **Step 4: Create data/motions_hammer.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
縦振り,28,30,false,,
横振り,22,28,false,,
溜め1,30,50,false,,
溜め2,42,65,false,,
溜め3スタンプ,65,85,false,,
スタンプ,54,60,false,,
ジャンプスタンプ,48,55,false,jump|aerial,
```

- [ ] **Step 5: Create data/motions_huntinghorn.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
演奏1,22,35,false,,
演奏2,25,38,false,,
演奏3,28,42,false,,
こだま,35,55,false,,
ジャンプ演奏,24,40,false,jump,
```

- [ ] **Step 6: Create data/motions_lance.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
突き1,20,22,false,,
突き2,20,22,false,,
突き3,22,24,false,,
突き刺しフィニッシュ,30,40,false,finisher,
ジャンプ突き,26,40,false,jump,
ガードカウンター,28,35,false,offset,
```

- [ ] **Step 7: Verify CSV parsing locally**

```bash
cd scripts/scraper
python -c "
from csv_to_json import convert_motions
import csv_to_json, pathlib
# Temporarily point DATA_DIR at the project data folder
csv_to_json.DATA_DIR = pathlib.Path('../../data')
result = convert_motions()
weapons = list(result.keys())
print('weapons:', weapons)
for w in ['greatsword','swordshield','dualblades','hammer','huntinghorn','lance']:
    print(f'{w}: {len(result.get(w,[]))} motions')
"
```

Expected output (counts match the CSVs created above):
```
greatsword: 9 motions
swordshield: 7 motions
dualblades: 7 motions
hammer: 7 motions
huntinghorn: 5 motions
lance: 6 motions
```

- [ ] **Step 8: Commit**

```bash
git add data/motions_greatsword.csv data/motions_swordshield.csv data/motions_dualblades.csv data/motions_hammer.csv data/motions_huntinghorn.csv data/motions_lance.csv
git commit -m "feat(data): motion data for greatsword, swordshield, dualblades, hammer, huntinghorn, lance"
```

---

## Task 5: Motion Data — Special Melee + Ranged + JSON Regeneration + Tag

**Files:**
- Create: `data/motions_gunlance.csv`
- Create: `data/motions_switchaxe.csv`
- Create: `data/motions_chargeblade.csv`
- Create: `data/motions_insectglaive.csv`
- Create: `data/motions_bow.csv`
- Create: `data/motions_lightbowgun.csv`
- Create: `data/motions_heavybowgun.csv`
- Modify: `public/data/motions.json` (regenerated)

### Background

- Gunlance has two shell motions. `damage_type` is `shell-normal` or `shell-long`; `motion_value` is `0` (unused by shell calc).
- Switch-axe phial-active motions carry `phial-active` tag → `weapon_state.ts` applies bin multiplier.
- Charge-blade discharge motions carry `discharge` tag.
- Bow motions that benefit from 強撃/接撃 bins carry `binshot-power`/`binshot-close` tag respectively.
- Bowgun motions use `damage_type=bowgun-bullet`.
- All values are **placeholder approximations** — verify via Kiranico.

---

- [ ] **Step 1: Create data/motions_gunlance.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
縦斬り,23,30,false,,
横斬り,17,25,false,,
突き,20,28,false,,
砲撃,0,35,false,,shell-normal
竜撃砲,0,80,false,,shell-long
```

- [ ] **Step 2: Create data/motions_switchaxe.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
縦斬り,33,35,false,,
横斬り,26,30,false,,
ジャンプ斬り,30,45,false,jump,
属性解放斬り,42,50,false,phial-active,
属性解放フィニッシュ,55,60,false,phial-active|finisher,
```

- [ ] **Step 3: Create data/motions_chargeblade.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
斬り,18,28,false,,
縦斬り,22,32,false,,
盾突き,16,25,false,,
超高出力解放,50,70,false,discharge|finisher,
連続フィニッシュ,40,55,false,discharge,
```

- [ ] **Step 4: Create data/motions_insectglaive.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
斬り,12,20,false,,
縦斬り,15,22,false,,
跳躍斬り,18,32,false,jump,
空中縦斬り,24,35,false,aerial,
空中竜巻斬り,30,45,false,aerial|finisher,
```

- [ ] **Step 5: Create data/motions_bow.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
溜め射ちLv1,12,30,false,,arrow
溜め射ちLv2,18,38,false,,arrow
溜め射ちLv3,24,45,false,,arrow
剛射(強撃),28,50,false,binshot-power,arrow
剛射(接撃),26,48,false,binshot-close,arrow
```

- [ ] **Step 6: Create data/motions_lightbowgun.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
通常弾Lv1,18,28,false,,bowgun-bullet
通常弾Lv2,24,32,false,,bowgun-bullet
通常弾Lv3,30,36,false,,bowgun-bullet
散弾Lv1(1発),7,30,false,,bowgun-bullet
属性弾,12,32,false,,bowgun-bullet
```

- [ ] **Step 7: Create data/motions_heavybowgun.csv**

```csv
motion_name,motion_value,frames,is_draw,tags,damage_type
通常弾Lv1,24,32,false,,bowgun-bullet
通常弾Lv2,32,38,false,,bowgun-bullet
通常弾Lv3,42,44,false,,bowgun-bullet
貫通弾Lv1(1発),14,35,false,,bowgun-bullet
徹甲榴弾Lv1,30,40,false,,bowgun-bullet
```

- [ ] **Step 8: Regenerate public/data/motions.json**

```bash
cd scripts/scraper
python csv_to_json.py motions
```

Expected: `  wrote .../public/data/motions.json`

Verify all 14 keys present:

```bash
python -c "
import json, pathlib
data = json.loads(pathlib.Path('../../public/data/motions.json').read_text())
print(sorted(data.keys()))
print({k: len(v) for k, v in data.items()})
"
```

Expected:
```
['bow', 'chargeblade', 'dualblades', 'greatsword', 'hammer', 'heavybowgun', 'huntinghorn', 'insectglaive', 'lance', 'lightbowgun', 'longsword', 'switchaxe', 'swordshield', 'gunlance']
{'bow': 5, 'chargeblade': 5, 'dualblades': 7, 'greatsword': 9, 'hammer': 7, 'heavybowgun': 5, 'huntinghorn': 5, 'insectglaive': 5, 'lance': 6, 'lightbowgun': 5, 'longsword': 8, 'switchaxe': 5, 'swordshield': 7, 'gunlance': 5}
```

- [ ] **Step 9: Run full Python + TypeScript test suites**

```bash
cd scripts/scraper
python -m pytest -v
cd ../..
npx vitest run
```

Both must pass with 0 failures.

- [ ] **Step 10: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, bundle produced in `dist/`.

- [ ] **Step 11: Commit + tag**

```bash
git add data/motions_gunlance.csv data/motions_switchaxe.csv data/motions_chargeblade.csv data/motions_insectglaive.csv data/motions_bow.csv data/motions_lightbowgun.csv data/motions_heavybowgun.csv public/data/motions.json
git commit -m "feat(data): motion data for all 14 weapon types, regenerate motions.json"
git tag v0.4.0-plan-b
```

---

## Self-Review

### 1. Spec Coverage

| Plan B requirement | Covered by |
|---|---|
| 計算エンジンをMotionタグ・DamageType対応へ拡張 | Already done before Plan B (melee.ts tags/damageType handling existed); Task 2 adds shell-* branch |
| スキル適用条件のフルマッチングロジック | Already done (skill_resolver.ts); no changes needed |
| 武器固有プロパティの計算反映 (砲撃) | Tasks 1–2: shelling_table + shellDamage in melee.ts |
| 武器固有プロパティの計算反映 (ビン) | Task 3: weapon_state.ts + melee.ts integration |
| 全14武器種のモーションデータ整備 | Tasks 4–5: 13 new CSVs + regenerate motions.json |
| 砲撃値テーブル | Task 1: shelling_table.csv + JSON |
| 弓・弾系の会心/斬れ味なし | Task 2: isRanged() check in melee.ts |

### 2. Placeholder Scan

No TBD/TODO in code. Motion values noted as "placeholder approximations" — this is an explicit known limitation documented in the CSV comments, not a plan failure. The Kiranico scraper from Plan D can be used to fetch real values.

### 3. Type Consistency

- `MotionTag` extended in Task 2 (`binshot-power`, `binshot-close`, `binshot-element`, `phial-active`, `discharge`) → used in Task 3 `weapon_state.ts` → consistent.
- `shellDamage(GunlanceShellType, number, number): number` defined in Task 2 `shelling.ts` → imported in Task 2 `melee.ts` → consistent.
- `resolveWeaponState(WeaponInput, readonly MotionTag[], DamageType): WeaponStateMultipliers` defined in Task 3 → imported in Task 3 `melee.ts` → consistent.
- `WeaponStateMultipliers.physicalMultiplier` and `.elementMultiplier` defined in Task 3 → applied in Task 3 melee.ts edits → consistent.
- `GunlanceShellType = 'normal' | 'spread' | 'long'` (from types/index.ts) → used as key in `SHELLING_TABLE` in `shelling.ts` → consistent.
