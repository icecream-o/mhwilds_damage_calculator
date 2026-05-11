export function clampAffinity(affinityPct: number): number {
  if (affinityPct > 100) return 100;
  if (affinityPct < -100) return -100;
  return affinityPct;
}

export function critCoefficient(affinityPct: number, critMult: number): number {
  const a = clampAffinity(affinityPct) / 100;
  return 1 + a * (critMult - 1);
}
