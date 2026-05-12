export function FormulaTab() {
  const steps = [
    { n: '01', label: '攻撃力期待値の合成', body: (<>
      <span className="var">武器攻撃力</span> + <span className="var">攻撃スキル補正</span> + <span className="var">アイテムバフ</span> + Σ <span className="var-cond">条件付き補正</span> × <span className="var-cond">発動時間割合</span><br/>
      <span className="comment">// 鬼人薬・粉塵などのフラットバフを加算</span>
    </>)},
    { n: '02', label: '会心率期待値', body: (<>
      <span className="var">武器会心率</span> + <span className="var">見切り</span> + <span className="var">弱点特効</span> + <span className="var">抜刀術【技】</span> + Σ<span className="var-cond">条件付き会心</span>×<span className="var-cond">uptime</span><br/>
      <span className="comment">// -1.00 〜 +1.00 にクランプ。弱点特効は肉質 ≥ 45 のみ</span>
    </>)},
    { n: '03', label: '会心期待係数', body: (<>
      1 + <span className="var">会心率期待値</span> × (<span className="var">会心倍率</span> − 1)<br/>
      <span className="comment">// 通常 1.25 / 超会心 1.40 / マイナス会心 0.75</span>
    </>)},
    { n: '04', label: '物理ダメージ', body: (<>
      <span className="var">攻撃力</span> ÷ <span className="var">武器係数</span> × (<span className="var">モーション値</span>÷100) × <span className="var">斬れ味補正</span> × <span className="var">会心期待係数</span> × <span className="var">武器固有補正</span> × (<span className="var">物理肉質</span>÷100)
    </>)},
    { n: '05', label: '属性ダメージ', body: (<>
      <span className="var">武器属性値</span> × <span className="var">属性スキル補正</span> × <span className="var">斬れ味補正(属性)</span> × <span className="var">属性会心期待係数</span> × (<span className="var">属性肉質</span>÷100)<br/>
      <span className="comment">// 会心撃【属性】発動時 ×1.35</span>
    </>)},
    { n: '06', label: 'パターン総ダメージ・フレーム', body: (<>
      パターン総ダメージ = floor((<span className="var">Σ物理</span> + <span className="var">Σ属性</span>) × <span className="var">全体防御率</span>)<br/>
      パターン総フレーム = Σ <span className="var">モーションフレーム数</span>
    </>)},
    { n: '07', label: '立ち回り期待DPS', body: (<>
      Σ(<span className="var">パターン総ダメージ</span> × <span className="var">パターン割合</span>) ÷ Σ(<span className="var">パターン総フレーム</span> × <span className="var">パターン割合</span>) × 60
    </>)},
  ];
  return (
    <div className="formula-wrap">
      <div className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>ダメージ計算ロジック</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>このアプリで使用している計算式の全貌です。各変数は日本語表記。</div>
        </div>
        {steps.map(s => (
          <div key={s.n}>
            <div className="formula-step">
              <span className="num mono">{s.n}</span>
              <span>{s.label}</span>
              <span className="ln" />
            </div>
            <div className="formula-box">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
