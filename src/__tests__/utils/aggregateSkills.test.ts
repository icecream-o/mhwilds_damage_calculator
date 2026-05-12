import { aggregateSkills } from '../../utils/aggregateSkills';
import type { ArmorPiece, Decoration } from '../../types';

const decos: Decoration[] = [
  { id: 'a1', name: '攻撃珠', slotSize: 1, skillId: 'attack', level: 1 },
];

const armor: ArmorPiece = {
  id: 'x', name: 'X', part: 'head',
  skills: [{ skillId: 'attack', level: 2 }],
  slots: [1],
};

test('sums armor skill + decoration skill', () => {
  const agg = aggregateSkills(
    { head: { piece: armor, decorations: ['a1'] } },
    { type: 'custom', skills: [], decorations: [] },
    decos,
  );
  expect(agg.find(s => s.skillId === 'attack')?.level).toBe(3);
});
