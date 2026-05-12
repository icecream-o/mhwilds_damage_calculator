import type { AppSnapshot } from './snapshot';
import type { DamageResult } from '../types';

export function buildTextSummary(snap: AppSnapshot, result: DamageResult | null): string {
  const lines: string[] = [];
  lines.push('=== MH Wilds ダメージ計算結果 ===');
  lines.push('');

  const w = snap.weapon;
  const affSign = w.affinity >= 0 ? '+' : '';
  lines.push(`[武器]`);
  lines.push(`  種別    : ${w.type}`);
  lines.push(`  攻撃力  : ${w.attack}`);
  lines.push(`  会心率  : ${affSign}${w.affinity}%`);
  lines.push(`  斬れ味  : ${w.sharpness}`);
  if (w.element) {
    lines.push(`  属性    : ${w.element.type} ${w.element.value}`);
  }
  lines.push('');

  if (snap.skills.length > 0) {
    lines.push(`[スキル]`);
    for (const s of snap.skills) {
      const uptime = s.uptime !== undefined ? ` (発動率 ${Math.round(s.uptime * 100)}%)` : '';
      lines.push(`  ${s.skillId} Lv${s.level}${uptime}`);
    }
    lines.push('');
  }

  if (snap.buffs.length > 0) {
    lines.push(`[バフ]`);
    for (const b of snap.buffs) {
      lines.push(`  ${b}`);
    }
    lines.push('');
  }

  if (result) {
    lines.push(`[計算結果]`);
    lines.push(`  期待DPS         : ${result.expectedDPS.toFixed(1)}`);
    lines.push(`  有効会心率      : ${Math.round(result.effectiveAffinity * 100)}%`);
    lines.push(`  会心係数        : ${result.critCoefficient.toFixed(3)}`);
    lines.push(`  全体防御率      : ${result.defenseRate.toFixed(2)}`);
    lines.push(`  物理平均ダメージ: ${result.physicalAvg.toFixed(1)}`);
    lines.push(`  属性平均ダメージ: ${result.elementAvg.toFixed(1)}`);
    lines.push('');
    lines.push(`[パターン別]`);
    for (const p of result.patterns) {
      const dps = p.frames > 0 ? Math.round((p.damage / p.frames) * 60) : 0;
      lines.push(`  ${p.name} (${Math.round(p.ratio * 100)}%): ${p.damage}dmg / ${p.frames}F / 貢献DPS ${dps}`);
    }
  }

  return lines.join('\n');
}
