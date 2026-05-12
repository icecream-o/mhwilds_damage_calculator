import type { Weapon } from '../types';

let cached: Weapon[] | null = null;

export async function loadWeapons(): Promise<Weapon[]> {
  if (cached) return cached;
  const res = await fetch('/data/weapons.json');
  if (!res.ok) throw new Error(`Failed to load weapons.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getWeaponById(id: string): Promise<Weapon | undefined> {
  const all = await loadWeapons();
  return all.find(w => w.id === id);
}
