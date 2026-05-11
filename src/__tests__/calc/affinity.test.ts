import { critCoefficient, clampAffinity } from '../../calc/affinity';

describe('clampAffinity', () => {
  test('clamps to [-100, 100]', () => {
    expect(clampAffinity(150)).toBe(100);
    expect(clampAffinity(-150)).toBe(-100);
    expect(clampAffinity(42)).toBe(42);
  });
});

describe('critCoefficient', () => {
  test('zero affinity => 1.0', () => {
    expect(critCoefficient(0, 1.25)).toBeCloseTo(1.0);
  });
  test('100% affinity, normal crit (1.25) => 1.25', () => {
    expect(critCoefficient(100, 1.25)).toBeCloseTo(1.25);
  });
  test('100% affinity, super crit (1.40) => 1.40', () => {
    expect(critCoefficient(100, 1.40)).toBeCloseTo(1.40);
  });
  test('50% affinity, super crit (1.40) => 1.20', () => {
    expect(critCoefficient(50, 1.40)).toBeCloseTo(1.20);
  });
  test('negative affinity uses 0.75 multiplier semantics in caller; here passes through', () => {
    expect(critCoefficient(-50, 0.75)).toBeCloseTo(1.125);
  });
});
