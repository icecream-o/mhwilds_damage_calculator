import { useMotionStore } from '../../store/motionStore';
import type { MotionPattern } from '../../types';

const p1: MotionPattern = {
  name: 'A', ratio: 0.5,
  motions: [{ motionName: '斬り', motionValue: 50, frames: 30, isDraw: false }],
};
const p2: MotionPattern = { name: 'B', ratio: 0.3, motions: [] };

beforeEach(() => {
  useMotionStore.setState({ patterns: [] });
});

test('duplicatePattern appends a copy with "(コピー)" suffix', () => {
  useMotionStore.setState({ patterns: [p1] });
  useMotionStore.getState().duplicatePattern(0);
  const { patterns } = useMotionStore.getState();
  expect(patterns).toHaveLength(2);
  expect(patterns[1].name).toBe('A (コピー)');
  expect(patterns[1]).not.toBe(patterns[0]);
  expect(patterns[1].motions).toEqual(patterns[0].motions);
});

test('setPatterns replaces all patterns at once', () => {
  useMotionStore.setState({ patterns: [p1] });
  useMotionStore.getState().setPatterns([p2]);
  expect(useMotionStore.getState().patterns).toEqual([p2]);
});

test('setPatterns with empty array clears patterns', () => {
  useMotionStore.setState({ patterns: [p1, p2] });
  useMotionStore.getState().setPatterns([]);
  expect(useMotionStore.getState().patterns).toHaveLength(0);
});
