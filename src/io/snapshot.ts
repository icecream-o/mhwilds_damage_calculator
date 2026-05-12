import type { WeaponInput, ActiveSkill, MotionPattern } from '../types';
import type { TargetSnapshot } from '../store/targetStore';
import { useWeaponStore } from '../store/weaponStore';
import { useSkillStore } from '../store/skillStore';
import { useBuffStore } from '../store/buffStore';
import { useMotionStore } from '../store/motionStore';
import { useTargetStore } from '../store/targetStore';

export interface AppSnapshot {
  version: 1;
  weapon: WeaponInput;
  skills: ActiveSkill[];
  buffs: string[];
  patterns: MotionPattern[];
  target: TargetSnapshot;
}

export function buildSnapshot(): AppSnapshot {
  const { weapon } = useWeaponStore.getState();
  const { skills } = useSkillStore.getState();
  const { selected: buffs } = useBuffStore.getState();
  const { patterns } = useMotionStore.getState();
  const { monsterId, variantId, partId, enraged, wounded, defenseRateOverride } =
    useTargetStore.getState();
  return {
    version: 1,
    weapon,
    skills,
    buffs,
    patterns,
    target: { monsterId, variantId, partId, enraged, wounded, defenseRateOverride },
  };
}

export function parseSnapshot(json: unknown): AppSnapshot {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid snapshot: not an object');
  }
  const snap = json as Record<string, unknown>;
  if (snap['version'] !== 1) {
    throw new Error(`Unsupported snapshot version: ${snap['version']}`);
  }
  if (snap['weapon'] == null || snap['skills'] == null || snap['patterns'] == null || snap['target'] == null) {
    throw new Error('Invalid snapshot: missing required fields (weapon, skills, patterns, target)');
  }
  return snap as unknown as AppSnapshot;
}

export function applySnapshot(snap: AppSnapshot): void {
  useWeaponStore.getState().setWeapon(snap.weapon);
  useSkillStore.getState().setAll(snap.skills);
  useBuffStore.getState().setSelected(snap.buffs);
  useMotionStore.getState().setPatterns(snap.patterns);
  useTargetStore.getState().setAll(snap.target);
}
