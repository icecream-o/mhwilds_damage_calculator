import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { WeaponInputCard } from './components/weapon/WeaponInputCard';
import { SkillsInputCard } from './components/skills/SkillsInputCard';
import { MonsterCard } from './components/monster/MonsterCard';
import { BuffsCard } from './components/buffs/BuffsCard';
import { PatternList } from './components/motion/PatternList';
import { HeroResult } from './components/result/HeroResult';
import { BreakdownCard } from './components/result/BreakdownCard';
import { FormulaTab } from './components/formula/FormulaTab';
import { ThemeTab } from './components/theme/ThemeTab';

import { useWeaponStore } from './store/weaponStore';
import { useSkillStore } from './store/skillStore';
import { useBuffStore } from './store/buffStore';
import { useMotionStore } from './store/motionStore';
import { useTargetStore } from './store/targetStore';
import { useThemeStore } from './store/themeStore';

import { loadSkills } from './data/skills';
import { loadSeriesSkills } from './data/series_skills';
import { loadGroupSkills } from './data/group_skills';
import { loadBuffs } from './data/buffs';
import { loadMonsters } from './data/monsters';
import { getMotionsFor } from './data/motions';

import { calcDamage } from './calc';
import type { DamageResult, SkillMaster, Buff, Monster, Motion } from './types';

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

export default function App() {
  const weapon = useWeaponStore(s => s.weapon);
  const skills = useSkillStore(s => s.skills);
  const buffs = useBuffStore(s => s.selected);
  const patterns = useMotionStore(s => s.patterns);
  const addPattern = useMotionStore(s => s.addPattern);
  const monsterId = useTargetStore(s => s.monsterId);
  const variantId = useTargetStore(s => s.variantId);
  const partId = useTargetStore(s => s.partId);
  const enraged = useTargetStore(s => s.enraged);
  const wounded = useTargetStore(s => s.wounded);
  const defenseRateOverride = useTargetStore(s => s.defenseRateOverride);
  const hydrate = useThemeStore(s => s.hydrate);

  const [skillMasters, setSkillMasters] = useState<SkillMaster[]>([]);
  const [buffMasters, setBuffMasters] = useState<Buff[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    Promise.all([loadSkills(), loadSeriesSkills(), loadGroupSkills(), loadBuffs(), loadMonsters()])
      .then(([n, s, g, b, m]) => {
        setSkillMasters([...n, ...s, ...g]);
        setBuffMasters(b);
        setMonsters(m);
      });
  }, []);

  // 太刀のデフォルトパターン投入
  useEffect(() => {
    if (patterns.length > 0) return;
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
  }, [weapon.type]);

  const result: DamageResult | null = useMemo(() => {
    if (!monsterId || !variantId || !partId) return null;
    const monster = monsters.find(m => m.id === monsterId);
    if (!monster) return null;
    try {
      return calcDamage({
        weapon,
        skills,
        buffs,
        motionPatterns: patterns,
        target: {
          monster, variantId, partId, enraged, wounded,
          defenseRateOverride: defenseRateOverride ?? undefined,
        },
      }, skillMasters, buffMasters);
    } catch {
      return null;
    }
  }, [weapon, skills, buffs, patterns, monsters, monsterId, variantId, partId, enraged, wounded, defenseRateOverride, skillMasters, buffMasters]);

  return (
    <AppLayout
      calc={<CalcPage result={result} />}
      formula={<FormulaTab />}
      theme={<ThemeTab />}
    />
  );
}
