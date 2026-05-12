import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import type { DamageResult } from '../../types';

const DOTS = ['var(--accent)', 'var(--crit)', 'var(--purple)', 'var(--elem)'];

interface Props { result: DamageResult | null; }

export function BreakdownCard({ result }: Props) {
  if (!result) return null;
  const patterns = result.patterns;
  const totalRatio = patterns.reduce((s, p) => s + p.ratio, 0) || 1;

  return (
    <Card>
      <CardHead icon="▤" title="パターン別内訳" />
      <div className="breakdown-bar">
        {patterns.map((p, i) => (
          <span key={i} style={{ width: `${(p.ratio / totalRatio) * 100}%`, background: DOTS[i % DOTS.length] }} />
        ))}
      </div>
      <div style={{ marginTop: 4 }}>
        {patterns.map((p, i) => {
          const contributionDps = p.frames > 0 ? (p.damage / p.frames * 60 * (p.ratio / totalRatio)) : 0;
          return (
            <div key={i} className="breakdown-row">
              <div className="name">
                <div className="dot" style={{ background: DOTS[i % DOTS.length] }} />
                <span className="name-text">{p.name}</span>
                <span className="name-pct mono">{Math.round(p.ratio * 100)}%</span>
              </div>
              <span className="val mono">{contributionDps.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
