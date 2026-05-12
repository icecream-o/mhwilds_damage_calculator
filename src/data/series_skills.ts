import type { SkillMaster } from '../types';

let cached: SkillMaster[] | null = null;

export async function loadSeriesSkills(): Promise<SkillMaster[]> {
  if (cached) return cached;
  const res = await fetch('/data/series_skills.json');
  if (!res.ok) throw new Error(`Failed to load series_skills.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}
