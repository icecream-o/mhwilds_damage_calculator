import type { SkillMaster } from '../types';

let cached: SkillMaster[] | null = null;

export async function loadGroupSkills(): Promise<SkillMaster[]> {
  if (cached) return cached;
  const res = await fetch('/data/group_skills.json');
  if (!res.ok) throw new Error(`Failed to load group_skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}
