# Plan C: I/O + Pattern Editing UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** パターン編集 UI（追加・複製・削除・モーション選択モーダル）と JSON/テキスト/PNG エクスポート＆インポート機能を実装する。

**Architecture:** ストア拡張（motionStore: duplicatePattern/setPatterns、targetStore: setAll）→ io/ モジュール（snapshot.ts・textExport.ts・pngExport.ts）→ UI コンポーネント（MotionPickerModal・ExportPanel）→ PatternCard/PatternList への配線の順に積み上げる。各レイヤーが独立しているため TDD で進めやすい。

**Tech Stack:** React 19 + Vite + TypeScript + Zustand 5 + Vitest + html2canvas（新規インストール）

---

## ファイル構成

| 役割 | パス |
|------|------|
| ストア拡張 | `src/store/motionStore.ts`（modify） / `src/store/targetStore.ts`（modify） |
| スナップショット型・ビルド・パース・適用 | `src/io/snapshot.ts`（create） |
| テキストエクスポート | `src/io/textExport.ts`（create） |
| PNG エクスポート | `src/io/pngExport.ts`（create） |
| エクスポート/インポート UI | `src/components/io/ExportPanel.tsx`（create） |
| モーション選択モーダル | `src/components/motion/MotionPickerModal.tsx`（create） |
| パターンカード（編集/複製/削除ボタン追加） | `src/components/motion/PatternCard.tsx`（modify） |
| パターンリスト（配線・モーダル制御・ExportPanel） | `src/components/motion/PatternList.tsx`（modify） |
| CSS 追加（モーダル・btn-icon・btn-sm・input） | `src/index.css`（modify） |
| result-panel ID 付与（PNG 対象要素） | `src/App.tsx`（modify） |
| テスト: ストア | `src/__tests__/store/motionStore.test.ts`（create） |
| テスト: snapshot | `src/__tests__/io/snapshot.test.ts`（create） |
| テスト: textExport | `src/__tests__/io/textExport.test.ts`（create） |

---

## 既存コードの重要な情報（subagent 向け）

### 型定義（src/types/index.ts より抜粋）
```ts
export interface MotionPattern { name: string; motions: Motion[]; ratio: number; }
export interface Motion {
  motionName: string; motionValue: number; frames: number; isDraw: boolean;
  tags?: MotionTag[]; damageType?: DamageType;
}
export interface ActiveSkill { skillId: string; level: number; uptime?: number; }
export interface WeaponInput {
  type: WeaponType; attack: number; affinity: number;
  element: Element | null; sharpness: SharpnessColor;
  elementCap?: number;
  gunlanceShell?: { type: GunlanceShellType; level: number };
  bowBins?: BowBinType[]; bowgunAmmo?: BowgunAmmoType[];
  chargeBladeBin?: ChargeBladeBin; switchAxeBin?: SwitchAxeBin;
}
export interface DamageResult {
  expectedDPS: number; physicalAvg: number; elementAvg: number;
  effectiveAffinity: number; critCoefficient: number; defenseRate: number;
  patterns: PatternResult[];
}
export interface PatternResult { name: string; damage: number; frames: number; ratio: number; }
```

### 現在のストア状態
- `useMotionStore`: `patterns`, `addPattern`, `updatePattern`, `removePattern`, `setRatio`
  - **不足**: `duplicatePattern`, `setPatterns` → Task 1 で追加
- `useTargetStore`: `monsterId`, `variantId`, `partId`, `enraged`, `wounded`, `defenseRateOverride` + 各 setter
  - **不足**: 一括セット用 `setAll` → Task 1 で追加
- `useWeaponStore`: `weapon`, `setWeapon(w)` ✅
- `useSkillStore`: `skills`, `setAll(skills)` ✅
- `useBuffStore`: `selected`, `setSelected(ids)` ✅

### データローダー
```ts
// src/data/motions.ts
export async function getMotionsFor(type: WeaponType): Promise<Motion[]>
```

