import { parseSnapshot, applySnapshot, buildSnapshot } from '../../io/snapshot';
import type { AppSnapshot } from '../../io/snapshot';
import { useWeaponStore } from '../../store/weaponStore';
import { useSkillStore } from '../../store/skillStore';
import { useBuffStore } from '../../store/buffStore';
import { useMotionStore } from '../../store/motionStore';
import { useTargetStore } from '../../store/targetStore';

const validSnap: AppSnapshot = {
  version: 1,
  weapon: {
    type: 'longsword', attack: 330, affinity: 20,
    element: { type: '水', value: 24 }, sharpness: 'purple',
  },
  skills: [{ skillId: 'attack', level: 5 }],
  buffs: ['item-dango'],
  patterns: [
    { name: 'テスト', ratio: 1.0, motions: [{ motionName: '斬り', motionValue: 50, frames: 30, isDraw: false }] },
  ],
  target: {
    monsterId: 'g', variantId: 'normal', partId: 'head',
    enraged: false, wounded: false, defenseRateOverride: null,
  },
};

// ────── parseSnapshot ──────
test('parseSnapshot rejects null', () => {
  expect(() => parseSnapshot(null)).toThrow('Invalid snapshot');
});

test('parseSnapshot rejects non-object', () => {
  expect(() => parseSnapshot('hello')).toThrow('Invalid snapshot');
});

test('parseSnapshot rejects unsupported version', () => {
  expect(() => parseSnapshot({ ...validSnap, version: 2 })).toThrow('Unsupported snapshot version: 2');
});

test('parseSnapshot rejects missing weapon', () => {
  const { weapon: _w, ...rest } = validSnap;
  expect(() => parseSnapshot(rest)).toThrow('missing required fields');
});

test('parseSnapshot accepts valid v1 snapshot', () => {
  const result = parseSnapshot(validSnap);
  expect(result.version).toBe(1);
  expect(result.weapon.type).toBe('longsword');
  expect(result.skills).toHaveLength(1);
});

// ────── applySnapshot ──────
test('applySnapshot writes weapon to weaponStore', () => {
  applySnapshot(validSnap);
  expect(useWeaponStore.getState().weapon.type).toBe('longsword');
  expect(useWeaponStore.getState().weapon.attack).toBe(330);
});

test('applySnapshot writes skills to skillStore', () => {
  applySnapshot(validSnap);
  expect(useSkillStore.getState().skills).toEqual([{ skillId: 'attack', level: 5 }]);
});

test('applySnapshot writes buffs to buffStore', () => {
  applySnapshot(validSnap);
  expect(useBuffStore.getState().selected).toEqual(['item-dango']);
});

test('applySnapshot writes patterns to motionStore', () => {
  applySnapshot(validSnap);
  expect(useMotionStore.getState().patterns).toHaveLength(1);
  expect(useMotionStore.getState().patterns[0].name).toBe('テスト');
});

test('applySnapshot writes target to targetStore', () => {
  applySnapshot(validSnap);
  const t = useTargetStore.getState();
  expect(t.monsterId).toBe('g');
  expect(t.variantId).toBe('normal');
  expect(t.partId).toBe('head');
  expect(t.enraged).toBe(false);
});

// ────── buildSnapshot ──────
test('buildSnapshot round-trips via applySnapshot', () => {
  applySnapshot(validSnap);
  const snap = buildSnapshot();
  expect(snap.version).toBe(1);
  expect(snap.weapon.type).toBe('longsword');
  expect(snap.target.monsterId).toBe('g');
});
