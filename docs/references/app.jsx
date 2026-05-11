// MHWilds Damage Calc — main app
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "ember"
}/*EDITMODE-END*/;

// ─── tween hook ─────────────────────────────────────
function useTween(target, ms = 320) {
  const [val, setVal] = useState(target);
  const ref = useRef({ from: target, to: target, t0: 0, raf: 0 });
  useEffect(() => {
    cancelAnimationFrame(ref.current.raf);
    ref.current.from = val;
    ref.current.to = target;
    ref.current.t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - ref.current.t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = ref.current.from + (ref.current.to - ref.current.from) * e;
      setVal(v);
      if (k < 1) ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.raf);
  }, [target]);
  return val;
}

// ─── small components ───────────────────────────────
function CardHead({ icon, title, num, meta }) {
  return (
    <div className="card-head">
      <div className="card-title">
        <span>{icon} {title}</span>
        {num && <span className="card-title-num">{num}</span>}
      </div>
      {meta && <div className="card-meta">{meta}</div>}
    </div>
  );
}

function Field({ value, options, small }) {
  return (
    <select className={"field " + (small ? "sm" : "")} defaultValue={value}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function Chip({ name, lv, kind }) {
  return (
    <span className={"chip " + (kind || "")}>
      <span>{name}</span>
      <span className="lv">Lv{lv}</span>
    </span>
  );
}

// ─── WEAPON ─────────────────────────────────────────
function WeaponCard() {
  const sharp = [
    { c: 'red', f: 1 }, { c: 'orange', f: 1 }, { c: 'yellow', f: 2 },
    { c: 'green', f: 3 }, { c: 'blue', f: 3 }, { c: 'white', f: 2 }, { c: 'purple', f: 2 },
  ];
  return (
    <div className="card">
      <CardHead icon="⚔" title="武器 / WEAPON" num="01" />
      <div style={{display: 'flex', gap: 8, marginBottom: 10}}>
        <Field value="太刀" options={['太刀','大剣','片手剣','双剣','ハンマー','狩猟笛','ランス','ガンランス','スラッシュアックス','チャージアックス','操虫棍','ライトボウガン','ヘビィボウガン','弓']} />
      </div>
      <Field value="業物【神流】" options={['業物【神流】','飛竜刀【蒼】','黒龍棍【千千】','レーヴァテイン']} />
      <div className="stat-grid" style={{marginTop: 12}}>
        <div className="stat"><div className="label">攻撃力</div><div className="value">330</div></div>
        <div className="stat"><div className="label">会心</div><div className="value num-good">+20%</div></div>
        <div className="stat"><div className="label">水属性</div><div className="value num-elem">24</div></div>
      </div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 14, fontSize: 11}}>
        <span style={{color: 'var(--text-3)'}}>斬れ味</span>
        <span className="mono" style={{color: 'var(--purple)', fontWeight: 600}}>紫 ×1.39</span>
      </div>
      <div className="sharp">
        {sharp.map((s,i) => <span key={i} className={'sharp-' + s.c} style={{flex: s.f}}></span>)}
      </div>
    </div>
  );
}

