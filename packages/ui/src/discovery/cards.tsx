import type { ComponentChildren } from 'preact';
import type { ToolLink } from '../layout/types.ts';
import { Badge } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';

type Heading = 'h2' | 'h3';

const TOOL_META: Record<string, { icon: string; tags: string[] }> = {
  'brickwork-calculator': { icon: '🧱', tags: ['3D Wall Blueprint', 'Openings Deduction'] },
  'concrete-quantity-calculator': { icon: '🏗️', tags: ['3D Slab & Column', 'Cement Bags'] },
  'excavation-calculator': { icon: '⛏️', tags: ['3D Pit Cut', 'Swell Factor'] },
  'tile-flooring-calculator': { icon: '🔲', tags: ['Floor & Wall Grid', 'Box Estimator'] },
  'plaster-calculator': { icon: '🪵', tags: ['Wall & Ceiling', 'Mix Ratio'] },
  'paint-calculator': { icon: '🎨', tags: ['Multi-Coat Area', 'Litres to Order'] },
  'image-crop': { icon: '✂️', tags: ['3-Panel Visual Studio', 'Zero Uploads'] },
  'image-compress': { icon: '📉', tags: ['3-Stage Card', 'Target KB Presets'] },
  'passport-photo-resizer': { icon: '🛂', tags: ['Official Specs', '35×45mm / 2×2in'] },
  'signature-resizer': { icon: '✍️', tags: ['Exam Specs', 'Ink Optimizer'] },
  'image-resize': { icon: '📐', tags: ['Exact Pixels', 'Aspect Lock'] },
  'cbm-calculator': { icon: '📦', tags: ['3D Freight Carton', 'CBM & CFT'] },
  'container-loading-calculator': { icon: '🚢', tags: ['20ft & 40ft HQ', 'Pallet Space'] },
  'gst-calculator': { icon: '💰', tags: ['CGST & SGST', 'Instant Invoicing'] },
  'amazon-india-seller-fee-profit-estimator': {
    icon: '🛒',
    tags: ['FBA & Easy Ship', 'Profit Margin'],
  },
};

export interface ToolCardProps {
  tool: ToolLink;
  heading?: Heading;
}

export function ToolCard({ tool, heading: H = 'h3' }: ToolCardProps) {
  const meta = TOOL_META[tool.id];
  return (
    <article class={styles.card} data-tool-card={tool.id}>
      <H class={styles.title}>
        {meta?.icon && (
          <span class={styles.toolIcon} aria-hidden="true">
            {meta.icon}
          </span>
        )}
        <a class={styles.link} href={tool.url}>
          {tool.name}
        </a>
      </H>
      <p class={styles.summary}>{tool.summary}</p>
      <div class={styles.metaRow}>
        {meta?.tags.map((tag) => (
          <span key={tag} class={styles.tagPill}>
            {tag}
          </span>
        ))}
        {tool.professional ? <Badge tone="accent">{t('card.pro')}</Badge> : null}
      </div>
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
  compact?: boolean;
}

export function CategoryCard({
  name,
  summary,
  url,
  icon,
  count,
  heading: H = 'h3',
  compact = false,
}: CategoryCardProps) {
  return (
    <article class={`${styles.card} ${compact ? styles.categoryCompact : ''}`}>
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
