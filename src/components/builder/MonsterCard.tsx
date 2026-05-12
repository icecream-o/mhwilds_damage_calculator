import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { Toggle } from '../shared/Toggle';
import { loadMonsters } from '../../data/monsters';
import { useTargetStore } from '../../store/targetStore';
import type { Monster } from '../../types';

export function MonsterCard() {
  const { monsterId, partId, enraged, wounded, setMonster, setPart, setEnraged, setWounded } = useTargetStore();
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => {
    loadMonsters().then((m) => {
      setMonsters(m);
      if (!monsterId && m.length > 0) {
        setMonster(m[0].id);
        if (m[0].parts.length > 0) setPart(m[0].parts[0].id);
      }
    });
  }, [monsterId, setMonster, setPart]);

  const monster = monsters.find(m => m.id === monsterId);

  return (
    <Card>
      <CardHead icon="◈" title="対象モンスター / TARGET" num="04" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field
          value={monsterId ?? ''}
          options={monsters.map(m => ({ value: m.id, label: m.name }))}
          onChange={(id) => { setMonster(id); const m = monsters.find(x => x.id === id); if (m?.parts[0]) setPart(m.parts[0].id); }}
        />
        <Field
          value={partId ?? ''}
          options={(monster?.parts ?? []).map(p => ({
            value: p.id,
            label: `${p.name}（物理${p.physical} / ${Object.entries(p.element).map(([k,v])=>`${k}${v}`).join(' ')}）`
          }))}
          onChange={setPart}
        />
      </div>
      <div className="toggle-grid" style={{ marginTop: 10 }}>
        <Toggle label="怒り状態" on={enraged} onChange={setEnraged} />
        <Toggle label="傷口" on={wounded} onChange={setWounded} />
      </div>
    </Card>
  );
}
