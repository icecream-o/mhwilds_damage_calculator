import type { SharpnessColor } from '../types';

const MELEE_MULTIPLIERS: Record<SharpnessColor, number> = {
  red: 0.50, orange: 0.75, yellow: 1.00, green: 1.05,
  blue: 1.20, white: 1.32, purple: 1.39,
};

const ELEMENT_MULTIPLIERS: Record<SharpnessColor, number> = {
  red: 0.25, orange: 0.50, yellow: 0.75, green: 1.00,
  blue: 1.0625, white: 1.15, purple: 1.2625,
};

export function meleeSharpnessMult(color: SharpnessColor): number {
  return MELEE_MULTIPLIERS[color];
}

export function elementSharpnessMult(color: SharpnessColor): number {
  return ELEMENT_MULTIPLIERS[color];
}
