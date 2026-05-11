import { meleeSharpnessMult, elementSharpnessMult } from '../../calc/sharpness';

describe('meleeSharpnessMult', () => {
  test.each([
    ['red', 0.50], ['orange', 0.75], ['yellow', 1.00], ['green', 1.05],
    ['blue', 1.20], ['white', 1.32], ['purple', 1.39],
  ] as const)('%s => %s', (color, expected) => {
    expect(meleeSharpnessMult(color)).toBe(expected);
  });
});

describe('elementSharpnessMult', () => {
  test('purple is around 1.2625', () => {
    expect(elementSharpnessMult('purple')).toBeCloseTo(1.2625, 4);
  });
  test('green is 1.0 (baseline)', () => {
    expect(elementSharpnessMult('green')).toBe(1.0);
  });
});
