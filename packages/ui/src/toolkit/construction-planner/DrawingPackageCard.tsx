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
    <svg
      class={styles.blueprintSvg}
      viewBox="0 0 130 80"
      aria-label="Architectural floor plan thumbnail"
    >
      <rect
        x="6"
        y="6"
        width="118"
        height="68"
        fill="#ffffff"
        stroke="#1e40af"
        stroke-width="1.4"
      />
      {/* Outer rooms */}
      <rect
        x="14"
        y="14"
        width="46"
        height="52"
        fill="#eff6ff"
        stroke="#3b82f6"
        stroke-width="0.9"
      />
      <rect
        x="68"
        y="14"
        width="48"
        height="30"
        fill="#eff6ff"
        stroke="#3b82f6"
        stroke-width="0.9"
      />
      {/* Stairs UP */}
      <g stroke="#93c5fd" stroke-width="0.8">
        <line x1="72" y1="52" x2="108" y2="52" />
        <line x1="72" y1="56" x2="108" y2="56" />
        <line x1="72" y1="60" x2="108" y2="60" />
      </g>
      <text
        x="24"
        y="44"
        fill="#1e3a8a"
        font-size="7.5"
        font-weight="bold"
        font-family="system-ui, sans-serif"
      >
        LIVING
      </text>
      <text
        x="76"
        y="32"
        fill="#1e3a8a"
        font-size="7.5"
        font-weight="bold"
        font-family="system-ui, sans-serif"
      >
        OFFICE
      </text>
      <text x="86" y="50" fill="#2563eb" font-size="6" font-family="system-ui, sans-serif">
        UP ↑
      </text>
    </svg>
  );
}

function StructGridLines() {
  return (
    <>
      <line
        x1="20"
        y1="12"
        x2="110"
        y2="12"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
      <line
        x1="20"
        y1="40"
        x2="110"
        y2="40"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
      <line
        x1="20"
        y1="68"
        x2="110"
        y2="68"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="72"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
      <line
        x1="65"
        y1="8"
        x2="65"
        y2="72"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
      <line
        x1="106"
        y1="8"
        x2="106"
        y2="72"
        stroke="#93c5fd"
        stroke-width="0.7"
        stroke-dasharray="3,2"
      />
    </>
  );
}

function StructColumnsAndBeams() {
  return (
    <>
      <rect x="20" y="8" width="8" height="8" fill="#1d4ed8" />
      <rect x="61" y="8" width="8" height="8" fill="#1d4ed8" />
      <rect x="102" y="8" width="8" height="8" fill="#1d4ed8" />
      <rect x="20" y="36" width="8" height="8" fill="#1d4ed8" />
      <rect x="61" y="36" width="8" height="8" fill="#1d4ed8" />
      <rect x="102" y="36" width="8" height="8" fill="#1d4ed8" />
      <rect x="20" y="64" width="8" height="8" fill="#1d4ed8" />
      <rect x="61" y="64" width="8" height="8" fill="#1d4ed8" />
      <rect x="102" y="64" width="8" height="8" fill="#1d4ed8" />
      <line x1="28" y1="12" x2="61" y2="12" stroke="#1e40af" stroke-width="1.5" />
      <line x1="69" y1="12" x2="102" y2="12" stroke="#1e40af" stroke-width="1.5" />
      <line x1="28" y1="40" x2="61" y2="40" stroke="#1e40af" stroke-width="1.5" />
      <line x1="69" y1="40" x2="102" y2="40" stroke="#1e40af" stroke-width="1.5" />
      <line x1="28" y1="68" x2="61" y2="68" stroke="#1e40af" stroke-width="1.5" />
      <line x1="69" y1="68" x2="102" y2="68" stroke="#1e40af" stroke-width="1.5" />
    </>
  );
}

function StructBlueprint() {
  return (
    <svg
      class={styles.blueprintSvg}
      viewBox="0 0 130 80"
      aria-label="Structural framing plan thumbnail"
    >
      <rect
        x="6"
        y="6"
        width="118"
        height="68"
        fill="#ffffff"
        stroke="#1e40af"
        stroke-width="1.4"
      />
      <StructGridLines />
      <StructColumnsAndBeams />
    </svg>
  );
}

function SectionBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 135 80" aria-label="Section elevation thumbnail">
      <rect
        x="4"
        y="4"
        width="127"
        height="72"
        fill="#ffffff"
        stroke="#1e40af"
        stroke-width="1.2"
      />
      {/* Building frame */}
      <rect x="12" y="14" width="62" height="52" fill="#eff6ff" stroke="#1e40af" stroke-width="1" />
      <line x1="12" y1="31" x2="74" y2="31" stroke="#2563eb" stroke-width="1.1" />
      <line x1="12" y1="48" x2="74" y2="48" stroke="#2563eb" stroke-width="1.1" />
      {/* Columns in section */}
      <line x1="18" y1="14" x2="18" y2="66" stroke="#1e40af" stroke-width="2" />
      <line x1="43" y1="14" x2="43" y2="66" stroke="#1e40af" stroke-width="2" />
      <line x1="68" y1="14" x2="68" y2="66" stroke="#1e40af" stroke-width="2" />
      {/* Footing pads at bottom */}
      <rect x="14" y="66" width="8" height="3" fill="#cbd5e1" stroke="#1e40af" stroke-width="0.8" />
      <rect x="39" y="66" width="8" height="3" fill="#cbd5e1" stroke="#1e40af" stroke-width="0.8" />
      <rect x="64" y="66" width="8" height="3" fill="#cbd5e1" stroke="#1e40af" stroke-width="0.8" />
      {/* Level tags */}
      <text x="78" y="18" fill="#475569" font-size="5.5" font-family="system-ui, sans-serif">
        +10.80 m (Roof)
      </text>
      <text x="78" y="35" fill="#475569" font-size="5.5" font-family="system-ui, sans-serif">
        +7.20 m (FF)
      </text>
      <text x="78" y="52" fill="#475569" font-size="5.5" font-family="system-ui, sans-serif">
        +3.60 m (GF)
      </text>
      <text x="78" y="69" fill="#475569" font-size="5.5" font-family="system-ui, sans-serif">
        ±0.00 m (NGL)
      </text>
    </svg>
  );
}

function DetailsBlueprint() {
  return (
    <svg class={styles.blueprintSvg} viewBox="0 0 135 80" aria-label="Member details thumbnail">
      <rect
        x="4"
        y="4"
        width="127"
        height="72"
        fill="#ffffff"
        stroke="#1e40af"
        stroke-width="1.2"
      />
      {/* Beam/Column cross section */}
      <rect
        x="28"
        y="13"
        width="44"
        height="50"
        fill="#eff6ff"
        stroke="#1e40af"
        stroke-width="1.2"
      />
      {/* Stirrup ring */}
      <rect x="32" y="17" width="36" height="42" fill="none" stroke="#ea580c" stroke-width="0.9" />
      {/* Corner rebars */}
      <circle cx="36" cy="21" r="2.2" fill="#dc2626" />
      <circle cx="64" cy="21" r="2.2" fill="#dc2626" />
      <circle cx="36" cy="55" r="2.2" fill="#dc2626" />
      <circle cx="64" cy="55" r="2.2" fill="#dc2626" />
      {/* Intermediate bars */}
      <circle cx="50" cy="21" r="1.8" fill="#dc2626" />
      <circle cx="50" cy="55" r="1.8" fill="#dc2626" />
      {/* Side face bars */}
      <circle cx="36" cy="38" r="1.8" fill="#2563eb" />
      <circle cx="64" cy="38" r="1.8" fill="#2563eb" />
      {/* Labels */}
      <text x="76" y="23" fill="#334155" font-size="5.5" font-family="system-ui, sans-serif">
        4 - 20Ø (T)
      </text>
      <text x="76" y="40" fill="#334155" font-size="5.5" font-family="system-ui, sans-serif">
        2 - 16Ø (S)
      </text>
      <text x="76" y="57" fill="#334155" font-size="5.5" font-family="system-ui, sans-serif">
        4 - 20Ø (B)
      </text>
      <text x="44" y="70" fill="#64748b" font-size="5.5" font-family="system-ui, sans-serif">
        300
      </text>
      <text x="14" y="40" fill="#64748b" font-size="5.5" font-family="system-ui, sans-serif">
        450
      </text>
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
  const isUploaded = sheets.length > 0;
  const preview = sheets.slice(0, 4);
  const extra = sheets.length - preview.length;

  return (
    <div class={styles.drawingBox}>
      <div class={styles.drawingBoxTop}>
        <div class={styles.drawingBoxTitleRow}>
          <span class={isUploaded ? styles.checkIconGreen : styles.pendingIconGray}>
            <Icon name={isUploaded ? 'circle-check' : 'circle-dashed'} />
          </span>
          <h3 class={styles.drawingBoxTitle}>{title}</h3>
        </div>
        <span class={isUploaded ? styles.sheetCountBadge : styles.sheetCountPending}>
          {isUploaded ? `${sheets.length} sheets · Uploaded` : '0 sheets · Pending'}
        </span>
      </div>
      <div class={styles.drawingBoxBody}>
        <div class={styles.blueprintThumbnailWrap}>{children}</div>
        <div class={styles.drawingListWrap}>
          {isUploaded ? (
            <>
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
            </>
          ) : (
            <div class={styles.noSheetsMsg}>
              <span>No sheets uploaded yet</span>
            </div>
          )}
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
