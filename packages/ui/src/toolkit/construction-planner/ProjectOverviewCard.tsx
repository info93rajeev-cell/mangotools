import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { ProjectOverviewState } from './types.ts';

interface ProjectOverviewCardProps {
  overview: ProjectOverviewState;
  onChangeField: (key: keyof ProjectOverviewState, value: string) => void;
}

export function ProjectOverviewCard({ overview, onChangeField }: ProjectOverviewCardProps) {
  return (
    <section class={styles.overviewCard} aria-labelledby="overview-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="box" />
          </span>
          <h2 id="overview-heading" class={styles.cardTitle}>
            {t.projectOverviewTitle}
          </h2>
        </div>
      </div>

      <div class={styles.overviewFormGrid}>
        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-project-name">
            {t.projectNameLabel}
          </label>
          <input
            id="cp-project-name"
            class={styles.formInput}
            type="text"
            value={overview.projectName}
            placeholder={t.projectNamePlaceholder}
            onInput={(e) => onChangeField('projectName', (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-location">
            {t.locationLabel}
          </label>
          <input
            id="cp-location"
            class={styles.formInput}
            type="text"
            value={overview.location}
            placeholder={t.locationPlaceholder}
            onInput={(e) => onChangeField('location', (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-project-type">
            {t.projectTypeLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-project-type"
              class={styles.formSelect}
              value={overview.projectType}
              onChange={(e) => onChangeField('projectType', (e.target as HTMLSelectElement).value)}
            >
              <option value="Mixed Use (House + Office)">Mixed Use (House + Office)</option>
              <option value="Residential Individual House">Residential Individual House</option>
              <option value="Residential Apartment">Residential Apartment</option>
              <option value="Commercial Office Building">Commercial Office Building</option>
              <option value="Industrial Shed / Warehouse">Industrial Shed / Warehouse</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-floors">
            {t.floorsLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-floors"
              class={styles.formSelect}
              value={overview.floors}
              onChange={(e) => onChangeField('floors', (e.target as HTMLSelectElement).value)}
            >
              <option value="G (Ground only)">G (Ground only)</option>
              <option value="1 (G + 1)">1 (G + 1)</option>
              <option value="2 (G + 2)">2 (G + 2)</option>
              <option value="3 (G + 3)">3 (G + 3)</option>
              <option value="4 (G + 4)">4 (G + 4)</option>
              <option value="5 (G + 5)">5 (G + 5)</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-site-portion">
            {t.sitePortionLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-site-portion"
              class={styles.formSelect}
              value={overview.sitePortion}
              onChange={(e) => onChangeField('sitePortion', (e.target as HTMLSelectElement).value)}
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

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-unit-system">
            {t.unitSystemLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-unit-system"
              class={styles.formSelect}
              value={overview.unitSystem}
              onChange={(e) => onChangeField('unitSystem', (e.target as HTMLSelectElement).value)}
            >
              <option value="Metric (m, mm, kg, m³)">Metric (m, mm, kg, m³)</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-concrete-std">
            {t.concreteStandardLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-concrete-std"
              class={styles.formSelect}
              value={overview.concreteStandard}
              onChange={(e) =>
                onChangeField('concreteStandard', (e.target as HTMLSelectElement).value)
              }
            >
              <option value="IS 456 : 2000">IS 456 : 2000</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>

        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="cp-rebar-std">
            {t.rebarStandardLabel}
          </label>
          <div class={styles.selectWrap}>
            <select
              id="cp-rebar-std"
              class={styles.formSelect}
              value={overview.rebarStandard}
              onChange={(e) =>
                onChangeField('rebarStandard', (e.target as HTMLSelectElement).value)
              }
            >
              <option value="IS 1786 : 2008 (Fe 500)">IS 1786 : 2008 (Fe 500)</option>
              <option value="IS 1786 : 2008 (Fe 415)">IS 1786 : 2008 (Fe 415)</option>
              <option value="IS 1786 : 2008 (Fe 550D)">IS 1786 : 2008 (Fe 550D)</option>
            </select>
            <span class={styles.selectArrow}>
              <Icon name="chevron-down" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
