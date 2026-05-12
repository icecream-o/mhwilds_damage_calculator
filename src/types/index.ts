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
  | 'offset' | 'tackle' | 'finisher'
  | 'binshot-power' | 'binshot-close' | 'binshot-element'
  | 'phial-active' | 'discharge';

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

