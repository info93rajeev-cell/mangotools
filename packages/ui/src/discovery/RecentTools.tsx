import { createPreferences } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import type { ToolLink } from '../layout/types.ts';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';
import { ToolCard } from './cards.tsx';

export interface RecentToolsProps {
  tools: ToolLink[];
}

/** Tools this visitor opened recently (stored only in this browser). Renders nothing if none. */
export function RecentTools({ tools }: RecentToolsProps) {
  const [recent, setRecent] = useState<ToolLink[]>([]);
  useEffect(() => {
    const byId = new Map(tools.map((tool) => [tool.id, tool]));
    const ids = createPreferences().getRecentTools();
    setRecent(ids.map((id) => byId.get(id)).filter((tool): tool is ToolLink => tool !== undefined));
  }, [tools]);

  if (recent.length === 0) return null;
  return (
    <section class={styles.section} aria-labelledby="recent-title" data-recent-tools="">
      <h2 id="recent-title" class={styles.sectionTitle}>
        {t('recent.title')}
      </h2>
      <ul class={styles.grid}>
        {recent.map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}
