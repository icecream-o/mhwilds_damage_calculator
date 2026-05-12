import { useEffect, useState } from 'react';
import { Card } from '../shared/Card';
import { CardHead } from '../shared/CardHead';
import { SkillSearch } from './SkillSearch';
import { SkillRow } from './SkillRow';
import { loadSkills } from '../../data/skills';
import { loadSeriesSkills } from '../../data/series_skills';
import { loadGroupSkills } from '../../data/group_skills';
import { useSkillStore } from '../../store/skillStore';
import type { SkillMaster } from '../../types';

export function SkillsInputCard() {
  const skills = useSkillStore(s => s.skills);
  const addSkill = useSkillStore(s => s.addSkill);
  const updateLevel = useSkillStore(s => s.updateLevel);
  const setUptime = useSkillStore(s => s.setUptime);
  const removeSkill = useSkillStore(s => s.removeSkill);

  const [normal, setNormal] = useState<SkillMaster[]>([]);
  const [series, setSeries] = useState<SkillMaster[]>([]);
  const [group, setGroup] = useState<SkillMaster[]>([]);

  useEffect(() => {
    Promise.all([loadSkills(), loadSeriesSkills(), loadGroupSkills()])
      .then(([n, s, g]) => { setNormal(n); setSeries(s); setGroup(g); });
  }, []);

  const allMasters = [...normal, ...series, ...group];
  const findMaster = (id: string) => allMasters.find(m => m.id === id);

  const renderSection = (title: string, masters: SkillMaster[]) => {
    const ids = new Set(masters.map(m => m.id));
    const activeRows = skills.filter(s => ids.has(s.skillId));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          fontSize: 9.5, color: 'var(--text-4)', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>{title}</div>
        <SkillSearch
          masters={masters}
          excludeIds={skills.map(s => s.skillId)}
          onSelect={(id) => addSkill(id, masters.find(m => m.id === id)?.maxLevel ?? 1)}
        />
        {activeRows.map(a => {
          const m = findMaster(a.skillId);
          if (!m) return null;
          return (
            <SkillRow
              key={a.skillId}
              active={a}
              master={m}
              onLevelChange={(lv) => updateLevel(a.skillId, lv)}
              onUptimeChange={(u) => setUptime(a.skillId, u)}
              onRemove={() => removeSkill(a.skillId)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHead icon="✦" title="発動スキル / SKILLS" num="02" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {renderSection('常時スキル', normal)}
        {renderSection('シリーズスキル', series)}
        {renderSection('グループスキル', group)}
      </div>
    </Card>
  );
}
