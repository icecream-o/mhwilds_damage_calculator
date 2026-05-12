import type { Motion, WeaponType } from '../types';

let cached: Record<string, Motion[]> | null = null;

export async function loadMotions(): Promise<Record<string, Motion[]>> {
  if (cached) return cached;
  const res = await fetch('/data/motions.json');
  if (!res.ok) throw new Error(`Failed to load motions.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getMotionsFor(type: WeaponType): Promise<Motion[]> {
  const all = await loadMotions();
  return all[type] ?? [];
}
