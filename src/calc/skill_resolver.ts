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
