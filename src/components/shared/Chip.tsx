interface Props { name: string; lv: number; kind?: 'draw' | 'default'; }

export function Chip({ name, lv, kind = 'default' }: Props) {
  return (
    <span className={`chip ${kind === 'draw' ? 'draw' : ''}`}>
      <span>{name}</span>
      <span className="lv">Lv{lv}</span>
    </span>
  );
}
