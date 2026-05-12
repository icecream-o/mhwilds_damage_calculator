# MHWilds Damage Calc — 設計書 v2

> **改訂理由:** 武器・防具・装飾品をDB化する従来案を破棄し、「**最終ステータスを直接入力する電卓型**」へ全面リファクタ。アーティア武器・シリーズスキル・グループスキル・武器固有プロパティ（砲撃タイプ等）への対応を含む。

> **v1からの主な変更:**
> - 武器DB / 防具DB / 装飾品DB / 護石プリセットDB を**全て廃止**
> - 入力モデルを「装備選択 → スキル集計」から「ステータス・スキル直接入力」へ変更
> - モーションタグ × スキル適用条件 × 武器固有プロパティの3軸モデルを導入
> - データソースは Kiranico スクレイピング（B方式）でブートストラップ、以後はCSV手動管理（A方式）

---

## 1. 概要

Monster Hunter Wilds 専用の期待ダメージ・期待DPS算出ツール。プレイヤーが装備の最終ステータス（攻撃力・会心率・属性・斬れ味・発動スキル）を直接入力し、立ち回りパターンと割合を指定することで、対モンスター期待DPSをリアルタイム計算する。

### 1.1 ターゲットユーザー
- 装備構成を組み終わって「どのスキル構成・どの立ち回りが最強か」を比較したいプレイヤー
- アーティア武器のロール最適化を検証したいプレイヤー
- スキルのuptime（弱点特効・挑戦者等の発動時間割合）を踏まえた現実的なDPSを知りたいプレイヤー

### 1.2 やらないこと
- **装備ビルダー機能**（武器・防具・装飾品のスロット最適化）
- **MHWilds以外のシリーズ対応**（MHW/MHRise/MHWorld等は対象外）
- **オンラインビルド共有サーバー**（クライアントサイドのみ）

---

## 2. スコープ

### 2.1 入力（ユーザーが指定する5要素）

| # | 項目 | 内容 |
|---|---|---|
| ① | **武器パラメータ** | 武器種、攻撃力、会心率、属性タイプ＋値、斬れ味色、武器固有プロパティ（砲撃タイプ等） |
| ② | **発動スキル** | 通常スキル＋シリーズスキル＋グループスキル。条件付きスキルはuptime（0-100%）入力 |
| ③ | **モンスター情報** | モンスター選択、個体ティア（通常/歴戦/護竜）、部位選択、怒り状態、傷口状態、全体防御率override |
| ④ | **バフ** | 鬼人薬・力の護符・ネコ飯・笛バフ等のトグル群 |
| ⑤ | **立ち回りパターン** | パターン名＋モーション列＋採用割合（0-100%、合計100%目標） |

### 2.2 出力
- **立ち回り期待DPS**（メイン指標、リアルタイム更新・tweenアニメ付き）
- **物理期待ダメージ平均**
- **属性期待ダメージ平均**
- **実効会心率**
- **会心期待係数**
- **パターン別内訳**（各パターンの貢献DPS・割合）
- **エクスポート**: PNG画像、JSONテキスト、人間可読テキスト

---

## 3. 技術スタック（v1から流用）

- **フロント**: React 18 + Vite + TypeScript
- **スタイル**: Tailwind CSS v3 + OKLCH CSS変数（4テーマ: Ember/Aurora/Forest/Solar）
- **状態管理**: Zustand
- **永続化**: Dexie.js（IndexedDB）
- **テスト**: Vitest + Testing Library
- **PWA**: vite-plugin-pwa（Workbox）— Plan後半
- **エクスポート**: html2canvas (PNG)
- **タイポグラフィ**: Geist / JetBrains Mono / Noto Sans JP
- **スクレイパー**: Python 3.11+ / requests / BeautifulSoup4 / pandas（CSV出力）

---

## 4. アーキテクチャ

### 4.1 フォルダ構成（更新）

