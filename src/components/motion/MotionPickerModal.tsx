// src/components/motion/MotionPickerModal.tsx
import { useState, useEffect } from 'react';
import type { Motion, MotionPattern, WeaponType } from '../../types';
import { getMotionsFor } from '../../data/motions';

interface Props {
  open: boolean;
  initialPattern?: MotionPattern;
  weaponType: WeaponType;
  onConfirm: (pattern: MotionPattern) => void;
  onClose: () => void;
}

export function MotionPickerModal({ open, initialPattern, weaponType, onConfirm, onClose }: Props) {
  const [name, setName] = useState('');
  const [ratio, setRatio] = useState(0.33);
  const [sequence, setSequence] = useState<Motion[]>([]);
  const [available, setAvailable] = useState<Motion[]>([]);

  // モーダルが開くたびに初期値をリセット
  useEffect(() => {
    if (!open) return;
    setName(initialPattern?.name ?? '');
    setRatio(initialPattern?.ratio ?? 0.33);
    setSequence(initialPattern ? [...initialPattern.motions] : []);
    getMotionsFor(weaponType).then(setAvailable);
  }, [open, weaponType, initialPattern]);

  if (!open) return null;

  const addMotion = (m: Motion) => setSequence(prev => [...prev, m]);
  const removeMotion = (idx: number) => setSequence(prev => prev.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    if (!name.trim() || sequence.length === 0) return;
    onConfirm({ name: name.trim(), ratio, motions: sequence });
    onClose();
  };

  const ratioPct = Math.round(ratio * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <span>{initialPattern ? 'パターンを編集' : 'パターンを追加'}</span>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 名前 */}
          <label className="modal-field-label">
            パターン名
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例: 居合抜刀コンボ"
              autoFocus
            />
          </label>

          {/* 比率 */}
          <div>
            <div className="modal-label">比率</div>
            <div className="ratio-row">
              <input
                type="range" min={1} max={100} value={ratioPct}
                onChange={e => setRatio(Number(e.target.value) / 100)}
              />
              <span className="ratio-pct">{ratioPct}%</span>
            </div>
          </div>

          {/* 利用可能なモーション */}
          <div>
            <div className="modal-label">利用可能モーション（クリックで追加）</div>
            <div className="motion-available">
              {available.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>読み込み中...</span>
              )}
              {available.map(m => (
                <button
                  key={m.motionName}
                  className="motion-available-item"
                  onClick={() => addMotion(m)}
                  title={`MV${m.motionValue} / ${m.frames}F`}
                >
                  {m.motionName}
                </button>
              ))}
            </div>
          </div>

          {/* シーケンス */}
          <div>
            <div className="modal-label">シーケンス（チップをクリックで削除）</div>
            <div className="motion-seq-list">
              {sequence.length === 0 && (
                <span className="motion-seq-empty">上からモーションを選んでください</span>
              )}
              {sequence.map((m, i) => (
                <button
                  key={i}
                  className="motion-seq-chip"
                  onClick={() => removeMotion(i)}
                  title="クリックで削除"
                >
                  {m.motionName} <span style={{ opacity: 0.6, fontSize: 9 }}>✕</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!name.trim() || sequence.length === 0}
          >
            {initialPattern ? '更新する' : '追加する'}
          </button>
        </div>

      </div>
    </div>
  );
}