### CSS 変数（index.css より）
```
--bg-0/1/2/3, --line, --line-strong
--text-1/2/3/4, --accent, --accent-soft, --accent-line
--rad-card (14px), --rad-ctl (8px)
```
既存クラス: `.btn`, `.btn-primary`, `.card`, `.pattern`, `.field`（select 用・矢印アイコン付き）

---

## Task 1: ストア拡張（motionStore + targetStore）

**Files:**
- Modify: `src/store/motionStore.ts`
- Modify: `src/store/targetStore.ts`
- Create: `src/__tests__/store/motionStore.test.ts`

---

- [ ] **Step 1: テストを書く（失敗確認用）**

```ts
// src/__tests__/store/motionStore.test.ts
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
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
npx vitest run src/__tests__/store/motionStore.test.ts
```
期待: `duplicatePattern is not a function`（または `setPatterns is not a function`）でFAIL

- [ ] **Step 3: motionStore に duplicatePattern と setPatterns を追加する**

`src/store/motionStore.ts` を以下で全体置き換え:

```ts
import { create } from 'zustand';
import type { MotionPattern } from '../types';

interface MotionStore {
  patterns: MotionPattern[];
  addPattern: (p: MotionPattern) => void;
  updatePattern: (idx: number, patch: Partial<MotionPattern>) => void;
  removePattern: (idx: number) => void;
  setRatio: (idx: number, ratio: number) => void;
  duplicatePattern: (idx: number) => void;
  setPatterns: (patterns: MotionPattern[]) => void;
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
  duplicatePattern: (idx) => set((s) => {
    const src = s.patterns[idx];
    if (!src) return s;
    const copy: MotionPattern = {
      ...src,
      name: `${src.name} (コピー)`,
      motions: [...src.motions],
    };
    return { patterns: [...s.patterns, copy] };
  }),
  setPatterns: (patterns) => set({ patterns }),
}));
```

- [ ] **Step 4: テストがパスすることを確認する**

```bash
npx vitest run src/__tests__/store/motionStore.test.ts
```
期待: 3/3 PASS

- [ ] **Step 5: targetStore に TargetSnapshot 型と setAll を追加する**

`src/store/targetStore.ts` を以下で全体置き換え:

```ts
import { create } from 'zustand';

export interface TargetSnapshot {
  monsterId: string | null;
  variantId: string | null;
  partId: string | null;
  enraged: boolean;
  wounded: boolean;
  defenseRateOverride: number | null;
}

interface TargetStore extends TargetSnapshot {
  setMonster: (id: string) => void;
  setVariant: (id: string) => void;
  setPart:    (id: string) => void;
  setEnraged: (b: boolean) => void;
  setWounded: (b: boolean) => void;
  setDefenseRateOverride: (v: number | null) => void;
  setAll: (t: TargetSnapshot) => void;
}

export const useTargetStore = create<TargetStore>((set) => ({
  monsterId: null,
  variantId: null,
  partId: null,
  enraged: false,
  wounded: false,
  defenseRateOverride: null,
  setMonster: (id) => set({ monsterId: id, variantId: null, partId: null }),
  setVariant: (id) => set({ variantId: id }),
  setPart:    (id) => set({ partId: id }),
  setEnraged: (b)  => set({ enraged: b }),
  setWounded: (b)  => set({ wounded: b }),
  setDefenseRateOverride: (v) => set({ defenseRateOverride: v }),
  setAll: (t) => set(t),
}));
```

- [ ] **Step 6: 全テストがパスすることを確認する**

```bash
npx vitest run
```
期待: 既存テストすべて含め全 PASS

- [ ] **Step 7: コミットする**

```bash
git add src/store/motionStore.ts src/store/targetStore.ts src/__tests__/store/motionStore.test.ts
git commit -m "feat: extend stores — duplicatePattern, setPatterns, targetStore.setAll"
```

---

## Task 2: AppSnapshot 型 + buildSnapshot + parseSnapshot + applySnapshot

**Files:**
- Create: `src/io/snapshot.ts`
- Create: `src/__tests__/io/snapshot.test.ts`