```
mhwilds_damage_calculator/
├── public/data/                # アプリ実行時に読むデータ
│   ├── skills.json             # スキルマスター（適用条件付き）
│   ├── series_skills.json      # シリーズスキルマスター
│   ├── group_skills.json       # グループスキルマスター
│   ├── motions.json            # 武器種別モーション一覧（タグ付き）
│   ├── monsters.json           # モンスター肉質・バリアント
│   ├── buffs.json              # アイテム・ネコ飯バフ
│   └── shelling_table.json     # ガンランス砲撃値テーブル
├── data/                       # CSV原本（手動管理対象、git管理）
│   ├── skills.csv
│   ├── series_skills.csv
│   ├── group_skills.csv
│   ├── motions_*.csv           # 武器種ごとに分割
│   ├── monsters.csv
│   ├── buffs.csv
│   └── shelling_table.csv
├── scripts/scraper/            # スクレイパー（Python）
│   ├── kiranico/
│   │   ├── skills.py
│   │   ├── monsters.py
│   │   ├── motions.py
│   │   └── series_group.py
│   ├── csv_to_json.py          # ビルド前にCSV→JSON変換
│   └── requirements.txt
├── src/
│   ├── calc/                   # 計算エンジン（v1から拡張）
│   │   ├── index.ts
│   │   ├── physical.ts         # 物理ダメージ
│   │   ├── element.ts          # 属性ダメージ
│   │   ├── fixed.ts            # 固定ダメージ（砲撃等）
│   │   ├── sharpness.ts        # 斬れ味補正
│   │   ├── affinity.ts         # 会心係数
│   │   ├── skills.ts           # スキル補正（タグ判定込み）
│   │   ├── conditional.ts      # 条件付きスキルuptime
│   │   ├── weapon_state.ts     # 武器固有プロパティ補正
│   │   └── buffs.ts            # バフ補正
│   ├── types/index.ts
│   ├── data/                   # JSONローダー
│   ├── db/database.ts          # Dexie（ビルド永続化のみ）
│   ├── store/                  # Zustand
│   │   ├── weaponStore.ts      # 武器パラメータ直接入力
│   │   ├── skillStore.ts       # 発動スキル直接入力
│   │   ├── motionStore.ts
│   │   ├── targetStore.ts
│   │   ├── buffStore.ts
│   │   └── themeStore.ts
│   ├── components/
│   │   ├── weapon/             # 武器入力UI（武器種別の追加プロパティ含む）
│   │   ├── skills/             # スキル入力UI（検索・Lv指定）
│   │   ├── monster/            # モンスター・部位選択
│   │   ├── buffs/              # バフトグル
│   │   ├── motion/             # 立ち回りパターン編集
│   │   ├── result/             # HeroResult / BreakdownCard
│   │   ├── shared/             # Card/Field/Slider/Toggle/Chip/StatTile
│   │   ├── layout/             # Header/AppLayout/TabBar
│   │   ├── formula/            # 計算式タブ
│   │   ├── theme/              # テーマタブ
│   │   └── io/                 # エクスポート・インポート
│   ├── utils/
│   └── __tests__/
└── docs/
```

### 4.2 計算パイプライン

```
[入力]
  ├─ ① 武器パラメータ
  │     ├─ 基本: ATK, 会心, 属性, 斬れ味
  │     └─ 固有: 砲撃タイプLv / ビン種 / 弾種
  ├─ ② 発動スキル [{id, level, uptime}]
  ├─ ③ モンスター (variant, part, enraged, wounded, defenseRateOverride?)
  ├─ ④ バフ [{id, on}]
  └─ ⑤ パターン [{motions[{name, MV, frames, tags}], ratio}]

[計算]
  ├─ 1. 攻撃力期待値 = ATK + 攻撃スキル + バフ + Σ(条件付きスキル × uptime)
  ├─ 2. 会心率期待値 = 武器会心 + Σ(会心スキル × 適用条件) + Σ(条件付き会心 × uptime)
  │      └─ 適用条件: 弱点特効(肉質≥45), 抜刀術【技】(タグdraw), 飛燕(タグjump), etc.
  ├─ 3. 会心期待係数 = 1 + 会心率 × (会心倍率 - 1)
  ├─ 4. 各モーション×パターンの物理ダメージ計算
  │      ├─ タグに応じてスキル適用判定
  │      ├─ 砲撃モーションは固定値計算（砲撃値テーブル参照）
  │      ├─ 弓ビン・SA/CBビンによる物理補正
  │      └─ 集中攻撃・オフセット等のWilds固有補正
  ├─ 5. 各モーション×パターンの属性ダメージ計算
  │      └─ 会心撃【属性】、属性会心倍率の適用
  ├─ 6. パターン総ダメージ = floor((Σ物理 + Σ属性) × 全体防御率)
  ├─ 7. パターン総フレーム = Σ モーションフレーム数
  └─ 8. 立ち回り期待DPS = Σ(総ダメージ × 割合) / Σ(総フレーム × 割合) × 60

[出力]
  → DamageResult { expectedDPS, physicalAvg, elementAvg, effectiveAffinity, critCoef, patterns[] }
```

