import { useEffect, useState } from 'preact/hooks';
import styles from './toolOnboardingTour.module.css';
import {
  isTourCompleted,
  markTourCompleted,
  type ToolOnboardingTourProps,
  type TourStep,
} from './tourStorage.ts';

export type { ToolOnboardingTourProps, TourStep };
export { isTourCompleted, markTourCompleted };

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function calculateCardPos(rect: SpotlightRect | null): { top: number; left: number } {
  if (typeof window === 'undefined' || !rect) {
    return { top: 120, left: 24 };
  }
  const isMobile = window.innerWidth <= 600;
  if (isMobile) {
    return { top: window.innerHeight - 280, left: 12 };
  }

  const cardWidth = 340;
  const cardHeight = 220;
  const padding = 12;

  let left = rect.left + rect.width / 2 - cardWidth / 2;
  left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));

  let top = rect.top + rect.height + padding;
  if (top + cardHeight > window.innerHeight - 16) {
    top = Math.max(16, rect.top - cardHeight - padding);
  }

  return { top, left };
}

function TourProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div class={styles.tourProgressRow}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          class={styles.progressDot}
          data-active={String(i === current)}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface TourFooterProps {
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function TourFooter({ isFirst, isLast, onNext, onBack, onSkip }: TourFooterProps) {
  return (
    <div class={styles.tourFooter}>
      <button type="button" class={styles.skipBtn} onClick={onSkip}>
        Skip Tour
      </button>
      <div class={styles.navBtnGroup}>
        {!isFirst && (
          <button type="button" class={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
        )}
        <button type="button" class={styles.nextBtn} onClick={onNext}>
          {isLast ? 'Got it! ✓' : 'Next Step →'}
        </button>
      </div>
    </div>
  );
}

interface TourCardModalProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  cardPos: { top: number; left: number };
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
}

function TourCardModal({
  step,
  stepIndex,
  totalSteps,
  cardPos,
  onClose,
  onNext,
  onBack,
}: TourCardModalProps) {
  return (
    <div
      class={styles.tourCard}
      role="dialog"
      aria-modal="true"
      aria-label={`Step ${step.stepNumber}: ${step.title}`}
      style={{
        '--card-top': `${cardPos.top}px`,
        '--card-left': `${cardPos.left}px`,
      }}
    >
      <div class={styles.tourHeader}>
        <div class={styles.stepIndicator}>
          <span class={styles.stepBadge}>{step.stepNumber}</span>
          <span class={styles.stepLabel}>
            Step {step.stepNumber} of {totalSteps}
          </span>
        </div>
        <button
          type="button"
          class={styles.closeBtn}
          onClick={onClose}
          aria-label="Close walkthrough"
          title="Close walkthrough"
        >
          ✕
        </button>
      </div>

      <div class={styles.tourBody}>
        <h3 class={styles.tourTitle}>{step.title}</h3>
        <p class={styles.tourDesc}>{step.description}</p>
        {step.hint && <div class={styles.tourHint}>💡 {step.hint}</div>}
      </div>

      <TourProgressDots total={totalSteps} current={stepIndex} />
      <TourFooter
        isFirst={stepIndex === 0}
        isLast={stepIndex === totalSteps - 1}
        onNext={onNext}
        onBack={onBack}
        onSkip={onClose}
      />
    </div>
  );
}

export function ToolOnboardingTour({
  toolId,
  steps,
  isOpen,
  onClose,
  onComplete,
}: ToolOnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const step = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen || !step) return;

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector);
      if (!el) {
        setSpotlight(null);
        return;
      }
      const b = el.getBoundingClientRect();
      const pad = 4;
      const left = Math.max(2, b.left - pad);
      const right = Math.min(window.innerWidth - 2, b.right + pad);
      setSpotlight({
        top: Math.max(0, b.top - pad),
        left,
        width: Math.max(0, right - left),
        height: b.height + pad * 2,
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, step]);

  if (!isOpen || !step) return null;

  const handleFinish = () => {
    markTourCompleted(toolId);
    onClose();
    onComplete?.();
  };

  const handleNext = () => {
    if (isLast) handleFinish();
    else setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const handleBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const cardPos = calculateCardPos(spotlight);

  return (
    <>
      <div class={styles.tourBackdrop} onClick={handleFinish} aria-hidden="true" />
      {spotlight && (
        <div
          class={styles.tourSpotlight}
          style={{
            top: `${spotlight.top}px`,
            left: `${spotlight.left}px`,
            width: `${spotlight.width}px`,
            height: `${spotlight.height}px`,
          }}
        />
      )}
      <TourCardModal
        step={step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        cardPos={cardPos}
        onClose={handleFinish}
        onNext={handleNext}
        onBack={handleBack}
      />
    </>
  );
}

export function TourLauncherButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      class={styles.tourLauncherBtn}
      onClick={onClick}
      title="How this tool works (step-by-step guide)"
    >
      <span>💡</span>
      <span>How to use</span>
    </button>
  );
}
