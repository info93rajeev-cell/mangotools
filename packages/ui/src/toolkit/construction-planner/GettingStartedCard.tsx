import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import {
  BeamIsoGraphic,
  ColumnIsoGraphic,
  FootingIsoGraphic,
  SlabIsoGraphic,
} from './isometricGraphics.tsx';
import type { MemberType } from './types.ts';

interface GettingStartedCardProps {
  sitePortion: string;
  onChangePortion: (portion: string) => void;
  onAttachDrawings: () => void;
  onSelectMemberType: (type: MemberType) => void;
}

function PortionStep({ portion, onChange }: { portion: string; onChange: (v: string) => void }) {
  return (
    <div class={styles.gsStepBox}>
      <div class={styles.gsStepHead}>
        <span class={styles.stepNumCircle}>1</span>
        <h3 class={styles.gsStepTitle}>{t.gsStep1Title}</h3>
      </div>
      <p class={styles.gsStepDesc}>{t.gsStep1Desc}</p>
      <div class={styles.selectWrap}>
        <select
          class={styles.formSelect}
          value={portion}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          aria-label={t.gsStep1Title}
        >
          <option value="Site A / Block 1">Site A / Block 1</option>
          <option value="Site B / Block 2">Site B / Block 2</option>
          <option value="Main Tower">Main Tower</option>
          <option value="Entire Site">Entire Site</option>
        </select>
        <span class={styles.selectArrow}>
          <Icon name="chevron-down" />
        </span>
      </div>
    </div>
  );
}

function AttachStep({ onAttach }: { onAttach: () => void }) {
  return (
    <div class={styles.gsStepBox}>
      <div class={styles.gsStepHead}>
        <span class={styles.stepNumCircle}>2</span>
        <h3 class={styles.gsStepTitle}>{t.gsStep2Title}</h3>
      </div>
      <p class={styles.gsStepDesc}>PDF or image; DWG not supported</p>
      <button
        type="button"
        class={styles.gsBlueprintBtn}
        onClick={onAttach}
        title="Attach drawings (PDF or image; DWG not supported)"
      >
        <svg class={styles.gsBlueprintSvg} viewBox="0 0 140 48" aria-hidden="true">
          <rect
            x="4"
            y="4"
            width="132"
            height="40"
            fill="#eff6ff"
            stroke="#93c5fd"
            stroke-width="1.2"
            rx="4"
          />
          {/* Blueprint grid & details */}
          <line
            x1="20"
            y1="8"
            x2="20"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <line
            x1="50"
            y1="8"
            x2="50"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <line
            x1="90"
            y1="8"
            x2="90"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <rect
            x="25"
            y="14"
            width="18"
            height="18"
            fill="#ffffff"
            stroke="#2563eb"
            stroke-width="1"
          />
          <line x1="60" y1="18" x2="80" y2="18" stroke="#1d4ed8" stroke-width="1.2" />
          <line x1="60" y1="24" x2="76" y2="24" stroke="#60a5fa" stroke-width="1" />
          <circle cx="106" cy="24" r="8" fill="#3b82f6" opacity="0.25" />
        </svg>
        <span class={styles.attachOverlayLabel}>
          <Icon name="file-plus" />
          <span>Attach Sheets</span>
        </span>
      </button>
    </div>
  );
}

function MemberStep({ onSelect }: { onSelect: (type: MemberType) => void }) {
  return (
    <div class={styles.gsStepBox}>
      <div class={styles.gsStepHead}>
        <span class={styles.stepNumCircle}>3</span>
        <h3 class={styles.gsStepTitle}>{t.gsStep3Title}</h3>
      </div>
      <p class={styles.gsStepDesc}>{t.gsStep3Desc}</p>
      <div class={styles.memberQuickRow}>
        {/* Footing Tile */}
        <button
          type="button"
          class={styles.memberQuickTile}
          onClick={() => onSelect('footing')}
          title="Start Footing Schedule"
        >
          <div class={styles.quickTileGraphic}>
            <FootingIsoGraphic />
          </div>
          <span class={styles.quickTileLabel}>{t.footingsTitle}</span>
        </button>

        {/* Column Tile */}
        <button
          type="button"
          class={styles.memberQuickTile}
          onClick={() => onSelect('column')}
          title="Start Column Schedule"
        >
          <div class={styles.quickTileGraphic}>
            <ColumnIsoGraphic />
          </div>
          <span class={styles.quickTileLabel}>{t.columnsTitle}</span>
        </button>

        {/* Beam Tile */}
        <button
          type="button"
          class={styles.memberQuickTile}
          onClick={() => onSelect('beam')}
          title="Start Beam Schedule"
        >
          <div class={styles.quickTileGraphic}>
            <BeamIsoGraphic />
          </div>
          <span class={styles.quickTileLabel}>{t.beamsTitle}</span>
        </button>

        {/* Slab Tile */}
        <button
          type="button"
          class={styles.memberQuickTile}
          onClick={() => onSelect('slab')}
          title="Start Slab Schedule"
        >
          <div class={styles.quickTileGraphic}>
            <SlabIsoGraphic />
          </div>
          <span class={styles.quickTileLabel}>{t.slabsTitle}</span>
        </button>
      </div>
    </div>
  );
}

export function GettingStartedCard({
  sitePortion,
  onChangePortion,
  onAttachDrawings,
  onSelectMemberType,
}: GettingStartedCardProps) {
  return (
    <section class={styles.gettingStartedCard} aria-labelledby="getting-started-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="route" />
          </span>
          <div>
            <h2 id="getting-started-heading" class={styles.cardTitle}>
              {t.gettingStartedTitle}
            </h2>
            <p class={styles.cardSubtitle}>{t.gettingStartedSubtitle}</p>
          </div>
        </div>
      </div>
      <div class={styles.gsCardsGrid}>
        <PortionStep portion={sitePortion} onChange={onChangePortion} />
        <AttachStep onAttach={onAttachDrawings} />
        <MemberStep onSelect={onSelectMemberType} />
      </div>
    </section>
  );
}