---

## 5. UI設計

### 5.1 ページ構成（タブ）
- **計算機タブ**: メインの入力・結果表示
- **計算式タブ**: 計算ロジックのリファレンス
- **テーマタブ**: テーマ切替

### 5.2 計算機タブのレイアウト（3カラム）

```
┌─────────────┬─────────────┬─────────────┐
│ 武器        │ 立ち回り    │ 期待DPS     │
│  パラメータ │  パターン   │  （Hero）   │
│             │             │             │
│ 発動スキル  │ モンスター  │ パターン別  │
│  ・常時     │  対象部位   │  内訳       │
│  ・uptime   │             │             │
│             │ バフ        │ エクスポート│
│             │             │  ボタン     │
└─────────────┴─────────────┴─────────────┘
```

### 5.3 入力UIの主要コンポーネント

#### ① WeaponInputCard
- 武器種ドロップダウン（14種）
- 攻撃力・会心率・属性タイプ・属性値・斬れ味色の入力フィールド
- **武器種別の追加プロパティ**（折りたたみ可能セクション）:
  - ガンランス: 砲撃タイプ + Lv
  - 弓: 装填可能ビンのチェックボックス群
  - LBG/HBG: 装填可能弾種チェックボックス群
  - チャアク: ビンタイプ（榴弾/強属性）
  - スラアク: ビンタイプ

#### ② SkillsInputCard
- スキル検索コンボボックス（インクリメンタル検索）→ 追加
- 追加済みスキルの一覧（Lv調整スライダー、削除ボタン）
- **シリーズスキル**セクション: シリーズ選択ドロップダウン + 発動Lv（2/3/4部位等）
- **グループスキル**セクション: 同上
- 条件付きスキル（挑戦者・逆襲・フルチャージ・抜刀術等）には **uptime スライダー** が自動表示

#### ③ MonsterCard
- モンスター名ドロップダウン
- 個体ティア（通常/歴戦/護竜）ラジオ
- 部位ドロップダウン（物理肉質・属性肉質を表示）
- 怒り状態・傷口状態トグル
- 全体防御率の表示 + override可能な数値入力

#### ④ BuffsCard
- 主要バフのトグル群（鬼人薬・力の護符・力の爪・ネコ飯攻撃力UP・笛攻撃力旋律など）
- カテゴリ別グループ化

#### ⑤ PatternList + PatternCard
- パターン追加ボタン
- パターンごと: 名前編集、モーション列編集、割合スライダー
- モーション追加: 武器種に応じたモーションリストから選択

### 5.4 結果表示
- HeroResult: 期待DPSを大きく表示（tween アニメーション）
- 物理期待値・属性期待値・実効会心率・会心期待係数
- BreakdownCard: パターン別の貢献DPSバー

### 5.5 テーマシステム
- v1から流用（Ember/Aurora/Forest/Solar、OKLCH変数、Dexie永続化）

---

## 6. データモデル

### 6.1 主要な型定義

