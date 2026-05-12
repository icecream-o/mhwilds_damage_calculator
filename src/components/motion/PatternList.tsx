import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { PatternCard } from './PatternCard';
import { useMotionStore } from '../../store/motionStore';
import type { DamageResult } from '../../types';

interface Props { result: DamageResult | null; }

export function PatternList({ result }: Props) {
  const patterns = useMotionStore(s => s.patterns);
  const setRatio = useMotionStore(s => s.setRatio);

  const total = patterns.reduce((s, p) => s + p.ratio, 0);
  const sumPct = Math.round(total * 100);
  const sumGood = sumPct === 100;

  return (
    <Card>
      <CardHead
        icon="▶"
        title="立ち回りパターン / ROTATION"
        num="MAIN"
        meta={
          <span className="mono" style={{ fontSize: 11.5, color: sumGood ? 'var(--good)' : 'var(--accent)', fontWeight: 600 }}>
            {sumGood ? '✓' : '⚠'} 合計 {sumPct}%
          </span>
        }
      />
      {patterns.map((p, i) => (
        <PatternCard
          key={i}
          pattern={p}
          result={result?.patterns[i]}
          onRatioChange={(v) => setRatio(i, v)}
        />
      ))}
      <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>＋ パターンを追加（Plan 2で実装）</button>
    </Card>
  );
}
