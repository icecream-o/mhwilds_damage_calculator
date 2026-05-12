import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { loadArmor } from '../../data/armor';
import { loadDecorations } from '../../data/decorations';
import { loadSkills } from '../../data/skills';
import { useBuildStore } from '../../store/buildStore';
import type { ArmorPiece, Decoration, Skill } from '../../types';

const PARTS: ArmorPiece['part'][] = ['head','chest','arms','waist','legs'];
const PART_LABEL: Record<ArmorPiece['part'], string> = { head:'頭', chest:'胴', arms:'腕', waist:'腰', legs:'脚' };

export function ArmorCard() {
  const armor = useBuildStore(s => s.armor);
  const setArmor = useBuildStore(s => s.setArmor);
  const setArmorDeco = useBuildStore(s => s.setArmorDeco);
  const [allArmor, setAllArmor] = useState<ArmorPiece[]>([]);
  const [allDecos, setAllDecos] = useState<Decoration[]>([]);
  const [, setAllSkills] = useState<Skill[]>([]);

  useEffect(() => {
    Promise.all([loadArmor(), loadDecorations(), loadSkills()]).then(([a, d, s]) => {
      setAllArmor(a); setAllDecos(d); setAllSkills(s);
    });
  }, []);

  const optsFor = (part: ArmorPiece['part']) => allArmor.filter(a => a.part === part);
  const decoOptsFor = (slotSize: number) => allDecos.filter(d => d.slotSize <= slotSize);

  return (
    <Card>
      <CardHead icon="🛡" title="防具 / ARMOR" num="02" />
      {PARTS.map(part => {
        const cur = armor[part];
        return (
          <div className="eq-row" key={part}>
            <div className="eq-slot">{PART_LABEL[part]}</div>
            <div>
              <Field
                value={cur?.piece.id ?? ''}
                options={[{ value: '', label: '—' }, ...optsFor(part).map(a => ({ value: a.id, label: a.name }))]}
                onChange={(id) => { const p = optsFor(part).find(x => x.id === id) ?? null; setArmor(part, p); }}
                small
              />
              {cur && (
                <div className="eq-slots">
                  {cur.piece.slots.map((slotSize, i) => {
                    return (
                      <select
                        key={i}
                        className={`field sm eq-slot-pill ${cur.decorations[i] ? '' : 'empty'}`}
                        value={cur.decorations[i] ?? ''}
                        onChange={(e) => setArmorDeco(part, i, e.target.value || null)}
                      >
                        <option value="">— 空き Lv{slotSize}</option>
                        {decoOptsFor(slotSize).map(d =>
                          <option key={d.id} value={d.id}>{d.name} L{d.level}</option>
                        )}
                      </select>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
