import type { ComponentChildren } from 'preact';
import type { ToolLink } from '../layout/types.ts';
import { Badge } from '../primitives/feedback.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import styles from './cards.module.css';

type Heading = 'h2' | 'h3';

const TOOL_META: Record<string, { icon: string; tags: string[]; image?: string }> = {
  // Civil & Construction
  'brickwork-calculator': {
    icon: '🧱',
    tags: ['3D Wall Blueprint', 'Openings Deduction'],
    image: '/samples/brick_wall_3d.png',
  },
  'concrete-quantity-calculator': {
    icon: '🏗️',
    tags: ['3D Slab & Column', 'Cement Bags'],
    image: '/samples/concrete_slab_3d.png',
  },
  'excavation-calculator': {
    icon: '⛏️',
    tags: ['3D Pit Cut', 'Swell Factor'],
    image: '/samples/excavation_pit_3d.png',
  },
  'paint-calculator': {
    icon: '🎨',
    tags: ['Multi-Coat Area', 'Litres to Order'],
    image: '/samples/paint_room_3d.png',
  },
  'plaster-calculator': {
    icon: '🪵',
    tags: ['Wall & Ceiling', 'Mix Ratio'],
    image: '/samples/plaster_wall_3d.png',
  },
  'tile-flooring-calculator': {
    icon: '🔲',
    tags: ['Floor & Wall Grid', 'Box Estimator'],
    image: '/samples/tile_floor_3d.png',
  },

  // Logistics
  'cbm-calculator': {
    icon: '📦',
    tags: ['3D Freight Carton', 'CBM & CFT'],
    image: '/samples/cbm_box_3d.png',
  },
  'container-loading-calculator': {
    icon: '🚢',
    tags: ['20ft & 40ft HQ', 'Pallet Space'],
    image: '/samples/container_3d.png',
  },
  'pallet-loading-calculator': {
    icon: '🪵',
    tags: ['Standard Pallet', 'Volume Utilization'],
  },
  'volumetric-weight-calculator': {
    icon: '⚖️',
    tags: ['Air & Courier', 'Chargeable Weight'],
  },

  // Export & Import Documents
  'export-commercial-invoice-generator': {
    icon: '📋',
    tags: ['Commercial Invoice', 'Customs Compliant'],
  },
  'export-packing-list-generator': {
    icon: '📦',
    tags: ['Packing List', 'Net & Gross Weights'],
  },

  // Business & Finance
  'gst-calculator': {
    icon: '💰',
    tags: ['CGST & SGST', 'Instant Invoicing'],
  },
  'profit-margin-calculator': {
    icon: '📈',
    tags: ['Margin & Markup', 'Revenue Goal'],
  },
  'amazon-india-seller-fee-profit-estimator': {
    icon: '🛒',
    tags: ['FBA & Easy Ship', 'Profit Margin'],
  },
  'markup-calculator': {
    icon: '🏷️',
    tags: ['Cost to Price', 'Profit Multiplier'],
  },

  // Developer & Data
  'json-formatter': {
    icon: '{ }',
    tags: ['Format & Validate', 'Tree Inspection'],
  },
  'base64-encode-decode': {
    icon: '🔐',
    tags: ['Encode & Decode', 'RFC 4648'],
  },
  'url-encode-decode': {
    icon: '🔗',
    tags: ['URI Component', 'Percent Encoding'],
  },
  'csv-to-json': {
    icon: '📊',
    tags: ['CSV Parser', 'JSON Transform'],
  },
  'json-to-csv': {
    icon: '📄',
    tags: ['JSON to CSV', 'Table Export'],
  },
  'timestamp-converter': {
    icon: '⏱️',
    tags: ['Unix Epoch', 'ISO 8601 UTC'],
  },

  // PDF & Documents
  'jpg-to-pdf': {
    icon: '📄',
    tags: ['Multi-Image to PDF', 'Zero Uploads'],
  },
  'pdf-merge': {
    icon: '📑',
    tags: ['Combine PDFs', 'Page Order'],
  },
  'pdf-split': {
    icon: '✂️',
    tags: ['Extract Pages', 'Split Ranges'],
  },

  // Image & Media
  'image-crop': {
    icon: '✂️',
    tags: ['3-Panel Visual Studio', 'Aspect Ratio Presets'],
    image: '/samples/jaipur_cropped_result.png',
  },
  'image-resize': {
    icon: '📐',
    tags: ['3-Panel Visual Studio', 'Exact Pixels & Lock'],
  },
  'image-compress': {
    icon: '📉',
    tags: ['3-Panel Visual Studio', 'Target KB Presets'],
  },
  'image-format-converter': {
    icon: '🔄',
    tags: ['3-Panel Visual Studio', 'PNG · JPG · WEBP · PDF'],
  },
  'image-background-remover': {
    icon: '✨',
    tags: ['3-Panel Visual Studio', 'Transparent PNG & PDF'],
  },
  'image-watermark': {
    icon: '🏷️',
    tags: ['Text & Image Overlay', 'Visual Placement'],
  },
  'favicon-generator': {
    icon: '🌐',
    tags: ['ICO & PNG Sizes', 'Multi-Resolution'],
  },
  'image-metadata-remover': {
    icon: '🛡️',
    tags: ['EXIF Strip', 'Privacy Guard'],
  },
  'passport-photo-resizer': {
    icon: '🛂',
    tags: ['Official Specs', '35×45mm / 2×2in'],
  },
  'photo-size-reducer': {
    icon: '🗜️',
    tags: ['KB Target', 'Quick Compression'],
  },
  'signature-resizer': {
    icon: '✍️',
    tags: ['Exam Specs', 'Ink Optimizer'],
  },
};

export interface ToolCardProps {
  tool: ToolLink;
  heading?: Heading;
  showThumbnail?: boolean;
  showTags?: boolean;
}

export function ToolCard({
  tool,
  heading: H = 'h3',
  showThumbnail = false,
  showTags = false,
}: ToolCardProps) {
  const meta = TOOL_META[tool.id];
  return (
    <article class={styles.card} data-tool-card={tool.id}>
      {showThumbnail && meta?.image && (
        <div class={styles.thumbnailWell}>
          <img src={meta.image} alt={tool.name} class={styles.thumbnail} loading="lazy" />
        </div>
      )}
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
      {showTags && meta?.tags && meta.tags.length > 0 && (
        <div class={styles.metaRow}>
          {meta.tags.map((tag) => (
            <span key={tag} class={styles.tagPill}>
              {tag}
            </span>
          ))}
          {tool.professional ? <Badge tone="accent">{t('card.pro')}</Badge> : null}
        </div>
      )}
      {!showTags && tool.professional ? (
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
