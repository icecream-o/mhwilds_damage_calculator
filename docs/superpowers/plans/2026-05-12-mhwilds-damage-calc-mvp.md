# MHWilds Damage Calc — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 太刀1武器で「装備選択 → モーションパターン設定 → 期待DPS算出」までエンドツーエンドで動作する最小動作版を実装する。設計書のフェーズ1-10をカバー。

**Architecture:** React 18 + Vite + TypeScript の SPA。`calc/` 配下に純粋関数のダメージ計算エンジン、`store/` に Zustand のUI状態、`db/` に Dexie.js の永続化、`components/` にUI。テーマはOKLCH CSS変数で4種類。設計書 §4 のフォルダ構成に従う。

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS v3, Zustand, Dexie.js, Vitest, html2canvas（Plan 2で使用）, Geist/JetBrains Mono/Noto Sans JP

**Reference:** ビジュアルは `docs/references/MHWilds Damage Calc.html` と `docs/references/app.jsx` を正準とする。

---

## File Structure (Plan 1 で作成・変更するファイル)

```
mhwilds_damage_calculator/
├── package.json                # 新規
├── vite.config.ts              # 新規（PWA設定はPlan 3）
├── tsconfig.json / .app.json / .node.json  # 新規
├── tailwind.config.js          # 新規
├── postcss.config.js           # 新規
├── index.html                  # 新規
├── .gitignore                  # 新規
├── public/data/
│   ├── weapons.json            # 新規（太刀のみ：3本）
│   ├── armor.json              # 新規（5部位×3セット）
│   ├── decorations.json        # 新規（主要装飾品10種）
│   ├── skills.json             # 新規（主要スキル15種）
│   ├── motions.json            # 新規（太刀の主要モーション）
│   └── monsters.json           # 新規（ゴアマガラ1体）
├── src/
│   ├── main.tsx                # 新規
│   ├── App.tsx                 # 新規
│   ├── index.css               # 新規（CSS変数・4テーマ）
│   ├── vite-env.d.ts           # 新規
│   ├── types/index.ts          # 新規
│   ├── calc/
│   │   ├── index.ts            # 新規
│   │   ├── melee.ts            # 新規
│   │   ├── sharpness.ts        # 新規
│   │   ├── affinity.ts         # 新規
│   │   ├── skills.ts           # 新規
│   │   └── conditional.ts      # 新規
│   ├── data/
│   │   ├── weapons.ts          # 新規
│   │   ├── armor.ts            # 新規
│   │   ├── decorations.ts      # 新規
│   │   ├── skills.ts           # 新規
│   │   ├── motions.ts          # 新規
│   │   └── monsters.ts         # 新規
│   ├── db/database.ts          # 新規
│   ├── store/
│   │   ├── buildStore.ts       # 新規
│   │   ├── motionStore.ts      # 新規
│   │   ├── targetStore.ts      # 新規
│   │   └── themeStore.ts       # 新規
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── TabBar.tsx
│   │   ├── shared/
│   │   │   ├── Card.tsx
│   │   │   ├── CardHead.tsx
│   │   │   ├── Field.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Toggle.tsx
│   │   │   └── StatTile.tsx
│   │   ├── builder/
│   │   │   ├── WeaponCard.tsx
│   │   │   ├── ArmorCard.tsx
│   │   │   ├── SkillsCard.tsx
│   │   │   └── MonsterCard.tsx
│   │   ├── motion/
│   │   │   ├── PatternCard.tsx
│   │   │   └── PatternList.tsx
│   │   ├── result/
│   │   │   ├── HeroResult.tsx
│   │   │   └── BreakdownCard.tsx
│   │   ├── formula/
│   │   │   └── FormulaTab.tsx
│   │   └── theme/
│   │       └── ThemeTab.tsx
│   ├── utils/format.ts         # 新規
│   ├── test/setup.ts           # 新規
│   └── __tests__/
│       ├── calc/melee.test.ts
│       ├── calc/sharpness.test.ts
│       ├── calc/affinity.test.ts
│       ├── calc/skills.test.ts
│       └── store/themeStore.test.ts
```

---

## Task 1: プロジェクト初期化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`

- [ ] **Step 1: Initialize Vite + React + TS project**

```bash
cd C:/Users/tm-86/Claude/mhwilds_damage_calculator
npm create vite@latest . -- --template react-ts
# プロンプトで「Ignore files and continue」を選択
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install zustand dexie dexie-react-hooks
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tailwindcss@^3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 4: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 5: Configure tailwind.config.js**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Noto Sans JP', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Configure vite.config.ts**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 7: Add Vitest types to tsconfig.app.json**

Edit `tsconfig.app.json` and add `"types": ["vitest/globals", "@testing-library/jest-dom"]` under `compilerOptions`.

- [ ] **Step 8: Create test setup file**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 9: Add npm scripts to package.json**

Edit `package.json` `scripts` section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 10: Initialize git and create .gitignore**

```bash
git init
```

Create `.gitignore`:

```
node_modules
dist
.DS_Store
*.log
.env.local
.vite
coverage
```

- [ ] **Step 11: Verify dev server boots**

Run: `npm run dev`
Expected: Vite starts on http://localhost:5173 and the default React page renders without errors. Stop with Ctrl+C.

- [ ] **Step 12: Verify test runner works**

Run: `npm run test:run`
Expected: "No test files found" message (exit code 1 is OK at this stage).

- [ ] **Step 13: Initial commit**

```bash
git add -A
git commit -m "chore: initialize Vite + React + TS + Tailwind + Vitest"
```

---

## Task 2: デザイントークン整備（OKLCH 4テーマ）

**Files:**
- Create: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Replace src/index.css with the OKLCH theme tokens**

Reference: `docs/references/MHWilds Damage Calc.html` lines 15-110.

Write to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-0: oklch(0.16 0.008 65);
  --bg-1: oklch(0.20 0.008 65);
  --bg-2: oklch(0.24 0.008 65);
  --bg-3: oklch(0.28 0.008 65);
  --line: color-mix(in oklch, white 7%, transparent);
  --line-strong: color-mix(in oklch, white 14%, transparent);
  --text-1: oklch(0.97 0.004 65);
  --text-2: oklch(0.78 0.012 65);
  --text-3: oklch(0.58 0.014 65);
  --text-4: oklch(0.42 0.012 65);
  --accent: oklch(0.76 0.16 55);
  --accent-2: oklch(0.83 0.14 75);
  --accent-soft: color-mix(in oklch, oklch(0.76 0.16 55) 18%, transparent);
  --accent-line: color-mix(in oklch, oklch(0.76 0.16 55) 36%, transparent);
  --crit: oklch(0.87 0.16 90);
  --elem: oklch(0.78 0.13 230);
  --good: oklch(0.78 0.16 155);
  --purple: oklch(0.74 0.16 300);
  --rad-card: 14px;
  --rad-ctl: 8px;
  --rad-pill: 999px;
}

[data-theme="aurora"] {
  --bg-0: oklch(0.15 0.022 260);
  --bg-1: oklch(0.19 0.024 260);
  --bg-2: oklch(0.23 0.024 260);
  --bg-3: oklch(0.27 0.024 260);
  --accent: oklch(0.78 0.15 220);
  --accent-2: oklch(0.80 0.14 290);
  --accent-soft: color-mix(in oklch, oklch(0.78 0.15 220) 18%, transparent);
  --accent-line: color-mix(in oklch, oklch(0.78 0.15 220) 36%, transparent);
  --crit: oklch(0.85 0.13 200);
  --elem: oklch(0.78 0.14 250);
  --good: oklch(0.82 0.15 175);
}

[data-theme="forest"] {
  --bg-0: oklch(0.15 0.012 165);
  --bg-1: oklch(0.19 0.012 165);
  --bg-2: oklch(0.23 0.012 165);
  --bg-3: oklch(0.27 0.012 165);
  --accent: oklch(0.74 0.16 160);
  --accent-2: oklch(0.82 0.14 145);
  --accent-soft: color-mix(in oklch, oklch(0.74 0.16 160) 18%, transparent);
  --accent-line: color-mix(in oklch, oklch(0.74 0.16 160) 36%, transparent);
  --crit: oklch(0.86 0.15 105);
  --good: oklch(0.82 0.16 150);
}

[data-theme="solar"] {
  --bg-0: oklch(0.97 0.005 70);
  --bg-1: oklch(0.99 0.004 70);
  --bg-2: oklch(0.96 0.006 70);
  --bg-3: oklch(0.92 0.008 70);
  --line: color-mix(in oklch, black 9%, transparent);
  --line-strong: color-mix(in oklch, black 16%, transparent);
  --text-1: oklch(0.20 0.008 65);
  --text-2: oklch(0.38 0.012 65);
  --text-3: oklch(0.55 0.012 65);
  --text-4: oklch(0.70 0.010 65);
  --accent: oklch(0.62 0.18 35);
  --accent-2: oklch(0.70 0.16 55);
  --accent-soft: color-mix(in oklch, oklch(0.62 0.18 35) 14%, transparent);
  --accent-line: color-mix(in oklch, oklch(0.62 0.18 35) 32%, transparent);
  --crit: oklch(0.65 0.18 60);
  --elem: oklch(0.55 0.15 230);
  --good: oklch(0.60 0.16 150);
  --purple: oklch(0.55 0.18 295);
}

html, body {
  margin: 0;
  background:
    radial-gradient(1100px 600px at 85% -10%, color-mix(in oklch, var(--accent) 12%, transparent), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, color-mix(in oklch, var(--elem) 6%, transparent), transparent 60%),
    var(--bg-0);
  color: var(--text-1);
  font-family: 'Geist', 'Noto Sans JP', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'ss01', 'cv11';
  letter-spacing: -0.005em;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-feature-settings: 'tnum', 'zero';
}
```

- [ ] **Step 2: Add Google Fonts link to index.html**

Edit `index.html`, add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Also update `<title>` to `Wilds Damage Calc`.

- [ ] **Step 3: Replace src/App.tsx with minimal verification page**

```tsx
export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Theme verification</h1>
      <div className="flex gap-4">
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', padding: 16, borderRadius: 14, color: 'var(--text-1)' }}>
          Card with theme variables
          <div className="mono mt-2" style={{ color: 'var(--accent)' }}>224.7 DPS</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {(['ember', 'aurora', 'forest', 'solar'] as const).map(t => (
          <button key={t} onClick={() => document.documentElement.setAttribute('data-theme', t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify themes render correctly in dev**

Run: `npm run dev`
Open http://localhost:5173. Click each theme button. Background and accent color should change. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(theme): add OKLCH design tokens for 4 themes"
```

---

