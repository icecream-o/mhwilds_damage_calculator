import type { ArmorPiece, Talisman, Decoration, ActiveSkill } from '../types';

type ArmorMap = Partial<Record<ArmorPiece['part'], { piece: ArmorPiece; decorations: (string | null)[] }>>;

export function aggregateSkills(armor: ArmorMap, talisman: Talisman, decos: Decoration[]): ActiveSkill[] {
  const totals = new Map<string, number>();
  const add = (id: string, lv: number) => totals.set(id, (totals.get(id) ?? 0) + lv);

  for (const entry of Object.values(armor)) {
    if (!entry) continue;
    for (const s of entry.piece.skills) add(s.skillId, s.level);
    for (const id of entry.decorations) {
      if (!id) continue;
      const d = decos.find(x => x.id === id);
      if (d) add(d.skillId, d.level);
    }
  }

  if (talisman.type === 'custom' && talisman.skills) {
    for (const s of talisman.skills) add(s.skillId, s.level);
  }
  for (const id of talisman.decorations) {
    if (!id) continue;
    const d = decos.find(x => x.id === id);
    if (d) add(d.skillId, d.level);
  }

  return Array.from(totals.entries()).map(([skillId, level]) => ({ skillId, level }));
}