---

- [ ] **Step 1: テストを書く**

```ts
// src/__tests__/io/snapshot.test.ts
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
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
npx vitest run src/__tests__/io/snapshot.test.ts
```
期待: `Cannot find module '../../io/snapshot'` でFAIL

- [ ] **Step 3: src/io/snapshot.ts を作成する**

```ts
// src/io/snapshot.ts
import type { WeaponInput, ActiveSkill, MotionPattern } from '../types';
import type { TargetSnapshot } from '../store/targetStore';
import { useWeaponStore } from '../store/weaponStore';
import { useSkillStore } from '../store/skillStore';
import { useBuffStore } from '../store/buffStore';
import { useMotionStore } from '../store/motionStore';
import { useTargetStore } from '../store/targetStore';

export interface AppSnapshot {
  version: 1;
  weapon: WeaponInput;
  skills: ActiveSkill[];
  buffs: string[];
  patterns: MotionPattern[];
  target: TargetSnapshot;
}

export function buildSnapshot(): AppSnapshot {
  const { weapon } = useWeaponStore.getState();
  const { skills } = useSkillStore.getState();
  const { selected: buffs } = useBuffStore.getState();
  const { patterns } = useMotionStore.getState();
  const { monsterId, variantId, partId, enraged, wounded, defenseRateOverride } =
    useTargetStore.getState();
  return {
    version: 1,
    weapon,
    skills,
    buffs,
    patterns,
    target: { monsterId, variantId, partId, enraged, wounded, defenseRateOverride },
  };
}

export function parseSnapshot(json: unknown): AppSnapshot {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Invalid snapshot: not an object');
  }
  const snap = json as Record<string, unknown>;
  if (snap['version'] !== 1) {
    throw new Error(`Unsupported snapshot version: ${snap['version']}`);
  }
  if (!snap['weapon'] || !snap['skills'] || !snap['patterns'] || !snap['target']) {
    throw new Error('Invalid snapshot: missing required fields (weapon, skills, patterns, target)');
  }
  return snap as unknown as AppSnapshot;
}

export function applySnapshot(snap: AppSnapshot): void {
  useWeaponStore.getState().setWeapon(snap.weapon);
  useSkillStore.getState().setAll(snap.skills);
  useBuffStore.getState().setSelected(snap.buffs);
  useMotionStore.getState().setPatterns(snap.patterns);
  useTargetStore.getState().setAll(snap.target);
}
```

- [ ] **Step 4: テストがパスすることを確認する**

```bash
npx vitest run src/__tests__/io/snapshot.test.ts
```
期待: 12/12 PASS

- [ ] **Step 5: 全テストがパスすることを確認する**

```bash
npx vitest run
```
期待: 全 PASS

- [ ] **Step 6: コミットする**

```bash
git add src/io/snapshot.ts src/__tests__/io/snapshot.test.ts
git commit -m "feat: add AppSnapshot — buildSnapshot, parseSnapshot, applySnapshot"
```

---

## Task 3: テキストエクスポート + PNG エクスポート

**Files:**
- Create: `src/io/textExport.ts`
- Create: `src/io/pngExport.ts`
- Create: `src/__tests__/io/textExport.test.ts`
- Modify: `package.json`（html2canvas インストール）

---

- [ ] **Step 1: テキストエクスポートのテストを書く**

```ts
// src/__tests__/io/textExport.test.ts
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
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
npx vitest run src/__tests__/io/textExport.test.ts
```
期待: `Cannot find module '../../io/textExport'` でFAIL

- [ ] **Step 3: src/io/textExport.ts を作成する**

