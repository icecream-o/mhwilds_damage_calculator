type TabId = 'calc' | 'formula' | 'theme';

interface Props { tab: TabId; onTab: (t: TabId) => void; }

export function Header({ tab, onTab }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-text">
            <div className="title">Wilds Damage Calc</div>
            <div className="sub">期待ダメージ・立ち回りDPS算出ツール</div>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'calc' ? 'active' : ''}`} onClick={() => onTab('calc')}>
            <span style={{ opacity: 0.7 }}>◫</span> 計算機
          </button>
          <button className={`tab ${tab === 'formula' ? 'active' : ''}`} onClick={() => onTab('formula')}>
            <span style={{ opacity: 0.7 }}>ƒ</span> 計算式
          </button>
          <button className={`tab ${tab === 'theme' ? 'active' : ''}`} onClick={() => onTab('theme')}>
            <span style={{ opacity: 0.7 }}>◐</span> テーマ
          </button>
        </div>
        <div className="header-spacer" />
        <div className="header-actions">
          <button className="btn">↓ 読込</button>
          <button className="btn">⊕ 保存</button>
        </div>
      </div>
    </header>
  );
}
