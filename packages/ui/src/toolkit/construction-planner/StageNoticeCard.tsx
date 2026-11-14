import { Button } from '../../primitives/Button.tsx';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { PlannerTab } from './types.ts';

interface StageNoticeCardProps {
  activeTab: PlannerTab;
  onReturnToSetup: () => void;
}

const STAGE_DETAILS: Record<
  Exclude<PlannerTab, 'setup'>,
  { title: string; stage: string; desc: string }
> = {
  drawings: {
    title: t.tabDrawings,
    stage: 'Stage 3',
    desc: 'Interactive CAD/PDF drawing sheet viewer, pan/zoom canvas, structural grid alignment, and manual member tagging.',
  },
  'concrete-rebar': {
    title: t.tabConcreteRebar,
    stage: 'Stage 4',
    desc: 'Member concrete geometry sizing, reinforcement detailing, clear cover, and IS 2502 cutting length derivation.',
  },
  bbs: {
    title: t.tabBbs,
    stage: 'Stage 5',
    desc: 'Consolidated Bar Bending Schedule table, diameter-wise tonnage aggregation, and fabrication package export.',
  },
  revisions: {
    title: t.tabRevisions,
    stage: 'Stage 6',
    desc: 'Immutable revision comparison, quantity deltas, approval logs, and browser-native printable project reports.',
  },
};

export function StageNoticeCard({ activeTab, onReturnToSetup }: StageNoticeCardProps) {
  if (activeTab === 'setup') return null;
  const detail = STAGE_DETAILS[activeTab];

  return (
    <section class={styles.stageNoticeCard} aria-label="Development stage preview">
      <div class={styles.stageNoticeIconWrap}>
        <Icon name="clock" />
      </div>
      <div class={styles.stageNoticeContent}>
        <div class={styles.stageNoticeBadgeRow}>
          <span class={styles.stageNoticeBadge}>{detail.stage}</span>
          <span class={styles.stageNoticeStatus}>{t.notBuiltYetBadge}</span>
        </div>
        <h2 class={styles.stageNoticeTitle}>{detail.title}</h2>
        <p class={styles.stageNoticeDesc}>{detail.desc}</p>
        <div class={styles.stageNoticeAction}>
          <Button variant="primary" onClick={onReturnToSetup}>
            Back to Project Setup
          </Button>
        </div>
      </div>
    </section>
  );
}
