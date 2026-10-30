import styles from './advancedPenSelection.module.css';

export function AdvancedPenWorkflowGuide() {
  return (
    <div class={styles.workflowSection}>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable content must be keyboard-focusable (WCAG 2.1.1). */}
      <section class={styles.workflowStepsContainer} tabIndex={0} aria-label="Workflow steps">
        {/* Step 1 */}
        <div class={styles.workflowStepCard}>
          <div class={styles.workflowStepHeader}>
            <span class={styles.stepBadgeBlue}>1</span>
            <span class={styles.workflowStepTitle}>Original Image</span>
          </div>
          <div class={styles.workflowThumbWrapper}>
            <img
              src="/samples/kingfisher-sample.jpg"
              alt="Step 1: Original"
              class={styles.workflowThumbImg}
              loading="lazy"
            />
          </div>
          <div class={styles.workflowStepCaption}>
            <strong>Upload your image</strong>
            <span>(JPG / PNG / WebP)</span>
          </div>
        </div>

        <div class={styles.stepArrow}>➔</div>

        {/* Step 2 */}
        <div class={styles.workflowStepCard}>
          <div class={styles.workflowStepHeader}>
            <span class={styles.stepBadgePink}>2</span>
            <span class={styles.workflowStepTitle}>Auto Selection</span>
          </div>
          <div class={styles.workflowThumbWrapper}>
            <img
              src="/samples/kingfisher-sample.jpg"
              alt="Step 2: Auto Select"
              class={styles.workflowThumbImg}
              loading="lazy"
            />
            <div class={styles.thumbSilhouetteOverlay} />
          </div>
          <div class={styles.workflowStepCaption}>
            <strong>Auto-detects boundary</strong>
            <span>instant initial contour</span>
          </div>
        </div>

        <div class={styles.stepArrow}>➔</div>

        {/* Step 3 */}
        <div class={styles.workflowStepCard}>
          <div class={styles.workflowStepHeader}>
            <span class={styles.stepBadgeGreen}>3</span>
            <span class={styles.workflowStepTitle}>Edit with Pen Tool</span>
          </div>
          <div class={styles.workflowThumbWrapper}>
            <img
              src="/samples/kingfisher-sample.jpg"
              alt="Step 3: Pen Tool"
              class={styles.workflowThumbImg}
              loading="lazy"
            />
            <svg
              class={styles.thumbSvgOverlay}
              viewBox="0 0 100 75"
              role="img"
              aria-label="Vector point preview"
            >
              <title>Vector point preview</title>
              <path
                d="M 15 50 Q 30 20 60 25 T 90 45"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="3 2"
              />
              <circle cx="35" cy="22" r="3" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
              <circle cx="60" cy="25" r="3" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
              <line x1="60" y1="25" x2="75" y2="15" stroke="#3b82f6" strokeWidth="1" />
              <circle cx="75" cy="15" r="2" fill="#ffffff" stroke="#2563eb" strokeWidth="1" />
            </svg>
          </div>
          <div class={styles.workflowStepCaption}>
            <strong>Adjust points & curves</strong>
            <span>Photoshop-style precision</span>
          </div>
        </div>

        <div class={styles.stepArrow}>➔</div>

        {/* Step 4 */}
        <div class={styles.workflowStepCard}>
          <div class={styles.workflowStepHeader}>
            <span class={styles.stepBadgeAmber}>4</span>
            <span class={styles.workflowStepTitle}>Adjust Feather</span>
          </div>
          <div class={`${styles.workflowThumbWrapper} ${styles.featherComparison}`}>
            <img
              src="/samples/kingfisher-sample.jpg"
              alt="Step 4: Feather"
              class={styles.workflowThumbImg}
              loading="lazy"
            />
            <div class={styles.featherSplitBar} />
            <div class={styles.featherBadgeLeft}>Feather 0 px</div>
            <div class={styles.featherBadgeRight}>Feather 5 px</div>
          </div>
          <div class={styles.workflowStepCaption}>
            <strong>Feather 0px vs 5px</strong>
            <span>soft natural boundary</span>
          </div>
        </div>

        <div class={styles.stepArrow}>➔</div>

        {/* Step 5 */}
        <div class={styles.workflowStepCard}>
          <div class={styles.workflowStepHeader}>
            <span class={styles.stepBadgePurple}>5</span>
            <span class={styles.workflowStepTitle}>Final Output</span>
          </div>
          <div class={`${styles.workflowThumbWrapper} ${styles.bgCheckerboard}`}>
            <img
              src="/samples/kingfisher-sample.jpg"
              alt="Step 5: Output"
              class={styles.workflowThumbImgCutout}
              loading="lazy"
            />
          </div>
          <div class={styles.workflowStepCaption}>
            <strong>Transparent background</strong>
            <span>Download PNG / WebP</span>
          </div>
        </div>

        {/* USE CASES CARD */}
        <div class={styles.useCasesCard}>
          <div class={styles.useCasesHeader}>
            <span class={styles.useCasesStar}>⭐</span>
            <span class={styles.useCasesTitle}>Use Cases</span>
          </div>
          <ul class={styles.useCasesList}>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Product photos for e-commerce</span>
            </li>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Create stickers and cutouts</span>
            </li>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Remove background for presentations</span>
            </li>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Design thumbnails and social media images</span>
            </li>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Isolate objects for graphic design</span>
            </li>
            <li>
              <span class={styles.checkIcon}>✓</span>
              <span>Export reusable SVG path</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
