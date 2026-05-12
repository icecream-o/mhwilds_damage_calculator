import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { StatTile } from '../shared/StatTile';
import { loadWeapons } from '../../data/weapons';
import { useBuildStore } from '../../store/buildStore';
import { meleeSharpnessMult } from '../../calc/sharpness';
import type { Weapon } from '../../types';

export function WeaponCard() {
  const weapon = useBuildStore(s => s.weapon);
  const setWeapon = useBuildStore(s => s.setWeapon);
  const [list, setList] = useState<Weapon[]>([]);

  useEffect(() => {
    loadWeapons().then((all) => {
      setList(all);
      if (!weapon && all.length > 0) setWeapon(all[0]);
    });
  }, [weapon, setWeapon]);

  if (!weapon) return <Card><CardHead icon="⚔" title="武器 / WEAPON" num="01" />Loading...</Card>;

  const sharpMult = meleeSharpnessMult(weapon.sharpness.current);
  const sharpColor = weapon.sharpness.current;
  const sharpLabel = ({red:'赤',orange:'橙',yellow:'黄',green:'緑',blue:'青',white:'白',purple:'紫'} as const)[sharpColor];

  return (
    <Card>
      <CardHead icon="⚔" title="武器 / WEAPON" num="01" />
      <div style={{ marginBottom: 10 }}>
        <Field
          value={weapon.id}
          options={list.map(w => ({ value: w.id, label: w.name }))}
          onChange={(id) => { const w = list.find(x => x.id === id); if (w) setWeapon(w); }}
        />
      </div>
      <div className="stat-grid">
        <StatTile label="攻撃力" value={weapon.attack} />
        <StatTile label="会心" value={`${weapon.affinity >= 0 ? '+' : ''}${weapon.affinity}%`} valueClass={weapon.affinity >= 0 ? 'num-good' : 'num-crit'} />
        <StatTile label={weapon.element ? `${weapon.element.type}属性` : '属性'} value={weapon.element?.value ?? '—'} valueClass="num-elem" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 11 }}>
        <span style={{ color: 'var(--text-3)' }}>斬れ味</span>
        <span className="mono" style={{ color: 'var(--purple)', fontWeight: 600 }}>{sharpLabel} ×{sharpMult.toFixed(2)}</span>
      </div>
      <div className="sharp">
        {weapon.sharpness.values.map((s, i) => <span key={i} className={`sharp-${s.color}`} style={{ flex: s.value / 50 }} />)}
      </div>
    </Card>
  );
}
