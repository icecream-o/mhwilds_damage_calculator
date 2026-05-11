export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Theme verification</h1>
      <div className="flex gap-4">
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', padding: 16, borderRadius: 14, color: 'var(--text-1)' }}>
          Card with theme variables
          <div className="mono mt-2" style={{ color: 'var(--accent)' }}>224.7 DPS</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {(['ember', 'aurora', 'forest', 'solar'] as const).map(t => (
          <button key={t} onClick={() => document.documentElement.setAttribute('data-theme', t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