// ─── ARMOR ─────────────────────────────────────────
function ArmorCard() {
  const pieces = [
    { slot: '頭', name: 'ガルルガヘルム', deco: [{name: '攻撃珠', lv: 1}, null] },
    { slot: '胴', name: 'ネルギガンテメイル', deco: [{name: '会心珠', lv: 2}, {name: '会心珠', lv: 2}, null] },
    { slot: '腕', name: 'ゴアマガラアーム', deco: [null] },
    { slot: '腰', name: 'ティガレックスコイル', deco: [{name: '超会心珠', lv: 3}] },
    { slot: '脚', name: 'マムガイラグリーヴ', deco: [null, null] },
  ];
  return (
    <div className="card">
      <CardHead icon="🛡" title="防具 / ARMOR" num="02" />
      <div>
        {pieces.map((p, i) => (
          <div className="eq-row" key={i}>
            <div className="eq-slot">{p.slot}</div>
            <div>
              <Field value={p.name} options={[p.name]} small />
              <div className="eq-slots">
                {p.deco.map((d, j) => (
                  <div key={j} className={"eq-slot-pill " + (d ? "" : "empty")}>
                    {d ? <><span>{d.name}</span><span className="lv">L{d.lv}</span></> : <span>— 空き</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="div-line"></div>
      <div className="eq-row" style={{borderTop: 0, paddingTop: 0}}>
        <div className="eq-slot">護石</div>
        <div>
          <Field value="🎲 鑑定護石（カスタム）" options={['🎲 鑑定護石（カスタム）','抜刀術護石Ⅲ','超会心の護石Ⅲ']} small />
          <div className="talisman">
            <div className="talisman-head">
              <span style={{width: 5, height: 5, borderRadius: '50%', background: 'var(--purple)'}}></span>
              CUSTOM SKILL SET
            </div>
            <div className="talisman-row">
              <Field value="抜刀術【力】" options={['抜刀術【力】','抜刀術【技】','業物','見切り']} small />
              <select className="field sm field-lv" defaultValue="Lv3"><option>Lv1</option><option>Lv2</option><option>Lv3</option></select>
            </div>
            <div className="talisman-row">
              <Field value="業物" options={['業物','匠','超会心','弱点特効']} small />
              <select className="field sm field-lv" defaultValue="Lv2"><option>Lv1</option><option>Lv2</option><option>Lv3</option></select>
            </div>
          </div>
          <div className="eq-slots" style={{marginTop: 8}}>
            <div className="eq-slot-pill"><span>業物珠</span><span className="lv">L2</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SKILLS ────────────────────────────────────────
function SkillsCard({ uptimes, setUptime }) {
  const active = [
    { name: '超会心', lv: 3 },
    { name: '会心撃【属性】', lv: 1 },
    { name: '攻撃', lv: 5 },
    { name: '見切り', lv: 7 },
    { name: '業物', lv: 3 },
    { name: '抜刀術【力】', lv: 3, kind: 'draw' },
    { name: '弱点特効', lv: 3 },
  ];
  return (
    <div className="card">
      <CardHead icon="✦" title="発動スキル / SKILLS" num="03" />
      <div style={{fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8}}>常時発動</div>
      <div className="chips" style={{marginBottom: 14}}>
        {active.map((s, i) => <Chip key={i} {...s} />)}
      </div>
      <div style={{fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8}}>条件付き（UPTIME）</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {Object.entries(uptimes).map(([key, u]) => (
          <div key={key} className="uptime">
            <div className="uptime-head">
              <div className="uptime-name">
                <span style={{color: 'var(--crit)', fontWeight: 600}}>{u.name}</span>
                <span className="meta">Lv{u.lv} · {u.cond}</span>
              </div>
              <span className="mono" style={{color: 'var(--accent)', fontWeight: 600, fontSize: 12}}>{u.pct}%</span>
            </div>
            <input type="range" className="slider" min="0" max="100" value={u.pct}
              onChange={e => setUptime(key, +e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MONSTER ───────────────────────────────────────
function MonsterCard({ enraged, setEnraged, wounded, setWounded }) {
  return (
    <div className="card">
      <CardHead icon="◈" title="対象モンスター / TARGET" num="04" />
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <Field value="ゴア・マガラ" options={['ゴア・マガラ','リオレウス','ティガレックス','ネルギガンテ','イビルジョー']} />
        <Field value="頭部（物理85 / 水35）" options={['頭部（物理85 / 水35）','胴体（物理50 / 水20）','尻尾（物理45 / 水15）']} />
      </div>
      <div className="toggle-grid" style={{marginTop: 10}}>
        <div className={"toggle " + (enraged ? "on" : "")} onClick={() => setEnraged(!enraged)}>
          <div className="ck"></div><span>怒り状態</span>
        </div>
        <div className={"toggle " + (wounded ? "on" : "")} onClick={() => setWounded(!wounded)}>
          <div className="ck"></div><span>傷口</span>
        </div>
      </div>
    </div>
  );
}

// ─── PATTERN ───────────────────────────────────────
function PatternCard({ p, onChange }) {
  return (
    <div className="pattern">
      <div className="pattern-head">
        <div className="pattern-name">
          <span>{p.name}</span>
          {p.draw && <span className="chip draw" style={{padding: '2px 8px', fontSize: 10.5}}><span>🗡 抜刀</span></span>}
        </div>
        <span className="mono" style={{color: 'var(--accent)', fontSize: 13, fontWeight: 600}}>{p.pct}%</span>
      </div>
      <div className="pattern-seq">{p.seq}</div>
      <div className="slider-row">
        <input type="range" className="slider" min="0" max="100" value={p.pct}
          onChange={e => onChange(+e.target.value)} />
      </div>
      <div className="pattern-stats">
        <div className="pattern-stat"><span className="lbl">期待ダメージ</span><span className="val num-crit">{p.dmg}</span></div>
        <div className="pattern-stat"><span className="lbl">フレーム</span><span className="val">{p.frames}F</span></div>
        <div className="pattern-stat"><span className="lbl">貢献DPS</span><span className="val num-accent">{Math.round(p.dmg / p.frames * 60)}</span></div>
      </div>
    </div>
  );
}

// ─── BUFFS ─────────────────────────────────────────
function BuffsCard({ buffs, toggle }) {
  return (
    <div className="card">
      <CardHead icon="◉" title="バフ・アイテム / BUFFS" num="05" />
      <div className="toggle-grid">
        {Object.entries(buffs).map(([k, v]) => (
          <div key={k} className={"toggle " + (v.on ? "on" : "")} onClick={() => toggle(k)}>
            <div className="ck"></div><span>{v.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HERO RESULT ───────────────────────────────────
function HeroResult({ dps, baselineDps, physical, elemental, critRate, critCoef }) {
  const tweened = useTween(dps);
  const delta = dps - baselineDps;
  const sign = delta >= 0 ? '+' : '';
  return (
    <div className="hero lift">
      <div className="hero-inner">
        <div className="hero-label">立ち回り期待DPS</div>
        <div className="hero-dps">
          <span>{tweened.toFixed(1)}</span>
          <span className="unit">DMG / s</span>
        </div>
        {Math.abs(delta) > 0.05 && (
          <div className="hero-delta">
            <span>▲</span>
            <span>{sign}{delta.toFixed(1)} vs baseline</span>
          </div>
        )}
        <div className="hero-stats">
          <div className="hero-stat"><span className="l">物理期待値</span><span className="v num-crit">{physical}</span></div>
          <div className="hero-stat"><span className="l">属性期待値</span><span className="v num-elem">+{elemental}</span></div>
          <div className="hero-stat"><span className="l">実効会心率</span><span className="v num-good">{critRate}%</span></div>
          <div className="hero-stat"><span className="l">会心期待係数</span><span className="v">×{critCoef}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── BREAKDOWN ─────────────────────────────────────
function BreakdownCard({ patterns, totalDps }) {
  const dots = ['var(--accent)', 'var(--crit)', 'var(--purple)', 'var(--elem)'];
  const total = patterns.reduce((s, p) => s + p.pct, 0) || 1;
  return (
    <div className="card">
      <CardHead icon="▤" title="パターン別内訳" />
      <div className="breakdown-bar">
        {patterns.map((p, i) => (
          <span key={i} style={{width: (p.pct / total * 100) + '%', background: dots[i % dots.length]}}></span>
        ))}
      </div>
      <div style={{marginTop: 4}}>
        {patterns.map((p, i) => (
          <div key={i} className="breakdown-row">
            <div className="name">
              <div className="dot" style={{background: dots[i % dots.length]}}></div>
              <span className="name-text">{p.name}</span>
              <span className="name-pct">{p.pct}%</span>
            </div>
            <span className="val">{(p.dmg / p.frames * 60 * (p.pct/total)).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXPORT ────────────────────────────────────────
function ExportCard() {
  return (
    <div className="card">
      <CardHead icon="↗" title="出力 / EXPORT" />
      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        <button className="btn btn-primary" style={{justifyContent: 'center'}}>🖼  画像で保存 (PNG)</button>
        <button className="btn" style={{justifyContent: 'center'}}>📋  テキストをコピー</button>
        <button className="btn" style={{justifyContent: 'center'}}>{`{ }`}  JSONをコピー</button>
      </div>
    </div>
  );
}

// ─── FORMULA TAB ───────────────────────────────────
function FormulaTab() {
  const steps = [
    { n: '01', label: '攻撃力期待値の合成', body: (
      <><span className="var">武器攻撃力</span> + <span className="var">攻撃スキル補正</span> + <span className="var">アイテムバフ</span> + Σ <span className="var-cond">条件付き補正</span> × <span className="var-cond">発動時間割合</span><br/>
      <span className="comment">// 鬼人薬・粉塵などのフラットバフを加算</span></>
    )},
    { n: '02', label: '会心率期待値', body: (
      <><span className="var">武器会心率</span> + <span className="var">見切り</span> + <span className="var">弱点特効</span> + <span className="var">抜刀術【技】</span> + Σ<span className="var-cond">条件付き会心</span>×<span className="var-cond">uptime</span><br/>
      <span className="comment">// -1.00 〜 +1.00 にクランプ。弱点特効は肉質 ≥ 45 のみ</span></>
    )},
    { n: '03', label: '会心期待係数', body: (
      <>1 + <span className="var">会心率期待値</span> × (<span className="var">会心倍率</span> − 1)<br/>
      <span className="comment">// 通常 1.25 / 超会心 1.40 / マイナス会心 0.75</span></>
    )},
    { n: '04', label: '物理ダメージ', body: (
      <><span className="var">攻撃力</span> ÷ <span className="var">武器係数</span> × (<span className="var">モーション値</span>÷100) × <span className="var">斬れ味補正</span> × <span className="var">会心期待係数</span> × <span className="var">武器固有補正</span> × (<span className="var">物理肉質</span>÷100)</>
    )},
    { n: '05', label: '属性ダメージ', body: (
      <><span className="var">武器属性値</span> × <span className="var">属性スキル補正</span> × <span className="var">斬れ味補正(属性)</span> × <span className="var">属性会心期待係数</span> × (<span className="var">属性肉質</span>÷100)<br/>
      <span className="comment">// 会心撃【属性】発動時 ×1.35</span></>
    )},
    { n: '06', label: 'パターン総ダメージ・フレーム', body: (
      <>パターン総ダメージ = floor((<span className="var">Σ物理</span> + <span className="var">Σ属性</span>) × <span className="var">全体防御率</span>)<br/>
      パターン総フレーム = Σ <span className="var">モーションフレーム数</span></>
    )},
    { n: '07', label: '立ち回り期待DPS', body: (
      <>Σ(<span className="var">パターン総ダメージ</span> × <span className="var">パターン割合</span>) ÷ Σ(<span className="var">パターン総フレーム</span> × <span className="var">パターン割合</span>) × 60</>
    )},
  ];
  return (
    <div className="formula-wrap">
      <div className="card" style={{padding: 28}}>
        <div style={{marginBottom: 24}}>
          <div style={{fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em'}}>ダメージ計算ロジック</div>
          <div style={{fontSize: 13, color: 'var(--text-3)', marginTop: 4}}>このアプリで使用している計算式の全貌です。各変数は日本語表記。</div>
        </div>
        {steps.map(s => (
          <div key={s.n}>
            <div className="formula-step">
              <span className="num">{s.n}</span>
              <span>{s.label}</span>
              <span className="ln"></span>
            </div>
            <div className="formula-box">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── THEME TAB ─────────────────────────────────────
function ThemeTab({ current, onChange }) {
  const themes = [
    {
      id: 'ember', name: 'Ember', sub: '琥珀色のアクセント / ダーク',
      desc: '初期テーマ。落ち着いた暖色アクセントとクールなニュートラル背景。長時間の利用に最適。',
      swatches: ['oklch(0.16 0.008 65)', 'oklch(0.20 0.008 65)', 'oklch(0.76 0.16 55)', 'oklch(0.83 0.14 75)', 'oklch(0.87 0.16 90)'],
    },
    {
      id: 'aurora', name: 'Aurora', sub: 'シアン × バイオレット / ダーク',
      desc: '寒色系。深いブルーブラックを背景に、シアンと紫のグラデーションが映える。',
      swatches: ['oklch(0.15 0.022 260)', 'oklch(0.19 0.024 260)', 'oklch(0.78 0.15 220)', 'oklch(0.80 0.14 290)', 'oklch(0.85 0.13 200)'],
    },
    {
      id: 'forest', name: 'Forest', sub: 'エメラルド × ティール / ダーク',
      desc: 'ハイコントラストな緑系アクセント。属性ダメージや会心値の視認性が高い。',
      swatches: ['oklch(0.15 0.012 165)', 'oklch(0.19 0.012 165)', 'oklch(0.74 0.16 160)', 'oklch(0.82 0.14 145)', 'oklch(0.86 0.15 105)'],
    },
    {
      id: 'solar', name: 'Solar', sub: '紙のような暖白 / ライトモード',
      desc: '日中・明るい部屋向けの暖色ライトモード。エディトリアル誌面のような可読性。',
      swatches: ['oklch(0.97 0.005 70)', 'oklch(0.99 0.004 70)', 'oklch(0.62 0.18 35)', 'oklch(0.70 0.16 55)', 'oklch(0.65 0.18 60)'],
    },
  ];
  return (
    <div className="formula-wrap" style={{maxWidth: 1080}}>
      <div style={{marginBottom: 24, padding: '0 4px'}}>
        <div style={{fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em'}}>テーマカラー設定</div>
        <div style={{fontSize: 13, color: 'var(--text-3)', marginTop: 4}}>4つのプリセットから選択できます。設定はそのまま保存されます。</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16}}>
        {themes.map(th => {
          const active = current === th.id;
          return (
            <div
              key={th.id}
              onClick={() => onChange(th.id)}
              className="card lift"
              style={{
                cursor: 'pointer',
                padding: 18,
                borderColor: active ? 'var(--accent-line)' : undefined,
                boxShadow: active
                  ? '0 0 0 1px var(--accent-line), 0 12px 30px -16px color-mix(in oklch, var(--accent) 50%, transparent)'
                  : undefined,
                position: 'relative',
                background: th.swatches.length
                  ? `linear-gradient(165deg, ${th.swatches[1]} 0%, color-mix(in oklch, ${th.swatches[2]} 12%, ${th.swatches[1]}) 100%)`
                  : undefined,
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14}}>
                <div>
                  <div style={{fontSize: 15, fontWeight: 600, color: 'oklch(0.97 0.004 65)', letterSpacing: '-0.01em'}}>{th.name}</div>
                  <div style={{fontSize: 11, color: 'oklch(0.70 0.012 65)', marginTop: 3}}>{th.sub}</div>
                </div>
                {active && (
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
                    padding: '3px 8px', borderRadius: 999,
                    background: th.swatches[2], color: 'white',
                  }}>USING</div>
                )}
              </div>
              <div style={{display: 'flex', gap: 4, marginBottom: 14}}>
                {th.swatches.map((c, i) => (
                  <div key={i} style={{
                    flex: 1, height: 32, borderRadius: 6,
                    background: c,
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklch, white 8%, transparent)',
                  }}></div>
                ))}
              </div>
              <div style={{fontSize: 11.5, color: 'oklch(0.72 0.012 65)', lineHeight: 1.55}}>{th.desc}</div>

              {/* mini preview */}
              <div style={{
                marginTop: 14, padding: 10,
                background: th.swatches[0],
                border: '1px solid color-mix(in oklch, white 6%, transparent)',
                borderRadius: 8,
                display: 'flex', alignItems: 'baseline', gap: 6,
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22, fontWeight: 600,
                  color: th.swatches[2],
                  letterSpacing: '-0.02em',
                }}>224.7</span>
                <span style={{fontSize: 10, color: 'oklch(0.60 0.012 65)', textTransform: 'uppercase', letterSpacing: '0.12em'}}>DPS</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('calc');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
  }, [t.theme]);
  const [enraged, setEnraged] = useState(true);
  const [wounded, setWounded] = useState(false);

  const [uptimes, setUptimes] = useState({
    chal: { name: '挑戦者', lv: 7, cond: '怒り時', pct: 60 },
    rev:  { name: '逆襲', lv: 3, cond: '被弾後', pct: 30 },
  });
  const setUptime = (k, v) => setUptimes(s => ({...s, [k]: {...s[k], pct: v}}));

  const [buffs, setBuffs] = useState({
    might:    { name: '鬼人薬グレート', on: true },
    armor:    { name: '硬化薬グレート', on: true },
    demon:    { name: '怪力の丸薬', on: false },
    meal:     { name: '食事バフ（攻撃）', on: false },
    bug:      { name: '翔蟲【攻撃強化】', on: false },
    blast:    { name: '粉塵【爆破】', on: false },
  });
  const toggleBuff = (k) => setBuffs(s => ({...s, [k]: {...s[k], on: !s[k].on}}));

  const [patterns, setPatterns] = useState([
    { name: '居合抜刀鬼人斬り', seq: '居合(MV50, 抜刀) → 鬼人斬り ×2 (MV35×2)', pct: 50, dmg: 487, frames: 62, draw: true },
    { name: '赤刃1 + 鬼人斬り1', seq: '赤刃斬り(MV45) → 鬼人斬り(MV35)', pct: 45, dmg: 312, frames: 45 },
    { name: '兜割', seq: '兜割(MV110, フィニッシュ)', pct: 5, dmg: 524, frames: 55 },
  ]);
  const setPatternPct = (idx, v) => setPatterns(s => s.map((p,i) => i === idx ? {...p, pct: v} : p));

  // mock DPS recompute
  const dps = useMemo(() => {
    const total = patterns.reduce((s,p) => s + p.pct, 0) || 1;
    const num = patterns.reduce((s,p) => s + p.dmg * p.pct, 0);
    const den = patterns.reduce((s,p) => s + p.frames * p.pct, 0);
    let dps = (num / den) * 60;
    // small bias from uptimes + buffs + monster state
    const upBoost = (uptimes.chal.pct / 100) * 0.10 + (uptimes.rev.pct / 100) * 0.06;
    const buffBoost = Object.values(buffs).filter(b => b.on).length * 0.02;
    const monBoost = (enraged ? 0.04 : 0) + (wounded ? 0.06 : 0);
    return dps * (1 + upBoost + buffBoost + monBoost);
  }, [patterns, uptimes, buffs, enraged, wounded]);

  const baselineDps = 224.7;

  // pattern sum indicator
  const patternSum = patterns.reduce((s,p) => s + p.pct, 0);
  const sumGood = patternSum === 100;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark"></div>
            <div className="brand-text">
              <div className="title">Wilds Damage Calc</div>
              <div className="sub">期待ダメージ・立ち回りDPS算出ツール</div>
            </div>
          </div>
          <div className="tabs">
            <button className={"tab " + (tab === 'calc' ? "active" : "")} onClick={() => setTab('calc')}>
              <span style={{opacity: 0.7}}>◫</span> 計算機
            </button>
            <button className={"tab " + (tab === 'formula' ? "active" : "")} onClick={() => setTab('formula')}>
              <span style={{opacity: 0.7}}>ƒ</span> 計算式
            </button>
            <button className={"tab " + (tab === 'theme' ? "active" : "")} onClick={() => setTab('theme')}>
              <span style={{opacity: 0.7}}>◐</span> テーマ
            </button>
          </div>
          <div className="header-spacer"></div>
          <div className="header-actions">
            <button className="btn">↓ 読込</button>
            <button className="btn">⊕ 保存</button>
          </div>
        </div>
      </header>

      {tab === 'formula' && <div style={{padding: '28px'}}><FormulaTab /></div>}
      {tab === 'theme' && <div style={{padding: '28px'}}><ThemeTab current={t.theme} onChange={(v) => setTweak('theme', v)} /></div>}

      {tab === 'calc' && (
        <div className="page">
          <div className="col">
            <WeaponCard />
            <ArmorCard />
            <SkillsCard uptimes={uptimes} setUptime={setUptime} />
          </div>

          <div className="col">
            <div className="card">
              <CardHead icon="▶" title="立ち回りパターン / ROTATION" num="MAIN"
                meta={
                  <span style={{fontSize: 11.5, color: sumGood ? 'var(--good)' : 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600}}>
                    {sumGood ? '✓' : '⚠'} 合計 {patternSum}%
                  </span>
                }
              />
              {patterns.map((p, i) => (
                <PatternCard key={i} p={p} onChange={(v) => setPatternPct(i, v)} />
              ))}
              <button className="btn" style={{width: '100%', justifyContent: 'center', marginTop: 4}}>＋ パターンを追加</button>
            </div>

            <MonsterCard enraged={enraged} setEnraged={setEnraged} wounded={wounded} setWounded={setWounded} />
            <BuffsCard buffs={buffs} toggle={toggleBuff} />
          </div>

          <div className="col col-result">
            <HeroResult
              dps={dps}
              baselineDps={baselineDps}
              physical={312}
              elemental={48}
              critRate={62}
              critCoef={'1.155'}
            />
            <BreakdownCard patterns={patterns} totalDps={dps} />
            <ExportCard />
          </div>
        </div>
      )}

    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
