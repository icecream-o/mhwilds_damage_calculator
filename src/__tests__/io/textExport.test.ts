import { buildTextSummary } from '../../io/textExport';
import type { AppSnapshot } from '../../io/snapshot';
import type { DamageResult } from '../../types';

const snap: AppSnapshot = {
  version: 1,
  weapon: {
    type: 'longsword', attack: 330, affinity: 20,
    element: { type: '水', value: 24 }, sharpness: 'purple',
  },
  skills: [
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
  ],
  buffs: [],
  patterns: [
    { name: '居合', ratio: 1.0, motions: [{ motionName: '居合抜刀', motionValue: 70, frames: 40, isDraw: true }] },
  ],
  target: {
    monsterId: 'g', variantId: 'normal', partId: 'head',
    enraged: false, wounded: false, defenseRateOverride: null,
  },
};

const result: DamageResult = {
  expectedDPS: 123.4,
  physicalAvg: 98.5,
  elementAvg: 24.9,
  effectiveAffinity: 0.80,
  critCoefficient: 1.24,
  defenseRate: 1.0,
  patterns: [{ name: '居合', damage: 500, frames: 40, ratio: 1.0 }],
};

test('includes weapon type and attack', () => {
  const text = buildTextSummary(snap, null);
  expect(text).toContain('longsword');
  expect(text).toContain('330');
});

test('includes element info', () => {
  const text = buildTextSummary(snap, null);
  expect(text).toContain('水');
  expect(text).toContain('24');
});

test('includes sharpness', () => {
  const text = buildTextSummary(snap, null);
  expect(text).toContain('purple');
});

test('includes skill names and levels', () => {
  const text = buildTextSummary(snap, null);
  expect(text).toContain('attack');
  expect(text).toContain('Lv5');
});

test('includes DPS when result provided', () => {
  const text = buildTextSummary(snap, result);
  expect(text).toContain('123.4');
});

test('includes effective affinity as percent', () => {
  const text = buildTextSummary(snap, result);
  expect(text).toContain('80%');
});

test('includes pattern breakdown', () => {
  const text = buildTextSummary(snap, result);
  expect(text).toContain('居合');
  expect(text).toContain('500');
});

test('handles null result gracefully', () => {
  const text = buildTextSummary(snap, null);
  expect(text).toContain('longsword');
  expect(text).not.toContain('DPS');
});