```ts
// 武器入力
interface WeaponInput {
  type: WeaponType;
  attack: number;
  affinity: number;
  element: { type: ElementType; value: number } | null;
  sharpness: SharpnessColor;
  // 武器種別の追加プロパティ（type に応じて使い分け）
  gunlanceShell?: { type: 'normal' | 'spread' | 'long'; level: number };
  bowBins?: BowBinType[];        // 装填可能ビンの配列
  bowgunAmmo?: BowgunAmmoType[]; // 装填可能弾種
  chargeBladeBin?: 'impact' | 'element';
  switchAxeBin?: 'power' | 'element' | 'paralysis' | 'dragon' | 'exhaust';
}

// 発動スキル（通常・シリーズ・グループを区別せず一律）
interface ActiveSkill {
  skillId: string;       // skills.json の id
  level: number;
  uptime?: number;       // 0-1, 条件付きスキルのみ
  source: 'normal' | 'series' | 'group';  // 表示用
}

// スキルマスター
interface SkillMaster {
  id: string;
  name: string;
  maxLevel: number;
  category: 'normal' | 'series' | 'group';
  description?: string;
  applicability?: {
    requireTags?: MotionTag[];      // 該当タグのモーションのみ適用
    matchAny?: boolean;              // requireTags の OR/AND
    requireDamageType?: DamageType[]; // 砲撃のみ等
    requireHitzonePhysical?: number;  // 弱点特効 (>=45)
  };
  effects: SkillEffectByLevel[];     // Lv別の効果
}

interface SkillEffectByLevel {
  level: number;
  attackBonus?: number;        // 攻撃+X
  attackMultiplier?: number;   // 攻撃×X
  affinityBonus?: number;      // 会心+X%
  critMultiplier?: number;     // 会心倍率上書き（超会心等）
  elementMultiplier?: number;  // 属性×X
  // ... 他の効果
}

// モーション
interface Motion {
  id: string;
  motionName: string;
  motionValue: number;       // 物理ダメージ用（砲撃は別扱い）
  frames: number;
  tags: MotionTag[];
  damageType?: DamageType;
}

type MotionTag =
  | 'draw'           // 抜刀
  | 'jump' | 'aerial'
  | 'mounted'        // セクレト騎乗
  | 'focus-strike'   // 集中攻撃（傷部位向け）
  | 'offset'         // オフセット
  | 'tackle'
  | 'finisher';

type DamageType =
  | 'physical'           // 通常物理
  | 'shell-normal'       // 通常砲撃
  | 'shell-spread'       // 拡散砲撃
  | 'shell-long'         // 放射砲撃
  | 'fixed'              // スキル/会心無効の固定値
  | 'arrow'              // 弓矢
  | 'bowgun-bullet';     // 弾系

// モンスター
interface Monster {
  id: string;
  name: string;
  baseDefenseRate: number;
  variants: MonsterVariant[];
  parts: MonsterPart[];
}

interface MonsterVariant {
  id: string;
  name: string;           // '通常' | '歴戦' | '護竜'
  defenseRateMod: number; // baseDefenseRate に乗算
}

interface MonsterPart {
  id: string;
  name: string;
  physical: number;
  element: Partial<Record<ElementType, number>>;
  woundedPhysicalBonus?: number;
  // 怒り時の肉質変動（差分または上書き、モンスターごとに存在しない場合あり）
  enragedPhysical?: number;
  enragedElement?: Partial<Record<ElementType, number>>;
}

// バフ
interface Buff {
  id: string;
  name: string;
  category: 'item' | 'cat-food' | 'horn' | 'environment';
  attackBonus?: number;
  attackMultiplier?: number;
  affinityBonus?: number;
  defenseBonus?: number;    // 受け側、計算には不要だが表示用
}

// 計算入力
interface CalcInput {
  weapon: WeaponInput;
  skills: ActiveSkill[];
  buffs: string[];           // buff IDs
  motionPatterns: MotionPattern[];
  target: {
    monsterId: string;
    variantId: string;
    partId: string;
    enraged: boolean;
    wounded: boolean;
    defenseRateOverride?: number;
  };
}

interface MotionPattern {
  name: string;
  motions: Motion[];
  ratio: number;
}

// 計算結果
interface DamageResult {
  expectedDPS: number;
  physicalAvg: number;
  elementAvg: number;
  effectiveAffinity: number;
  critCoefficient: number;
  patterns: PatternResult[];
}
```

### 6.2 砲撃値テーブル（固定参照）

```jsonc
// public/data/shelling_table.json
{
  "normal":  { "1": 12, "2": 16, "3": 20, "4": 24, "5": 28, "6": 32 },
  "spread":  { "1": 14, "2": 18, "3": 22, "4": 26, "5": 30, "6": 34 },
  "long":    { "1": 13, "2": 17, "3": 21, "4": 25, "5": 29, "6": 33 }
}
// 値は Kiranico スクレイピングで確定する。砲術スキルで × multiplier。
```

---

## 7. 計算ロジック詳細

### 7.1 ステップ詳細

#### Step 1: 攻撃力期待値
```
attack_effective = weapon.attack
                 + Σ(passive skill attack bonus)
                 + Σ(buff attack bonus)
                 + Σ(conditional skill attack bonus × uptime)
                 + (attack_multiplier_total - 1) × base  // 攻撃%系スキル
```

#### Step 2: 会心率期待値（モーションごとに変動）
モーション毎に以下を計算:
```
for each motion:
  affinity = weapon.affinity
           + Σ(passive affinity skill bonus, where applicability matches motion.tags AND part.hitzone)
           + Σ(buff affinity)
           + Σ(conditional affinity × uptime)
  affinity = clamp(affinity, -100, +100)
```

