import type { Buff } from '../types';

let cached: Buff[] | null = null;

export async function loadBuffs(): Promise<Buff[]> {
  if (cached) return cached;
  const res = await fetch('/data/buffs.json');
  if (!res.ok) throw new Error(`Failed to load buffs.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getBuffById(id: string): Promise<Buff | undefined> {
  const all = await loadBuffs();
  return all.find(b => b.id === id);
}
