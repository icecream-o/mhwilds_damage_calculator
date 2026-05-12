// src/components/motion/PatternList.tsx
import { useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { PatternCard } from './PatternCard';
import { MotionPickerModal } from './MotionPickerModal';
import { ExportPanel } from '../io/ExportPanel';
import { useMotionStore } from '../../store/motionStore';
import { useWeaponStore } from '../../store/weaponStore';
import type { DamageResult, MotionPattern } from '../../types';

interface Props { result: DamageResult | null; }

export function PatternList({ result }: Props) {
  const patterns      = useMotionStore(s => s.patterns);
  const addPattern    = useMotionStore(s => s.addPattern);
  const updatePattern = useMotionStore(s => s.updatePattern);
  const duplicatePattern = useMotionStore(s => s.duplicatePattern);
  const removePattern = useMotionStore(s => s.removePattern);
  const setRatio      = useMotionStore(s => s.setRatio);
  const weaponType    = useWeaponStore(s => s.weapon.type);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editIndex, setEditIndex]   = useState<number | null>(null);

  const total = patterns.reduce((s, p) => s + p.ratio, 0);
  const sumPct = Math.round(total * 100);
  const sumGood = sumPct === 100;

  const handleAdd = () => {
    setEditIndex(null);
    setModalOpen(true);
  };

  const handleEdit = (i: number) => {
    setEditIndex(i);
    setModalOpen(true);
  };

  const handleConfirm = (p: MotionPattern) => {
    if (editIndex !== null) {
      updatePattern(editIndex, p);
    } else {
      addPattern(p);
    }
  };

  return (
    <Card>
      <CardHead
        icon="▶"
        title="立ち回りパターン / ROTATION"
        num="MAIN"
        meta={
          <span
            className="mono"
            style={{
              fontSize: 11.5,
              color: sumGood ? 'var(--good)' : 'var(--accent)',
              fontWeight: 600,
            }}
          >
            {sumGood ? '✓' : '⚠'} 合計 {sumPct}%
          </span>
        }
      />

      {patterns.map((p, i) => (
        <PatternCard
          key={i}
          pattern={p}
          result={result?.patterns[i]}
          onRatioChange={(v) => setRatio(i, v)}
          onEdit={() => handleEdit(i)}
          onDuplicate={() => duplicatePattern(i)}
          onDelete={() => removePattern(i)}
        />
      ))}

      <button
        className="btn"
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        onClick={handleAdd}
      >
        ＋ パターンを追加
      </button>

      <ExportPanel result={result} />

      <MotionPickerModal
        open={modalOpen}
        initialPattern={editIndex !== null ? patterns[editIndex] : undefined}
        weaponType={weaponType}
        onConfirm={handleConfirm}
        onClose={() => setModalOpen(false)}
      />
    </Card>
  );
}