例:
- **弱点特効Lv3** は `physicalHitzone >= 45` の時のみ +30%
- **抜刀術【技】Lv3** は `motion.tags.includes('draw')` の時のみ +30%
- **飛燕Lv3** は `motion.tags.includes('jump')` の時のみ +30%

#### Step 3: 会心期待係数
```
critMult = affinity >= 0 ? (超会心適用) : 0.75
critCoef = 1 + (affinity / 100) × (critMult - 1)
```

#### Step 4: 物理ダメージ（モーションごと）
```
if motion.damageType == 'physical' OR undefined:
  physical = (attack_effective / weapon_coef)
           × (motionValue / 100)
           × sharpness_multiplier(weapon.sharpness)
           × critCoef
           × weaponSpecificMultiplier  // ビン補正等
           × (physicalHitzone / 100)

elif motion.damageType matches 'shell-*':
  shellValue = shellingTable[weapon.gunlanceShell.type][weapon.gunlanceShell.level]
  physical = shellValue × artilleryMultiplier(砲術Lv)
  // 砲撃は会心・斬れ味・肉質の影響を受けない（固定値）

elif motion.damageType == 'fixed':
  physical = motionValue  // 固定値、補正なし
```

#### Step 5: 属性ダメージ
```
if weapon.element exists:
  elemMult = base
           × Σ(element skill multipliers, e.g. 水属性攻撃強化)
           × elementSharpnessMult(weapon.sharpness)
           × elementCritCoef  // 会心撃【属性】発動時のみ
  element = weapon.element.value
          × elemMult
          × (elementHitzone / 100)
```

#### Step 6: パターン総ダメージ・フレーム
```
patternDamage = floor(Σ(physical + element for each motion) × monster.defenseRate)
patternFrames = Σ(motion.frames)
```

#### Step 7: 立ち回り期待DPS
```
DPS = Σ(patternDamage × ratio) / Σ(patternFrames × ratio) × 60
```

### 7.2 スキル適用ロジック（タグマッチング）

```ts
function isSkillApplicable(
  skill: SkillMaster,
  motion: Motion,
  hitzonePhys: number
): boolean {
  const app = skill.applicability;
  if (!app) return true; // 常時発動
  if (app.requireHitzonePhysical && hitzonePhys < app.requireHitzonePhysical) return false;
  if (app.requireTags && app.requireTags.length > 0) {
    const has = app.matchAny
      ? app.requireTags.some(t => motion.tags.includes(t))
      : app.requireTags.every(t => motion.tags.includes(t));
    if (!has) return false;
  }
  if (app.requireDamageType && app.requireDamageType.length > 0) {
    if (!motion.damageType || !app.requireDamageType.includes(motion.damageType)) return false;
  }
  return true;
}
```

### 7.3 武器固有プロパティの計算反映

| 武器 | プロパティ | 計算への影響 |
|---|---|---|
| ガンランス | 砲撃タイプ・Lv | `shell-*` モーションの固定値ダメージを決定 |
| ガンランス | 砲術スキルLv | 砲撃値に倍率 |
| 弓 | 装填可能ビン（強撃） | `requires-bin:強撃` タグ付きモーションに +25%物理 |
| 弓 | 装填可能ビン（接撃） | 該当タグモーションに +15%物理 |
| 弓 | 装填可能ビン（属強） | 該当タグモーションに +20%属性 |
| チャアク | ビンタイプ（榴弾） | `discharge-*` モーションに榴弾値加算 |
| チャアク | ビンタイプ（強属性） | `discharge-*` モーションに属性倍率 |
| スラアク | ビンタイプ（強撃） | `phial-*` モーションに +15%物理 |
| スラアク | ビンタイプ（強属性） | `phial-*` モーションに +45%属性 |
| LBG/HBG | 装填可能弾種 | `bullet-*` モーションのうち装填可能なものだけ計算対象 |

---

## 8. データ取得・管理

### 8.1 ブートストラップ（B方式: Kiranico スクレイピング）

#### 対象データ
1. スキルマスター（〜80スキル）
2. シリーズスキルマスター
3. グループスキルマスター
4. モンスター肉質（〜30モンスター × 4-6部位、通常/怒り）
5. モーション値（14武器種 × 各〜20モーション）
6. 砲撃値テーブル
7. バフアイテム一覧

