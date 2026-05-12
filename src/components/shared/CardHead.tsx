import type { ReactNode } from 'react';

interface Props { icon?: string; title: string; num?: string; meta?: ReactNode; }

export function CardHead({ icon, title, num, meta }: Props) {
  return (
    <div className="card-head">
      <div className="card-title">
        <span>{icon ? `${icon} ` : ''}{title}</span>
        {num && <span className="card-title-num">{num}</span>}
      </div>
      {meta && <div className="card-meta">{meta}</div>}
    </div>
  );
}
