import type { ReactNode } from 'react';

interface Props { label: string; value: ReactNode; valueClass?: string; }

export function StatTile({ label, value, valueClass = '' }: Props) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={`value mono ${valueClass}`}>{value}</div>
    </div>
  );
}
