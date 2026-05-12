import { useState } from 'react';
import type { SkillMaster } from '../../types';

interface Props {
  masters: SkillMaster[];
  excludeIds: string[];
  onSelect: (skillId: string) => void;
}

export function SkillSearch({ masters, excludeIds, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const candidates = masters
    .filter(m => !excludeIds.includes(m.id))
    .filter(m => query === '' || m.name.includes(query) || m.id.includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="field"
        placeholder="スキル追加（検索）..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%' }}
      />
      {query && candidates.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', marginTop: 4,
        }}>
          {candidates.map(m => (
            <div
              key={m.id}
              onClick={() => { onSelect(m.id); setQuery(''); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid var(--line)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              {m.description && (
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{m.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
