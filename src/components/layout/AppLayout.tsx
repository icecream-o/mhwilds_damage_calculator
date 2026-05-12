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
