import type { ArmorPiece } from '../types';

let cached: ArmorPiece[] | null = null;

export async function loadArmor(): Promise<ArmorPiece[]> {
  if (cached) return cached;
  const res = await fetch('/data/armor.json');
  if (!res.ok) throw new Error(`Failed to load armor.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getArmorById(id: string): Promise<ArmorPiece | undefined> {
  const all = await loadArmor();
  return all.find(a => a.id === id);
}
