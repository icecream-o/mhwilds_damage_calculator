import type { Skill } from '../types';

let cached: Skill[] | null = null;

export async function loadSkills(): Promise<Skill[]> {
  if (cached) return cached;
  const res = await fetch('/data/skills.json');
  if (!res.ok) throw new Error(`Failed to load skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getSkillById(id: string): Promise<Skill | undefined> {
  const all = await loadSkills();
  return all.find(s => s.id === id);
}
