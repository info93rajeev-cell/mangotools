import styles from './dataStudio.module.css';
import type { DetailedJsonStats } from './jsonStats.ts';

interface JsonStructureCardsProps {
  stats: DetailedJsonStats | null;
}

export function JsonStructureCards({ stats }: JsonStructureCardsProps) {
  if (!stats) return null;
  const { types } = stats;

  return (
    <div class={styles.sideSummaryCol}>
      {/* 1. Structure Summary */}
      <section class={styles.structureCard}>
        <div class={styles.sideCardHeader}>
          <span class={styles.sideCardTitle}>Structure Summary</span>
        </div>
        <div class={styles.structureGrid}>
          <div class={`${styles.structureMetric} ${styles.metricBlue}`}>
            <span class={styles.metricIcon}>🧊</span>
            <div class={styles.metricText}>
              <small>Objects</small>
              <b>{stats.objects}</b>
            </div>
          </div>
          <div class={`${styles.structureMetric} ${styles.metricPurple}`}>
            <span class={styles.metricIcon}>🔲</span>
            <div class={styles.metricText}>
              <small>Arrays</small>
              <b>{stats.arrays}</b>
            </div>
          </div>
          <div class={`${styles.structureMetric} ${styles.metricAmber}`}>
            <span class={styles.metricIcon}>📋</span>
            <div class={styles.metricText}>
              <small>Total Keys</small>
              <b>{stats.totalKeys}</b>
            </div>
          </div>
          <div class={`${styles.structureMetric} ${styles.metricGreen}`}>
            <span class={styles.metricIcon}>🌱</span>
            <div class={styles.metricText}>
              <small>Total Values</small>
              <b>{stats.totalValues}</b>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Data Types Breakdown */}
      <section class={styles.dataTypesCard}>
        <div class={styles.sideCardHeader}>
          <span class={styles.sideCardTitle}>Data Types</span>
        </div>
        <div class={styles.dataTypesList}>
          <DataTypeRow
            icon="🌿"
            label="Strings"
            count={types.strings}
            pct={types.stringsPct}
            colorClass={styles.trackGreen}
          />
          <DataTypeRow
            icon="🔢"
            label="Numbers"
            count={types.numbers}
            pct={types.numbersPct}
            colorClass={styles.trackBlue}
          />
          <DataTypeRow
            icon="🛡️"
            label="Booleans"
            count={types.booleans}
            pct={types.booleansPct}
            colorClass={styles.trackRed}
          />
          <DataTypeRow
            icon="⚪"
            label="Null"
            count={types.nulls}
            pct={types.nullsPct}
            colorClass={styles.trackGray}
          />
          <DataTypeRow
            icon="🧊"
            label="Objects"
            count={types.objects}
            pct={types.objectsPct}
            colorClass={styles.trackPurple}
          />
          <DataTypeRow
            icon="🔲"
            label="Arrays"
            count={types.arrays}
            pct={types.arraysPct}
            colorClass={styles.trackPink}
          />
        </div>
      </section>
    </div>
  );
}

function DataTypeRow({
  icon,
  label,
  count,
  pct,
  colorClass,
}: {
  icon: string;
  label: string;
  count: number;
  pct: number;
  colorClass: string;
}) {
  return (
    <div class={styles.dataTypeRow}>
      <div class={styles.dataTypeMeta}>
        <span class={styles.dataTypeIcon}>{icon}</span>
        <span class={styles.dataTypeLabel}>{label}</span>
      </div>
      <div class={styles.dataTypeTrackWrapper}>
        <div class={styles.dataTypeTrack}>
          <div
            class={`${styles.dataTypeBar} ${colorClass}`}
            style={{ width: `${Math.min(100, Math.max(pct, count > 0 ? 8 : 0))}%` }}
          />
        </div>
      </div>
      <div class={styles.dataTypeCount}>
        <strong>{count}</strong>
        <span class={styles.dataTypePct}>{pct}%</span>
      </div>
    </div>
  );
}
