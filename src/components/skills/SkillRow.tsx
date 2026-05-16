import { Slider } from '../shared/Slider';
import type { SkillMaster, ActiveSkill, SkillApplicability } from '../../types';

/**
 * 発動条件（HP・スタミナ・怒り状態など）が存在するスキル。
 * uptime スライダーで発動時間割合を指定可能にする。
 */
const CONDITIONAL_IDS = new Set([
  'agitator',         // 挑戦者: 怒り時
  'resentment',       // 逆襲: 被弾後
  'peak-performance', // フルチャージ: 体力満タン時
  'ni-hen-mi',        // 逆恨み: 赤ゲージ時
  'qiao-ji',          // 巧撃: 緊急回避成功後
  'gong-shi',         // 攻勢: 赤ゲージ時
  'hun-shen',         // 渾身: スタミナ満タン時
  'li-nojie-fang',    // 力の解放: 一定条件発動時
  'wu-wo-nojing-di',  // 無我の境地: 一定条件発動時
]);

const DAMAGE_TYPE_LABEL: Record<string, string> = {
  'shell-normal':  '通常砲',
  'shell-spread':  '拡散砲',
  'shell-long':    '放射砲',
  'arrow':         '矢',
  'bowgun-bullet': '弾',
};

/** applicability → 短い日本語バッジ文字列の配列 */
function applicabilityLabels(app: SkillApplicability | undefined): string[] {
  if (!app) return [];
  const labels: string[] = [];
  if (app.requireHitzonePhysical !== undefined) {
    labels.push(`肉質≥${app.requireHitzonePhysical}`);
  }
  if (app.requireHitzonePhysicalMax !== undefined) {
    labels.push(`肉質≤${app.requireHitzonePhysicalMax}`);
  }
  if (app.requireTags && app.requireTags.length > 0) {
    const sep = app.matchAny ? ' / ' : ' & ';
    labels.push(app.requireTags.join(sep));
  }
  if (app.requireDamageType && app.requireDamageType.length > 0) {
    labels.push(app.requireDamageType.map(d => DAMAGE_TYPE_LABEL[d] ?? d).join(' / '));
  }
  return labels;
}

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
  const badges = applicabilityLabels(master.applicability);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 8,
      border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{master.name}</span>
          {badges.map((b, i) => (
            <span
              key={i}
              title="このスキルが発動するモーション条件"
              style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 4,
                background: 'var(--bg-3)', color: 'var(--text-3)',
                border: '1px solid var(--line)',
              }}
            >
              {b}
            </span>
          ))}
        </div>
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
