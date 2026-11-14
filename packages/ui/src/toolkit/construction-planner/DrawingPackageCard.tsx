import { Button } from '../../primitives/Button.tsx';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { DrawingCategory, SheetMetadata } from './types.ts';

interface DrawingPackageCardProps {
  sheets: SheetMetadata[];
  onOpenUpload: () => void;
  onViewCategory: (cat: DrawingCategory) => void;
}

function ArchBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 120 70" aria-hidden="true">
      <rect x="5" y="5" width="110" height="60" fill="none" stroke="#93c5fd" stroke-width="1.2" />
      <rect x="15" y="15" width="40" height="40" fill="none" stroke="#bfdbfe" stroke-width="0.8" />
      <rect x="65" y="15" width="40" height="25" fill="none" stroke="#bfdbfe" stroke-width="0.8" />
      <text x="25" y="38" fill="#3b82f6" font-size="7" font-family="monospace">
        LIVING
      </text>
      <text x="75" y="30" fill="#3b82f6" font-size="7" font-family="monospace">
        OFFICE
      </text>
    </svg>
  );
}

function StructBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 120 70" aria-hidden="true">
      <line
        x1="15"
        y1="15"
        x2="105"
        y2="15"
        stroke="#93c5fd"
        stroke-dasharray="2,2"
        stroke-width="0.8"
      />
      <line
        x1="15"
        y1="55"
        x2="105"
        y2="55"
        stroke="#93c5fd"
        stroke-dasharray="2,2"
        stroke-width="0.8"
      />
      <line
        x1="25"
        y1="10"
        x2="25"
        y2="60"
        stroke="#93c5fd"
        stroke-dasharray="2,2"
        stroke-width="0.8"
      />
      <line
        x1="60"
        y1="10"
        x2="60"
        y2="60"
        stroke="#93c5fd"
        stroke-dasharray="2,2"
        stroke-width="0.8"
      />
      <line
        x1="95"
        y1="10"
        x2="95"
        y2="60"
        stroke="#93c5fd"
        stroke-dasharray="2,2"
        stroke-width="0.8"
      />
      <rect x="22" y="12" width="6" height="6" fill="#2563eb" />
      <rect x="57" y="12" width="6" height="6" fill="#2563eb" />
      <rect x="92" y="12" width="6" height="6" fill="#2563eb" />
      <rect x="22" y="52" width="6" height="6" fill="#2563eb" />
      <rect x="57" y="52" width="6" height="6" fill="#2563eb" />
      <rect x="92" y="52" width="6" height="6" fill="#2563eb" />
    </svg>
  );
}

function SectionBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 120 70" aria-hidden="true">
      <line x1="10" y1="62" x2="110" y2="62" stroke="#475569" stroke-width="1.2" />
      <rect x="25" y="15" width="70" height="47" fill="none" stroke="#2563eb" stroke-width="1" />
      <line x1="25" y1="31" x2="95" y2="31" stroke="#3b82f6" stroke-width="0.8" />
      <line x1="25" y1="47" x2="95" y2="47" stroke="#3b82f6" stroke-width="0.8" />
      <text x="100" y="18" fill="#64748b" font-size="6">
        +10.80
      </text>
      <text x="100" y="34" fill="#64748b" font-size="6">
        +7.20
      </text>
    </svg>
  );
}

function DetailsBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 120 70" aria-hidden="true">
      <rect x="35" y="10" width="50" height="50" fill="none" stroke="#2563eb" stroke-width="1.2" />
      <rect x="40" y="15" width="40" height="40" fill="none" stroke="#f59e0b" stroke-width="0.8" />
      <circle cx="43" cy="18" r="2.5" fill="#dc2626" />
      <circle cx="77" cy="18" r="2.5" fill="#dc2626" />
      <circle cx="43" cy="52" r="2.5" fill="#dc2626" />
      <circle cx="77" cy="52" r="2.5" fill="#dc2626" />
    </svg>
  );
}

interface GroupBoxProps {
  id: DrawingCategory;
  title: string;
  sheets: SheetMetadata[];
  onView: () => void;
  children: preact.JSX.Element;
}

function DrawingGroupBox({ title, sheets, onView, children }: GroupBoxProps) {
  const preview = sheets.slice(0, 4);
  const extra = sheets.length - preview.length;

  return (
    <div class={styles.drawingBox}>
      <div class={styles.drawingBoxTop}>
        <div class={styles.drawingBoxTitleRow}>
          <span class={styles.checkIconGreen}>
            <Icon name="circle-check" />
          </span>
          <h3 class={styles.drawingBoxTitle}>{title}</h3>
        </div>
        <span class={styles.sheetCountBadge}>
          {sheets.length} sheets · {t.uploadedSuffix}
        </span>
      </div>
      <div class={styles.drawingBoxBody}>
        <div class={styles.blueprintThumbnailWrap}>{children}</div>
        <div class={styles.drawingListWrap}>
          <ul class={styles.sheetList}>
            {preview.map((s) => (
              <li key={s.id} class={styles.sheetListItem}>
                <span class={styles.sheetNum}>{s.sheetNumber}</span>
                <span class={styles.sheetName}>{s.name}</span>
              </li>
            ))}
            {extra > 0 && <li class={styles.sheetExtra}>+ {extra} more</li>}
          </ul>
          <button type="button" class={styles.viewSheetsBtn} onClick={onView}>
            <Icon name="eye" />
            <span>
              {t.viewSheetsBtn} ({sheets.length})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function DrawingPackageCard({
  sheets,
  onOpenUpload,
  onViewCategory,
}: DrawingPackageCardProps) {
  const byCategory = (cat: DrawingCategory) => sheets.filter((s) => s.category === cat);

  return (
    <section class={styles.drawingCard} aria-labelledby="drawing-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="file-text" />
          </span>
          <h2 id="drawing-heading" class={styles.cardTitle}>
            {t.drawingPackageTitle}
          </h2>
        </div>
        <Button variant="secondary" icon="file-plus" onClick={onOpenUpload}>
          {t.uploadDrawingsBtn}
        </Button>
      </div>

      <div class={styles.drawingGrid}>
        <DrawingGroupBox
          id="architectural"
          title={t.archPlanLabel}
          sheets={byCategory('architectural')}
          onView={() => onViewCategory('architectural')}
        >
          <ArchBlueprint />
        </DrawingGroupBox>
        <DrawingGroupBox
          id="structural"
          title={t.structPlanLabel}
          sheets={byCategory('structural')}
          onView={() => onViewCategory('structural')}
        >
          <StructBlueprint />
        </DrawingGroupBox>
        <DrawingGroupBox
          id="section-elevation"
          title={t.secElevLabel}
          sheets={byCategory('section-elevation')}
          onView={() => onViewCategory('section-elevation')}
        >
          <SectionBlueprint />
        </DrawingGroupBox>
        <DrawingGroupBox
          id="member-details"
          title={t.memberDetailsLabel}
          sheets={byCategory('member-details')}
          onView={() => onViewCategory('member-details')}
        >
          <DetailsBlueprint />
        </DrawingGroupBox>
      </div>
    </section>
  );
}
