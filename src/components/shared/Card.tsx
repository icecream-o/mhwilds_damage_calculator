import type { ReactNode } from 'react';

export function Card({ children, tight = false, className = '' }: { children: ReactNode; tight?: boolean; className?: string }) {
  return <div className={`card ${tight ? 'card-tight' : ''} ${className}`}>{children}</div>;
}
