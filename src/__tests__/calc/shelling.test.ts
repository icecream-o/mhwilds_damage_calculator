import { describe, test, expect } from 'vitest';
import { shellDamage } from '../../calc/shelling';

describe('shellDamage', () => {
  test('normal Lv1 = 12', () => {
    expect(shellDamage('normal', 1, 1.0)).toBe(12);
  });

  test('normal Lv6 = 32', () => {
    expect(shellDamage('normal', 6, 1.0)).toBe(32);
  });

  test('spread Lv3 = 22', () => {
    expect(shellDamage('spread', 3, 1.0)).toBe(22);
  });

  test('long Lv5 = 29', () => {
    expect(shellDamage('long', 5, 1.0)).toBe(29);
  });

  test('artillery multiplier scales linearly', () => {
    // normal Lv1 = 12, artillery ×1.30 → 15.6
    expect(shellDamage('normal', 1, 1.30)).toBeCloseTo(15.6);
  });

  test('unknown level returns 0', () => {
    expect(shellDamage('normal', 99, 1.0)).toBe(0);
  });
});
