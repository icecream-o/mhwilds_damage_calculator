# Plan A: 直接入力UI 全面改修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v1 MVP の装備選択型UIを破棄し、武器パラメータ・発動スキル・バフを直接入力するUIへ全面改修する。計算エンジンは v2 設計（スキル適用条件・バフ排他処理・モンスターバリアント）に対応する。

**Architecture:** 既存の `calc/` モジュールを v2 型へ拡張、新UI（WeaponInputCard / SkillsInputCard / BuffsCard）を実装、`store/` をストア分割（weaponStore / skillStore / buffStore）。装備関連のコード（ArmorCard、aggregateSkills、buildStore.armor）は削除。モーションタグの本格対応・武器固有プロパティの計算反映は Plan B、I/O は Plan C のスコープ。

**Tech Stack:** 既存（React 18 + Vite + TypeScript + Tailwind v3 + Zustand + Dexie + Vitest）

**Reference:** 設計書 `docs/superpowers/specs/2026-05-12-mhwilds-damage-calc-design-v2.md` を正準とする。

---

## File Structure (Plan A で作成・変更・削除するファイル)

```
mhwilds_damage_calculator/
├── public/data/
│   ├── skills.json             # 修正: applicability + category 追加、スキル拡充
│   ├── monsters.json           # 修正: variants 追加、enraged 肉質追加
│   ├── series_skills.json      # 新規（最小限のサンプル）
│   ├── group_skills.json       # 新規（最小限のサンプル）
│   ├── buffs.json              # 新規
│   ├── weapons.json            # 維持（武器プリセットとして残す）
│   ├── motions.json            # 維持
│   ├── armor.json              # 削除
│   └── decorations.json        # 削除
├── src/
│   ├── types/index.ts          # 修正: WeaponInput, SkillMaster, Buff, MonsterVariant 追加
│   ├── calc/
│   │   ├── index.ts            # 修正: 新 CalcInput 対応
│   │   ├── melee.ts            # 修正: バフ集計, variant defenseRate, 怒り時肉質
│   │   ├── skills.ts           # 修正: SkillMaster ベースに変更
│   │   ├── skill_resolver.ts   # 新規: ActiveSkill + SkillMaster → 効果集計
│   │   ├── buffs.ts            # 新規: バフ集計 + 排他処理
│   │   ├── conditional.ts      # 維持（後で skill_resolver に統合検討）
│   │   ├── affinity.ts         # 維持
│   │   └── sharpness.ts        # 維持
│   ├── data/
│   │   ├── skills.ts           # 修正: applicability 含む型でロード
│   │   ├── monsters.ts         # 修正: variants 含む型でロード
│   │   ├── buffs.ts            # 新規
│   │   ├── series_skills.ts    # 新規
│   │   ├── group_skills.ts     # 新規
│   │   ├── weapons.ts          # 維持
│   │   ├── motions.ts          # 維持
│   │   ├── armor.ts            # 削除
│   │   └── decorations.ts      # 削除
│   ├── store/
│   │   ├── weaponStore.ts      # 新規（buildStore.weapon を独立化）
│   │   ├── skillStore.ts       # 新規（直接入力のActiveSkill[]）
│   │   ├── buffStore.ts        # 新規
│   │   ├── motionStore.ts      # 維持
│   │   ├── targetStore.ts      # 修正: variantId 追加
│   │   ├── themeStore.ts       # 維持
│   │   └── buildStore.ts       # 削除
│   ├── components/
│   │   ├── weapon/
│   │   │   ├── WeaponInputCard.tsx        # 新規
│   │   │   └── WeaponSpecificFields.tsx   # 新規
│   │   ├── skills/
│   │   │   ├── SkillsInputCard.tsx        # 新規
│   │   │   ├── SkillSearch.tsx            # 新規
│   │   │   ├── SkillRow.tsx               # 新規
│   │   │   ├── SeriesSkillsSection.tsx    # 新規
│   │   │   └── GroupSkillsSection.tsx     # 新規
│   │   ├── monster/
│   │   │   └── MonsterCard.tsx            # 移動（builder/ → monster/）+ variants対応
│   │   ├── buffs/
│   │   │   └── BuffsCard.tsx              # 新規
│   │   ├── motion/                        # 維持
│   │   ├── result/                        # 維持
│   │   ├── shared/                        # 維持
│   │   ├── layout/                        # 維持
│   │   ├── formula/                       # 維持
│   │   ├── theme/                         # 維持
│   │   └── builder/                       # 削除（WeaponCard, ArmorCard, SkillsCard, MonsterCard）
│   ├── utils/
│   │   ├── aggregateSkills.ts             # 削除
│   │   └── useTween.ts                    # 維持
│   ├── App.tsx                            # 修正: 新ストア・新コンポーネントに差し替え
│   └── __tests__/
│       ├── calc/melee.test.ts             # 修正: 新 CalcInput
│       ├── calc/skill_resolver.test.ts    # 新規
│       ├── calc/buffs.test.ts             # 新規
│       ├── store/themeStore.test.ts       # 維持
│       └── utils/aggregateSkills.test.ts  # 削除
└── docs/                                  # 維持
```

---

## Task 1: 型定義の v2 化（src/types/index.ts）

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 既存型を読んで現状を確認**

Run: `cat src/types/index.ts | head -50` 
既存の `Weapon`, `ArmorPiece`, `Decoration`, `Skill`, `Monster`, `MonsterPart`, `ConditionalSkillUptime`, `ActiveSkill`, `Build`, `CalcInput`, `DamageResult`, `PatternResult` を確認。

- [ ] **Step 2: src/types/index.ts に v2 型を追加・既存型を修正**

`src/types/index.ts` を以下の内容で完全に置き換える:

```ts
export type ThemeId = 'ember' | 'aurora' | 'forest' | 'solar';

export type WeaponType =
  | 'longsword' | 'greatsword' | 'sword-and-shield' | 'dual-blades'
  | 'hammer' | 'hunting-horn' | 'lance' | 'gunlance'
  | 'switch-axe' | 'charge-blade' | 'insect-glaive'
  | 'light-bowgun' | 'heavy-bowgun' | 'bow';

export type SharpnessColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'white' | 'purple';

export interface SharpnessValue { color: SharpnessColor; value: number; }

export type ElementType = '火' | '水' | '雷' | '氷' | '龍';

export interface Element { type: ElementType; value: number; }

// === v2: モーションタグ・ダメージタイプ ===
export type MotionTag =
  | 'draw' | 'jump' | 'aerial'
  | 'offset' | 'tackle' | 'finisher';

export type DamageType =
  | 'physical'
  | 'shell-normal' | 'shell-spread' | 'shell-long'
  | 'fixed'
  | 'arrow' | 'bowgun-bullet';

// === v2: 武器入力（直接入力モデル） ===
export type GunlanceShellType = 'normal' | 'spread' | 'long';
export type BowBinType = '強撃' | '接撃' | '属強' | '麻痺' | '睡眠' | '減気';
export type BowgunAmmoType =
  | '通常Lv1' | '通常Lv2' | '通常Lv3'
  | '貫通Lv1' | '貫通Lv2' | '貫通Lv3'
  | '散弾Lv1' | '散弾Lv2' | '散弾Lv3'
  | '徹甲榴弾Lv1' | '徹甲榴弾Lv2' | '徹甲榴弾Lv3'
  | '拡散弾Lv1' | '拡散弾Lv2' | '拡散弾Lv3'
  | '属性弾'
  | '状態異常弾';
export type ChargeBladeBin = 'impact' | 'element';
export type SwitchAxeBin = 'power' | 'element' | 'paralysis' | 'dragon' | 'exhaust';

export interface WeaponInput {
  type: WeaponType;
  attack: number;
  affinity: number;
  element: Element | null;
  sharpness: SharpnessColor;
  /** 属性キャップの上書き値。未指定時はデフォルト式 max(value × 2.3, value + 400) */
  elementCap?: number;
  // 武器種別の追加プロパティ（type に応じて使い分け）
  gunlanceShell?: { type: GunlanceShellType; level: number };
  bowBins?: BowBinType[];
  bowgunAmmo?: BowgunAmmoType[];
  chargeBladeBin?: ChargeBladeBin;
  switchAxeBin?: SwitchAxeBin;
}

// === v2: スキル（マスター + アクティブ） ===
export type SkillCategory = 'normal' | 'series' | 'group';

export interface SkillApplicability {
  /** モーションがこれらのタグを持つ時のみ適用 */
  requireTags?: MotionTag[];
  /** requireTags の OR/AND 切替（デフォルト: false = AND） */
  matchAny?: boolean;
  /** 該当ダメージタイプのモーションにのみ適用（砲術等） */
  requireDamageType?: DamageType[];
  /** 物理肉質がこの値以上のモーションにのみ適用（弱点特効: 45） */
  requireHitzonePhysical?: number;
}

export interface SkillEffectByLevel {
  level: number;
  /** 攻撃力 +X */
  attackBonus?: number;
  /** 攻撃力 ×X（1.05 等） */
  attackMultiplier?: number;
  /** 会心率 +X% */
  affinityBonus?: number;
  /** 会心倍率の上書き（超会心 1.40 等） */
  critMultiplier?: number;
  /** 属性値 ×X */
  elementMultiplier?: number;
  /** 物理ダメージ ×X（一部条件付きスキル） */
  physicalMultiplier?: number;
}

export interface SkillMaster {
  id: string;
  name: string;
  maxLevel: number;
  category: SkillCategory;
  description?: string;
  applicability?: SkillApplicability;
  effects: SkillEffectByLevel[];
}

export interface ActiveSkill {
  skillId: string;
  level: number;
  /** 条件付きスキルの発動時間割合 (0-1)。未指定時は常時発動扱い */
  uptime?: number;
}

// === v2: バフ ===
export type BuffCategory = 'item' | 'cat-food' | 'horn' | 'environment';

export interface Buff {
  id: string;
  name: string;
  category: BuffCategory;
  /** 同一グループ内は最強値だけ採用 */
  exclusiveGroup?: string;
  attackBonus?: number;
  attackMultiplier?: number;
  affinityBonus?: number;
  description?: string;
}

// === v2: モンスター（バリアント対応） ===
export interface MonsterVariant {
  id: string;
  name: string;
  /** baseDefenseRate に乗算される倍率 */
  defenseRateMod: number;
}

export interface MonsterPart {
  id: string;
  name: string;
  physical: number;
  element: Partial<Record<ElementType, number>>;
  woundedPhysicalBonus?: number;
  /** 怒り時の物理肉質（上書き値） */
  enragedPhysical?: number;
  /** 怒り時の属性肉質（上書き値） */
  enragedElement?: Partial<Record<ElementType, number>>;
}

export interface Monster {
  id: string;
  name: string;
  baseDefenseRate: number;
  variants: MonsterVariant[];
  parts: MonsterPart[];
}

// === v2: モーション ===
export interface Motion {
  motionName: string;
  motionValue: number;
  frames: number;
  /** 抜刀モーションフラグ（互換用、Plan B で tags に統合） */
  isDraw: boolean;
  /** v2: モーションタグ（Plan B で本格対応） */
  tags?: MotionTag[];
  /** v2: ダメージタイプ（未指定時は 'physical'） */
  damageType?: DamageType;
}

export interface MotionPattern {
  name: string;
  motions: Motion[];
  ratio: number;
}

// === v2: 計算入力・出力 ===
export interface CalcInput {
  weapon: WeaponInput;
  skills: ActiveSkill[];
  buffs: string[]; // Buff.id の配列
  motionPatterns: MotionPattern[];
  target: {
    monster: Monster;
    variantId: string;
    partId: string;
    enraged: boolean;
    wounded: boolean;
    /** 全体防御率の上書き（未指定時は variant 計算値） */
    defenseRateOverride?: number;
  };
}

export interface PatternResult {
  name: string;
  damage: number;
  frames: number;
  ratio: number;
}

export interface DamageResult {
  expectedDPS: number;
  physicalAvg: number;
  elementAvg: number;
  effectiveAffinity: number;
  critCoefficient: number;
  defenseRate: number;
  patterns: PatternResult[];
}

// === 旧型（暫定互換、Plan A 末尾の Task で削除） ===
export interface Build {
  id: string;
  name: string;
  weaponId: string;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 3: 型コンパイルチェック**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: 既存ファイル（calc/, components/, store/ など）で型エラーが大量に出る（旧 `Weapon`, `ArmorPiece`, `Decoration` などの参照が壊れた状態）。**この時点ではエラーは無視してOK** — 後続Taskで段階的に解消する。

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add v2 type definitions (WeaponInput/SkillMaster/Buff/MonsterVariant)"
```

