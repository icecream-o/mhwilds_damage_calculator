import { describe, test, expect } from 'vitest';
import { resolveWeaponState } from '../../calc/weapon_state';
import type { WeaponInput } from '../../types';

const baseBow: WeaponInput = {
  type: 'bow', attack: 200, affinity: 0, element: null, sharpness: 'purple',
};

describe('resolveWeaponState', () => {
  test('returns 1.0 multipliers by default (no bins)', () => {
    const r = resolveWeaponState(baseBow, [], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
    expect(r.elementMultiplier).toBe(1);
  });

  test('bow 強撃ビン: 1.30× physical on binshot-power motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['強撃'] };
    const r = resolveWeaponState(w, ['binshot-power'], 'arrow');
    expect(r.physicalMultiplier).toBeCloseTo(1.30);
  });

  test('bow 強撃ビン: no bonus without binshot-power tag', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['強撃'] };
    const r = resolveWeaponState(w, [], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('bow 接撃ビン: 1.40× physical on binshot-close motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['接撃'] };
    const r = resolveWeaponState(w, ['binshot-close'], 'arrow');
    expect(r.physicalMultiplier).toBeCloseTo(1.40);
  });

  test('bow 属強ビン: 1.20× element on binshot-element motion', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['属強'] };
    const r = resolveWeaponState(w, ['binshot-element'], 'arrow');
    expect(r.elementMultiplier).toBeCloseTo(1.20);
    expect(r.physicalMultiplier).toBe(1);
  });

  test('bow bin not loaded: no bonus even if motion has tag', () => {
    const w: WeaponInput = { ...baseBow, bowBins: ['麻痺'] };
    const r = resolveWeaponState(w, ['binshot-power'], 'arrow');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('SA power bin: 1.15× physical on phial-active motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'power',
    };
    const r = resolveWeaponState(w, ['phial-active'], 'physical');
    expect(r.physicalMultiplier).toBeCloseTo(1.15);
    expect(r.elementMultiplier).toBe(1);
  });

  test('SA element bin: 1.45× element on phial-active motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'element',
    };
    const r = resolveWeaponState(w, ['phial-active'], 'physical');
    expect(r.elementMultiplier).toBeCloseTo(1.45);
    expect(r.physicalMultiplier).toBe(1);
  });

  test('SA bin: no bonus on non-phial motion', () => {
    const w: WeaponInput = {
      type: 'switch-axe', attack: 240, affinity: 0,
      element: null, sharpness: 'white', switchAxeBin: 'power',
    };
    const r = resolveWeaponState(w, [], 'physical');
    expect(r.physicalMultiplier).toBe(1);
  });

  test('CB impact bin: 1.35× physical on discharge motion', () => {
    const w: WeaponInput = {
      type: 'charge-blade', attack: 250, affinity: 0,
      element: null, sharpness: 'white', chargeBladeBin: 'impact',
    };
    const r = resolveWeaponState(w, ['discharge'], 'physical');
    expect(r.physicalMultiplier).toBeCloseTo(1.35);
  });

  test('CB element bin: 1.25× element on discharge motion', () => {
    const w: WeaponInput = {
      type: 'charge-blade', attack: 250, affinity: 0,
      element: null, sharpness: 'white', chargeBladeBin: 'element',
    };
    const r = resolveWeaponState(w, ['discharge'], 'physical');
    expect(r.elementMultiplier).toBeCloseTo(1.25);
  });

  test('non-bin weapon type: always 1.0×', () => {
    const w: WeaponInput = {
      type: 'longsword', attack: 330, affinity: 0, element: null, sharpness: 'purple',
    };
    const r = resolveWeaponState(w, ['draw', 'finisher'], 'physical');
    expect(r.physicalMultiplier).toBe(1);
    expect(r.elementMultiplier).toBe(1);
  });
});
