import type { ComponentChildren } from 'preact';
import type { ToolLink } from '../layout/types.ts';
import { Badge } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';

type Heading = 'h2' | 'h3';

export interface ToolCardProps {
  tool: ToolLink;
  heading?: Heading;
}

export function ToolCard({ tool, heading: H = 'h3' }: ToolCardProps) {
  return (
    <article class={styles.card} data-tool-card={tool.id}>
      <H class={styles.title}>
        <a class={styles.link} href={tool.url}>
          {tool.name}
        </a>
      </H>
      <p class={styles.summary}>{tool.summary}</p>
      {tool.professional ? (
        <div class={styles.meta}>
          <Badge tone="accent">{t('card.pro')}</Badge>
        </div>
      ) : null}
    </article>
  );
}

export interface CategoryCardProps {
  name: string;
  summary: string;
  url: string;
  icon: string;
  count: number;
  heading?: Heading;
}

export function CategoryCard({
  name,
  summary,
  url,
  icon,
  count,
  heading: H = 'h3',
}: CategoryCardProps) {
  return (
    <article class={styles.card}>
      <span class={styles.categoryIcon}>
        <Icon name={icon} />
      </span>
      <H class={styles.title}>
        <a class={styles.link} href={url}>
          {name}
        </a>
      </H>
      <p class={styles.summary}>{summary}</p>
      <p class={styles.meta}>{count === 1 ? t('card.tool') : t('card.tools', { count })}</p>
    </article>
  );
}

export function CardGrid({ children }: { children: ComponentChildren }) {
  return <ul class={styles.grid}>{children}</ul>;
}

export const cardStyles = styles;
