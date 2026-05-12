import { Slider } from '../shared/Slider';
import type { MotionPattern, PatternResult } from '../../types';

interface Props {
  pattern: MotionPattern;
  result?: PatternResult;
  onRatioChange: (v: number) => void;
}

export function PatternCard({ pattern, result, onRatioChange }: Props) {
  const pct = Math.round(pattern.ratio * 100);
  const hasDraw = pattern.motions.some(m => m.isDraw);
  const seq = pattern.motions.map(m => `${m.motionName}(MV${m.motionValue}${m.isDraw ? ',抜刀' : ''})`).join(' → ');
  const damage = result?.damage ?? 0;
  const frames = result?.frames ?? 0;
  const dps = frames > 0 ? Math.round((damage / frames) * 60) : 0;

  return (
    <div className="pattern">
      <div className="pattern-head">
        <div className="pattern-name">
          <span>{pattern.name}</span>
          {hasDraw && <span className="chip draw" style={{ padding: '2px 8px', fontSize: 10.5 }}><span>🗡 抜刀</span></span>}
        </div>
        <span className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="pattern-seq">{seq}</div>
      <Slider value={pct} onChange={(v) => onRatioChange(v / 100)} />
      <div className="pattern-stats">
        <div className="pattern-stat"><span className="lbl">期待ダメージ</span><span className="val num-crit">{damage}</span></div>
        <div className="pattern-stat"><span className="lbl">フレーム</span><span className="val">{frames}F</span></div>
        <div className="pattern-stat"><span className="lbl">貢献DPS</span><span className="val num-accent">{dps}</span></div>
      </div>
    </div>
  );
}
