import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { PlannerTab } from './types.ts';

interface WorkflowRoadmapProps {
  onStepClick: (tab: PlannerTab) => void;
}

interface StepItem {
  num: number;
  icon: 'layers' | 'box' | 'table-2' | 'files' | 'circle-check' | 'file-text';
  title: string;
  desc: string;
  targetTab: PlannerTab;
  isReady: boolean;
}

export function WorkflowRoadmap({ onStepClick }: WorkflowRoadmapProps) {
  const steps: StepItem[] = [
    {
      num: 1,
      icon: 'layers',
      title: t.step1Title,
      desc: t.step1Desc,
      targetTab: 'setup',
      isReady: true,
    },
    {
      num: 2,
      icon: 'box',
      title: t.step2Title,
      desc: t.step2Desc,
      targetTab: 'drawings',
      isReady: false,
    },
    {
      num: 3,
      icon: 'table-2',
      title: t.step3Title,
      desc: t.step3Desc,
      targetTab: 'concrete-rebar',
      isReady: false,
    },
    {
      num: 4,
      icon: 'files',
      title: t.step4Title,
      desc: t.step4Desc,
      targetTab: 'bbs',
      isReady: false,
    },
    {
      num: 5,
      icon: 'circle-check',
      title: t.step5Title,
      desc: t.step5Desc,
      targetTab: 'revisions',
      isReady: false,
    },
    {
      num: 6,
      icon: 'file-text',
      title: t.step6Title,
      desc: t.step6Desc,
      targetTab: 'revisions',
      isReady: false,
    },
  ];

  return (
    <section class={styles.roadmapCard} aria-labelledby="roadmap-heading">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderTitle}>
          <span class={styles.cardIconBlue}>
            <Icon name="route" />
          </span>
          <div>
            <h2 id="roadmap-heading" class={styles.cardTitle}>
              {t.workflowRoadmapTitle}
            </h2>
            <p class={styles.cardSubtitle}>{t.workflowRoadmapSubtitle}</p>
          </div>
        </div>
      </div>

      <div class={styles.roadmapStepsTrack}>
        {steps.map((step, idx) => (
          <div key={step.num} class={styles.roadmapStepCol}>
            <button
              type="button"
              class={`${styles.roadmapPill} ${step.isReady ? styles.roadmapPillActive : ''}`}
              onClick={() => onStepClick(step.targetTab)}
            >
              <span class={styles.stepNumCircle}>{step.num}</span>
              <span class={styles.stepPillIcon}>
                <Icon name={step.icon} />
              </span>
              <div class={styles.stepTextWrap}>
                <span class={styles.stepTitle}>{step.title}</span>
                <span class={styles.stepDesc}>{step.desc}</span>
              </div>
            </button>
            {idx < steps.length - 1 && (
              <span class={styles.stepArrow} aria-hidden="true">
                <Icon name="arrow-right" />
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