---

## Task 2: skills.json の拡充（applicability 付与）

**Files:**
- Modify: `public/data/skills.json`

- [ ] **Step 1: skills.json を v2 形式で全置換**

`public/data/skills.json` を以下に置き換える:

```json
[
  {
    "id": "attack",
    "name": "攻撃",
    "maxLevel": 5,
    "category": "normal",
    "description": "攻撃力アップ",
    "effects": [
      { "level": 1, "attackBonus": 3 },
      { "level": 2, "attackBonus": 5 },
      { "level": 3, "attackBonus": 6 },
      { "level": 4, "attackBonus": 7 },
      { "level": 5, "attackBonus": 9 }
    ]
  },
  {
    "id": "critical-eye",
    "name": "見切り",
    "maxLevel": 7,
    "category": "normal",
    "description": "会心率アップ",
    "effects": [
      { "level": 1, "affinityBonus": 4 },
      { "level": 2, "affinityBonus": 8 },
      { "level": 3, "affinityBonus": 12 },
      { "level": 4, "affinityBonus": 16 },
      { "level": 5, "affinityBonus": 20 },
      { "level": 6, "affinityBonus": 25 },
      { "level": 7, "affinityBonus": 30 }
    ]
  },
  {
    "id": "critical-boost",
    "name": "超会心",
    "maxLevel": 3,
    "category": "normal",
    "description": "会心倍率を上昇",
    "effects": [
      { "level": 1, "critMultiplier": 1.30 },
      { "level": 2, "critMultiplier": 1.35 },
      { "level": 3, "critMultiplier": 1.40 }
    ]
  },
  {
    "id": "weakness-exploit",
    "name": "弱点特効",
    "maxLevel": 3,
    "category": "normal",
    "description": "物理肉質45以上で会心率+",
    "applicability": { "requireHitzonePhysical": 45 },
    "effects": [
      { "level": 1, "affinityBonus": 10 },
      { "level": 2, "affinityBonus": 20 },
      { "level": 3, "affinityBonus": 30 }
    ]
  },
  {
    "id": "punishing-draw-tech",
    "name": "抜刀術【技】",
    "maxLevel": 3,
    "category": "normal",
    "description": "抜刀斬りの会心率+",
    "applicability": { "requireTags": ["draw"] },
    "effects": [
      { "level": 1, "affinityBonus": 10 },
      { "level": 2, "affinityBonus": 20 },
      { "level": 3, "affinityBonus": 30 }
    ]
  },
  {
    "id": "punishing-draw-power",
    "name": "抜刀術【力】",
    "maxLevel": 3,
    "category": "normal",
    "description": "抜刀斬りの攻撃力+",
    "applicability": { "requireTags": ["draw"] },
    "effects": [
      { "level": 1, "attackBonus": 5 },
      { "level": 2, "attackBonus": 10 },
      { "level": 3, "attackBonus": 15 }
    ]
  },
  {
    "id": "ranger",
    "name": "飛燕",
    "maxLevel": 3,
    "category": "normal",
    "description": "ジャンプ攻撃の会心率+",
    "applicability": { "requireTags": ["jump", "aerial"], "matchAny": true },
    "effects": [
      { "level": 1, "affinityBonus": 5 },
      { "level": 2, "affinityBonus": 10 },
      { "level": 3, "affinityBonus": 15 }
    ]
  },
  {
    "id": "artillery",
    "name": "砲術",
    "maxLevel": 3,
    "category": "normal",
    "description": "砲撃ダメージ強化",
    "applicability": {
      "requireDamageType": ["shell-normal", "shell-spread", "shell-long"]
    },
    "effects": [
      { "level": 1, "physicalMultiplier": 1.10 },
      { "level": 2, "physicalMultiplier": 1.20 },
      { "level": 3, "physicalMultiplier": 1.30 }
    ]
  },
  {
    "id": "agitator",
    "name": "挑戦者",
    "maxLevel": 7,
    "category": "normal",
    "description": "怒り時に攻撃力・会心率+（条件付き）",
    "effects": [
      { "level": 1, "attackBonus": 4, "affinityBonus": 3 },
      { "level": 2, "attackBonus": 8, "affinityBonus": 5 },
      { "level": 3, "attackBonus": 12, "affinityBonus": 7 },
      { "level": 4, "attackBonus": 16, "affinityBonus": 10 },
      { "level": 5, "attackBonus": 20, "affinityBonus": 12 },
      { "level": 6, "attackBonus": 24, "affinityBonus": 15 },
      { "level": 7, "attackBonus": 25, "affinityBonus": 15 }
    ]
  },
  {
    "id": "resentment",
    "name": "逆襲",
    "maxLevel": 5,
    "category": "normal",
    "description": "被弾後に攻撃力+（条件付き）",
    "effects": [
      { "level": 1, "attackBonus": 5 },
      { "level": 2, "attackBonus": 10 },
      { "level": 3, "attackBonus": 15 },
      { "level": 4, "attackBonus": 20 },
      { "level": 5, "attackBonus": 25 }
    ]
  },
  {
    "id": "peak-performance",
    "name": "フルチャージ",
    "maxLevel": 3,
    "category": "normal",
    "description": "体力満タン時に攻撃力+（条件付き）",
    "effects": [
      { "level": 1, "attackBonus": 5 },
      { "level": 2, "attackBonus": 10 },
      { "level": 3, "attackBonus": 20 }
    ]
  },
  {
    "id": "element-crit",
    "name": "会心撃【属性】",
    "maxLevel": 3,
    "category": "normal",
    "description": "会心時に属性ダメージ+",
    "effects": [
      { "level": 1, "elementMultiplier": 1.15 },
      { "level": 2, "elementMultiplier": 1.25 },
      { "level": 3, "elementMultiplier": 1.35 }
    ]
  },
  {
    "id": "water-attack",
    "name": "水属性攻撃強化",
    "maxLevel": 5,
    "category": "normal",
    "description": "水属性値+",
    "effects": [
      { "level": 1, "elementMultiplier": 1.05 },
      { "level": 2, "elementMultiplier": 1.06 },
      { "level": 3, "elementMultiplier": 1.08 },
      { "level": 4, "elementMultiplier": 1.10 },
      { "level": 5, "elementMultiplier": 1.20 }
    ]
  },
  {
    "id": "razor-sharp",
    "name": "業物",
    "maxLevel": 3,
    "category": "normal",
    "description": "斬れ味の消費を抑える（DPS換算は別途）",
    "effects": [
      { "level": 1 },
      { "level": 2 },
      { "level": 3 }
    ]
  }
]
```