#### ワークフロー
```
[Kiranico mhwilds.kiranico.com]
   ↓ scripts/scraper/kiranico/*.py
[scraped_raw/*.csv]  ← 自動生成、編集禁止
   ↓ 初回コピー
[data/*.csv]         ← 手動編集対象、gitコミット
   ↓ scripts/csv_to_json.py
[public/data/*.json] ← アプリが読む、gitコミット対象（ビルド成果物的扱い）
```

#### スクレイパーの実装方針
- Python 3.11+ / requests / BeautifulSoup4 / pandas
- `User-Agent` 設定、`time.sleep(0.5)` でレートリミット遵守
- 取得結果は `scraped_raw/` にCSVで保存（diff確認用）
- 初回のみ `data/*.csv` へコピー
- アプデ時の再スクレイピング: `scraped_raw/` と `data/` を比較して **新規IDだけ追加**

### 8.2 継続管理（A方式: CSV手動編集）

- `data/*.csv` を手で編集 → `npm run build:data` で `public/data/*.json` を再生成
- 不正値検出: ビルド時に zod スキーマで検証、エラー時にビルド失敗
- スキーマファイル: `scripts/csv_to_json.py` 内に定義

### 8.3 CSVスキーマ例

**data/skills.csv:**
```csv
id,name,maxLevel,category,description,requireTags,requireDamageType,requireHitzonePhysical,matchAny
attack,攻撃,5,normal,攻撃力アップ,,,,
weakness-exploit,弱点特効,3,normal,肉質45以上で会心+,,,45,
punishing-draw-tech,抜刀術【技】,3,normal,抜刀斬りの会心+,draw,,,
ranger,飛燕,3,normal,ジャンプ攻撃の会心+,jump,,,
artillery,砲術,5,normal,砲撃ダメージ強化,,shell-normal;shell-spread;shell-long,,true
```

**data/skill_effects.csv:**
```csv
skillId,level,attackBonus,attackMultiplier,affinityBonus,critMultiplier,elementMultiplier
attack,1,3,,,
attack,2,5,,,
attack,3,6,,,
attack,4,7,,,
attack,5,9,,,
critical-boost,1,,,,1.30,
critical-boost,2,,,,1.35,
critical-boost,3,,,,1.40,
```

---

## 9. I/O（エクスポート・インポート）

### 9.1 JSON エクスポート
全入力・出力を含む完全なスナップショット:
```jsonc
{
  "version": "v2.0",
  "createdAt": 1234567890,
  "input": {
    "weapon": { /* WeaponInput */ },
    "skills": [ /* ActiveSkill[] */ ],
    "buffs": [ /* string[] */ ],
    "target": { /* ... */ },
    "patterns": [ /* MotionPattern[] */ ]
  },
  "result": { /* DamageResult */ }
}
```

### 9.2 テキストエクスポート（人間可読）
```
=== Wilds Damage Calc v2 ===
[武器] 太刀 / ATK 330 / 会心 +20% / 水属性 24 / 紫
[スキル] 攻撃Lv5 見切りLv7 超会心Lv3 弱点特効Lv3 挑戦者Lv7(60%) ...
[対象] ゴア・マガラ(歴戦) / 頭部 / 怒り
[バフ] 鬼人薬, 力の護符, ネコ飯攻撃力UP
[パターン]
  - 居合抜刀鬼人斬り (50%) → 居合抜刀気刃斬り → 鬼人斬り → 鬼人斬り
  - 赤刃 + 鬼人斬り (45%) → ...
  - 兜割 (5%) → 気刃兜割
[結果] 期待DPS: 224.7
       物理 18420 / 属性 +1230 / 実効会心 80% / 会心係数 ×1.32
```

### 9.3 PNG エクスポート
html2canvas で結果カード + 主要入力を画像化。SNS共有用。

### 9.4 インポート
- JSON: 完全復元
- テキスト: パース可能な範囲で復元（簡易）

---

## 10. テスト戦略

### 10.1 ユニットテスト（Vitest）
- 計算モジュール全般（純粋関数）: 既知の入出力ペアで網羅
- スキル適用条件マッチング: 各タグ・各条件の境界値
- 武器固有プロパティ反映: 砲撃値・ビン補正・弾種フィルタ
- CSV→JSON 変換: zod スキーマで型保証

