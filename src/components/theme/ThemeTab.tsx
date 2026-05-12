import { useThemeStore } from '../../store/themeStore';
import type { ThemeId } from '../../types';

interface ThemeDef {
  id: ThemeId; name: string; sub: string; desc: string; swatches: string[];
}

const THEMES: ThemeDef[] = [
  { id: 'ember', name: 'Ember', sub: '琥珀色のアクセント / ダーク',
    desc: '初期テーマ。落ち着いた暖色アクセントとクールなニュートラル背景。長時間の利用に最適。',
    swatches: ['oklch(0.16 0.008 65)','oklch(0.20 0.008 65)','oklch(0.76 0.16 55)','oklch(0.83 0.14 75)','oklch(0.87 0.16 90)'] },
  { id: 'aurora', name: 'Aurora', sub: 'シアン × バイオレット / ダーク',
    desc: '寒色系。深いブルーブラックを背景に、シアンと紫のグラデーションが映える。',
    swatches: ['oklch(0.15 0.022 260)','oklch(0.19 0.024 260)','oklch(0.78 0.15 220)','oklch(0.80 0.14 290)','oklch(0.85 0.13 200)'] },
  { id: 'forest', name: 'Forest', sub: 'エメラルド × ティール / ダーク',
    desc: 'ハイコントラストな緑系アクセント。属性ダメージや会心値の視認性が高い。',
    swatches: ['oklch(0.15 0.012 165)','oklch(0.19 0.012 165)','oklch(0.74 0.16 160)','oklch(0.82 0.14 145)','oklch(0.86 0.15 105)'] },
  { id: 'solar', name: 'Solar', sub: '紙のような暖白 / ライトモード',
    desc: '日中・明るい部屋向けの暖色ライトモード。エディトリアル誌面のような可読性。',
    swatches: ['oklch(0.97 0.005 70)','oklch(0.99 0.004 70)','oklch(0.62 0.18 35)','oklch(0.70 0.16 55)','oklch(0.65 0.18 60)'] },
];

export function ThemeTab() {
  const current = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);

  return (
    <div className="formula-wrap" style={{ maxWidth: 1080 }}>
      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>テーマカラー設定</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>4つのプリセットから選択できます。設定はそのまま保存されます。</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {THEMES.map(th => {
          const active = current === th.id;
          return (
            <div key={th.id} className="card lift" onClick={() => setTheme(th.id)}
              style={{ cursor: 'pointer', padding: 18,
                borderColor: active ? 'var(--accent-line)' : undefined,
                boxShadow: active ? '0 0 0 1px var(--accent-line), 0 12px 30px -16px color-mix(in oklch, var(--accent) 50%, transparent)' : undefined,
                background: `linear-gradient(165deg, ${th.swatches[1]} 0%, color-mix(in oklch, ${th.swatches[2]} 12%, ${th.swatches[1]}) 100%)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.97 0.004 65)', letterSpacing: '-0.01em' }}>{th.name}</div>
                  <div style={{ fontSize: 11, color: 'oklch(0.70 0.012 65)', marginTop: 3 }}>{th.sub}</div>
                </div>
                {active && (
                  <div className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 999, background: th.swatches[2], color: 'white' }}>USING</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {th.swatches.map((c, i) => (
                  <div key={i} style={{ flex: 1, height: 32, borderRadius: 6, background: c, boxShadow: 'inset 0 0 0 1px color-mix(in oklch, white 8%, transparent)' }} />
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'oklch(0.72 0.012 65)', lineHeight: 1.55 }}>{th.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
