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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapon]);

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
