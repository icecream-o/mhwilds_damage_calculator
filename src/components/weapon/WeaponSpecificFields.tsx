import type { WeaponType, GunlanceShellType, BowBinType, ChargeBladeBin, SwitchAxeBin } from '../../types';
import { Field } from '../shared/Field';
import { useWeaponStore } from '../../store/weaponStore';

const BOW_BINS: BowBinType[] = ['強撃', '接撃', '属強', '麻痺', '睡眠', '減気'];

export function WeaponSpecificFields({ type }: { type: WeaponType }) {
  const weapon = useWeaponStore(s => s.weapon);
  const setGunlanceShell = useWeaponStore(s => s.setGunlanceShell);
  const setBowBins = useWeaponStore(s => s.setBowBins);
  const setChargeBladeBin = useWeaponStore(s => s.setChargeBladeBin);
  const setSwitchAxeBin = useWeaponStore(s => s.setSwitchAxeBin);

  if (type === 'gunlance') {
    const shell = weapon.gunlanceShell ?? { type: 'normal' as GunlanceShellType, level: 1 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>砲撃</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Field
            value={shell.type}
            options={[
              { value: 'normal', label: '通常' },
              { value: 'spread', label: '拡散' },
              { value: 'long',   label: '放射' },
            ]}
            onChange={(v) => setGunlanceShell({ ...shell, type: v as GunlanceShellType })}
            small
          />
          <Field
            value={String(shell.level)}
            options={[1,2,3,4,5,6].map(n => ({ value: String(n), label: `Lv${n}` }))}
            onChange={(v) => setGunlanceShell({ ...shell, level: Number(v) })}
            small
          />
        </div>
      </div>
    );
  }

  if (type === 'bow') {
    const bins = weapon.bowBins ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>装填可能ビン</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BOW_BINS.map(bin => (
            <label key={bin} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <input
                type="checkbox"
                checked={bins.includes(bin)}
                onChange={(e) => {
                  if (e.target.checked) setBowBins([...bins, bin]);
                  else setBowBins(bins.filter(b => b !== bin));
                }}
              />
              {bin}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'charge-blade') {
    const bin = weapon.chargeBladeBin ?? 'impact';
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>ビン</div>
        <Field
          value={bin}
          options={[
            { value: 'impact',  label: '榴弾ビン' },
            { value: 'element', label: '強属性ビン' },
          ]}
          onChange={(v) => setChargeBladeBin(v as ChargeBladeBin)}
          small
        />
      </div>
    );
  }

  if (type === 'switch-axe') {
    const bin = weapon.switchAxeBin ?? 'power';
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>ビン</div>
        <Field
          value={bin}
          options={[
            { value: 'power',     label: '強撃ビン' },
            { value: 'element',   label: '強属性ビン' },
            { value: 'paralysis', label: '麻痺ビン' },
            { value: 'dragon',    label: '滅龍ビン' },
            { value: 'exhaust',   label: '減気ビン' },
          ]}
          onChange={(v) => setSwitchAxeBin(v as SwitchAxeBin)}
          small
        />
      </div>
    );
  }

  // 他武器種は追加プロパティなし
  return null;
}