- [ ] **Step 2: JSON 構文チェック**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/data/skills.json', 'utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add public/data/skills.json
git commit -m "feat(data): expand skills.json with applicability and effects per level"
```

---

## Task 3: monsters.json をバリアント対応へ拡張

**Files:**
- Modify: `public/data/monsters.json`

- [ ] **Step 1: monsters.json を置き換える**

`public/data/monsters.json` を以下に置き換える:

```json
[
  {
    "id": "gore-magala",
    "name": "ゴア・マガラ",
    "baseDefenseRate": 1.0,
    "variants": [
      { "id": "normal",  "name": "通常",   "defenseRateMod": 1.0 },
      { "id": "veteran", "name": "歴戦",   "defenseRateMod": 0.95 },
      { "id": "apex",    "name": "護竜",   "defenseRateMod": 0.85 }
    ],
    "parts": [
      {
        "id": "head", "name": "頭部",
        "physical": 85,
        "element": { "水": 35, "雷": 15, "火": 5 },
        "woundedPhysicalBonus": 10,
        "enragedPhysical": 90,
        "enragedElement": { "水": 40, "雷": 20, "火": 5 }
      },
      {
        "id": "body", "name": "胴体",
        "physical": 50,
        "element": { "水": 20, "雷": 10, "火": 5 }
      },
      {
        "id": "wings", "name": "翼",
        "physical": 45,
        "element": { "水": 25, "雷": 20 }
      },
      {
        "id": "tail", "name": "尻尾",
        "physical": 40,
        "element": { "水": 15 }
      }
    ]
  }
]
```

- [ ] **Step 2: JSON 構文チェック**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/data/monsters.json', 'utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add public/data/monsters.json
git commit -m "feat(data): add monster variants and enraged hitzones"
```

---

## Task 4: buffs.json / series_skills.json / group_skills.json を新規作成

**Files:**
- Create: `public/data/buffs.json`, `public/data/series_skills.json`, `public/data/group_skills.json`

- [ ] **Step 1: buffs.json を作成**

```json
[
  { "id": "demon-drug-g", "name": "鬼人薬グレート", "category": "item",
    "exclusiveGroup": "atk-up-large", "attackBonus": 7 },
  { "id": "demon-drug", "name": "鬼人薬", "category": "item",
    "exclusiveGroup": "atk-up-large", "attackBonus": 5 },
  { "id": "might-seed", "name": "怪力の種", "category": "item",
    "exclusiveGroup": "atk-up-small", "attackBonus": 10 },
  { "id": "might-pill", "name": "怪力の丸薬", "category": "item",
    "exclusiveGroup": "atk-up-small", "attackBonus": 25 },
  { "id": "powercharm", "name": "力の護符", "category": "item", "attackBonus": 6 },
  { "id": "powertalon", "name": "力の爪", "category": "item", "attackBonus": 9 },
  { "id": "cat-attack-l", "name": "ネコ飯 攻撃力UP【大】", "category": "cat-food",
    "exclusiveGroup": "cat-atk", "attackBonus": 15 },
  { "id": "cat-attack-m", "name": "ネコ飯 攻撃力UP【中】", "category": "cat-food",
    "exclusiveGroup": "cat-atk", "attackBonus": 10 },
  { "id": "cat-attack-s", "name": "ネコ飯 攻撃力UP【小】", "category": "cat-food",
    "exclusiveGroup": "cat-atk", "attackBonus": 5 },
  { "id": "horn-attack-l", "name": "笛 攻撃力UP【大】", "category": "horn",
    "exclusiveGroup": "horn-atk", "attackMultiplier": 1.15 },
  { "id": "horn-attack-m", "name": "笛 攻撃力UP【中】", "category": "horn",
    "exclusiveGroup": "horn-atk", "attackMultiplier": 1.10 },
  { "id": "horn-affinity", "name": "笛 会心率UP", "category": "horn",
    "exclusiveGroup": "horn-affinity", "affinityBonus": 20 }
]
```

- [ ] **Step 2: series_skills.json を作成（最小サンプル）**

```json
[
  {
    "id": "garuga-soul",
    "name": "ガルルガの魂",
    "maxLevel": 1,
    "category": "series",
    "description": "ガルルガシリーズ3部位以上で発動",
    "effects": [ { "level": 1, "affinityBonus": 15 } ]
  },
  {
    "id": "gore-soul",
    "name": "ゴア・マガラの魂",
    "maxLevel": 1,
    "category": "series",
    "description": "ゴアマガラシリーズ3部位以上で発動",
    "effects": [ { "level": 1, "attackBonus": 10 } ]
  }
]
```

- [ ] **Step 3: group_skills.json を作成（最小サンプル）**

```json
[
  {
    "id": "consecutive-hit",
    "name": "連撃",
    "maxLevel": 3,
    "category": "group",
    "description": "同部位に連続ヒットで攻撃力+",
    "effects": [
      { "level": 1, "attackBonus": 4 },
      { "level": 2, "attackBonus": 8 },
      { "level": 3, "attackBonus": 12 }
    ]
  },
  {
    "id": "elemental-mastery",
    "name": "属性適応",
    "maxLevel": 3,
    "category": "group",
    "description": "属性値+",
    "effects": [
      { "level": 1, "elementMultiplier": 1.05 },
      { "level": 2, "elementMultiplier": 1.08 },
      { "level": 3, "elementMultiplier": 1.10 }
    ]
  }
]
```

- [ ] **Step 4: 構文チェック**

```bash
node -e "['buffs','series_skills','group_skills'].forEach(f => JSON.parse(require('fs').readFileSync('public/data/' + f + '.json', 'utf8'))); console.log('OK')"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add public/data/buffs.json public/data/series_skills.json public/data/group_skills.json
git commit -m "feat(data): add buffs, series_skills, group_skills data files"
```

---

## Task 5: データローダーを v2 型へ更新

**Files:**
- Modify: `src/data/skills.ts`, `src/data/monsters.ts`
- Create: `src/data/buffs.ts`, `src/data/series_skills.ts`, `src/data/group_skills.ts`

- [ ] **Step 1: src/data/skills.ts を更新**

```ts
import type { SkillMaster } from '../types';

let cached: SkillMaster[] | null = null;

export async function loadSkills(): Promise<SkillMaster[]> {
  if (cached) return cached;
  const res = await fetch('/data/skills.json');
  if (!res.ok) throw new Error(`Failed to load skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getSkillById(id: string): Promise<SkillMaster | undefined> {
  const all = await loadSkills();
  return all.find(s => s.id === id);
}
```

- [ ] **Step 2: src/data/monsters.ts を更新（型は v2 Monster をそのまま使用）**

既存ファイル `src/data/monsters.ts` の `loadMonsters` / `getMonsterById` の戻り型を確認。`Monster` 型が v2 で変わったので、型エラーは出ないが構造の差異に注意。中身は変更不要だが念のため再保存:

```ts
import type { Monster } from '../types';

let cached: Monster[] | null = null;

