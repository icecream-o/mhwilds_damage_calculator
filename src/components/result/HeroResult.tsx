import { useTween } from '../../utils/useTween';
import type { DamageResult } from '../../types';

interface Props { result: DamageResult | null; }

export function HeroResult({ result }: Props) {
  const dps = result?.expectedDPS ?? 0;
  const tweened = useTween(dps);
  if (!result) return <div className="hero">計算結果なし</div>;

  return (
    <div className="hero lift">
      <div className="hero-inner">
        <div className="hero-label">立ち回り期待DPS</div>
        <div className="hero-dps">
          <span>{tweened.toFixed(1)}</span>
          <span className="unit">DMG / s</span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="l">物理期待値</span><span className="v num-crit">{result.physicalAvg}</span></div>
          <div className="hero-stat"><span className="l">属性期待値</span><span className="v num-elem">+{result.elementAvg}</span></div>
          <div className="hero-stat"><span className="l">実効会心率</span><span className="v num-good">{Math.round(result.effectiveAffinity * 100)}%</span></div>
          <div className="hero-stat"><span className="l">会心期待係数</span><span className="v">×{result.critCoefficient.toFixed(3)}</span></div>
        </div>
      </div>
    </div>
  );
}
