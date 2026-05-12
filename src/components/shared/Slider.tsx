interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function Slider({ value, min = 0, max = 100, onChange }: Props) {
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
    />
  );
}
