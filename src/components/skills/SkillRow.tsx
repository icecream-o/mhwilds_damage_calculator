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