export async function loadMonsters(): Promise<Monster[]> {
  if (cached) return cached;
  const res = await fetch('/data/monsters.json');
  if (!res.ok) throw new Error(`Failed to load monsters.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getMonsterById(id: string): Promise<Monster | undefined> {
  const all = await loadMonsters();
  return all.find(m => m.id === id);
}
```

- [ ] **Step 3: src/data/buffs.ts を新規作成**

```ts
import type { Buff } from '../types';

let cached: Buff[] | null = null;

export async function loadBuffs(): Promise<Buff[]> {
  if (cached) return cached;
  const res = await fetch('/data/buffs.json');
  if (!res.ok) throw new Error(`Failed to load buffs.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getBuffById(id: string): Promise<Buff | undefined> {
  const all = await loadBuffs();
  return all.find(b => b.id === id);
}
```

- [ ] **Step 4: src/data/series_skills.ts を新規作成**

```ts
import type { SkillMaster } from '../types';

let cached: SkillMaster[] | null = null;

export async function loadSeriesSkills(): Promise<SkillMaster[]> {
  if (cached) return cached;
  const res = await fetch('/data/series_skills.json');
  if (!res.ok) throw new Error(`Failed to load series_skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}
```

- [ ] **Step 5: src/data/group_skills.ts を新規作成**

```ts
import type { SkillMaster } from '../types';

let cached: SkillMaster[] | null = null;

export async function loadGroupSkills(): Promise<SkillMaster[]> {
  if (cached) return cached;
  const res = await fetch('/data/group_skills.json');
  if (!res.ok) throw new Error(`Failed to load group_skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/data/
git commit -m "feat(data): update loaders for v2 types (SkillMaster/Buff) + new files"
```

---

## Task 6: skill_resolver モジュール（SkillMaster + ActiveSkill → 効果集計）

**Files:**
- Create: `src/calc/skill_resolver.ts`
- Test: `src/__tests__/calc/skill_resolver.test.ts`

- [ ] **Step 1: テストを書く**

`src/__tests__/calc/skill_resolver.test.ts`:

```ts
import { resolveSkills } from '../../calc/skill_resolver';
import type { SkillMaster, ActiveSkill } from '../../types';

const masters: SkillMaster[] = [
  {
    id: 'attack', name: '攻撃', maxLevel: 5, category: 'normal',
    effects: [
      { level: 1, attackBonus: 3 },
      { level: 5, attackBonus: 9 },
    ],
  },
  {
    id: 'critical-eye', name: '見切り', maxLevel: 7, category: 'normal',
    effects: [{ level: 7, affinityBonus: 30 }],
  },
  {
    id: 'critical-boost', name: '超会心', maxLevel: 3, category: 'normal',
    effects: [{ level: 3, critMultiplier: 1.40 }],
  },
  {
    id: 'weakness-exploit', name: '弱点特効', maxLevel: 3, category: 'normal',
    applicability: { requireHitzonePhysical: 45 },
    effects: [{ level: 3, affinityBonus: 30 }],
  },
  {
    id: 'punishing-draw-tech', name: '抜刀術【技】', maxLevel: 3, category: 'normal',
    applicability: { requireTags: ['draw'] },
    effects: [{ level: 3, affinityBonus: 30 }],
  },
  {
    id: 'agitator', name: '挑戦者', maxLevel: 7, category: 'normal',
    effects: [{ level: 7, attackBonus: 25, affinityBonus: 15 }],
  },
];

describe('resolveSkills - 基本ボーナス集計', () => {
  test('攻撃Lv5 → +9 attack', () => {
    const skills: ActiveSkill[] = [{ skillId: 'attack', level: 5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
  });

  test('見切りLv7 → +30 affinity', () => {
    const skills: ActiveSkill[] = [{ skillId: 'critical-eye', level: 7 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.affinityBonus).toBe(30);
  });

  test('超会心Lv3 → critMultiplier 1.40', () => {
    const skills: ActiveSkill[] = [{ skillId: 'critical-boost', level: 3 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.critMultiplier).toBe(1.40);
  });
});

describe('resolveSkills - applicability', () => {
  test('弱点特効Lv3 は肉質45以上で発動', () => {
    const skills: ActiveSkill[] = [{ skillId: 'weakness-exploit', level: 3 }];
    const ctx = { tags: [] as const, damageType: 'physical' as const };
    expect(resolveSkills(skills, masters, { hitzonePhysical: 50, ...ctx }).affinityBonus).toBe(30);
    expect(resolveSkills(skills, masters, { hitzonePhysical: 40, ...ctx }).affinityBonus).toBe(0);
  });

  test('抜刀術【技】Lv3 は draw タグ時のみ', () => {
    const skills: ActiveSkill[] = [{ skillId: 'punishing-draw-tech', level: 3 }];
    expect(resolveSkills(skills, masters,
      { hitzonePhysical: 30, tags: ['draw'], damageType: 'physical' }).affinityBonus).toBe(30);
    expect(resolveSkills(skills, masters,
      { hitzonePhysical: 30, tags: [], damageType: 'physical' }).affinityBonus).toBe(0);
  });
});

describe('resolveSkills - uptime 重み付け', () => {
  test('挑戦者Lv7 at 60% uptime → +15 attack, +9 affinity', () => {
    const skills: ActiveSkill[] = [{ skillId: 'agitator', level: 7, uptime: 0.60 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBeCloseTo(15);
    expect(r.affinityBonus).toBeCloseTo(9);
  });

  test('uptime 未指定は常時発動扱い (uptime=1)', () => {
    const skills: ActiveSkill[] = [{ skillId: 'attack', level: 5 }];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 50, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
  });
});

describe('resolveSkills - 複合', () => {
  test('攻撃Lv5 + 見切りLv7 + 弱点特効Lv3 (肉質85)', () => {
    const skills: ActiveSkill[] = [
      { skillId: 'attack', level: 5 },
      { skillId: 'critical-eye', level: 7 },
      { skillId: 'weakness-exploit', level: 3 },
    ];
    const r = resolveSkills(skills, masters, { hitzonePhysical: 85, tags: [], damageType: 'physical' });
    expect(r.attackBonus).toBe(9);
    expect(r.affinityBonus).toBe(60);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm run test:run -- skill_resolver`
Expected: FAIL — モジュールが存在しない

- [ ] **Step 3: src/calc/skill_resolver.ts を実装**

```ts
import type {
  SkillMaster, ActiveSkill, SkillApplicability, MotionTag, DamageType,
} from '../types';

export interface MotionContext {
  hitzonePhysical: number;
  tags: readonly MotionTag[];
  damageType: DamageType;
}

export interface ResolvedSkills {
  attackBonus: number;
  attackMultiplier: number;
  affinityBonus: number;
  critMultiplier: number;
  elementMultiplier: number;
  physicalMultiplier: number;
}

function isApplicable(app: SkillApplicability | undefined, ctx: MotionContext): boolean {
  if (!app) return true;
  if (app.requireHitzonePhysical !== undefined && ctx.hitzonePhysical < app.requireHitzonePhysical) {
    return false;
  }
  if (app.requireTags && app.requireTags.length > 0) {
    const has = app.matchAny
      ? app.requireTags.some(t => ctx.tags.includes(t))
      : app.requireTags.every(t => ctx.tags.includes(t));
    if (!has) return false;
  }
  if (app.requireDamageType && app.requireDamageType.length > 0) {
    if (!app.requireDamageType.includes(ctx.damageType)) return false;
  }
  return true;
}

export function resolveSkills(
  skills: ActiveSkill[],
  masters: SkillMaster[],
  ctx: MotionContext,
): ResolvedSkills {
  const result: ResolvedSkills = {
    attackBonus: 0,
    attackMultiplier: 1,
    affinityBonus: 0,
    critMultiplier: 1.25, // デフォルト会心倍率
    elementMultiplier: 1,
    physicalMultiplier: 1,
  };
  let critMultiplierOverridden = false;

  for (const s of skills) {
    const master = masters.find(m => m.id === s.skillId);
    if (!master) continue;
    if (!isApplicable(master.applicability, ctx)) continue;

    const effect = master.effects.find(e => e.level === s.level);
    if (!effect) continue;

    const w = s.uptime ?? 1; // 未指定は常時発動

    if (effect.attackBonus !== undefined) {
      result.attackBonus += effect.attackBonus * w;
    }
    if (effect.attackMultiplier !== undefined) {
      // 乗算は uptime 重み付けが難しいので、uptime=1 前提
      result.attackMultiplier *= effect.attackMultiplier;
    }
    if (effect.affinityBonus !== undefined) {
      result.affinityBonus += effect.affinityBonus * w;
    }
    if (effect.critMultiplier !== undefined) {
      // 超会心は単一スキルから上書き
      result.critMultiplier = effect.critMultiplier;
      critMultiplierOverridden = true;
    }
    if (effect.elementMultiplier !== undefined) {
      result.elementMultiplier *= effect.elementMultiplier;
    }
    if (effect.physicalMultiplier !== undefined) {
      result.physicalMultiplier *= effect.physicalMultiplier;
    }
  }

  // 上書きされなかった場合はデフォルト 1.25 のまま
  void critMultiplierOverridden;
  return result;
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `npm run test:run -- skill_resolver`
Expected: PASS (全テスト)

- [ ] **Step 5: Commit**

```bash
git add src/calc/skill_resolver.ts src/__tests__/calc/skill_resolver.test.ts
git commit -m "feat(calc): add skill_resolver with applicability and uptime weighting"
```

---

## Task 7: バフ集計モジュール（排他処理付き）

**Files:**
- Create: `src/calc/buffs.ts`
- Test: `src/__tests__/calc/buffs.test.ts`

- [ ] **Step 1: テストを書く**

`src/__tests__/calc/buffs.test.ts`:

```ts
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
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm run test:run -- buffs`
Expected: FAIL

- [ ] **Step 3: src/calc/buffs.ts を実装**

```ts
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
```

- [ ] **Step 4: テスト成功を確認**

Run: `npm run test:run -- buffs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/calc/buffs.ts src/__tests__/calc/buffs.test.ts
git commit -m "feat(calc): add buff resolver with exclusive group handling"
```

---

## Task 8: melee.ts を v2 CalcInput 対応へ書き換え

**Files:**
- Modify: `src/calc/melee.ts`, `src/calc/index.ts`
- Modify: `src/__tests__/calc/melee.test.ts`

- [ ] **Step 1: 既存テストの v2 化**

`src/__tests__/calc/melee.test.ts` を以下に置き換える:

```ts
import { calcDamage } from '../../calc';
import type { CalcInput, SkillMaster, Buff, Monster } from '../../types';

const skillMasters: SkillMaster[] = [
  { id: 'attack', name: '攻撃', maxLevel: 5, category: 'normal',
    effects: [{ level: 5, attackBonus: 9 }] },
  { id: 'critical-eye', name: '見切り', maxLevel: 7, category: 'normal',
    effects: [{ level: 7, affinityBonus: 30 }] },
  { id: 'critical-boost', name: '超会心', maxLevel: 3, category: 'normal',
    effects: [{ level: 3, critMultiplier: 1.40 }] },
  { id: 'weakness-exploit', name: '弱点特効', maxLevel: 3, category: 'normal',
    applicability: { requireHitzonePhysical: 45 },
    effects: [{ level: 3, affinityBonus: 30 }] },
];

const buffMasters: Buff[] = [];

const monster: Monster = {
  id: 'g', name: 'ゴア', baseDefenseRate: 1.0,
  variants: [{ id: 'normal', name: '通常', defenseRateMod: 1.0 }],
  parts: [
    { id: 'head', name: '頭部', physical: 85, element: { 水: 35 } },
    { id: 'tail', name: '尻尾', physical: 40, element: { 水: 10 } },
  ],
};

const baseInput: CalcInput = {
  weapon: {
    type: 'longsword', attack: 330, affinity: 20,
    element: { type: '水', value: 24 }, sharpness: 'purple',
  },
  skills: [
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
  ],
  buffs: [],
  motionPatterns: [{
    name: 'test', ratio: 1.0,
    motions: [{ motionName: '突き', motionValue: 50, frames: 30, isDraw: false }],
  }],
  target: { monster, variantId: 'normal', partId: 'head', enraged: false, wounded: false },
};

describe('calcDamage (v2 melee)', () => {
  test('returns positive DPS', () => {
    const r = calcDamage(baseInput, skillMasters, buffMasters);
    expect(r.expectedDPS).toBeGreaterThan(0);
    expect(r.patterns).toHaveLength(1);
  });

  test('weakness exploit fires on head (85)', () => {
    const r = calcDamage(baseInput, skillMasters, buffMasters);
    // 武器20 + 見切り30 + 弱点特効30 = 80 → 0.80
    expect(r.effectiveAffinity).toBeCloseTo(0.80, 2);
  });

  test('weakness exploit does NOT fire on tail (40)', () => {
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, partId: 'tail' },
    }, skillMasters, buffMasters);
    // 武器20 + 見切り30 + 弱点特効0 = 50 → 0.50
    expect(r.effectiveAffinity).toBeCloseTo(0.50, 2);
  });

  test('variant defenseRateMod is applied', () => {
    const monsterWithApex: Monster = {
      ...monster,
      variants: [
        { id: 'normal', name: '通常', defenseRateMod: 1.0 },
        { id: 'apex', name: '護竜', defenseRateMod: 0.85 },
      ],
    };
    const normal = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: monsterWithApex, variantId: 'normal' },
    }, skillMasters, buffMasters);
    const apex = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: monsterWithApex, variantId: 'apex' },
    }, skillMasters, buffMasters);
    expect(apex.expectedDPS).toBeLessThan(normal.expectedDPS);
    expect(apex.defenseRate).toBeCloseTo(0.85);
  });

  test('enraged uses enragedPhysical when defined', () => {
    const enragedMonster: Monster = {
      ...monster,
      parts: [{ ...monster.parts[0], enragedPhysical: 95 }, monster.parts[1]],
    };
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, monster: enragedMonster, enraged: true },
    }, skillMasters, buffMasters);
    expect(r.patterns[0].damage).toBeGreaterThan(0);
  });

  test('defenseRateOverride takes precedence', () => {
    const r = calcDamage({
      ...baseInput,
      target: { ...baseInput.target, defenseRateOverride: 0.5 },
    }, skillMasters, buffMasters);
    expect(r.defenseRate).toBeCloseTo(0.5);
  });

  test('element cap is applied', () => {
    // element=100, skill x2.5, cap = max(100*2.3, 100+400) = max(230, 500) = 500
    // skill effect: 100*2.5 = 250, capped to 500 → no cap hit yet
    // Try element=200, x3 = 600, cap=max(460, 600)=600 → no cap hit
    // Try element=500, x3 = 1500, cap=max(1150, 900)=1150 → cap to 1150
    const elementSkills: SkillMaster[] = [
      ...skillMasters,
      { id: 'x3-elem', name: 'x3', maxLevel: 1, category: 'normal',
        effects: [{ level: 1, elementMultiplier: 3.0 }] },
    ];
    const r = calcDamage({
      ...baseInput,
      weapon: { ...baseInput.weapon, element: { type: '水', value: 500 } },
      skills: [...baseInput.skills, { skillId: 'x3-elem', level: 1 }],
    }, elementSkills, buffMasters);
    expect(r.elementAvg).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm run test:run -- melee`
Expected: FAIL — 旧 `calcDamage` シグネチャと不一致

- [ ] **Step 3: src/calc/melee.ts を v2 対応に書き換える**

```ts
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
```

- [ ] **Step 4: src/calc/index.ts を更新**

```ts
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
```

- [ ] **Step 5: 旧 src/calc/skills.ts を削除（skill_resolver に統合済み）**

Run: `git rm src/calc/skills.ts src/__tests__/calc/skills.test.ts`

- [ ] **Step 6: 旧 src/calc/conditional.ts を削除（skill_resolver に統合済み）**

Run: `git rm src/calc/conditional.ts src/__tests__/calc/conditional.test.ts`

- [ ] **Step 7: テスト成功を確認**

Run: `npm run test:run -- melee`
Expected: PASS (7テスト)

- [ ] **Step 8: 全テスト実行**

Run: `npm run test:run`
Expected: sharpness, affinity, skill_resolver, buffs, melee の各テストが PASS。`aggregateSkills` テストはまだ存在するが Task 21 で削除する。`types` テストはまだ存在するが Build 型が変わったので追加修正が必要なら別途対応。

実際にエラーが出る場合は、`src/__tests__/types/types.test.ts` を以下に差し替える:

```ts
import type { WeaponInput, ActiveSkill, MotionPattern, ThemeId, SkillMaster } from '../../types';

test('v2 types are importable', () => {
  const w: WeaponInput = {
    type: 'longsword', attack: 100, affinity: 0, element: null, sharpness: 'white',
  };
  const s: ActiveSkill = { skillId: 'attack', level: 5 };
  const p: MotionPattern = { name: 'p', motions: [], ratio: 1.0 };
  const t: ThemeId = 'ember';
  const m: SkillMaster = { id: 'x', name: 'X', maxLevel: 1, category: 'normal', effects: [] };
  expect(w.type).toBe('longsword');
  expect(s.skillId).toBe('attack');
  expect(p.ratio).toBe(1.0);
  expect(t).toBe('ember');
  expect(m.category).toBe('normal');
});
```

Run: `npm run test:run`
Expected: 全 PASS（旧 aggregateSkills.test.ts は Task 21 で削除予定）

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(calc): rewrite melee for v2 CalcInput (variants, buffs, element cap)"
```

---

## Task 9: weaponStore（武器パラメータ直接入力ストア）

**Files:**
- Create: `src/store/weaponStore.ts`

- [ ] **Step 1: src/store/weaponStore.ts を作成**

```ts
import { create } from 'zustand';
import type { WeaponInput, WeaponType, Element, SharpnessColor } from '../types';

interface WeaponStore {
  weapon: WeaponInput;
  setWeaponType: (type: WeaponType) => void;
  setAttack: (v: number) => void;
  setAffinity: (v: number) => void;
  setElement: (e: Element | null) => void;
  setSharpness: (c: SharpnessColor) => void;
  setGunlanceShell: (shell: WeaponInput['gunlanceShell']) => void;
  setBowBins: (bins: WeaponInput['bowBins']) => void;
  setBowgunAmmo: (ammo: WeaponInput['bowgunAmmo']) => void;
  setChargeBladeBin: (bin: WeaponInput['chargeBladeBin']) => void;
  setSwitchAxeBin: (bin: WeaponInput['switchAxeBin']) => void;
  setWeapon: (w: WeaponInput) => void;
}

const defaultWeapon: WeaponInput = {
  type: 'longsword',
  attack: 330,
  affinity: 20,
  element: { type: '水', value: 24 },
  sharpness: 'white',
};

export const useWeaponStore = create<WeaponStore>((set) => ({
  weapon: defaultWeapon,
  setWeaponType: (type) => set((s) => ({ weapon: { ...s.weapon, type } })),
  setAttack:     (v)    => set((s) => ({ weapon: { ...s.weapon, attack: v } })),
  setAffinity:   (v)    => set((s) => ({ weapon: { ...s.weapon, affinity: v } })),
  setElement:    (e)    => set((s) => ({ weapon: { ...s.weapon, element: e } })),
  setSharpness:  (c)    => set((s) => ({ weapon: { ...s.weapon, sharpness: c } })),
  setGunlanceShell:  (shell) => set((s) => ({ weapon: { ...s.weapon, gunlanceShell: shell } })),
  setBowBins:        (bins)  => set((s) => ({ weapon: { ...s.weapon, bowBins: bins } })),
  setBowgunAmmo:     (ammo)  => set((s) => ({ weapon: { ...s.weapon, bowgunAmmo: ammo } })),
  setChargeBladeBin: (bin)   => set((s) => ({ weapon: { ...s.weapon, chargeBladeBin: bin } })),
  setSwitchAxeBin:   (bin)   => set((s) => ({ weapon: { ...s.weapon, switchAxeBin: bin } })),
  setWeapon:         (w)     => set({ weapon: w }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/weaponStore.ts
git commit -m "feat(store): add weaponStore for direct weapon parameter input"
```

---

## Task 10: skillStore（発動スキル直接入力ストア）

**Files:**
- Create: `src/store/skillStore.ts`

- [ ] **Step 1: src/store/skillStore.ts を作成**

```ts
import { create } from 'zustand';
import type { ActiveSkill } from '../types';

interface SkillStore {
  skills: ActiveSkill[];
  addSkill: (skillId: string, level: number) => void;
  updateLevel: (skillId: string, level: number) => void;
  setUptime: (skillId: string, uptime: number | undefined) => void;
  removeSkill: (skillId: string) => void;
  setAll: (skills: ActiveSkill[]) => void;
}

export const useSkillStore = create<SkillStore>((set) => ({
  skills: [
    // デフォルト発動スキル例（MVP の状態を維持）
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
    { skillId: 'agitator', level: 7, uptime: 0.60 },
    { skillId: 'resentment', level: 3, uptime: 0.30 },
  ],
  addSkill: (skillId, level) => set((s) =>
    s.skills.some(x => x.skillId === skillId)
      ? s
      : { skills: [...s.skills, { skillId, level }] }
  ),
  updateLevel: (skillId, level) => set((s) => ({
    skills: s.skills.map(x => x.skillId === skillId ? { ...x, level } : x),
  })),
  setUptime: (skillId, uptime) => set((s) => ({
    skills: s.skills.map(x => x.skillId === skillId ? { ...x, uptime } : x),
  })),
  removeSkill: (skillId) => set((s) => ({
    skills: s.skills.filter(x => x.skillId !== skillId),
  })),
  setAll: (skills) => set({ skills }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/skillStore.ts
git commit -m "feat(store): add skillStore for direct skill input"
```

---

## Task 11: buffStore

**Files:**
- Create: `src/store/buffStore.ts`

- [ ] **Step 1: src/store/buffStore.ts を作成**

```ts
import { create } from 'zustand';

interface BuffStore {
  selected: string[]; // Buff.id の配列
  toggle: (id: string) => void;
  setSelected: (ids: string[]) => void;
}

export const useBuffStore = create<BuffStore>((set) => ({
  selected: [],
  toggle: (id) => set((s) => ({
    selected: s.selected.includes(id)
      ? s.selected.filter(x => x !== id)
      : [...s.selected, id],
  })),
  setSelected: (ids) => set({ selected: ids }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/buffStore.ts
git commit -m "feat(store): add buffStore for buff selection"
```

---

## Task 12: targetStore を variantId 対応へ更新

**Files:**
- Modify: `src/store/targetStore.ts`

- [ ] **Step 1: src/store/targetStore.ts を置き換える**

```ts
import { create } from 'zustand';

interface TargetStore {
  monsterId: string | null;
  variantId: string | null;
  partId: string | null;
  enraged: boolean;
  wounded: boolean;
  defenseRateOverride: number | null;
  setMonster: (id: string) => void;
  setVariant: (id: string) => void;
  setPart: (id: string) => void;
  setEnraged: (b: boolean) => void;
  setWounded: (b: boolean) => void;
  setDefenseRateOverride: (v: number | null) => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  monsterId: null,
  variantId: null,
  partId: null,
  enraged: false,
  wounded: false,
  defenseRateOverride: null,
  setMonster: (id) => set({ monsterId: id, variantId: null, partId: null }),
  setVariant: (id) => set({ variantId: id }),
  setPart:    (id) => set({ partId: id }),
  setEnraged: (b)  => set({ enraged: b }),
  setWounded: (b)  => set({ wounded: b }),
  setDefenseRateOverride: (v) => set({ defenseRateOverride: v }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/targetStore.ts
git commit -m "feat(store): targetStore supports variant + defenseRate override"
```

---

## Task 13: WeaponInputCard と WeaponSpecificFields

**Files:**
- Create: `src/components/weapon/WeaponInputCard.tsx`
- Create: `src/components/weapon/WeaponSpecificFields.tsx`

- [ ] **Step 1: src/components/weapon/WeaponSpecificFields.tsx を作成**

```tsx
import type { WeaponType, WeaponInput, GunlanceShellType, BowBinType, ChargeBladeBin, SwitchAxeBin } from '../../types';
import { Field } from '../shared/Field';
import { useWeaponStore } from '../../store/weaponStore';

const BOW_BINS: BowBinType[] = ['強撃', '接撃', '属強', '麻痺', '睡眠', '減気'];

export function WeaponSpecificFields({ type }: { type: WeaponType }) {
  const weapon = useWeaponStore(s => s.weapon);
  const setGunlanceShell = useWeaponStore(s => s.setGunlanceShell);
  const setBowBins = useWeaponStore(s => s.setBowBins);
  const setChargeBladeBin = useWeaponStore(s => s.setChargeBladeBin);
  const setSwitchAxeBin = useWeaponStore(s => s.setSwitchAxeBin);

  if (type === 'gunlance') {
    const shell = weapon.gunlanceShell ?? { type: 'normal' as GunlanceShellType, level: 1 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>砲撃</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Field
            value={shell.type}
            options={[
              { value: 'normal', label: '通常' },
              { value: 'spread', label: '拡散' },
              { value: 'long',   label: '放射' },
            ]}
            onChange={(v) => setGunlanceShell({ ...shell, type: v as GunlanceShellType })}
            small
          />
          <Field
            value={String(shell.level)}
            options={[1,2,3,4,5,6].map(n => ({ value: String(n), label: `Lv${n}` }))}
            onChange={(v) => setGunlanceShell({ ...shell, level: Number(v) })}
            small
          />
        </div>
      </div>
    );
  }

  if (type === 'bow') {
    const bins = weapon.bowBins ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>装填可能ビン</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BOW_BINS.map(bin => (
            <label key={bin} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input
                type="checkbox"
                checked={bins.includes(bin)}
                onChange={(e) => {
                  if (e.target.checked) setBowBins([...bins, bin]);
                  else setBowBins(bins.filter(b => b !== bin));
                }}
              />
              {bin}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'charge-blade') {
    const bin = weapon.chargeBladeBin ?? 'impact';
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>ビン</div>
        <Field
          value={bin}
          options={[
            { value: 'impact',  label: '榴弾ビン' },
            { value: 'element', label: '強属性ビン' },
          ]}
          onChange={(v) => setChargeBladeBin(v as ChargeBladeBin)}
          small
        />
      </div>
    );
  }

  if (type === 'switch-axe') {
    const bin = weapon.switchAxeBin ?? 'power';
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>ビン</div>
        <Field
          value={bin}
          options={[
            { value: 'power',     label: '強撃ビン' },
            { value: 'element',   label: '強属性ビン' },
            { value: 'paralysis', label: '麻痺ビン' },
            { value: 'dragon',    label: '滅龍ビン' },
            { value: 'exhaust',   label: '減気ビン' },
          ]}
          onChange={(v) => setSwitchAxeBin(v as SwitchAxeBin)}
          small
        />
      </div>
    );
  }

  // 他武器種は追加プロパティなし
  return null;
}
```

- [ ] **Step 2: src/components/weapon/WeaponInputCard.tsx を作成**

```tsx
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { WeaponSpecificFields } from './WeaponSpecificFields';
import { useWeaponStore } from '../../store/weaponStore';
import type { WeaponType, SharpnessColor, ElementType } from '../../types';

const WEAPON_TYPES: { value: WeaponType; label: string }[] = [
  { value: 'greatsword',       label: '大剣' },
  { value: 'sword-and-shield', label: '片手剣' },
  { value: 'dual-blades',      label: '双剣' },
  { value: 'longsword',        label: '太刀' },
  { value: 'hammer',           label: 'ハンマー' },
  { value: 'hunting-horn',     label: '狩猟笛' },
  { value: 'lance',            label: 'ランス' },
  { value: 'gunlance',         label: 'ガンランス' },
  { value: 'switch-axe',       label: 'スラッシュアックス' },
  { value: 'charge-blade',     label: 'チャージアックス' },
  { value: 'insect-glaive',    label: '操虫棍' },
  { value: 'light-bowgun',     label: 'ライトボウガン' },
  { value: 'heavy-bowgun',     label: 'ヘビィボウガン' },
  { value: 'bow',              label: '弓' },
];

const SHARPNESS_COLORS: { value: SharpnessColor; label: string }[] = [
  { value: 'red',    label: '赤' },
  { value: 'orange', label: '橙' },
  { value: 'yellow', label: '黄' },
  { value: 'green',  label: '緑' },
  { value: 'blue',   label: '青' },
  { value: 'white',  label: '白' },
  { value: 'purple', label: '紫' },
];

const ELEMENTS: { value: ElementType | 'none'; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: '火',   label: '火' },
  { value: '水',   label: '水' },
  { value: '雷',   label: '雷' },
  { value: '氷',   label: '氷' },
  { value: '龍',   label: '龍' },
];

export function WeaponInputCard() {
  const weapon = useWeaponStore(s => s.weapon);
  const setWeaponType = useWeaponStore(s => s.setWeaponType);
  const setAttack = useWeaponStore(s => s.setAttack);
  const setAffinity = useWeaponStore(s => s.setAffinity);
  const setElement = useWeaponStore(s => s.setElement);
  const setSharpness = useWeaponStore(s => s.setSharpness);

  return (
    <Card>
      <CardHead icon="⚔" title="武器パラメータ / WEAPON" num="01" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          value={weapon.type}
          options={WEAPON_TYPES.map(w => ({ value: w.value, label: w.label }))}
          onChange={(v) => setWeaponType(v as WeaponType)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            攻撃力
            <input
              type="number"
              className="field"
              value={weapon.attack}
              onChange={(e) => setAttack(Number(e.target.value))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            会心率 (%)
            <input
              type="number"
              className="field"
              value={weapon.affinity}
              onChange={(e) => setAffinity(Number(e.target.value))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            属性
            <Field
              value={weapon.element?.type ?? 'none'}
              options={ELEMENTS.map(e => ({ value: e.value, label: e.label }))}
              onChange={(v) => {
                if (v === 'none') setElement(null);
                else setElement({ type: v as ElementType, value: weapon.element?.value ?? 0 });
              }}
              small
            />
          </label>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            属性値
            <input
              type="number"
              className="field"
              disabled={!weapon.element}
              value={weapon.element?.value ?? 0}
              onChange={(e) => {
                if (weapon.element) setElement({ ...weapon.element, value: Number(e.target.value) });
              }}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
          斬れ味
          <Field
            value={weapon.sharpness}
            options={SHARPNESS_COLORS.map(s => ({ value: s.value, label: s.label }))}
            onChange={(v) => setSharpness(v as SharpnessColor)}
            small
          />
        </label>
        <WeaponSpecificFields type={weapon.type} />
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/weapon/
git commit -m "feat(ui): add WeaponInputCard with weapon-type-specific fields"
```

---

## Task 14: SkillSearch + SkillRow + SkillsInputCard

**Files:**
- Create: `src/components/skills/SkillSearch.tsx`
- Create: `src/components/skills/SkillRow.tsx`
- Create: `src/components/skills/SkillsInputCard.tsx`

- [ ] **Step 1: src/components/skills/SkillSearch.tsx を作成**

```tsx
import { useState } from 'react';
import type { SkillMaster } from '../../types';

interface Props {
  masters: SkillMaster[];
  excludeIds: string[];
  onSelect: (skillId: string) => void;
}

export function SkillSearch({ masters, excludeIds, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const candidates = masters
    .filter(m => !excludeIds.includes(m.id))
    .filter(m => query === '' || m.name.includes(query) || m.id.includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="field"
        placeholder="スキル追加（検索）..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%' }}
      />
      {query && candidates.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', marginTop: 4,
        }}>
          {candidates.map(m => (
            <div
              key={m.id}
              onClick={() => { onSelect(m.id); setQuery(''); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid var(--line)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              {m.description && (
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{m.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: src/components/skills/SkillRow.tsx を作成**

```tsx
import { Slider } from '../shared/Slider';
import type { SkillMaster, ActiveSkill } from '../../types';

const CONDITIONAL_IDS = new Set(['agitator', 'resentment', 'peak-performance']);

interface Props {
  active: ActiveSkill;
  master: SkillMaster;
  onLevelChange: (level: number) => void;
  onUptimeChange: (uptime: number | undefined) => void;
  onRemove: () => void;
}

export function SkillRow({ active, master, onLevelChange, onUptimeChange, onRemove }: Props) {
  const isConditional = CONDITIONAL_IDS.has(master.id);
  const uptimePct = active.uptime !== undefined ? Math.round(active.uptime * 100) : 100;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 8,
      border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{master.name}</div>
        <select
          className="field sm"
          value={active.level}
          onChange={(e) => onLevelChange(Number(e.target.value))}
          style={{ width: 60 }}
        >
          {Array.from({ length: master.maxLevel }, (_, i) => i + 1).map(lv =>
            <option key={lv} value={lv}>Lv{lv}</option>
          )}
        </select>
        <button
          className="btn"
          onClick={onRemove}
          style={{ padding: '2px 8px', fontSize: 11 }}
        >×</button>
      </div>
      {isConditional && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>uptime</span>
          <Slider value={uptimePct} onChange={(v) => onUptimeChange(v / 100)} />
          <span className="mono" style={{ fontSize: 11, minWidth: 36, textAlign: 'right' }}>
            {uptimePct}%
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: src/components/skills/SkillsInputCard.tsx を作成**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { SkillSearch } from './SkillSearch';
import { SkillRow } from './SkillRow';
import { loadSkills } from '../../data/skills';
import { loadSeriesSkills } from '../../data/series_skills';
import { loadGroupSkills } from '../../data/group_skills';
import { useSkillStore } from '../../store/skillStore';
import type { SkillMaster } from '../../types';

export function SkillsInputCard() {
  const skills = useSkillStore(s => s.skills);
  const addSkill = useSkillStore(s => s.addSkill);
  const updateLevel = useSkillStore(s => s.updateLevel);
  const setUptime = useSkillStore(s => s.setUptime);
  const removeSkill = useSkillStore(s => s.removeSkill);

  const [normal, setNormal] = useState<SkillMaster[]>([]);
  const [series, setSeries] = useState<SkillMaster[]>([]);
  const [group, setGroup] = useState<SkillMaster[]>([]);

  useEffect(() => {
    Promise.all([loadSkills(), loadSeriesSkills(), loadGroupSkills()])
      .then(([n, s, g]) => { setNormal(n); setSeries(s); setGroup(g); });
  }, []);

  const allMasters = [...normal, ...series, ...group];
  const findMaster = (id: string) => allMasters.find(m => m.id === id);

  const renderSection = (title: string, masters: SkillMaster[]) => {
    const ids = new Set(masters.map(m => m.id));
    const activeRows = skills.filter(s => ids.has(s.skillId));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>{title}</div>
        <SkillSearch
          masters={masters}
          excludeIds={skills.map(s => s.skillId)}
          onSelect={(id) => addSkill(id, masters.find(m => m.id === id)?.maxLevel ?? 1)}
        />
        {activeRows.map(a => {
          const m = findMaster(a.skillId);
          if (!m) return null;
          return (
            <SkillRow
              key={a.skillId}
              active={a}
              master={m}
              onLevelChange={(lv) => updateLevel(a.skillId, lv)}
              onUptimeChange={(u) => setUptime(a.skillId, u)}
              onRemove={() => removeSkill(a.skillId)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHead icon="✦" title="発動スキル / SKILLS" num="02" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {renderSection('常時スキル', normal)}
        {renderSection('シリーズスキル', series)}
        {renderSection('グループスキル', group)}
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/skills/
git commit -m "feat(ui): add SkillsInputCard with search and uptime sliders"
```

---

## Task 15: BuffsCard

**Files:**
- Create: `src/components/buffs/BuffsCard.tsx`

- [ ] **Step 1: src/components/buffs/BuffsCard.tsx を作成**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Toggle } from '../shared/Toggle';
import { loadBuffs } from '../../data/buffs';
import { useBuffStore } from '../../store/buffStore';
import type { Buff, BuffCategory } from '../../types';

const CATEGORY_LABELS: Record<BuffCategory, string> = {
  'item':        'アイテム',
  'cat-food':    'ネコ飯',
  'horn':        '笛バフ',
  'environment': '環境',
};

export function BuffsCard() {
  const selected = useBuffStore(s => s.selected);
  const toggle = useBuffStore(s => s.toggle);
  const [buffs, setBuffs] = useState<Buff[]>([]);

  useEffect(() => { loadBuffs().then(setBuffs); }, []);

  const byCategory = buffs.reduce<Record<string, Buff[]>>((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});

  return (
    <Card>
      <CardHead icon="✺" title="バフ / BUFFS" num="04" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(Object.keys(byCategory) as BuffCategory[]).map(cat => (
          <div key={cat}>
            <div style={{
              fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>{CATEGORY_LABELS[cat]}</div>
            <div className="toggle-grid">
              {byCategory[cat].map(b => (
                <Toggle
                  key={b.id}
                  label={b.name}
                  on={selected.includes(b.id)}
                  onChange={() => toggle(b.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/buffs/
git commit -m "feat(ui): add BuffsCard with category grouping"
```

---

## Task 16: MonsterCard を variants 対応へ更新

**Files:**
- Create: `src/components/monster/MonsterCard.tsx`

- [ ] **Step 1: src/components/monster/MonsterCard.tsx を新規作成（builder/ のものはあとで削除）**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { Toggle } from '../shared/Toggle';
import { loadMonsters } from '../../data/monsters';
import { useTargetStore } from '../../store/targetStore';
import type { Monster } from '../../types';

export function MonsterCard() {
  const monsterId = useTargetStore(s => s.monsterId);
  const variantId = useTargetStore(s => s.variantId);
  const partId = useTargetStore(s => s.partId);
  const enraged = useTargetStore(s => s.enraged);
  const wounded = useTargetStore(s => s.wounded);
  const defenseRateOverride = useTargetStore(s => s.defenseRateOverride);
  const setMonster = useTargetStore(s => s.setMonster);
  const setVariant = useTargetStore(s => s.setVariant);
  const setPart = useTargetStore(s => s.setPart);
  const setEnraged = useTargetStore(s => s.setEnraged);
  const setWounded = useTargetStore(s => s.setWounded);
  const setDefenseRateOverride = useTargetStore(s => s.setDefenseRateOverride);

  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => {
    loadMonsters().then((m) => {
      setMonsters(m);
      if (!monsterId && m.length > 0) {
        setMonster(m[0].id);
        if (m[0].variants[0]) setVariant(m[0].variants[0].id);
        if (m[0].parts[0])    setPart(m[0].parts[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monster = monsters.find(m => m.id === monsterId);
  const variant = monster?.variants.find(v => v.id === variantId);
  const calculatedRate = (monster?.baseDefenseRate ?? 1.0) * (variant?.defenseRateMod ?? 1.0);

  return (
    <Card>
      <CardHead icon="◈" title="対象モンスター / TARGET" num="03" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field
          value={monsterId ?? ''}
          options={monsters.map(m => ({ value: m.id, label: m.name }))}
          onChange={(id) => {
            setMonster(id);
            const m = monsters.find(x => x.id === id);
            if (m?.variants[0]) setVariant(m.variants[0].id);
            if (m?.parts[0]) setPart(m.parts[0].id);
          }}
        />
        <Field
          value={variantId ?? ''}
          options={(monster?.variants ?? []).map(v => ({
            value: v.id, label: `${v.name} (×${v.defenseRateMod})`,
          }))}
          onChange={setVariant}
          small
        />
        <Field
          value={partId ?? ''}
          options={(monster?.parts ?? []).map(p => ({
            value: p.id,
            label: `${p.name}（物理${p.physical} / ${Object.entries(p.element).map(([k,v])=>`${k}${v}`).join(' ')}）`
          }))}
          onChange={setPart}
        />
      </div>
      <div className="toggle-grid" style={{ marginTop: 10 }}>
        <Toggle label="怒り状態" on={enraged} onChange={setEnraged} />
        <Toggle label="傷口" on={wounded} onChange={setWounded} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
        <span style={{ color: 'var(--text-3)' }}>全体防御率</span>
        <input
          type="number"
          step="0.05"
          className="field sm"
          value={defenseRateOverride ?? calculatedRate}
          onChange={(e) => {
            const v = Number(e.target.value);
            // 計算値と一致する場合は override をクリア
            if (Math.abs(v - calculatedRate) < 0.001) setDefenseRateOverride(null);
            else setDefenseRateOverride(v);
          }}
          style={{ width: 80, textAlign: 'right' }}
        />
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/monster/
git commit -m "feat(ui): MonsterCard supports variants and defenseRate override"
```

---

## Task 17: App.tsx を新ストア・新コンポーネントへ差し替え

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: src/App.tsx を以下に置き換える**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { WeaponInputCard } from './components/weapon/WeaponInputCard';
import { SkillsInputCard } from './components/skills/SkillsInputCard';
import { MonsterCard } from './components/monster/MonsterCard';
import { BuffsCard } from './components/buffs/BuffsCard';
import { PatternList } from './components/motion/PatternList';
import { HeroResult } from './components/result/HeroResult';
import { BreakdownCard } from './components/result/BreakdownCard';
import { FormulaTab } from './components/formula/FormulaTab';
import { ThemeTab } from './components/theme/ThemeTab';

import { useWeaponStore } from './store/weaponStore';
import { useSkillStore } from './store/skillStore';
import { useBuffStore } from './store/buffStore';
import { useMotionStore } from './store/motionStore';
import { useTargetStore } from './store/targetStore';
import { useThemeStore } from './store/themeStore';

import { loadSkills } from './data/skills';
import { loadSeriesSkills } from './data/series_skills';
import { loadGroupSkills } from './data/group_skills';
import { loadBuffs } from './data/buffs';
import { loadMonsters } from './data/monsters';
import { getMotionsFor } from './data/motions';

import { calcDamage } from './calc';
import type { DamageResult, SkillMaster, Buff, Monster, Motion } from './types';

function CalcPage({ result }: { result: DamageResult | null }) {
  return (
    <div className="page">
      <div className="col">
        <WeaponInputCard />
        <SkillsInputCard />
      </div>
      <div className="col">
        <PatternList result={result} />
        <MonsterCard />
        <BuffsCard />
      </div>
      <div className="col col-result">
        <HeroResult result={result} />
        <BreakdownCard result={result} />
      </div>
    </div>
  );
}

export default function App() {
  const weapon = useWeaponStore(s => s.weapon);
  const skills = useSkillStore(s => s.skills);
  const buffs = useBuffStore(s => s.selected);
  const patterns = useMotionStore(s => s.patterns);
  const addPattern = useMotionStore(s => s.addPattern);
  const monsterId = useTargetStore(s => s.monsterId);
  const variantId = useTargetStore(s => s.variantId);
  const partId = useTargetStore(s => s.partId);
  const enraged = useTargetStore(s => s.enraged);
  const wounded = useTargetStore(s => s.wounded);
  const defenseRateOverride = useTargetStore(s => s.defenseRateOverride);
  const hydrate = useThemeStore(s => s.hydrate);

  const [skillMasters, setSkillMasters] = useState<SkillMaster[]>([]);
  const [buffMasters, setBuffMasters] = useState<Buff[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    Promise.all([loadSkills(), loadSeriesSkills(), loadGroupSkills(), loadBuffs(), loadMonsters()])
      .then(([n, s, g, b, m]) => {
        setSkillMasters([...n, ...s, ...g]);
        setBuffMasters(b);
        setMonsters(m);
      });
  }, []);

  // 太刀のデフォルトパターン投入
  useEffect(() => {
    if (patterns.length > 0) return;
    getMotionsFor(weapon.type).then((all: Motion[]) => {
      if (all.length === 0) return;
      const find = (name: string) => all.find(m => m.motionName === name);
      const draw = find('居合抜刀気刃斬り');
      const oni  = find('鬼人斬り');
      const aka  = find('縦斬り');
      const helm = find('気刃兜割');
      if (draw && oni) addPattern({ name: '居合抜刀鬼人斬り', ratio: 0.5, motions: [draw, oni, oni] });
      if (aka  && oni) addPattern({ name: '赤刃 + 鬼人斬り',  ratio: 0.45, motions: [aka, oni] });
      if (helm)        addPattern({ name: '兜割',              ratio: 0.05, motions: [helm] });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapon.type]);

  const result: DamageResult | null = useMemo(() => {
    if (!monsterId || !variantId || !partId) return null;
    const monster = monsters.find(m => m.id === monsterId);
    if (!monster) return null;
    try {
      return calcDamage({
        weapon,
        skills,
        buffs,
        motionPatterns: patterns,
        target: {
          monster, variantId, partId, enraged, wounded,
          defenseRateOverride: defenseRateOverride ?? undefined,
        },
      }, skillMasters, buffMasters);
    } catch {
      return null;
    }
  }, [weapon, skills, buffs, patterns, monsters, monsterId, variantId, partId, enraged, wounded, defenseRateOverride, skillMasters, buffMasters]);

  return (
    <AppLayout
      calc={<CalcPage result={result} />}
      formula={<FormulaTab />}
      theme={<ThemeTab />}
    />
  );
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: 一部の旧コンポーネント参照（builder/, buildStore など）でエラーが残るが、`App.tsx` 自体は通る。残りは Task 18-21 で削除する。

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): switch App to v2 stores and new input components"
```

---

## Task 18: 旧 builder コンポーネント・aggregateSkills を削除

**Files:**
- Delete: `src/components/builder/` (4 components)
- Delete: `src/utils/aggregateSkills.ts`
- Delete: `src/__tests__/utils/aggregateSkills.test.ts`

- [ ] **Step 1: 旧コンポーネントを削除**

```bash
git rm src/components/builder/WeaponCard.tsx
git rm src/components/builder/ArmorCard.tsx
git rm src/components/builder/SkillsCard.tsx
git rm src/components/builder/MonsterCard.tsx
git rm src/utils/aggregateSkills.ts
git rm src/__tests__/utils/aggregateSkills.test.ts
rmdir src/components/builder 2>/dev/null || true
rmdir src/utils 2>/dev/null || true
```

> 注: `src/utils/` には `useTween.ts` が残っているので `rmdir` は失敗する。これでOK。

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: 残るエラーは `buildStore` への参照のみ（次タスクで削除）

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete builder components and aggregateSkills"
```

---

## Task 19: buildStore を削除（旧装備系ストア）

**Files:**
- Delete: `src/store/buildStore.ts`

- [ ] **Step 1: 参照確認**

Run: `grep -r "buildStore" src/ 2>/dev/null || true`
Expected: 何も出ない（App.tsx で削除済み）

- [ ] **Step 2: 削除**

```bash
git rm src/store/buildStore.ts
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete buildStore"
```

---

## Task 20: 旧 armor.json / decorations.json を削除

**Files:**
- Delete: `public/data/armor.json`, `public/data/decorations.json`
- Delete: `src/data/armor.ts`, `src/data/decorations.ts`

- [ ] **Step 1: 参照確認**

```bash
grep -rE "armor\.json|decorations\.json|loadArmor|loadDecorations" src/ public/ 2>/dev/null || true
```
Expected: 何も出ない

- [ ] **Step 2: 削除**

```bash
git rm public/data/armor.json public/data/decorations.json
git rm src/data/armor.ts src/data/decorations.ts
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete armor/decorations data files"
```

---

## Task 21: 旧 types を削除・整理

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 不要型の参照確認**

```bash
grep -rE "\bArmorPiece\b|\bDecoration\b|\bTalisman\b|\bConditionalSkillUptime\b|\bBuild\b" src/ 2>/dev/null || true
```

Expected: types/index.ts 自身以外には何も出ない（テストで `Build` を import している箇所がある可能性 → あれば修正）。

- [ ] **Step 2: 不要型を削除**

`src/types/index.ts` の末尾にある以下のブロックを削除:

```ts
// === 旧型（暫定互換、Plan A 末尾の Task で削除） ===
export interface Build {
  id: string;
  name: string;
  weaponId: string;
  createdAt: number;
  updatedAt: number;
}
```

また、Task 1 で残した `SharpnessValue`, `ArmorPiece`, `Decoration`, `Skill`, `Talisman`, `ConditionalSkillUptime` などが残っていないか確認（Task 1 では既に削除済みのはずだが、念のため）。残っていれば削除。

- [ ] **Step 3: Dexie の Build テーブルを削除**

`src/db/database.ts` を以下に置き換える:

```ts
import Dexie, { type Table } from 'dexie';
import type { ThemeId } from '../types';

interface ThemePref { id: 'current'; theme: ThemeId; }

class AppDB extends Dexie {
  themePref!: Table<ThemePref, 'current'>;

  constructor() {
    super('mhwilds-calc');
    this.version(1).stores({
      builds:    'id, updatedAt',
      themePref: 'id',
    });
    // v2: builds テーブルは Plan C で再導入する。現状は宣言だけ残す（既存DB互換）
    this.version(2).stores({
      builds:    null,         // 削除
      themePref: 'id',
    });
  }
}

export const db = new AppDB();
```

- [ ] **Step 4: 型チェック & テスト**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: エラーなし

Run: `npm run test:run`
Expected: 全テストPASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete types and Dexie builds table"
```

---

## Task 22: 動作確認・ビルド・タグ

**Files:**
- なし

- [ ] **Step 1: 全テスト実行**

Run: `npm run test:run`
Expected: 全テスト PASS。期待数: sharpness(8) + affinity(5) + skill_resolver(7) + buffs(5) + melee(7) + themeStore(3) + types(1) = 36+ テスト

- [ ] **Step 2: 本番ビルド**

Run: `npm run build`
Expected: クリーンビルド成功

- [ ] **Step 3: dev サーバーでスモークテスト**

Run: `npm run dev`
ブラウザで http://localhost:5173 を開き以下を確認:
- WeaponInputCard で武器種を切り替えると WeaponSpecificFields が変わる（ガンランス選択で砲撃UI表示）
- 攻撃力・会心率・属性値を編集すると HeroResult のDPSが変わる
- 斬れ味色を変えるとDPSが変わる
- SkillsInputCard で検索→追加ができる
- 追加したスキルのLvを変えるとDPSが変わる
- 条件付きスキル（挑戦者等）に uptime スライダーが出る
- BuffsCard でバフをトグルするとDPSが変わる
- 同一 exclusiveGroup のバフを2つON → 強い方だけ効く（DPS差で確認）
- MonsterCard で variant 切替→DPS変動
- 怒り/傷口 トグル→DPS変動
- 全体防御率を直接編集→DPS変動
- 計算式タブ・テーマタブが従来通り動作

Stop with Ctrl+C.

- [ ] **Step 4: タグ付け**

```bash
git commit --allow-empty -m "chore: Plan A feature-complete"
git tag v0.2.0-plan-a
```

---

## Plan A 完了基準

- [ ] 武器パラメータ（武器種・ATK・会心・属性・斬れ味・武器種別追加プロパティ）を直接入力できる
- [ ] スキル（通常・シリーズ・グループ）を検索→追加→Lv調整→uptime調整できる
- [ ] バフをトグル選択でき、exclusiveGroup の排他処理が動く
- [ ] モンスターの variant（通常/歴戦/護竜）が選択でき、defenseRate がDPSに反映される
- [ ] 怒り時の物理・属性肉質が計算に反映される
- [ ] 全体防御率の override が効く
- [ ] 属性キャップ（×2.3 or +400 の大きい方）が計算に効く
- [ ] 旧 builder コンポーネント・aggregateSkills・buildStore・armor/decorations データが削除されている
- [ ] 全テストが PASS、本番ビルドがクリーン

---

## Plan B/C/D/E への引き継ぎ事項

- **Plan B**: モーションタグの本格対応（motions.json 全武器種化・タグ付与）、武器固有プロパティの計算反映（ガンランス砲撃値テーブル参照、弓ビン補正、SA/CBビン補正）、damageType='shell-*' / 'arrow' / 'bowgun-bullet' 対応
- **Plan C**: パターン追加・削除・並び替えUI、モーション編集UI、JSON/テキスト/PNG エクスポート、ビルド永続化（Dexie builds テーブル再導入）
- **Plan D**: Kiranicoスクレイパー実装、CSV→JSON ビルドパイプライン、強撃/接撃ビン等の確定値取得
- **Plan E**: PWA、レスポンシブ調整、Capacitor 準備