```ts
// src/io/textExport.ts
import type { AppSnapshot } from './snapshot';
import type { DamageResult } from '../types';

export function buildTextSummary(snap: AppSnapshot, result: DamageResult | null): string {
  const lines: string[] = [];
  lines.push('=== MH Wilds ダメージ計算結果 ===');
  lines.push('');

  const w = snap.weapon;
  const affSign = w.affinity >= 0 ? '+' : '';
  lines.push(`[武器]`);
  lines.push(`  種別    : ${w.type}`);
  lines.push(`  攻撃力  : ${w.attack}`);
  lines.push(`  会心率  : ${affSign}${w.affinity}%`);
  lines.push(`  斬れ味  : ${w.sharpness}`);
  if (w.element) {
    lines.push(`  属性    : ${w.element.type} ${w.element.value}`);
  }
  lines.push('');

  if (snap.skills.length > 0) {
    lines.push(`[スキル]`);
    for (const s of snap.skills) {
      const uptime = s.uptime !== undefined ? ` (発動率 ${Math.round(s.uptime * 100)}%)` : '';
      lines.push(`  ${s.skillId} Lv${s.level}${uptime}`);
    }
    lines.push('');
  }

  if (snap.buffs.length > 0) {
    lines.push(`[バフ]`);
    for (const b of snap.buffs) {
      lines.push(`  ${b}`);
    }
    lines.push('');
  }

  if (result) {
    lines.push(`[計算結果]`);
    lines.push(`  期待DPS         : ${result.expectedDPS.toFixed(1)}`);
    lines.push(`  有効会心率      : ${Math.round(result.effectiveAffinity * 100)}%`);
    lines.push(`  会心係数        : ${result.critCoefficient.toFixed(3)}`);
    lines.push(`  全体防御率      : ${result.defenseRate.toFixed(2)}`);
    lines.push(`  物理平均ダメージ: ${result.physicalAvg.toFixed(1)}`);
    lines.push(`  属性平均ダメージ: ${result.elementAvg.toFixed(1)}`);
    lines.push('');
    lines.push(`[パターン別]`);
    for (const p of result.patterns) {
      const dps = p.frames > 0 ? Math.round((p.damage / p.frames) * 60) : 0;
      lines.push(`  ${p.name} (${Math.round(p.ratio * 100)}%): ${p.damage}dmg / ${p.frames}F / 貢献DPS ${dps}`);
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: テストがパスすることを確認する**

```bash
npx vitest run src/__tests__/io/textExport.test.ts
```
期待: 8/8 PASS

- [ ] **Step 5: html2canvas をインストールする**

```bash
npm install html2canvas
npm install --save-dev @types/html2canvas
```

- [ ] **Step 6: src/io/pngExport.ts を作成する**

（pngExport は DOM API に依存するため Vitest でのユニットテストは省略。実動作は Step 9 の統合確認で行う。）

```ts
// src/io/pngExport.ts
import html2canvas from 'html2canvas';

/**
 * 指定 ID の DOM 要素を PNG としてダウンロードする。
 * @param elementId  - スクリーンショット対象要素の id 属性値
 * @param filename   - ダウンロードファイル名（デフォルト: 'mhwilds-result.png'）
 */
