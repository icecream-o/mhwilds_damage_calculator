import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { Toggle } from '../shared/Toggle';
import { loadMonsters } from '../../data/monsters';
import { useTargetStore } from '../../store/targetStore';
import type { Monster } from '../../types';

export function MonsterCard() {
  const monsterId = useTargetStore(s => s.monsterId);
  const variantId = useTargetStore(s => s.variantId);
  const partId = useTargetStore(s => s.partId);
  const enraged = useTargetStore(s => s.enraged);
  const wounded = useTargetStore(s => s.wounded);
  const defenseRateOverride = useTargetStore(s => s.defenseRateOverride);
  const setMonster = useTargetStore(s => s.setMonster);
  const setVariant = useTargetStore(s => s.setVariant);
  const setPart = useTargetStore(s => s.setPart);
  const setEnraged = useTargetStore(s => s.setEnraged);
  const setWounded = useTargetStore(s => s.setWounded);
  const setDefenseRateOverride = useTargetStore(s => s.setDefenseRateOverride);

  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => {
    loadMonsters().then((m) => {
      setMonsters(m);
      if (!monsterId && m.length > 0) {
        setMonster(m[0].id);
        if (m[0].variants[0]) setVariant(m[0].variants[0].id);
        if (m[0].parts[0])    setPart(m[0].parts[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monster = monsters.find(m => m.id === monsterId);
  const variant = monster?.variants.find(v => v.id === variantId);
  const calculatedRate = (monster?.baseDefenseRate ?? 1.0) * (variant?.defenseRateMod ?? 1.0);

  return (
    <Card>
      <CardHead icon="◈" title="対象モンスター / TARGET" num="03" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field
          value={monsterId ?? ''}
          options={monsters.map(m => ({ value: m.id, label: m.name }))}
          onChange={(id) => {
            setMonster(id);
            const m = monsters.find(x => x.id === id);
            if (m?.variants[0]) setVariant(m.variants[0].id);
            if (m?.parts[0]) setPart(m.parts[0].id);
          }}
        />
        <Field
          value={variantId ?? ''}
          options={(monster?.variants ?? []).map(v => ({
            value: v.id, label: `${v.name} (×${v.defenseRateMod})`,
          }))}
          onChange={setVariant}
          small
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
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
        <span style={{ color: 'var(--text-3)' }}>全体防御率</span>
        <input
          type="number"
          step="0.05"
          className="field sm"
          value={defenseRateOverride ?? calculatedRate}
          onChange={(e) => {
            const v = Number(e.target.value);
            // 計算値と一致する場合は override をクリア
            if (Math.abs(v - calculatedRate) < 0.001) setDefenseRateOverride(null);
            else setDefenseRateOverride(v);
          }}
          style={{ width: 80, textAlign: 'right' }}
        />
      </div>
    </Card>
  );
}
