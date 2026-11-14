import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
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
      <p class={styles.gsStepDesc}>{t.gsStep2Desc}</p>
      <button
        type="button"
        class={styles.gsBlueprintBtn}
        onClick={onAttach}
        title="Attach drawings (PDF/images)"
      >
        <svg class={styles.gsBlueprintSvg} viewBox="0 0 140 50" aria-hidden="true">
          <rect
            x="5"
            y="5"
            width="130"
            height="40"
            fill="#f8fafc"
            stroke="#93c5fd"
            stroke-width="1"
          />
          <line
            x1="20"
            y1="10"
            x2="20"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <line
            x1="90"
            y1="10"
            x2="90"
            y2="40"
            stroke="#bfdbfe"
            stroke-dasharray="2,2"
            stroke-width="0.8"
          />
          <rect
            x="25"
            y="15"
            width="20"
            height="20"
            fill="none"
            stroke="#2563eb"
            stroke-width="1"
          />
          <circle cx="105" cy="25" r="8" fill="#3b82f6" opacity="0.2" />
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
      <div class={styles.memberQuickButtonsGrid}>
        <button type="button" class={styles.memberQuickBtn} onClick={() => onSelect('footing')}>
          <span class={styles.quickBtnIcon}>
            <Icon name="box" />
          </span>
          <span>{t.footingsTitle}</span>
        </button>
        <button type="button" class={styles.memberQuickBtn} onClick={() => onSelect('column')}>
          <span class={styles.quickBtnIcon}>
            <Icon name="layers" />
          </span>
          <span>{t.columnsTitle}</span>
        </button>
        <button type="button" class={styles.memberQuickBtn} onClick={() => onSelect('beam')}>
          <span class={styles.quickBtnIcon}>
            <Icon name="table-2" />
          </span>
          <span>{t.beamsTitle}</span>
        </button>
        <button type="button" class={styles.memberQuickBtn} onClick={() => onSelect('slab')}>
          <span class={styles.quickBtnIcon}>
            <Icon name="layout-grid" />
          </span>
          <span>{t.slabsTitle}</span>
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
