export type ThemeId = 'ember' | 'aurora' | 'forest' | 'solar';

export type WeaponType =
  | 'longsword' | 'greatsword' | 'sword-and-shield' | 'dual-blades'
  | 'hammer' | 'hunting-horn' | 'lance' | 'gunlance'
  | 'switch-axe' | 'charge-blade' | 'insect-glaive'
  | 'light-bowgun' | 'heavy-bowgun' | 'bow';

export type SharpnessColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'white' | 'purple';

export interface SharpnessValue { color: SharpnessColor; value: number; }

export interface Element {
  type: '火' | '水' | '雷' | '氷' | '龍';
  value: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  attack: number;
  affinity: number;
  element: Element | null;
  sharpness: { current: SharpnessColor; values: SharpnessValue[] };
  slots: number[];
}

export interface ArmorPiece {
  id: string;
  name: string;
  part: 'head' | 'chest' | 'arms' | 'waist' | 'legs';
  skills: { skillId: string; level: number }[];
  slots: number[];
}

export interface Decoration {
  id: string;
  name: string;
  slotSize: number;
  skillId: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  maxLevel: number;
  description?: string;
}

export interface Talisman {
  type: 'preset' | 'custom';
  id?: string;
  skills?: { skillId: string; level: number }[];
  decorations: (string | null)[];
}

export interface Motion {
  motionName: string;
  motionValue: number;
  frames: number;
  isDraw: boolean;
}

export interface MotionPattern {
  name: string;
  motions: Motion[];
  ratio: number;
}

export interface MonsterPart {
  id: string;
  name: string;
  physical: number;
  element: Partial<Record<Element['type'], number>>;
  woundedPhysicalBonus?: number;
}

export interface Monster {
  id: string;
  name: string;
  parts: MonsterPart[];
}

export interface ConditionalSkillUptime {
  skillId: string;
  uptime: number;
}

export interface ActiveSkill {
  skillId: string;
  level: number;
}

export interface Build {
  id: string;
  name: string;
  weaponId: string;
  armor: Partial<Record<ArmorPiece['part'], { id: string; decorations: (string | null)[] }>>;
  talisman: Talisman;
  conditionalUptimes: ConditionalSkillUptime[];
  motionPatterns: MotionPattern[];
  buffs: string[];
  target: { monsterId: string; partId: string; enraged: boolean; wounded: boolean };
  createdAt: number;
  updatedAt: number;
}

export interface CalcInput {
  weapon: Weapon;
  passiveSkills: { skillId: string; level: number }[];
  conditionalUptimes: ConditionalSkillUptime[];
  buffs: string[];
  motionPatterns: MotionPattern[];
  target: { monster: Monster; partId: string; enraged: boolean; wounded: boolean };
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
  patterns: PatternResult[];
}