## Task 3: 型定義

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/types/types.test.ts`:

```ts
import type { Weapon, Skill, MotionPattern, Build, ThemeId } from '../../types';

test('types are importable', () => {
  const w: Weapon = {
    id: 'w1', name: 'test', type: 'longsword',
    attack: 100, affinity: 0, element: null,
    sharpness: { current: 'white', values: [] }, slots: [],
  };
  const s: Skill = { id: 's1', name: 'attack', maxLevel: 5 };
  const p: MotionPattern = { name: 'p1', motions: [], ratio: 1.0 };
  const t: ThemeId = 'ember';
  expect(w.type).toBe('longsword');
  expect(s.maxLevel).toBe(5);
  expect(p.ratio).toBe(1.0);
  expect(t).toBe('ember');
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test:run -- types`
Expected: FAIL — module `'../../types'` not found.

- [ ] **Step 3: Create the type definitions**

Create `src/types/index.ts`:

```ts
export type ThemeId = 'ember' | 'aurora' | 'forest' | 'solar';

export type WeaponType =
  | 'longsword' | 'greatsword' | 'sword-and-shield' | 'dual-blades'
  | 'hammer' | 'hunting-horn' | 'lance' | 'gunlance'
  | 'switch-axe' | 'charge-blade' | 'insect-glaive'
  | 'light-bowgun' | 'heavy-bowgun' | 'bow';

export type SharpnessColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'white' | 'purple';

export interface SharpnessValue { color: SharpnessColor; value: number; }

export interface Element {
  type: '火' | '水' | '雷' | '氷' | '龍';
  value: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  attack: number;
  affinity: number;          // -100..100 (percentage)
  element: Element | null;
  sharpness: { current: SharpnessColor; values: SharpnessValue[] };
  slots: number[];           // e.g. [2, 1] = 2-slot + 1-slot
}

export interface ArmorPiece {
  id: string;
  name: string;
  part: 'head' | 'chest' | 'arms' | 'waist' | 'legs';
  skills: { skillId: string; level: number }[];
  slots: number[];
}

export interface Decoration {
  id: string;
  name: string;
  slotSize: number;
  skillId: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  maxLevel: number;
  description?: string;
}

export interface Talisman {
  type: 'preset' | 'custom';
  // preset
  id?: string;
  // custom
  skills?: { skillId: string; level: number }[];
  // shared
  decorations: (string | null)[];
}

export interface Motion {
  motionName: string;
  motionValue: number;     // raw value (e.g. 50)
  frames: number;
  isDraw: boolean;
}

export interface MotionPattern {
  name: string;
  motions: Motion[];
  ratio: number;           // 0.0..1.0
}

export interface MonsterPart {
  id: string;
  name: string;
  physical: number;        // 物理肉質 0..100
  element: Partial<Record<Element['type'], number>>;
  woundedPhysicalBonus?: number;
}

export interface Monster {
  id: string;
  name: string;
  parts: MonsterPart[];
}

export interface ConditionalSkillUptime {
  skillId: string;
  uptime: number;          // 0.0..1.0
}

export interface ActiveSkill {
  skillId: string;
  level: number;
}

export interface Build {
  id: string;
  name: string;
  weaponId: string;
  armor: Partial<Record<ArmorPiece['part'], { id: string; decorations: (string | null)[] }>>;
  talisman: Talisman;
  conditionalUptimes: ConditionalSkillUptime[];
  motionPatterns: MotionPattern[];
  buffs: string[];
  target: { monsterId: string; partId: string; enraged: boolean; wounded: boolean };
  createdAt: number;
  updatedAt: number;
}

export interface CalcInput {
  weapon: Weapon;
  passiveSkills: { skillId: string; level: number }[];
  conditionalUptimes: ConditionalSkillUptime[];
  buffs: string[];
  motionPatterns: MotionPattern[];
  target: { monster: Monster; partId: string; enraged: boolean; wounded: boolean };
}

export interface PatternResult {
  name: string;
  damage: number;
  frames: number;
  ratio: number;
}

export interface DamageResult {
  expectedDPS: number;
  physicalAvg: number;
  elementAvg: number;
  effectiveAffinity: number;
  critCoefficient: number;
  patterns: PatternResult[];
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test:run -- types`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(types): add core domain type definitions"
```

---

## Task 4: 斬れ味補正テーブル（calc/sharpness.ts）

**Files:**
- Create: `src/calc/sharpness.ts`
- Test: `src/__tests__/calc/sharpness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- sharpness`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement sharpness module**

Create `src/calc/sharpness.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- sharpness`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(calc): add sharpness multiplier tables"
```

---

## Task 5: 会心期待値計算（calc/affinity.ts）

**Files:**
- Create: `src/calc/affinity.ts`
- Test: `src/__tests__/calc/affinity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
    // critCoefficient(-50, 0.75): 1 + (-0.5) * (0.75 - 1) = 1 + 0.125 = 1.125
    expect(critCoefficient(-50, 0.75)).toBeCloseTo(1.125);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- affinity`
Expected: FAIL.

- [ ] **Step 3: Implement affinity module**

Create `src/calc/affinity.ts`:

```ts
/** Clamp an affinity percentage to [-100, 100]. */
export function clampAffinity(affinityPct: number): number {
  if (affinityPct > 100) return 100;
  if (affinityPct < -100) return -100;
  return affinityPct;
}

/**
 * Expected crit coefficient = 1 + (affinity/100) * (critMult - 1).
 * Caller picks critMult: 1.25 normal, 1.40 with 超会心, 0.75 for negative-affinity hits.
 */
export function critCoefficient(affinityPct: number, critMult: number): number {
  const a = clampAffinity(affinityPct) / 100;
  return 1 + a * (critMult - 1);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- affinity`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(calc): add affinity / crit coefficient calculation"
```

---

## Task 6: スキル補正適用（calc/skills.ts）

**Files:**
- Create: `src/calc/skills.ts`
- Test: `src/__tests__/calc/skills.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { attackSkillBonus, affinitySkillBonus, critMultiplier } from '../../calc/skills';

describe('attackSkillBonus', () => {
  test('攻撃Lv5 => +9', () => {
    expect(attackSkillBonus([{ skillId: 'attack', level: 5 }])).toBe(9);
  });
  test('攻撃Lv3 => +6', () => {
    expect(attackSkillBonus([{ skillId: 'attack', level: 3 }])).toBe(6);
  });
  test('no skills => 0', () => {
    expect(attackSkillBonus([])).toBe(0);
  });
});

describe('affinitySkillBonus', () => {
  test('見切りLv7 => +30', () => {
    expect(affinitySkillBonus(
      [{ skillId: 'critical-eye', level: 7 }],
      { hitzonePhysical: 0, isDraw: false }
    )).toBe(30);
  });
  test('弱点特効Lv3 applies only when hitzone>=45', () => {
    const skills = [{ skillId: 'weakness-exploit', level: 3 }];
    expect(affinitySkillBonus(skills, { hitzonePhysical: 50, isDraw: false })).toBe(30);
    expect(affinitySkillBonus(skills, { hitzonePhysical: 40, isDraw: false })).toBe(0);
  });
  test('抜刀術【技】Lv3 applies only to draw motions', () => {
    const skills = [{ skillId: 'punishing-draw-technique', level: 3 }];
    expect(affinitySkillBonus(skills, { hitzonePhysical: 0, isDraw: true })).toBe(30);
    expect(affinitySkillBonus(skills, { hitzonePhysical: 0, isDraw: false })).toBe(0);
  });
});

describe('critMultiplier', () => {
  test('default 1.25', () => {
    expect(critMultiplier([])).toBe(1.25);
  });
  test('超会心Lv3 => 1.40', () => {
    expect(critMultiplier([{ skillId: 'critical-boost', level: 3 }])).toBe(1.40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- skills`
Expected: FAIL.

- [ ] **Step 3: Implement skills module**

Create `src/calc/skills.ts`:

```ts
import type { ActiveSkill } from '../types';

interface MotionContext {
  hitzonePhysical: number;
  isDraw: boolean;
}

const ATTACK_BONUSES: Record<number, number>     = { 1: 3, 2: 5, 3: 6, 4: 7, 5: 9 };
const CRITICAL_EYE: Record<number, number>       = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 25, 7: 30 };
const WEAKNESS_EXPLOIT: Record<number, number>   = { 1: 10, 2: 20, 3: 30 };
const PUNISH_DRAW_TECH: Record<number, number>   = { 1: 10, 2: 20, 3: 30 };
const CRIT_BOOST: Record<number, number>         = { 1: 1.30, 2: 1.35, 3: 1.40, 4: 1.40, 5: 1.40 };

function lookup(table: Record<number, number>, level: number): number {
  return table[level] ?? 0;
}

export function attackSkillBonus(skills: ActiveSkill[]): number {
  return skills
    .filter(s => s.skillId === 'attack')
    .reduce((sum, s) => sum + lookup(ATTACK_BONUSES, s.level), 0);
}

export function affinitySkillBonus(skills: ActiveSkill[], ctx: MotionContext): number {
  let bonus = 0;
  for (const s of skills) {
    if (s.skillId === 'critical-eye') bonus += lookup(CRITICAL_EYE, s.level);
    if (s.skillId === 'weakness-exploit' && ctx.hitzonePhysical >= 45) bonus += lookup(WEAKNESS_EXPLOIT, s.level);
    if (s.skillId === 'punishing-draw-technique' && ctx.isDraw) bonus += lookup(PUNISH_DRAW_TECH, s.level);
  }
  return bonus;
}

export function critMultiplier(skills: ActiveSkill[]): number {
  const boost = skills.find(s => s.skillId === 'critical-boost');
  return boost ? (CRIT_BOOST[boost.level] ?? 1.25) : 1.25;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- skills`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(calc): add skill correction lookups (attack/affinity/crit)"
```

---

## Task 7: 条件付きスキル処理（calc/conditional.ts）

**Files:**
- Create: `src/calc/conditional.ts`
- Test: `src/__tests__/calc/conditional.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { applyConditionalUptimes } from '../../calc/conditional';

describe('applyConditionalUptimes', () => {
  test('挑戦者Lv7 at 60% uptime => +15 attack, +9 affinity', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'agitator', uptime: 0.60 }],
      [{ skillId: 'agitator', level: 7 }]
    );
    expect(result.attackBonus).toBeCloseTo(15);
    expect(result.affinityBonus).toBeCloseTo(9);
  });
  test('逆襲Lv3 at 30% uptime => +9 attack, no affinity', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'resentment', uptime: 0.30 }],
      [{ skillId: 'resentment', level: 3 }]
    );
    expect(result.attackBonus).toBeCloseTo(9);
    expect(result.affinityBonus).toBe(0);
  });
  test('0 uptime => no bonus', () => {
    const result = applyConditionalUptimes(
      [{ skillId: 'agitator', uptime: 0 }],
      [{ skillId: 'agitator', level: 7 }]
    );
    expect(result.attackBonus).toBe(0);
    expect(result.affinityBonus).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- conditional`
Expected: FAIL.

- [ ] **Step 3: Implement conditional module**

Create `src/calc/conditional.ts`:

```ts
import type { ConditionalSkillUptime, ActiveSkill } from '../types';

const AGITATOR_ATK:  Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28 };
const AGITATOR_AFF:  Record<number, number> = { 1: 3, 2: 5, 3: 7, 4: 10, 5: 12, 6: 15, 7: 15 };
const RESENTMENT:    Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25 };
const PEAK_PERF:     Record<number, number> = { 1: 5, 2: 10, 3: 20 };

