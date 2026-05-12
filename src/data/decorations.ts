import type { Decoration } from '../types';

let cached: Decoration[] | null = null;

export async function loadDecorations(): Promise<Decoration[]> {
  if (cached) return cached;
  const res = await fetch('/data/decorations.json');
  if (!res.ok) throw new Error(`Failed to load decorations.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getDecorationById(id: string): Promise<Decoration | undefined> {
  const all = await loadDecorations();
  return all.find(d => d.id === id);
}
