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
