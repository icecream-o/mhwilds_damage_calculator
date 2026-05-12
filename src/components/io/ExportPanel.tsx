// src/components/io/ExportPanel.tsx
import { useRef } from 'react';
import { buildSnapshot, parseSnapshot, applySnapshot } from '../../io/snapshot';
import { buildTextSummary } from '../../io/textExport';
import { exportPng } from '../../io/pngExport';
import type { DamageResult } from '../../types';

interface Props {
  result: DamageResult | null;
}

export function ExportPanel({ result }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleJsonExport = () => {
    const snap = buildSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mhwilds-build.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const snap = parseSnapshot(json);
        applySnapshot(snap);
      } catch (err) {
        alert(`インポート失敗: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    // 同じファイルを再選択できるようリセット
    e.target.value = '';
  };

  const handleTextExport = () => {
    const snap = buildSnapshot();
    const text = buildTextSummary(snap, result);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mhwilds-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePngExport = () => {
    exportPng('result-panel', 'mhwilds-result.png').catch(err => {
      alert(`PNG出力失敗: ${(err as Error).message}`);
    });
  };

  return (
    <div className="export-panel">
      <button className="btn btn-sm" onClick={handleJsonExport} title="ビルドをJSONに保存">
        ↓ JSON保存
      </button>
      <button className="btn btn-sm" onClick={() => fileRef.current?.click()} title="JSONを読み込み">
        ↑ JSON読込
      </button>
      <button className="btn btn-sm" onClick={handleTextExport} title="結果をテキスト出力" disabled={!result}>
        ↓ テキスト
      </button>
      <button className="btn btn-sm" onClick={handlePngExport} title="結果をPNG画像出力" disabled={!result}>
        ↓ PNG
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleJsonImport}
      />
    </div>
  );
}
