import type { Monster } from '../types';

let cached: Monster[] | null = null;

export async function loadMonsters(): Promise<Monster[]> {
  if (cached) return cached;
  const res = await fetch('/data/monsters.json');
  if (!res.ok) throw new Error(`Failed to load monsters.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getMonsterById(id: string): Promise<Monster | undefined> {
  const all = await loadMonsters();
  return all.find(m => m.id === id);
}