export async function exportPng(
  elementId: string,
  filename = 'mhwilds-result.png',
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error(`exportPng: element #${elementId} not found`);
  }
  const canvas = await html2canvas(el, {
    useCORS: true,
    scale: 2,
    backgroundColor: null,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

- [ ] **Step 7: 全テストがパスすることを確認する**

```bash
npx vitest run
```
期待: 全 PASS

- [ ] **Step 8: コミットする**

```bash
git add src/io/textExport.ts src/io/pngExport.ts src/__tests__/io/textExport.test.ts package.json package-lock.json
git commit -m "feat: add textExport, pngExport (html2canvas), tests"
```

---

## Task 4: MotionPickerModal コンポーネント

**Files:**
- Create: `src/components/motion/MotionPickerModal.tsx`
- Modify: `src/index.css`（モーダル用 CSS + 汎用クラス追加）

このコンポーネントは DOM に依存する UI のためユニットテストは省略し、Task 5 の統合確認で動作検証する。

---

- [ ] **Step 1: CSS を追加する（index.css 末尾に追記）**

`src/index.css` の末尾（`/* ───── ANIMATIONS ─────*/` ブロックの後）に以下を追加:

```css
/* ───── INPUT (text) ───── */
.input {
  background: color-mix(in oklch, var(--bg-0) 70%, transparent);
  border: 1px solid var(--line);
  border-radius: var(--rad-ctl);
  padding: 7px 11px;
  color: var(--text-1);
  width: 100%;
  font-size: 12.5px;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

/* ───── BUTTON VARIANTS ───── */
.btn-sm {
  padding: 5px 10px;
  font-size: 11.5px;
}
.btn-icon {
  padding: 4px 7px;
  font-size: 12px;
  min-width: 0;
  border-radius: 6px;
  color: var(--text-3);
  line-height: 1;
}
.btn-icon:hover { color: var(--text-1); }
.btn-danger { color: oklch(0.70 0.18 25); }
.btn-danger:hover {
  background: color-mix(in oklch, oklch(0.62 0.20 25) 12%, transparent);
  border-color: color-mix(in oklch, oklch(0.62 0.20 25) 38%, transparent);
  color: oklch(0.78 0.20 25);
}

/* ───── EXPORT PANEL ───── */
.export-panel {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px 0 2px;
  border-top: 1px solid var(--line);
  margin-top: 6px;
}

/* ───── MODAL ───── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.modal {
  background: var(--bg-1);
  border: 1px solid var(--line-strong);
  border-radius: var(--rad-card);
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px -16px rgba(0,0,0,0.6);
  overflow: hidden;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
  font-weight: 600;
  flex-shrink: 0;
}
.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal-label {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.modal-field-label {
  font-size: 11.5px;
  color: var(--text-2);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
  flex-shrink: 0;
}
.motion-available {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.motion-available-item {
  background: color-mix(in oklch, var(--bg-0) 50%, transparent);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 11.5px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  color: var(--text-2);
  transition: all 0.12s;
}
.motion-available-item:hover {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  color: var(--text-1);
}
.motion-seq-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 36px;
  padding: 8px;
  background: color-mix(in oklch, var(--bg-0) 40%, transparent);
  border: 1px dashed var(--line);
  border-radius: 8px;
}
.motion-seq-chip {
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  color: var(--text-1);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.12s;
}
.motion-seq-chip:hover {
  background: color-mix(in oklch, oklch(0.62 0.20 25) 12%, transparent);
  border-color: color-mix(in oklch, oklch(0.62 0.20 25) 38%, transparent);
}
.motion-seq-empty {
  font-size: 11px;
  color: var(--text-4);
  align-self: center;
}
.ratio-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ratio-row input[type="range"] {
  flex: 1;
}
.ratio-pct {
  min-width: 42px;
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  font-feature-settings: 'tnum';
}
```

- [ ] **Step 2: MotionPickerModal を作成する**

```tsx
// src/components/motion/MotionPickerModal.tsx
import { useState, useEffect } from 'react';
import type { Motion, MotionPattern, WeaponType } from '../../types';
import { getMotionsFor } from '../../data/motions';

interface Props {
  open: boolean;
  initialPattern?: MotionPattern;
  weaponType: WeaponType;
  onConfirm: (pattern: MotionPattern) => void;
  onClose: () => void;
}

export function MotionPickerModal({ open, initialPattern, weaponType, onConfirm, onClose }: Props) {
  const [name, setName] = useState('');
  const [ratio, setRatio] = useState(0.33);
  const [sequence, setSequence] = useState<Motion[]>([]);
  const [available, setAvailable] = useState<Motion[]>([]);

  // モーダルが開くたびに初期値をリセット
  useEffect(() => {
    if (!open) return;
    setName(initialPattern?.name ?? '');
    setRatio(initialPattern?.ratio ?? 0.33);
    setSequence(initialPattern ? [...initialPattern.motions] : []);
    getMotionsFor(weaponType).then(setAvailable);
  }, [open, weaponType, initialPattern]);

  if (!open) return null;

  const addMotion = (m: Motion) => setSequence(prev => [...prev, m]);
  const removeMotion = (idx: number) => setSequence(prev => prev.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    if (!name.trim() || sequence.length === 0) return;
    onConfirm({ name: name.trim(), ratio, motions: sequence });
    onClose();
  };

  const ratioPct = Math.round(ratio * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-head">
          <span>{initialPattern ? 'パターンを編集' : 'パターンを追加'}</span>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 名前 */}
          <label className="modal-field-label">
            パターン名
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例: 居合抜刀コンボ"
              autoFocus
            />
          </label>

          {/* 比率 */}
          <div>
            <div className="modal-label">比率</div>
            <div className="ratio-row">
              <input
                type="range" min={1} max={100} value={ratioPct}
                onChange={e => setRatio(Number(e.target.value) / 100)}
              />
              <span className="ratio-pct">{ratioPct}%</span>
            </div>
          </div>

          {/* 利用可能なモーション */}
          <div>
            <div className="modal-label">利用可能モーション（クリックで追加）</div>
            <div className="motion-available">
              {available.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>読み込み中...</span>
              )}
              {available.map(m => (
                <button
                  key={m.motionName}
                  className="motion-available-item"
                  onClick={() => addMotion(m)}
                  title={`MV${m.motionValue} / ${m.frames}F`}
                >
                  {m.motionName}
                </button>
              ))}
            </div>
          </div>

          {/* シーケンス */}
          <div>
            <div className="modal-label">シーケンス（チップをクリックで削除）</div>
            <div className="motion-seq-list">
              {sequence.length === 0 && (
                <span className="motion-seq-empty">上からモーションを選んでください</span>
              )}
              {sequence.map((m, i) => (
                <button
                  key={i}
                  className="motion-seq-chip"
                  onClick={() => removeMotion(i)}
                  title="クリックで削除"
                >
                  {m.motionName} <span style={{ opacity: 0.6, fontSize: 9 }}>✕</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!name.trim() || sequence.length === 0}
          >
            {initialPattern ? '更新する' : '追加する'}
          </button>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 3: 全テストがパスすることを確認する**

```bash
npx vitest run
```
期待: 全 PASS（CSS/コンポーネント追加はテストに影響しない）

- [ ] **Step 4: コミットする**

```bash
git add src/components/motion/MotionPickerModal.tsx src/index.css
git commit -m "feat: add MotionPickerModal and supporting CSS"
```

---

## Task 5: PatternCard / PatternList / ExportPanel 配線 + App.tsx

**Files:**
- Create: `src/components/io/ExportPanel.tsx`
- Modify: `src/components/motion/PatternCard.tsx`
- Modify: `src/components/motion/PatternList.tsx`
- Modify: `src/App.tsx`（result-panel ID）

---

- [ ] **Step 1: ExportPanel を作成する**

```tsx
// src/components/io/ExportPanel.tsx
import { useRef } from 'react';
import { buildSnapshot, parseSnapshot, applySnapshot } from '../../io/snapshot';
import { buildTextSummary } from '../../io/textExport';
import { exportPng } from '../../io/pngExport';
import type { DamageResult } from '../../types';

interface Props {
  result: DamageResult | null;
}

export function ExportPanel({ result }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleJsonExport = () => {
    const snap = buildSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mhwilds-build.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const snap = parseSnapshot(json);
        applySnapshot(snap);
      } catch (err) {
        alert(`インポート失敗: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    // 同じファイルを再選択できるようリセット
    e.target.value = '';
  };

  const handleTextExport = () => {
    const snap = buildSnapshot();
    const text = buildTextSummary(snap, result);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mhwilds-result.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePngExport = () => {
    exportPng('result-panel', 'mhwilds-result.png').catch(err => {
      alert(`PNG出力失敗: ${(err as Error).message}`);
    });
  };

  return (
    <div className="export-panel">
      <button className="btn btn-sm" onClick={handleJsonExport} title="ビルドをJSONに保存">
        ↓ JSON保存
      </button>
      <button className="btn btn-sm" onClick={() => fileRef.current?.click()} title="JSONを読み込み">
        ↑ JSON読込
      </button>
      <button className="btn btn-sm" onClick={handleTextExport} title="結果をテキスト出力" disabled={!result}>
        ↓ テキスト
      </button>
      <button className="btn btn-sm" onClick={handlePngExport} title="結果をPNG画像出力" disabled={!result}>
        ↓ PNG
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleJsonImport}
      />
    </div>
  );
}
```

- [ ] **Step 2: PatternCard に onEdit / onDuplicate / onDelete を追加する**

`src/components/motion/PatternCard.tsx` を以下で全体置き換え:

```tsx
// src/components/motion/PatternCard.tsx
import { Slider } from '../shared/Slider';
import type { MotionPattern, PatternResult } from '../../types';

interface Props {
  pattern: MotionPattern;
  result?: PatternResult;
  onRatioChange: (v: number) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PatternCard({ pattern, result, onRatioChange, onEdit, onDuplicate, onDelete }: Props) {
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
          {hasDraw && (
            <span className="chip draw" style={{ padding: '2px 8px', fontSize: 10.5 }}>
              <span>🗡 抜刀</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="mono" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
            {pct}%
          </span>
          <button className="btn btn-icon" onClick={onEdit}   title="編集">✎</button>
          <button className="btn btn-icon" onClick={onDuplicate} title="複製">⧉</button>
          <button className="btn btn-icon btn-danger" onClick={onDelete} title="削除">✕</button>
        </div>
      </div>
      <div className="pattern-seq">{seq}</div>
      <Slider value={pct} onChange={(v) => onRatioChange(v / 100)} />
      <div className="pattern-stats">
        <div className="pattern-stat">
          <span className="lbl">期待ダメージ</span>
          <span className="val num-crit">{damage}</span>
        </div>
        <div className="pattern-stat">
          <span className="lbl">フレーム</span>
          <span className="val">{frames}F</span>
        </div>
        <div className="pattern-stat">
          <span className="lbl">貢献DPS</span>
          <span className="val num-accent">{dps}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: PatternList を配線する**

`src/components/motion/PatternList.tsx` を以下で全体置き換え:

```tsx
// src/components/motion/PatternList.tsx
import { useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { PatternCard } from './PatternCard';
import { MotionPickerModal } from './MotionPickerModal';
import { ExportPanel } from '../io/ExportPanel';
import { useMotionStore } from '../../store/motionStore';
import { useWeaponStore } from '../../store/weaponStore';
import type { DamageResult, MotionPattern } from '../../types';

interface Props { result: DamageResult | null; }

export function PatternList({ result }: Props) {
  const patterns      = useMotionStore(s => s.patterns);
  const addPattern    = useMotionStore(s => s.addPattern);
  const updatePattern = useMotionStore(s => s.updatePattern);
  const duplicatePattern = useMotionStore(s => s.duplicatePattern);
  const removePattern = useMotionStore(s => s.removePattern);
  const setRatio      = useMotionStore(s => s.setRatio);
  const weaponType    = useWeaponStore(s => s.weapon.type);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editIndex, setEditIndex]   = useState<number | null>(null);

  const total = patterns.reduce((s, p) => s + p.ratio, 0);
  const sumPct = Math.round(total * 100);
  const sumGood = sumPct === 100;

  const handleAdd = () => {
    setEditIndex(null);
    setModalOpen(true);
  };

  const handleEdit = (i: number) => {
    setEditIndex(i);
    setModalOpen(true);
  };

  const handleConfirm = (p: MotionPattern) => {
    if (editIndex !== null) {
      updatePattern(editIndex, p);
    } else {
      addPattern(p);
    }
  };

  return (
    <Card>
      <CardHead
        icon="▶"
        title="立ち回りパターン / ROTATION"
        num="MAIN"
        meta={
          <span
            className="mono"
            style={{
              fontSize: 11.5,
              color: sumGood ? 'var(--good)' : 'var(--accent)',
              fontWeight: 600,
            }}
          >
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
          onEdit={() => handleEdit(i)}
          onDuplicate={() => duplicatePattern(i)}
          onDelete={() => removePattern(i)}
        />
      ))}

      <button
        className="btn"
        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        onClick={handleAdd}
      >
        ＋ パターンを追加
      </button>

      <ExportPanel result={result} />

      <MotionPickerModal
        open={modalOpen}
        initialPattern={editIndex !== null ? patterns[editIndex] : undefined}
        weaponType={weaponType}
        onConfirm={handleConfirm}
        onClose={() => setModalOpen(false)}
      />
    </Card>
  );
}
```

- [ ] **Step 4: App.tsx の result 列に id="result-panel" を付与する**

`src/App.tsx` の `CalcPage` コンポーネント内を修正。

変更前（30〜48行付近）:
```tsx
function CalcPage({ result }: { result: DamageResult | null }) {
  return (
    <div className="page">
      <div className="col">
        <WeaponInputCard />
        <SkillsInputCard />
      </div>
      <div className="col">
        <PatternList result={result} />
        <MonsterCard />
        <BuffsCard />
      </div>
      <div className="col col-result">
        <HeroResult result={result} />
        <BreakdownCard result={result} />
      </div>
    </div>
  );
}
```

変更後:
```tsx
function CalcPage({ result }: { result: DamageResult | null }) {
  return (
    <div className="page">
      <div className="col">
        <WeaponInputCard />
        <SkillsInputCard />
      </div>
      <div className="col">
        <PatternList result={result} />
        <MonsterCard />
        <BuffsCard />
      </div>
      <div className="col col-result" id="result-panel">
        <HeroResult result={result} />
        <BreakdownCard result={result} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 全テストがパスすることを確認する**

```bash
npx vitest run
```
期待: 全 PASS

- [ ] **Step 6: ビルドが通ることを確認する**

```bash
npm run build
```
期待: エラーなく dist/ が生成される

- [ ] **Step 7: コミットする**

```bash
git add src/components/io/ExportPanel.tsx src/components/motion/PatternCard.tsx src/components/motion/PatternList.tsx src/App.tsx
git commit -m "feat: wire up pattern editing UI and export/import panel"
```

- [ ] **Step 8: バージョンタグを打つ**

```bash
git tag v0.5.0-plan-c
git push origin master --tags
```

---

## 自己レビューチェックリスト（実施済み）

**1. スペック網羅性:**
- ✅ パターン追加 → MotionPickerModal + handleAdd
- ✅ パターン複製 → duplicatePattern + btn-icon ⧉
- ✅ パターン削除 → removePattern + btn-icon ✕
- ✅ パターン編集（名前・モーション変更）→ MotionPickerModal（edit モード）
- ✅ JSON エクスポート → ExportPanel.handleJsonExport
- ✅ JSON インポート → ExportPanel.handleJsonImport + parseSnapshot + applySnapshot
- ✅ テキストエクスポート → buildTextSummary + ExportPanel.handleTextExport
- ✅ PNG エクスポート → html2canvas + exportPng + ExportPanel.handlePngExport

**2. プレースホルダーなし:** 全ステップにコードブロード記載済み

**3. 型整合性:**
- `TargetSnapshot` は `targetStore.ts` でエクスポート、`snapshot.ts` でインポート ✅
- `AppSnapshot.target` は `TargetSnapshot` 型 ✅
- `PatternCard` の新プロップ `onEdit/onDuplicate/onDelete` は `PatternList` で全て渡している ✅
- `applySnapshot` が呼ぶ `useTargetStore.getState().setAll` は Task 1 で追加 ✅
- `useMotionStore.getState().setPatterns` は Task 1 で追加 ✅

**4. CSS クラス参照:**
- `.btn-icon`, `.btn-sm`, `.btn-danger` → Task 4 Step 1 で index.css に追加済み ✅
- `.input` → Task 4 Step 1 で追加済み ✅
- `.export-panel` → Task 4 Step 1 で追加済み ✅
- `.modal-overlay`, `.modal`, `.modal-head`, `.modal-body`, `.modal-footer` → Task 4 Step 1 で追加済み ✅
