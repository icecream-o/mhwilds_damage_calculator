interface Props { label: string; on: boolean; onChange: (b: boolean) => void; }

export function Toggle({ label, on, onChange }: Props) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <div className="ck" />
      <span>{label}</span>
    </div>
  );
}
