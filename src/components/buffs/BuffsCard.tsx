import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Toggle } from '../shared/Toggle';
import { loadBuffs } from '../../data/buffs';
import { useBuffStore } from '../../store/buffStore';
import type { Buff, BuffCategory } from '../../types';

const CATEGORY_LABELS: Record<BuffCategory, string> = {
  'item':        'アイテム',
  'cat-food':    'ネコ飯',
  'horn':        '笛バフ',
  'environment': '環境',
};

export function BuffsCard() {
  const selected = useBuffStore(s => s.selected);
  const toggle = useBuffStore(s => s.toggle);
  const [buffs, setBuffs] = useState<Buff[]>([]);

  useEffect(() => { loadBuffs().then(setBuffs); }, []);

  const byCategory = buffs.reduce<Record<string, Buff[]>>((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});

  return (
    <Card>
      <CardHead icon="✺" title="バフ / BUFFS" num="04" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(Object.keys(byCategory) as BuffCategory[]).map(cat => (
          <div key={cat}>
            <div style={{
              fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>{CATEGORY_LABELS[cat]}</div>
            <div className="toggle-grid">
              {byCategory[cat].map(b => (
                <Toggle
                  key={b.id}
                  label={b.name}
                  on={selected.includes(b.id)}
                  onChange={() => toggle(b.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