### 10.2 統合テスト
- App.tsx レベル: ユーザー入力 → DamageResult のE2E
- ストア間連携: weaponStore変更時のresult再計算

### 10.3 データ整合性テスト
- すべての skill applicability が motion タグと整合しているか
- すべてのモンスターバリアントが parts を持っているか
- 砲撃値テーブルがガンランスの全Lv分揃っているか

---

## 11. 実装フェーズ（実装計画書は別ファイル）

### Plan A: 直接入力UIへの全面改修
- v1 の WeaponCard / ArmorCard / SkillsCard を新UIに差し替え
- 武器パラメータ直接入力（武器種別追加プロパティ含む）
- スキル直接入力（検索・Lv指定・シリーズ・グループ）
- モンスター個体バリアント対応
- 計算エンジンに型を合わせて改修（後方互換は捨てる）
- バフ入力UI

### Plan B: モーションタグ・武器固有計算ロジック・全武器種データ
- 計算エンジンを Motion タグ・DamageType 対応へ拡張
- スキル適用条件のフルマッチングロジック
- 武器固有プロパティの計算反映
- 全14武器種のモーションデータ整備
- 砲撃値テーブル

### Plan C: I/O とパターン編集機能
- パターン追加・複製・削除・並び替えUI
- モーション編集（リストから選択 → MV/フレーム/タグ）
- JSON / テキスト / PNG エクスポート
- インポート機能

### Plan D: Kiranico スクレイパー
- Python スクレイパー実装（D1: 太刀パイロット → D2: 全カテゴリ）
- CSV→JSON ビルドパイプライン
- データバリデーション（zod）
- アプデ対応の差分マージスクリプト

### Plan E: PWA・モバイル対応（任意）
- vite-plugin-pwa 設定
- Capacitor 準備
- レスポンシブ最終調整

---

## 12. リスクと未確定事項

### 12.1 既知のリスク
- **Kiranico の構造変更**: HTMLレイアウト変更でスクレイパーが破綻 → 初回バルク取得後はCSV手動管理が主なので影響限定的
- **ワイルズ計算式の確証不足**: 公式の式は非公開、外部サイトの推測値が混在 → 計算式タブで使用式を明記、ユーザーが検証できる
- **スキル適用条件の曖昧性**: 一部スキル（例: 「強化持続」「逆襲」等）が「全モーション一律」なのか「特定タグだけ」なのかの判別困難 → CSV上で明記、不明な場合は「全モーション一律」をデフォルト
- **アーティア武器のロール上限**: ロール条件・最大値はゲーム解析次第 → 最終ATK直接入力なので不問

### 12.2 未確定で後続Planで詰めるもの
- 集中攻撃の倍率値（要 Kiranico/コミュニティ確認）
- オフセット攻撃の補正値
- セクレト騎乗時の補正
- 痛撃肉質補正の正確な数値
- 怒り時の物理・属性肉質変動（モンスターごとに大きく異なる）
- 弓の矢タイプ（連射/拡散/貫通）×Lvの扱い: 現状は **モーション側にエンコード**（連射Lv5矢の溜めIIIショット = 1モーション）とする方針。武器プロパティに含めない
- 強撃ビン・接撃ビン等の正確な倍率値（Wilds実数値の確証取得が必要）

---

## 13. 用語集

| 用語 | 説明 |
|---|---|
| MV (Motion Value) | モーション値。攻撃のダメージ係数 |
| 肉質 (Hitzone) | モンスター部位ごとのダメージ受けやすさ（0-100） |
| 会心 (Affinity) | クリティカル率（％） |
| 斬れ味補正 | 斬れ味色ごとの物理倍率 |
| 全体防御率 | モンスターの全ダメージに乗る基礎倍率 |
| アーティア武器 | ロール値で攻撃力等が決まるエンドコンテンツ武器 |
| シリーズスキル | 同一防具シリーズを複数部位装備で発動するスキル |
| グループスキル | 同一グループの防具を複数部位装備で発動するスキル |
| Uptime | 条件付きスキルの戦闘中発動時間割合 |
| タグ | モーションの分類ラベル（draw, jump, focus-strike等） |
| バリアント | モンスターの個体ティア（通常/歴戦/護竜） |

---

## 改訂履歴

- **v1 (2026-05-12)**: 初版（装備DB前提モデル、太刀MVP）→ Plan 1 として実装済み
- **v2 (2026-05-12)**: 直接入力モデルへ全面改訂（本書）
