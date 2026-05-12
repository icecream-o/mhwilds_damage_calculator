import type { ChangeEvent } from 'react';

interface Option { value: string; label: string; }
interface Props {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  small?: boolean;
}

export function Field({ value, options, onChange, small }: Props) {
  return (
    <select
      className={`field ${small ? 'sm' : ''}`}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
