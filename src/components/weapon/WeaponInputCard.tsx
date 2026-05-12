import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { WeaponSpecificFields } from './WeaponSpecificFields';
import { useWeaponStore } from '../../store/weaponStore';
import type { WeaponType, SharpnessColor, ElementType } from '../../types';

const WEAPON_TYPES: { value: WeaponType; label: string }[] = [
  { value: 'greatsword',       label: '大剣' },
  { value: 'sword-and-shield', label: '片手剣' },
  { value: 'dual-blades',      label: '双剣' },
  { value: 'longsword',        label: '太刀' },
  { value: 'hammer',           label: 'ハンマー' },
  { value: 'hunting-horn',     label: '狩猟笛' },
  { value: 'lance',            label: 'ランス' },
  { value: 'gunlance',         label: 'ガンランス' },
  { value: 'switch-axe',       label: 'スラッシュアックス' },
  { value: 'charge-blade',     label: 'チャージアックス' },
  { value: 'insect-glaive',    label: '操虫棍' },
  { value: 'light-bowgun',     label: 'ライトボウガン' },
  { value: 'heavy-bowgun',     label: 'ヘビィボウガン' },
  { value: 'bow',              label: '弓' },
];

const SHARPNESS_COLORS: { value: SharpnessColor; label: string }[] = [
  { value: 'red',    label: '赤' },
  { value: 'orange', label: '橙' },
  { value: 'yellow', label: '黄' },
  { value: 'green',  label: '緑' },
  { value: 'blue',   label: '青' },
  { value: 'white',  label: '白' },
  { value: 'purple', label: '紫' },
];

const ELEMENTS: { value: ElementType | 'none'; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: '火',   label: '火' },
  { value: '水',   label: '水' },
  { value: '雷',   label: '雷' },
  { value: '氷',   label: '氷' },
  { value: '龍',   label: '龍' },
];

export function WeaponInputCard() {
  const weapon = useWeaponStore(s => s.weapon);
  const setWeaponType = useWeaponStore(s => s.setWeaponType);
  const setAttack = useWeaponStore(s => s.setAttack);
  const setAffinity = useWeaponStore(s => s.setAffinity);
  const setElement = useWeaponStore(s => s.setElement);
  const setSharpness = useWeaponStore(s => s.setSharpness);

  return (
    <Card>
      <CardHead icon="⚔" title="武器パラメータ / WEAPON" num="01" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          value={weapon.type}
          options={WEAPON_TYPES.map(w => ({ value: w.value, label: w.label }))}
          onChange={(v) => setWeaponType(v as WeaponType)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            攻撃力
            <input
              type="number"
              className="field"
              value={weapon.attack}
              onChange={(e) => setAttack(Number(e.target.value))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            会心率 (%)
            <input
              type="number"
              className="field"
              value={weapon.affinity}
              onChange={(e) => setAffinity(Number(e.target.value))}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            属性
            <Field
              value={weapon.element?.type ?? 'none'}
              options={ELEMENTS.map(e => ({ value: e.value, label: e.label }))}
              onChange={(v) => {
                if (v === 'none') setElement(null);
                else setElement({ type: v as ElementType, value: weapon.element?.value ?? 0 });
              }}
              small
            />
          </label>
          <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
            属性値
            <input
              type="number"
              className="field"
              disabled={!weapon.element}
              value={weapon.element?.value ?? 0}
              onChange={(e) => {
                if (weapon.element) setElement({ ...weapon.element, value: Number(e.target.value) });
              }}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <label style={{ fontSize: 11, color: 'var(--text-3)' }}>
          斬れ味
          <Field
            value={weapon.sharpness}
            options={SHARPNESS_COLORS.map(s => ({ value: s.value, label: s.label }))}
            onChange={(v) => setSharpness(v as SharpnessColor)}
            small
          />
        </label>
        <WeaponSpecificFields type={weapon.type} />
      </div>
    </Card>
  );
}