export interface ConditionalBonus {
  attackBonus: number;
  affinityBonus: number;
}

function lookup(table: Record<number, number>, level: number): number {
  return table[level] ?? 0;
}

export function applyConditionalUptimes(
  uptimes: ConditionalSkillUptime[],
  skillLevels: ActiveSkill[],
): ConditionalBonus {
  let attackBonus = 0;
  let affinityBonus = 0;
  for (const u of uptimes) {
    const sk = skillLevels.find(s => s.skillId === u.skillId);
    if (!sk) continue;
    if (u.skillId === 'agitator') {
      attackBonus   += lookup(AGITATOR_ATK, sk.level) * u.uptime;
      affinityBonus += lookup(AGITATOR_AFF, sk.level) * u.uptime;
    } else if (u.skillId === 'resentment') {
      attackBonus   += lookup(RESENTMENT, sk.level) * u.uptime;
    } else if (u.skillId === 'peak-performance') {
      attackBonus   += lookup(PEAK_PERF, sk.level) * u.uptime;
    }
  }
  return { attackBonus, affinityBonus };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- conditional`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(calc): add conditional-skill uptime weighting"
```

---

## Task 8: 近接ダメージ統合計算（calc/melee.ts + calc/index.ts）

**Files:**
- Create: `src/calc/melee.ts`, `src/calc/index.ts`
- Test: `src/__tests__/calc/melee.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { calcDamage } from '../../calc';
import type { CalcInput } from '../../types';

const baseInput: CalcInput = {
  weapon: {
    id: 'test-ls', name: 'Test LS', type: 'longsword',
    attack: 330, affinity: 20,
    element: { type: '水', value: 24 },
    sharpness: { current: 'purple', values: [] },
    slots: [],
  },
  passiveSkills: [
    { skillId: 'attack', level: 5 },
    { skillId: 'critical-eye', level: 7 },
    { skillId: 'critical-boost', level: 3 },
    { skillId: 'weakness-exploit', level: 3 },
  ],
  conditionalUptimes: [],
  buffs: [],
  motionPatterns: [{
    name: 'test',
    ratio: 1.0,
    motions: [{ motionName: '突き', motionValue: 50, frames: 30, isDraw: false }],
  }],
  target: {
    monster: { id: 'g', name: 'ゴア', parts: [
      { id: 'head', name: '頭部', physical: 85, element: { 水: 35 } },
    ]},
    partId: 'head', enraged: false, wounded: false,
  },
};

describe('calcDamage (melee)', () => {
  test('returns positive DPS for the canonical longsword build', () => {
    const r = calcDamage(baseInput);
    expect(r.expectedDPS).toBeGreaterThan(0);
    expect(r.patterns).toHaveLength(1);
  });

  test('effective affinity caps at 100', () => {
    const r = calcDamage(baseInput);
    expect(r.effectiveAffinity).toBeLessThanOrEqual(1.0);
  });

  test('weakness exploit fires on hitzone>=45 (head)', () => {
    const r = calcDamage(baseInput);
    // 武器20 + 見切り30 + 弱点特効30 = 80 → 0.80
    expect(r.effectiveAffinity).toBeCloseTo(0.80, 2);
  });

  test('hitzone<45 disables weakness exploit', () => {
    const input = {
      ...baseInput,
      target: { ...baseInput.target,
        monster: { id: 'g', name: 'ゴア', parts: [
          { id: 'tail', name: '尻尾', physical: 40, element: { 水: 10 } },
        ]},
        partId: 'tail',
      },
    };
    const r = calcDamage(input);
    // 武器20 + 見切り30 + 弱点特効0 = 50 → 0.50
    expect(r.effectiveAffinity).toBeCloseTo(0.50, 2);
  });

  test('two patterns are weighted-averaged for DPS', () => {
    const r = calcDamage({
      ...baseInput,
      motionPatterns: [
        { name: 'a', ratio: 0.5, motions: [{ motionName: 'a', motionValue: 50, frames: 30, isDraw: false }] },
        { name: 'b', ratio: 0.5, motions: [{ motionName: 'b', motionValue: 100, frames: 60, isDraw: false }] },
      ],
    });
    // both produce same DPS structurally; combined DPS should equal either pattern
    expect(r.patterns).toHaveLength(2);
    expect(r.expectedDPS).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- melee`
Expected: FAIL.

- [ ] **Step 3: Implement melee calculation**

Create `src/calc/melee.ts`:

```ts
import type { CalcInput, DamageResult, PatternResult, Motion } from '../types';
import { meleeSharpnessMult, elementSharpnessMult } from './sharpness';
import { clampAffinity, critCoefficient } from './affinity';
import { attackSkillBonus, affinitySkillBonus, critMultiplier } from './skills';
import { applyConditionalUptimes } from './conditional';

// 武器係数（近接） — 太刀=3.3 など。Plan 1では太刀のみ使用。
const WEAPON_COEF: Record<string, number> = {
  'longsword': 3.3, 'greatsword': 4.8, 'sword-and-shield': 1.4,
  'dual-blades': 1.4, 'hammer': 5.2, 'hunting-horn': 4.2,
  'lance': 2.3, 'gunlance': 2.3, 'switch-axe': 5.4,
  'charge-blade': 3.6, 'insect-glaive': 3.1,
};

function calcMotionDamage(
  motion: Motion,
  input: CalcInput,
  conditionalAttack: number,
  conditionalAffinity: number,
): { physical: number; element: number } {
  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const physicalHitzone = part.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);
  const elementHitzone  = input.weapon.element ? (part.element[input.weapon.element.type] ?? 0) : 0;

  const attackBonus = attackSkillBonus(input.passiveSkills) + conditionalAttack;
  const attack      = input.weapon.attack + attackBonus;

  const affBonus = affinitySkillBonus(input.passiveSkills,
    { hitzonePhysical: physicalHitzone, isDraw: motion.isDraw });
  const affinity = clampAffinity(input.weapon.affinity + affBonus + conditionalAffinity);

  const critMult = affinity >= 0 ? critMultiplier(input.passiveSkills) : 0.75;
  const critCoef = critCoefficient(affinity, critMult);

  const coef       = WEAPON_COEF[input.weapon.type] ?? 1.0;
  const sharpPhys  = meleeSharpnessMult(input.weapon.sharpness.current);
  const sharpElem  = elementSharpnessMult(input.weapon.sharpness.current);

  const physical = (attack / coef)
                 * (motion.motionValue / 100)
                 * sharpPhys
                 * critCoef
                 * (physicalHitzone / 100);

  const element = input.weapon.element
    ? input.weapon.element.value
      * sharpElem
      * (elementHitzone / 100)
    : 0;

  return { physical, element };
}

export function calcMeleeDamage(input: CalcInput): DamageResult {
  const cond = applyConditionalUptimes(input.conditionalUptimes, input.passiveSkills);

  const part = input.target.monster.parts.find(p => p.id === input.target.partId)!;
  const physicalHitzone = part.physical + (input.target.wounded ? (part.woundedPhysicalBonus ?? 10) : 0);

  let physicalSum = 0, elementSum = 0;

  const patterns: PatternResult[] = input.motionPatterns.map(p => {
    let phys = 0, elem = 0, frames = 0;
    for (const m of p.motions) {
      const d = calcMotionDamage(m, input, cond.attackBonus, cond.affinityBonus);
      phys += d.physical;
      elem += d.element;
      frames += m.frames;
    }
    const damage = Math.floor(phys + elem); // 全体防御率 = 1.0 (Plan 1)
    physicalSum += phys * p.ratio;
    elementSum  += elem * p.ratio;
    return { name: p.name, damage, frames, ratio: p.ratio };
  });

  const weightedDmg  = patterns.reduce((s, r) => s + r.damage * r.ratio, 0);
  const weightedTime = patterns.reduce((s, r) => s + r.frames * r.ratio, 0);
  const dps = weightedTime > 0 ? (weightedDmg / weightedTime) * 60 : 0;

  // For display: representative affinity (averaged across motions)
  const affBonus = affinitySkillBonus(input.passiveSkills,
    { hitzonePhysical: physicalHitzone, isDraw: false });
  const repAffinity = clampAffinity(input.weapon.affinity + affBonus + cond.affinityBonus) / 100;
  const repCritMult = repAffinity >= 0 ? critMultiplier(input.passiveSkills) : 0.75;
  const repCritCoef = critCoefficient(repAffinity * 100, repCritMult);

  return {
    expectedDPS: dps,
    physicalAvg: Math.round(physicalSum),
    elementAvg:  Math.round(elementSum),
    effectiveAffinity: repAffinity,
    critCoefficient: repCritCoef,
    patterns,
  };
}
```

Create `src/calc/index.ts`:

```ts
import type { CalcInput, DamageResult } from '../types';
import { calcMeleeDamage } from './melee';

const RANGED: ReadonlyArray<string> = ['light-bowgun', 'heavy-bowgun', 'bow'];

export function calcDamage(input: CalcInput): DamageResult {
  if (RANGED.includes(input.weapon.type)) {
    // Plan 3 で実装
    throw new Error(`Ranged weapon ${input.weapon.type} not yet supported in MVP`);
  }
  return calcMeleeDamage(input);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- melee`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Run all calc tests**

Run: `npm run test:run -- calc`
Expected: PASS for sharpness, affinity, skills, conditional, melee.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(calc): integrate melee damage calculation pipeline"
```

---

## Task 9: ゲームデータJSON（太刀MVP分）

**Files:**
- Create: `public/data/weapons.json`, `armor.json`, `decorations.json`, `skills.json`, `motions.json`, `monsters.json`

- [ ] **Step 1: Create skills.json**

```json
[
  { "id": "attack", "name": "攻撃", "maxLevel": 5 },
  { "id": "critical-eye", "name": "見切り", "maxLevel": 7 },
  { "id": "critical-boost", "name": "超会心", "maxLevel": 3 },
  { "id": "weakness-exploit", "name": "弱点特効", "maxLevel": 3 },
  { "id": "punishing-draw-power", "name": "抜刀術【力】", "maxLevel": 3 },
  { "id": "punishing-draw-technique", "name": "抜刀術【技】", "maxLevel": 3 },
  { "id": "razor-sharp", "name": "業物", "maxLevel": 3 },
  { "id": "agitator", "name": "挑戦者", "maxLevel": 7 },
  { "id": "resentment", "name": "逆襲", "maxLevel": 5 },
  { "id": "peak-performance", "name": "フルチャージ", "maxLevel": 3 },
  { "id": "element-crit", "name": "会心撃【属性】", "maxLevel": 3 },
  { "id": "water-attack", "name": "水属性攻撃強化", "maxLevel": 5 },
  { "id": "constitution", "name": "体術", "maxLevel": 5 },
  { "id": "stun-resistance", "name": "気絶耐性", "maxLevel": 3 },
  { "id": "earplugs", "name": "耳栓", "maxLevel": 5 }
]
```

- [ ] **Step 2: Create weapons.json (太刀のみ3本)**

```json
[
  {
    "id": "ls-amatsu", "name": "業物【神流】", "type": "longsword",
    "attack": 330, "affinity": 20,
    "element": { "type": "水", "value": 24 },
    "sharpness": { "current": "purple", "values": [
      {"color":"red","value":50},{"color":"orange","value":50},{"color":"yellow","value":50},
      {"color":"green","value":80},{"color":"blue","value":120},{"color":"white","value":150},{"color":"purple","value":50}
    ]},
    "slots": [3, 2, 1]
  },
  {
    "id": "ls-azure", "name": "飛竜刀【蒼】", "type": "longsword",
    "attack": 310, "affinity": 30,
    "element": null,
    "sharpness": { "current": "white", "values": [
      {"color":"green","value":100},{"color":"blue","value":150},{"color":"white","value":120}
    ]},
    "slots": [2, 2]
  },
  {
    "id": "ls-ravage", "name": "黒龍棍【千千】", "type": "longsword",
    "attack": 350, "affinity": -20,
    "element": { "type": "龍", "value": 30 },
    "sharpness": { "current": "white", "values": [
      {"color":"green","value":120},{"color":"blue","value":160},{"color":"white","value":80}
    ]},
    "slots": [3, 3]
  }
]
```

- [ ] **Step 3: Create armor.json**

```json
[
  { "id": "garuga-head", "name": "ガルルガヘルム", "part": "head",
    "skills": [{"skillId":"weakness-exploit","level":2}], "slots": [1, 1] },
  { "id": "nergi-chest", "name": "ネルギガンテメイル", "part": "chest",
    "skills": [{"skillId":"critical-eye","level":2}], "slots": [2, 2, 1] },
  { "id": "gore-arms", "name": "ゴアマガラアーム", "part": "arms",
    "skills": [{"skillId":"agitator","level":2}], "slots": [1] },
  { "id": "tigrex-waist", "name": "ティガレックスコイル", "part": "waist",
    "skills": [{"skillId":"attack","level":2}], "slots": [3] },
  { "id": "mam-legs", "name": "マムガイラグリーヴ", "part": "legs",
    "skills": [{"skillId":"critical-boost","level":1}], "slots": [1, 1] }
]
```

- [ ] **Step 4: Create decorations.json**

```json
[
  { "id": "atk-1", "name": "攻撃珠", "slotSize": 1, "skillId": "attack", "level": 1 },
  { "id": "crit-2", "name": "会心珠", "slotSize": 2, "skillId": "critical-eye", "level": 1 },
  { "id": "supercrit-3", "name": "超会心珠", "slotSize": 3, "skillId": "critical-boost", "level": 1 },
  { "id": "razor-2", "name": "業物珠", "slotSize": 2, "skillId": "razor-sharp", "level": 1 },
  { "id": "wex-2", "name": "痛撃珠", "slotSize": 2, "skillId": "weakness-exploit", "level": 1 },
  { "id": "draw-pow-2", "name": "抜刀珠【力】", "slotSize": 2, "skillId": "punishing-draw-power", "level": 1 },
  { "id": "draw-tech-2", "name": "抜刀珠【技】", "slotSize": 2, "skillId": "punishing-draw-technique", "level": 1 },
  { "id": "agitator-2", "name": "挑戦珠", "slotSize": 2, "skillId": "agitator", "level": 1 },
  { "id": "water-atk-1", "name": "水属性攻撃珠", "slotSize": 1, "skillId": "water-attack", "level": 1 },
  { "id": "elem-crit-2", "name": "属攻珠", "slotSize": 2, "skillId": "element-crit", "level": 1 }
]
```

- [ ] **Step 5: Create motions.json (太刀の主要モーション)**

```json
{
  "longsword": [
    { "motionName": "縦斬り",         "motionValue": 22, "frames": 28, "isDraw": false },
    { "motionName": "踏み込み斬り",   "motionValue": 26, "frames": 30, "isDraw": false },
    { "motionName": "突き",           "motionValue": 17, "frames": 22, "isDraw": false },
    { "motionName": "鬼人斬り",       "motionValue": 35, "frames": 30, "isDraw": false },
    { "motionName": "気刃斬り",       "motionValue": 30, "frames": 35, "isDraw": false },
    { "motionName": "気刃兜割",       "motionValue": 110, "frames": 90, "isDraw": false },
    { "motionName": "居合抜刀気刃斬り","motionValue": 70, "frames": 50, "isDraw": true },
    { "motionName": "見切り斬り",     "motionValue": 28, "frames": 36, "isDraw": false }
  ]
}
```

- [ ] **Step 6: Create monsters.json**

```json
[
  {
    "id": "gore-magala", "name": "ゴア・マガラ",
    "parts": [
      { "id": "head", "name": "頭部",   "physical": 85, "element": { "水": 35, "雷": 15, "火": 5 }, "woundedPhysicalBonus": 10 },
      { "id": "body", "name": "胴体",   "physical": 50, "element": { "水": 20, "雷": 10, "火": 5 } },
      { "id": "wings","name": "翼",     "physical": 45, "element": { "水": 25, "雷": 20 } },
      { "id": "tail", "name": "尻尾",   "physical": 40, "element": { "水": 15 } }
    ]
  }
]
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(data): add MVP game data (longsword/armor/skills/monster)"
```

---

## Task 10: データローダー（src/data/*.ts）

**Files:**
- Create: `src/data/weapons.ts`, `armor.ts`, `decorations.ts`, `skills.ts`, `motions.ts`, `monsters.ts`

- [ ] **Step 1: Create data loaders**

Each loader fetches its JSON and validates the shape. Create `src/data/weapons.ts`:

```ts
import type { Weapon } from '../types';

let cached: Weapon[] | null = null;

export async function loadWeapons(): Promise<Weapon[]> {
  if (cached) return cached;
  const res = await fetch('/data/weapons.json');
  if (!res.ok) throw new Error(`Failed to load weapons.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getWeaponById(id: string): Promise<Weapon | undefined> {
  const all = await loadWeapons();
  return all.find(w => w.id === id);
}
```

Create `src/data/armor.ts`, `decorations.ts`, `skills.ts`, `monsters.ts` following the same pattern with the appropriate type.

Create `src/data/motions.ts`:

```ts
import type { Motion, WeaponType } from '../types';

let cached: Record<string, Motion[]> | null = null;

export async function loadMotions(): Promise<Record<string, Motion[]>> {
  if (cached) return cached;
  const res = await fetch('/data/motions.json');
  if (!res.ok) throw new Error(`Failed to load motions.json: ${res.status}`);
  cached = await res.json();
  return cached!;
}

export async function getMotionsFor(type: WeaponType): Promise<Motion[]> {
  const all = await loadMotions();
  return all[type] ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(data): add fetch-based JSON loaders"
```

---

## Task 11: Dexie.js データベース（src/db/database.ts）

**Files:**
- Create: `src/db/database.ts`

- [ ] **Step 1: Implement Dexie database**

```ts
import Dexie, { type Table } from 'dexie';
import type { Build, ThemeId } from '../types';

interface ThemePref { id: 'current'; theme: ThemeId; }

class AppDB extends Dexie {
  builds!:    Table<Build, string>;
  themePref!: Table<ThemePref, 'current'>;

  constructor() {
    super('mhwilds-calc');
    this.version(1).stores({
      builds:    'id, updatedAt',
      themePref: 'id',
    });
  }
}

export const db = new AppDB();
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(db): add Dexie database for builds and theme prefs"
```

---

## Task 12: themeStore + 永続化

**Files:**
- Create: `src/store/themeStore.ts`
- Test: `src/__tests__/store/themeStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { useThemeStore } from '../../store/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'ember' });
    document.documentElement.removeAttribute('data-theme');
  });

  test('default theme is ember', () => {
    expect(useThemeStore.getState().theme).toBe('ember');
  });

  test('setTheme updates state', () => {
    useThemeStore.getState().setTheme('aurora');
    expect(useThemeStore.getState().theme).toBe('aurora');
  });

  test('applyTheme sets the html data-theme attribute', () => {
    useThemeStore.getState().setTheme('forest');
    useThemeStore.getState().applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test:run -- themeStore`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement themeStore**

```ts
import { create } from 'zustand';
import type { ThemeId } from '../types';
import { db } from '../db/database';

interface ThemeStore {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  applyTheme: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'ember',
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.setAttribute('data-theme', t);
    db.themePref.put({ id: 'current', theme: t });
  },
  applyTheme: () => {
    document.documentElement.setAttribute('data-theme', get().theme);
  },
  hydrate: async () => {
    const pref = await db.themePref.get('current');
    if (pref) {
      set({ theme: pref.theme });
      document.documentElement.setAttribute('data-theme', pref.theme);
    }
  },
}));
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test:run -- themeStore`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(store): add themeStore with Dexie persistence"
```

---

## Task 13: buildStore（武器・防具・スキル状態）

**Files:**
- Create: `src/store/buildStore.ts`

- [ ] **Step 1: Implement buildStore**

```ts
import { create } from 'zustand';
import type { Weapon, ArmorPiece, Talisman, ConditionalSkillUptime } from '../types';

interface BuildStore {
  weapon: Weapon | null;
  armor: Partial<Record<ArmorPiece['part'], { piece: ArmorPiece; decorations: (string | null)[] }>>;
  talisman: Talisman;
  conditionalUptimes: ConditionalSkillUptime[];

  setWeapon: (w: Weapon | null) => void;
  setArmor: (part: ArmorPiece['part'], piece: ArmorPiece | null) => void;
  setArmorDeco: (part: ArmorPiece['part'], slotIdx: number, decoId: string | null) => void;
  setTalisman: (t: Talisman) => void;
  setConditionalUptime: (skillId: string, uptime: number) => void;
}

const defaultTalisman: Talisman = {
  type: 'custom', skills: [], decorations: [],
};

export const useBuildStore = create<BuildStore>((set) => ({
  weapon: null,
  armor: {},
  talisman: defaultTalisman,
  conditionalUptimes: [
    { skillId: 'agitator', uptime: 0.60 },
    { skillId: 'resentment', uptime: 0.30 },
  ],
  setWeapon: (w) => set({ weapon: w }),
  setArmor: (part, piece) => set((s) => ({
    armor: piece
      ? { ...s.armor, [part]: { piece, decorations: piece.slots.map(() => null) } }
      : { ...s.armor, [part]: undefined },
  })),
  setArmorDeco: (part, slotIdx, decoId) => set((s) => {
    const cur = s.armor[part];
    if (!cur) return s;
    const decorations = [...cur.decorations];
    decorations[slotIdx] = decoId;
    return { armor: { ...s.armor, [part]: { ...cur, decorations } } };
  }),
  setTalisman: (t) => set({ talisman: t }),
  setConditionalUptime: (skillId, uptime) => set((s) => ({
    conditionalUptimes: s.conditionalUptimes.some(c => c.skillId === skillId)
      ? s.conditionalUptimes.map(c => c.skillId === skillId ? { ...c, uptime } : c)
      : [...s.conditionalUptimes, { skillId, uptime }],
  })),
}));
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(store): add buildStore for weapon/armor/talisman state"
```

---

## Task 14: motionStore + targetStore

**Files:**
- Create: `src/store/motionStore.ts`, `src/store/targetStore.ts`

- [ ] **Step 1: Implement motionStore**

```ts
import { create } from 'zustand';
import type { MotionPattern } from '../types';

interface MotionStore {
  patterns: MotionPattern[];
  addPattern: (p: MotionPattern) => void;
  updatePattern: (idx: number, patch: Partial<MotionPattern>) => void;
  removePattern: (idx: number) => void;
  setRatio: (idx: number, ratio: number) => void;
}

export const useMotionStore = create<MotionStore>((set) => ({
  patterns: [],
  addPattern: (p) => set((s) => ({ patterns: [...s.patterns, p] })),
  updatePattern: (idx, patch) => set((s) => ({
    patterns: s.patterns.map((p, i) => i === idx ? { ...p, ...patch } : p),
  })),
  removePattern: (idx) => set((s) => ({
    patterns: s.patterns.filter((_, i) => i !== idx),
  })),
  setRatio: (idx, ratio) => set((s) => ({
    patterns: s.patterns.map((p, i) => i === idx ? { ...p, ratio } : p),
  })),
}));
```

- [ ] **Step 2: Implement targetStore**

```ts
import { create } from 'zustand';

interface TargetStore {
  monsterId: string | null;
  partId: string | null;
  enraged: boolean;
  wounded: boolean;
  setMonster: (id: string) => void;
  setPart: (id: string) => void;
  setEnraged: (b: boolean) => void;
  setWounded: (b: boolean) => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  monsterId: null, partId: null, enraged: false, wounded: false,
  setMonster: (id) => set({ monsterId: id, partId: null }),
  setPart:    (id) => set({ partId: id }),
  setEnraged: (b)  => set({ enraged: b }),
  setWounded: (b)  => set({ wounded: b }),
}));
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(store): add motionStore and targetStore"
```

---

## Task 15: 共通UIプリミティブ

**Files:**
- Create: `src/components/shared/Card.tsx`, `CardHead.tsx`, `Field.tsx`, `Chip.tsx`, `Slider.tsx`, `Toggle.tsx`, `StatTile.tsx`
- Modify: `src/index.css` (add component classes from reference)

- [ ] **Step 1: Append component CSS classes to src/index.css**

Append the following CSS classes from `docs/references/MHWilds Damage Calc.html` (lines 163-300) to `src/index.css`. Copy verbatim from the reference: `.btn`, `.btn-primary`, `.card`, `.card-head`, `.card-title`, `.card-title-num`, `.card-meta`, `.field`, `.field.sm`, `.chip`, `.chips`, `.chip .lv`, `.chip.draw .lv`, `.stat`, `.stat-grid`, `.stat .label`, `.stat .value`, `.sharp`, `.sharp-*` (7 colors), `.slider`, `.slider-row`, `.slider-row .pct`, `.toggle`, `.toggle-grid`, `.toggle.on`, `.toggle .ck`, `.toggle.on .ck`, `.toggle.on .ck::after`, `.num-crit`, `.num-elem`, `.num-good`, `.num-accent`, `.div-line`, `.lift`, `.mono`.

- [ ] **Step 2: Create Card.tsx**

```tsx
import type { ReactNode } from 'react';

export function Card({ children, tight = false, className = '' }: { children: ReactNode; tight?: boolean; className?: string }) {
  return <div className={`card ${tight ? 'card-tight' : ''} ${className}`}>{children}</div>;
}
```

- [ ] **Step 3: Create CardHead.tsx**

```tsx
import type { ReactNode } from 'react';

interface Props { icon?: string; title: string; num?: string; meta?: ReactNode; }

export function CardHead({ icon, title, num, meta }: Props) {
  return (
    <div className="card-head">
      <div className="card-title">
        <span>{icon ? `${icon} ` : ''}{title}</span>
        {num && <span className="card-title-num">{num}</span>}
      </div>
      {meta && <div className="card-meta">{meta}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Create Field.tsx**

```tsx
import type { ChangeEvent } from 'react';

interface Option { value: string; label: string; }
interface Props {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  small?: boolean;
}

export function Field({ value, options, onChange, small }: Props) {
  return (
    <select
      className={`field ${small ? 'sm' : ''}`}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
```

- [ ] **Step 5: Create Chip.tsx**

```tsx
interface Props { name: string; lv: number; kind?: 'draw' | 'default'; }

export function Chip({ name, lv, kind = 'default' }: Props) {
  return (
    <span className={`chip ${kind === 'draw' ? 'draw' : ''}`}>
      <span>{name}</span>
      <span className="lv">Lv{lv}</span>
    </span>
  );
}
```

- [ ] **Step 6: Create Slider.tsx**

```tsx
interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function Slider({ value, min = 0, max = 100, onChange }: Props) {
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
    />
  );
}
```

- [ ] **Step 7: Create Toggle.tsx**

```tsx
interface Props { label: string; on: boolean; onChange: (b: boolean) => void; }

export function Toggle({ label, on, onChange }: Props) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <div className="ck" />
      <span>{label}</span>
    </div>
  );
}
```

- [ ] **Step 8: Create StatTile.tsx**

```tsx
import type { ReactNode } from 'react';

interface Props { label: string; value: ReactNode; valueClass?: string; }

export function StatTile({ label, value, valueClass = '' }: Props) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={`value mono ${valueClass}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 9: Verify components render**

Replace `src/App.tsx`:

```tsx
import { Card } from './components/shared/Card';
import { CardHead } from './components/shared/CardHead';
import { Chip } from './components/shared/Chip';
import { StatTile } from './components/shared/StatTile';

export default function App() {
  return (
    <div className="p-8 max-w-md">
      <Card>
        <CardHead icon="⚔" title="武器 / WEAPON" num="01" />
        <div className="stat-grid">
          <StatTile label="攻撃力" value="330" />
          <StatTile label="会心" value="+20%" valueClass="num-good" />
          <StatTile label="水属性" value="24" valueClass="num-elem" />
        </div>
        <div className="chips mt-3">
          <Chip name="超会心" lv={3} />
          <Chip name="抜刀術【力】" lv={3} kind="draw" />
        </div>
      </Card>
    </div>
  );
}
```

Run: `npm run dev`. Verify the card, stat tiles, and chips render correctly with theme colors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): add shared UI primitives (Card/Field/Chip/Slider/Toggle/StatTile)"
```

---

## Task 16: Header と TabBar

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Append header CSS to src/index.css**

Append from `docs/references/MHWilds Damage Calc.html` lines 111-162: `.header`, `.header-inner`, `.brand`, `.brand-mark`, `.brand-mark::after`, `.brand-text`, `.brand-text .title`, `.brand-text .sub`, `.tabs`, `.tab`, `.tab.active`, `.header-spacer`, `.header-actions`.

- [ ] **Step 2: Create Header.tsx**

```tsx
type TabId = 'calc' | 'formula' | 'theme';

interface Props { tab: TabId; onTab: (t: TabId) => void; }

export function Header({ tab, onTab }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-text">
            <div className="title">Wilds Damage Calc</div>
            <div className="sub">期待ダメージ・立ち回りDPS算出ツール</div>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab === 'calc' ? 'active' : ''}`} onClick={() => onTab('calc')}>
            <span style={{ opacity: 0.7 }}>◫</span> 計算機
          </button>
          <button className={`tab ${tab === 'formula' ? 'active' : ''}`} onClick={() => onTab('formula')}>
            <span style={{ opacity: 0.7 }}>ƒ</span> 計算式
          </button>
          <button className={`tab ${tab === 'theme' ? 'active' : ''}`} onClick={() => onTab('theme')}>
            <span style={{ opacity: 0.7 }}>◐</span> テーマ
          </button>
        </div>
        <div className="header-spacer" />
        <div className="header-actions">
          <button className="btn">↓ 読込</button>
          <button className="btn">⊕ 保存</button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create AppLayout.tsx**

```tsx
import { useState } from 'react';
import { Header } from './Header';

type TabId = 'calc' | 'formula' | 'theme';

interface Props { calc: React.ReactNode; formula: React.ReactNode; theme: React.ReactNode; }

export function AppLayout({ calc, formula, theme }: Props) {
  const [tab, setTab] = useState<TabId>('calc');
  return (
    <>
      <Header tab={tab} onTab={setTab} />
      {tab === 'calc' && calc}
      {tab === 'formula' && <div style={{ padding: 28 }}>{formula}</div>}
      {tab === 'theme' && <div style={{ padding: 28 }}>{theme}</div>}
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): add Header + AppLayout with tab switching"
```

---

## Task 17: WeaponCard

**Files:**
- Create: `src/components/builder/WeaponCard.tsx`

- [ ] **Step 1: Create WeaponCard.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { StatTile } from '../shared/StatTile';
import { loadWeapons } from '../../data/weapons';
import { useBuildStore } from '../../store/buildStore';
import { meleeSharpnessMult } from '../../calc/sharpness';
import type { Weapon } from '../../types';

export function WeaponCard() {
  const weapon = useBuildStore(s => s.weapon);
  const setWeapon = useBuildStore(s => s.setWeapon);
  const [list, setList] = useState<Weapon[]>([]);

  useEffect(() => {
    loadWeapons().then((all) => {
      setList(all);
      if (!weapon && all.length > 0) setWeapon(all[0]);
    });
  }, [weapon, setWeapon]);

  if (!weapon) return <Card><CardHead icon="⚔" title="武器 / WEAPON" num="01" />Loading...</Card>;

  const sharpMult = meleeSharpnessMult(weapon.sharpness.current);
  const sharpColor = weapon.sharpness.current;
  const sharpLabel = ({red:'赤',orange:'橙',yellow:'黄',green:'緑',blue:'青',white:'白',purple:'紫'} as const)[sharpColor];

  return (
    <Card>
      <CardHead icon="⚔" title="武器 / WEAPON" num="01" />
      <div style={{ marginBottom: 10 }}>
        <Field
          value={weapon.id}
          options={list.map(w => ({ value: w.id, label: w.name }))}
          onChange={(id) => { const w = list.find(x => x.id === id); if (w) setWeapon(w); }}
        />
      </div>
      <div className="stat-grid">
        <StatTile label="攻撃力" value={weapon.attack} />
        <StatTile label="会心" value={`${weapon.affinity >= 0 ? '+' : ''}${weapon.affinity}%`} valueClass={weapon.affinity >= 0 ? 'num-good' : 'num-crit'} />
        <StatTile label={weapon.element ? `${weapon.element.type}属性` : '属性'} value={weapon.element?.value ?? '—'} valueClass="num-elem" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 11 }}>
        <span style={{ color: 'var(--text-3)' }}>斬れ味</span>
        <span className="mono" style={{ color: 'var(--purple)', fontWeight: 600 }}>{sharpLabel} ×{sharpMult.toFixed(2)}</span>
      </div>
      <div className="sharp">
        {weapon.sharpness.values.map((s, i) => <span key={i} className={`sharp-${s.color}`} style={{ flex: s.value / 50 }} />)}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(ui): add WeaponCard component"
```

---

## Task 18: ArmorCard (簡略版 — Plan 1では一覧表示のみ、装飾品スロットUI込み)

**Files:**
- Create: `src/components/builder/ArmorCard.tsx`

- [ ] **Step 1: Append armor-specific CSS to src/index.css**

Append `.eq-row`, `.eq-slot`, `.eq-slots`, `.eq-slot-pill`, `.eq-slot-pill.empty`, `.eq-slot-pill .lv`, `.talisman`, `.talisman-head`, `.talisman-row`, `.talisman-row .field`, `.talisman-row .field-lv` from `docs/references/MHWilds Damage Calc.html`.

- [ ] **Step 2: Create ArmorCard.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { loadArmor } from '../../data/armor';
import { loadDecorations } from '../../data/decorations';
import { loadSkills } from '../../data/skills';
import { useBuildStore } from '../../store/buildStore';
import type { ArmorPiece, Decoration, Skill } from '../../types';

const PARTS: ArmorPiece['part'][] = ['head','chest','arms','waist','legs'];
const PART_LABEL: Record<ArmorPiece['part'], string> = { head:'頭', chest:'胴', arms:'腕', waist:'腰', legs:'脚' };

export function ArmorCard() {
  const armor = useBuildStore(s => s.armor);
  const setArmor = useBuildStore(s => s.setArmor);
  const setArmorDeco = useBuildStore(s => s.setArmorDeco);
  const [allArmor, setAllArmor] = useState<ArmorPiece[]>([]);
  const [allDecos, setAllDecos] = useState<Decoration[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);

  useEffect(() => {
    Promise.all([loadArmor(), loadDecorations(), loadSkills()]).then(([a, d, s]) => {
      setAllArmor(a); setAllDecos(d); setAllSkills(s);
    });
  }, []);

  const optsFor = (part: ArmorPiece['part']) => allArmor.filter(a => a.part === part);
  const decoOptsFor = (slotSize: number) => allDecos.filter(d => d.slotSize <= slotSize);
  const decoName = (id: string | null) => {
    if (!id) return null;
    const d = allDecos.find(x => x.id === id);
    return d ? { name: d.name, lv: d.level } : null;
  };

  return (
    <Card>
      <CardHead icon="🛡" title="防具 / ARMOR" num="02" />
      {PARTS.map(part => {
        const cur = armor[part];
        return (
          <div className="eq-row" key={part}>
            <div className="eq-slot">{PART_LABEL[part]}</div>
            <div>
              <Field
                value={cur?.piece.id ?? ''}
                options={[{ value: '', label: '—' }, ...optsFor(part).map(a => ({ value: a.id, label: a.name }))]}
                onChange={(id) => { const p = optsFor(part).find(x => x.id === id) ?? null; setArmor(part, p); }}
                small
              />
              {cur && (
                <div className="eq-slots">
                  {cur.piece.slots.map((slotSize, i) => {
                    const deco = decoName(cur.decorations[i]);
                    return (
                      <select
                        key={i}
                        className={`field sm eq-slot-pill ${deco ? '' : 'empty'}`}
                        value={cur.decorations[i] ?? ''}
                        onChange={(e) => setArmorDeco(part, i, e.target.value || null)}
                      >
                        <option value="">— 空き Lv{slotSize}</option>
                        {decoOptsFor(slotSize).map(d =>
                          <option key={d.id} value={d.id}>{d.name} L{d.level}</option>
                        )}
                      </select>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): add ArmorCard with decoration slots"
```

---

## Task 19: SkillsCard（常時スキル一覧 + 条件付きuptime UI）

**Files:**
- Create: `src/components/builder/SkillsCard.tsx`
- Create: `src/utils/aggregateSkills.ts`
- Test: `src/__tests__/utils/aggregateSkills.test.ts`

- [ ] **Step 1: Append uptime CSS**

Append `.uptime`, `.uptime-head`, `.uptime-name`, `.uptime-name .meta` from the reference HTML.

- [ ] **Step 2: Write failing test for skill aggregation**

```ts
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
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm run test:run -- aggregateSkills`
Expected: FAIL.

- [ ] **Step 4: Implement aggregateSkills**

```ts
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
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm run test:run -- aggregateSkills`
Expected: PASS.

- [ ] **Step 6: Create SkillsCard.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Chip } from '../shared/Chip';
import { Slider } from '../shared/Slider';
import { loadDecorations } from '../../data/decorations';
import { loadSkills } from '../../data/skills';
import { useBuildStore } from '../../store/buildStore';
import { aggregateSkills } from '../../utils/aggregateSkills';
import type { Decoration, Skill } from '../../types';

const CONDITIONAL_IDS = ['agitator', 'resentment', 'peak-performance'];
const COND_LABELS: Record<string, string> = {
  agitator: '怒り時', resentment: '被弾後', 'peak-performance': '体力満タン',
};

export function SkillsCard() {
  const armor = useBuildStore(s => s.armor);
  const talisman = useBuildStore(s => s.talisman);
  const uptimes = useBuildStore(s => s.conditionalUptimes);
  const setUptime = useBuildStore(s => s.setConditionalUptime);

  const [decos, setDecos] = useState<Decoration[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    Promise.all([loadDecorations(), loadSkills()]).then(([d, s]) => { setDecos(d); setSkills(s); });
  }, []);

  const active = aggregateSkills(armor, talisman, decos);
  const skillName = (id: string) => skills.find(s => s.id === id)?.name ?? id;

  const passive   = active.filter(s => !CONDITIONAL_IDS.includes(s.skillId));
  const conditional = active.filter(s =>  CONDITIONAL_IDS.includes(s.skillId));

  return (
    <Card>
      <CardHead icon="✦" title="発動スキル / SKILLS" num="03" />
      <div style={{ fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>常時発動</div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {passive.map((s, i) => <Chip key={i} name={skillName(s.skillId)} lv={s.level} />)}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>条件付き（UPTIME）</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conditional.map((s) => {
          const u = uptimes.find(x => x.skillId === s.skillId);
          const pct = u ? Math.round(u.uptime * 100) : 0;
          return (
            <div key={s.skillId} className="uptime">
              <div className="uptime-head">
                <div className="uptime-name">
                  <span style={{ color: 'var(--crit)', fontWeight: 600 }}>{skillName(s.skillId)}</span>
                  <span className="meta">Lv{s.level} · {COND_LABELS[s.skillId] ?? ''}</span>
                </div>
                <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{pct}%</span>
              </div>
              <Slider value={pct} onChange={(v) => setUptime(s.skillId, v / 100)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): add SkillsCard with skill aggregation and uptime sliders"
```

---

## Task 20: MonsterCard

**Files:**
- Create: `src/components/builder/MonsterCard.tsx`

- [ ] **Step 1: Create MonsterCard.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { Field } from '../shared/Field';
import { Toggle } from '../shared/Toggle';
import { loadMonsters } from '../../data/monsters';
import { useTargetStore } from '../../store/targetStore';
import type { Monster } from '../../types';

export function MonsterCard() {
  const { monsterId, partId, enraged, wounded, setMonster, setPart, setEnraged, setWounded } = useTargetStore();
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => {
    loadMonsters().then((m) => {
      setMonsters(m);
      if (!monsterId && m.length > 0) {
        setMonster(m[0].id);
        if (m[0].parts.length > 0) setPart(m[0].parts[0].id);
      }
    });
  }, [monsterId, setMonster, setPart]);

  const monster = monsters.find(m => m.id === monsterId);

  return (
    <Card>
      <CardHead icon="◈" title="対象モンスター / TARGET" num="04" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field
          value={monsterId ?? ''}
          options={monsters.map(m => ({ value: m.id, label: m.name }))}
          onChange={(id) => { setMonster(id); const m = monsters.find(x => x.id === id); if (m?.parts[0]) setPart(m.parts[0].id); }}
        />
        <Field
          value={partId ?? ''}
          options={(monster?.parts ?? []).map(p => ({
            value: p.id,
            label: `${p.name}（物理${p.physical} / ${Object.entries(p.element).map(([k,v])=>`${k}${v}`).join(' ')}）`
          }))}
          onChange={setPart}
        />
      </div>
      <div className="toggle-grid" style={{ marginTop: 10 }}>
        <Toggle label="怒り状態" on={enraged} onChange={setEnraged} />
        <Toggle label="傷口" on={wounded} onChange={setWounded} />
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(ui): add MonsterCard for target selection"
```

---

## Task 21: PatternCard と PatternList

**Files:**
- Create: `src/components/motion/PatternCard.tsx`, `src/components/motion/PatternList.tsx`

- [ ] **Step 1: Append pattern CSS**

Append `.pattern`, `.pattern-head`, `.pattern-name`, `.pattern-seq`, `.pattern-stats`, `.pattern-stat`, `.pattern-stat .lbl`, `.pattern-stat .val` from the reference HTML.

- [ ] **Step 2: Create PatternCard.tsx**

```tsx
import { Chip } from '../shared/Chip';
import { Slider } from '../shared/Slider';
import type { MotionPattern, PatternResult } from '../../types';

interface Props {
  pattern: MotionPattern;
  result?: PatternResult;
  onRatioChange: (v: number) => void;
}

export function PatternCard({ pattern, result, onRatioChange }: Props) {
  const pct = Math.round(pattern.ratio * 100);
  const hasDraw = pattern.motions.some(m => m.isDraw);
  const seq = pattern.motions.map(m => `${m.motionName}(MV${m.motionValue}${m.isDraw ? ',抜刀' : ''})`).join(' → ');
  const damage = result?.damage ?? 0;
  const frames = result?.frames ?? 0;
  const dps = frames > 0 ? Math.round((damage / frames) * 60) : 0;

  return (
    <div className="pattern">
      <div className="pattern-head">
        <div className="pattern-name">
          <span>{pattern.name}</span>
          {hasDraw && <span className="chip draw" style={{ padding: '2px 8px', fontSize: 10.5 }}><span>🗡 抜刀</span></span>}
        </div>
        <span className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="pattern-seq">{seq}</div>
      <Slider value={pct} onChange={(v) => onRatioChange(v / 100)} />
      <div className="pattern-stats">
        <div className="pattern-stat"><span className="lbl">期待ダメージ</span><span className="val num-crit">{damage}</span></div>
        <div className="pattern-stat"><span className="lbl">フレーム</span><span className="val">{frames}F</span></div>
        <div className="pattern-stat"><span className="lbl">貢献DPS</span><span className="val num-accent">{dps}</span></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PatternList.tsx**

```tsx
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { PatternCard } from './PatternCard';
import { useMotionStore } from '../../store/motionStore';
import type { DamageResult } from '../../types';

interface Props { result: DamageResult | null; }

export function PatternList({ result }: Props) {
  const patterns = useMotionStore(s => s.patterns);
  const setRatio = useMotionStore(s => s.setRatio);

  const total = patterns.reduce((s, p) => s + p.ratio, 0);
  const sumPct = Math.round(total * 100);
  const sumGood = sumPct === 100;

  return (
    <Card>
      <CardHead
        icon="▶"
        title="立ち回りパターン / ROTATION"
        num="MAIN"
        meta={
          <span className="mono" style={{ fontSize: 11.5, color: sumGood ? 'var(--good)' : 'var(--accent)', fontWeight: 600 }}>
            {sumGood ? '✓' : '⚠'} 合計 {sumPct}%
          </span>
        }
      />
      {patterns.map((p, i) => (
        <PatternCard
          key={i}
          pattern={p}
          result={result?.patterns[i]}
          onRatioChange={(v) => setRatio(i, v)}
        />
      ))}
      <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>＋ パターンを追加（Plan 2で実装）</button>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): add PatternCard and PatternList components"
```

---

## Task 22: HeroResult（DPS表示 + tween）と BreakdownCard

**Files:**
- Create: `src/components/result/HeroResult.tsx`, `src/components/result/BreakdownCard.tsx`

- [ ] **Step 1: Append hero/breakdown CSS**

Append `.hero`, `.hero::before`, `.hero-inner`, `.hero-label`, `.hero-dps`, `.hero-dps .unit`, `.hero-delta`, `.hero-stats`, `.hero-stat`, `.hero-stat .l`, `.hero-stat .v`, `.breakdown-row`, `.breakdown-row .name`, `.breakdown-row .dot`, `.breakdown-row .name-text`, `.breakdown-row .name-pct`, `.breakdown-row .val`, `.breakdown-bar`, `.breakdown-bar > span` from the reference HTML.

- [ ] **Step 2: Create useTween hook**

Create `src/utils/useTween.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

export function useTween(target: number, ms = 320): number {
  const [val, setVal] = useState(target);
  const ref = useRef({ from: target, to: target, t0: 0, raf: 0 });
  useEffect(() => {
    cancelAnimationFrame(ref.current.raf);
    ref.current.from = val;
    ref.current.to = target;
    ref.current.t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - ref.current.t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = ref.current.from + (ref.current.to - ref.current.from) * e;
      setVal(v);
      if (k < 1) ref.current.raf = requestAnimationFrame(tick);
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}
```

- [ ] **Step 3: Create HeroResult.tsx**

```tsx
import { useTween } from '../../utils/useTween';
import type { DamageResult } from '../../types';

interface Props { result: DamageResult | null; }

export function HeroResult({ result }: Props) {
  const dps = result?.expectedDPS ?? 0;
  const tweened = useTween(dps);
  if (!result) return <div className="hero">計算結果なし</div>;

  return (
    <div className="hero lift">
      <div className="hero-inner">
        <div className="hero-label">立ち回り期待DPS</div>
        <div className="hero-dps">
          <span>{tweened.toFixed(1)}</span>
          <span className="unit">DMG / s</span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="l">物理期待値</span><span className="v num-crit">{result.physicalAvg}</span></div>
          <div className="hero-stat"><span className="l">属性期待値</span><span className="v num-elem">+{result.elementAvg}</span></div>
          <div className="hero-stat"><span className="l">実効会心率</span><span className="v num-good">{Math.round(result.effectiveAffinity * 100)}%</span></div>
          <div className="hero-stat"><span className="l">会心期待係数</span><span className="v">×{result.critCoefficient.toFixed(3)}</span></div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create BreakdownCard.tsx**

```tsx
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import type { DamageResult } from '../../types';

const DOTS = ['var(--accent)', 'var(--crit)', 'var(--purple)', 'var(--elem)'];

interface Props { result: DamageResult | null; }

export function BreakdownCard({ result }: Props) {
  if (!result) return null;
  const patterns = result.patterns;
  const totalRatio = patterns.reduce((s, p) => s + p.ratio, 0) || 1;

  return (
    <Card>
      <CardHead icon="▤" title="パターン別内訳" />
      <div className="breakdown-bar">
        {patterns.map((p, i) => (
          <span key={i} style={{ width: `${(p.ratio / totalRatio) * 100}%`, background: DOTS[i % DOTS.length] }} />
        ))}
      </div>
      <div style={{ marginTop: 4 }}>
        {patterns.map((p, i) => {
          const contributionDps = p.frames > 0 ? (p.damage / p.frames * 60 * (p.ratio / totalRatio)) : 0;
          return (
            <div key={i} className="breakdown-row">
              <div className="name">
                <div className="dot" style={{ background: DOTS[i % DOTS.length] }} />
                <span className="name-text">{p.name}</span>
                <span className="name-pct mono">{Math.round(p.ratio * 100)}%</span>
              </div>
              <span className="val mono">{contributionDps.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add HeroResult with tween and BreakdownCard"
```

---

## Task 23: 計算式タブ（FormulaTab）

**Files:**
- Create: `src/components/formula/FormulaTab.tsx`

- [ ] **Step 1: Append formula CSS**

Append `.formula-wrap`, `.formula-box`, `.formula-box .var`, `.formula-box .var-cond`, `.formula-box .comment`, `.formula-step`, `.formula-step:first-of-type`, `.formula-step .num`, `.formula-step .ln` from the reference HTML.

- [ ] **Step 2: Create FormulaTab.tsx**

Port the `FormulaTab` component from `docs/references/app.jsx` lines 319-369, converting JSX/JS to TSX. Use the `steps` array verbatim and render to typed React elements. Wrap in `<div className="formula-wrap">`.

```tsx
export function FormulaTab() {
  const steps = [
    { n: '01', label: '攻撃力期待値の合成', body: (<>
      <span className="var">武器攻撃力</span> + <span className="var">攻撃スキル補正</span> + <span className="var">アイテムバフ</span> + Σ <span className="var-cond">条件付き補正</span> × <span className="var-cond">発動時間割合</span><br/>
      <span className="comment">// 鬼人薬・粉塵などのフラットバフを加算</span>
    </>)},
    { n: '02', label: '会心率期待値', body: (<>
      <span className="var">武器会心率</span> + <span className="var">見切り</span> + <span className="var">弱点特効</span> + <span className="var">抜刀術【技】</span> + Σ<span className="var-cond">条件付き会心</span>×<span className="var-cond">uptime</span><br/>
      <span className="comment">// -1.00 〜 +1.00 にクランプ。弱点特効は肉質 ≥ 45 のみ</span>
    </>)},
    { n: '03', label: '会心期待係数', body: (<>
      1 + <span className="var">会心率期待値</span> × (<span className="var">会心倍率</span> − 1)<br/>
      <span className="comment">// 通常 1.25 / 超会心 1.40 / マイナス会心 0.75</span>
    </>)},
    { n: '04', label: '物理ダメージ', body: (<>
      <span className="var">攻撃力</span> ÷ <span className="var">武器係数</span> × (<span className="var">モーション値</span>÷100) × <span className="var">斬れ味補正</span> × <span className="var">会心期待係数</span> × <span className="var">武器固有補正</span> × (<span className="var">物理肉質</span>÷100)
    </>)},
    { n: '05', label: '属性ダメージ', body: (<>
      <span className="var">武器属性値</span> × <span className="var">属性スキル補正</span> × <span className="var">斬れ味補正(属性)</span> × <span className="var">属性会心期待係数</span> × (<span className="var">属性肉質</span>÷100)<br/>
      <span className="comment">// 会心撃【属性】発動時 ×1.35</span>
    </>)},
    { n: '06', label: 'パターン総ダメージ・フレーム', body: (<>
      パターン総ダメージ = floor((<span className="var">Σ物理</span> + <span className="var">Σ属性</span>) × <span className="var">全体防御率</span>)<br/>
      パターン総フレーム = Σ <span className="var">モーションフレーム数</span>
    </>)},
    { n: '07', label: '立ち回り期待DPS', body: (<>
      Σ(<span className="var">パターン総ダメージ</span> × <span className="var">パターン割合</span>) ÷ Σ(<span className="var">パターン総フレーム</span> × <span className="var">パターン割合</span>) × 60
    </>)},
  ];
  return (
    <div className="formula-wrap">
      <div className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>ダメージ計算ロジック</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>このアプリで使用している計算式の全貌です。各変数は日本語表記。</div>
        </div>
        {steps.map(s => (
          <div key={s.n}>
            <div className="formula-step">
              <span className="num mono">{s.n}</span>
              <span>{s.label}</span>
              <span className="ln" />
            </div>
            <div className="formula-box">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): add FormulaTab for calculation reference"
```

---

## Task 24: テーマタブ（ThemeTab）

**Files:**
- Create: `src/components/theme/ThemeTab.tsx`

- [ ] **Step 1: Create ThemeTab.tsx**

Port from `docs/references/app.jsx` lines 372-468. Convert to TSX, hook up to `useThemeStore`.

```tsx
import { useThemeStore } from '../../store/themeStore';
import type { ThemeId } from '../../types';

interface ThemeDef {
  id: ThemeId; name: string; sub: string; desc: string; swatches: string[];
}

const THEMES: ThemeDef[] = [
  { id: 'ember', name: 'Ember', sub: '琥珀色のアクセント / ダーク',
    desc: '初期テーマ。落ち着いた暖色アクセントとクールなニュートラル背景。長時間の利用に最適。',
    swatches: ['oklch(0.16 0.008 65)','oklch(0.20 0.008 65)','oklch(0.76 0.16 55)','oklch(0.83 0.14 75)','oklch(0.87 0.16 90)'] },
  { id: 'aurora', name: 'Aurora', sub: 'シアン × バイオレット / ダーク',
    desc: '寒色系。深いブルーブラックを背景に、シアンと紫のグラデーションが映える。',
    swatches: ['oklch(0.15 0.022 260)','oklch(0.19 0.024 260)','oklch(0.78 0.15 220)','oklch(0.80 0.14 290)','oklch(0.85 0.13 200)'] },
  { id: 'forest', name: 'Forest', sub: 'エメラルド × ティール / ダーク',
    desc: 'ハイコントラストな緑系アクセント。属性ダメージや会心値の視認性が高い。',
    swatches: ['oklch(0.15 0.012 165)','oklch(0.19 0.012 165)','oklch(0.74 0.16 160)','oklch(0.82 0.14 145)','oklch(0.86 0.15 105)'] },
  { id: 'solar', name: 'Solar', sub: '紙のような暖白 / ライトモード',
    desc: '日中・明るい部屋向けの暖色ライトモード。エディトリアル誌面のような可読性。',
    swatches: ['oklch(0.97 0.005 70)','oklch(0.99 0.004 70)','oklch(0.62 0.18 35)','oklch(0.70 0.16 55)','oklch(0.65 0.18 60)'] },
];

export function ThemeTab() {
  const current = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);

  return (
    <div className="formula-wrap" style={{ maxWidth: 1080 }}>
      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>テーマカラー設定</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>4つのプリセットから選択できます。設定はそのまま保存されます。</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {THEMES.map(th => {
          const active = current === th.id;
          return (
            <div key={th.id} className="card lift" onClick={() => setTheme(th.id)}
              style={{ cursor: 'pointer', padding: 18,
                borderColor: active ? 'var(--accent-line)' : undefined,
                boxShadow: active ? '0 0 0 1px var(--accent-line), 0 12px 30px -16px color-mix(in oklch, var(--accent) 50%, transparent)' : undefined,
                background: `linear-gradient(165deg, ${th.swatches[1]} 0%, color-mix(in oklch, ${th.swatches[2]} 12%, ${th.swatches[1]}) 100%)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.97 0.004 65)', letterSpacing: '-0.01em' }}>{th.name}</div>
                  <div style={{ fontSize: 11, color: 'oklch(0.70 0.012 65)', marginTop: 3 }}>{th.sub}</div>
                </div>
                {active && (
                  <div className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 999, background: th.swatches[2], color: 'white' }}>USING</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {th.swatches.map((c, i) => (
                  <div key={i} style={{ flex: 1, height: 32, borderRadius: 6, background: c, boxShadow: 'inset 0 0 0 1px color-mix(in oklch, white 8%, transparent)' }} />
                ))}
              </div>
              <div style={{ fontSize: 11.5, color: 'oklch(0.72 0.012 65)', lineHeight: 1.55 }}>{th.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(ui): add ThemeTab with 4-theme card preview"
```

---

## Task 25: App統合 — 計算機ページ完成

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/components/builder/DefaultPatternsInit.tsx`（or inline in App）

- [ ] **Step 1: Append page layout CSS**

Append `.page`, `.col`, `.col-result`, the two media queries (`@media (max-width: 1180px)`, `@media (max-width: 820px)`) from the reference HTML.

- [ ] **Step 2: Replace src/App.tsx**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { WeaponCard } from './components/builder/WeaponCard';
import { ArmorCard } from './components/builder/ArmorCard';
import { SkillsCard } from './components/builder/SkillsCard';
import { MonsterCard } from './components/builder/MonsterCard';
import { PatternList } from './components/motion/PatternList';
import { HeroResult } from './components/result/HeroResult';
import { BreakdownCard } from './components/result/BreakdownCard';
import { FormulaTab } from './components/formula/FormulaTab';
import { ThemeTab } from './components/theme/ThemeTab';
import { useBuildStore } from './store/buildStore';
import { useMotionStore } from './store/motionStore';
import { useTargetStore } from './store/targetStore';
import { useThemeStore } from './store/themeStore';
import { aggregateSkills } from './utils/aggregateSkills';
import { loadDecorations } from './data/decorations';
import { loadMonsters } from './data/monsters';
import { getMotionsFor } from './data/motions';
import { calcDamage } from './calc';
import type { DamageResult, Decoration, Monster, Motion } from './types';

function CalcPage({ result }: { result: DamageResult | null }) {
  return (
    <div className="page">
      <div className="col">
        <WeaponCard />
        <ArmorCard />
        <SkillsCard />
      </div>
      <div className="col">
        <PatternList result={result} />
        <MonsterCard />
      </div>
      <div className="col col-result">
        <HeroResult result={result} />
        <BreakdownCard result={result} />
      </div>
    </div>
  );
}

export default function App() {
  const weapon = useBuildStore(s => s.weapon);
  const armor = useBuildStore(s => s.armor);
  const talisman = useBuildStore(s => s.talisman);
  const conditionalUptimes = useBuildStore(s => s.conditionalUptimes);
  const patterns = useMotionStore(s => s.patterns);
  const addPattern = useMotionStore(s => s.addPattern);
  const { monsterId, partId, enraged, wounded } = useTargetStore();
  const hydrate = useThemeStore(s => s.hydrate);

  const [decos, setDecos] = useState<Decoration[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    Promise.all([loadDecorations(), loadMonsters()]).then(([d, m]) => { setDecos(d); setMonsters(m); });
  }, []);

  // Seed default patterns on first weapon load
  useEffect(() => {
    if (!weapon || patterns.length > 0) return;
    getMotionsFor(weapon.type).then((all: Motion[]) => {
      if (all.length === 0) return;
      const find = (name: string) => all.find(m => m.motionName === name);
      const draw = find('居合抜刀気刃斬り');
      const oni  = find('鬼人斬り');
      const aka  = find('縦斬り');
      const helm = find('気刃兜割');
      if (draw && oni) addPattern({ name: '居合抜刀鬼人斬り', ratio: 0.5, motions: [draw, oni, oni] });
      if (aka  && oni) addPattern({ name: '赤刃 + 鬼人斬り',  ratio: 0.45, motions: [aka, oni] });
      if (helm)        addPattern({ name: '兜割',              ratio: 0.05, motions: [helm] });
    });
  }, [weapon, patterns.length, addPattern]);

  const result: DamageResult | null = useMemo(() => {
    if (!weapon || !monsterId || !partId) return null;
    const monster = monsters.find(m => m.id === monsterId);
    if (!monster) return null;
    const passive = aggregateSkills(armor, talisman, decos);
    return calcDamage({
      weapon,
      passiveSkills: passive,
      conditionalUptimes,
      buffs: [],
      motionPatterns: patterns,
      target: { monster, partId, enraged, wounded },
    });
  }, [weapon, armor, talisman, decos, conditionalUptimes, patterns, monsters, monsterId, partId, enraged, wounded]);

  return (
    <AppLayout
      calc={<CalcPage result={result} />}
      formula={<FormulaTab />}
      theme={<ThemeTab />}
    />
  );
}
```

- [ ] **Step 3: Confirm src/main.tsx imports the CSS**

`src/main.tsx` should contain `import './index.css'` (Vite default).

- [ ] **Step 4: Smoke test in dev**

Run: `npm run dev`
Open http://localhost:5173. Verify:
- Default weapon (業物【神流】) loads
- Default armor selectable in each slot
- 3 default motion patterns appear (50% / 45% / 5%)
- HeroResult shows a non-zero DPS that tweens on change
- Sliding a pattern ratio changes DPS
- Tab switching (計算機 / 計算式 / テーマ) works
- Switching theme persists across reload

Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): integrate full MVP — calc + formula + theme tabs"
```

---

## Task 26: 全テスト実行と最終チェック

- [ ] **Step 1: Run all tests**

Run: `npm run test:run`
Expected: all calc, store, util tests pass.

- [ ] **Step 2: Type-check the build**

Run: `npm run build`
Expected: TypeScript compiles cleanly and Vite produces `dist/`.

- [ ] **Step 3: Preview the production build**

Run: `npm run preview`
Open the printed URL. Verify the same smoke checks from Task 25 Step 4 still pass.

- [ ] **Step 4: Final commit and tag**

```bash
git add -A
git commit -m "chore: MVP feature-complete" --allow-empty
git tag v0.1.0-mvp
```

---

## Plan 1 完了基準

- [ ] 太刀1武器・装備5部位・モンスター1体で計算が完動する
- [ ] 装飾品・護石（プリセット選択のみ。鑑定護石カスタムスキル入力はPlan 2）でスキルが集計される
- [ ] 条件付きスキル（挑戦者・逆襲）の uptime スライダーが期待ダメージに反映される
- [ ] 立ち回りパターン3種が割合スライダーで調整可能
- [ ] HeroResult が tween し、内訳バーがパターン構成を表示する
- [ ] 計算式タブが7ステップを表示する
- [ ] テーマタブで4テーマ切替＋ Dexie に永続化される
- [ ] `npm run test:run` で全calc/store/utilテストが green
- [ ] `npm run build` が成功する

---

## Plan 2 / Plan 3 への引き継ぎ事項

- **Plan 2（出力・共有）:** PNG/JSON/テキスト I/O、鑑定護石のカスタムスキル入力UI、パターン追加・削除UI
- **Plan 3（全武器・特殊機構・PWA）:** 残り13武器種、遠距離武器計算、Wilds固有機構（傷つけ・集中攻撃・操虫棍弱点集中・狩猟笛音波・砲撃）、PWA設定、Capacitor準備
