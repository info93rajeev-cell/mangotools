import styles from './imageCrop.module.css';

export function ImageCropDocCards() {
  return (
    <div class={styles.docCardsContainer} data-crop-doc-cards="">
      {/* CARD 1: HOW TO USE */}
      <section class={styles.docCard} aria-labelledby="crop-how-to-use-title">
        <h3 id="crop-how-to-use-title" class={styles.docCardTitle}>
          <span class={styles.docCardIcon} aria-hidden="true">
            📖
          </span>
          How to Crop an Image
        </h3>
        <ol class={styles.stepList}>
          <li class={styles.stepItem}>
            <strong>1. Select or Drop:</strong> Choose any JPG, PNG, or WebP photo.
          </li>
          <li class={styles.stepItem}>
            <strong>2. Adjust Frame:</strong> Drag handles or pick an aspect ratio (1:1, 4:3, 16:9).
          </li>
          <li class={styles.stepItem}>
            <strong>3. Crop & Download:</strong> Click "Crop Image" to instantly save your cut.
          </li>
        </ol>
      </section>

      {/* CARD 2: METHOD */}
      <section class={styles.docCard} aria-labelledby="crop-method-title">
        <h3 id="crop-method-title" class={styles.docCardTitle}>
          <span class={styles.docCardIcon} aria-hidden="true">
            ⚙️
          </span>
          Method & Precision
        </h3>
        <p class={styles.docCardText}>
          Uses in-browser OffscreenCanvas and subpixel-to-integer coordinate rounding. Pixels are
          sliced directly from source memory without server compression artifacts or generational
          quality loss.
        </p>
      </section>

      {/* CARD 3: IMPORTANT NOTES */}
      <section class={styles.docCard} aria-labelledby="crop-notes-title">
        <h3 id="crop-notes-title" class={styles.docCardTitle}>
          <span class={styles.docCardIcon} aria-hidden="true">
            ⚠️
          </span>
          Important Notes
        </h3>
        <ul class={styles.noteList}>
          <li>
            <strong>Lock Ratio:</strong> Keeps proportions fixed when resizing official form photos.
          </li>
          <li>
            <strong>PNG Transparency:</strong> Preserved when output format is set to "Same" or
            "PNG".
          </li>
          <li>
            <strong>Offline Safe:</strong> Your photos never leave your device or reach any server.
          </li>
        </ul>
      </section>

      {/* CARD 4: FAQ */}
      <section class={styles.docCard} aria-labelledby="crop-faq-title">
        <h3 id="crop-faq-title" class={styles.docCardTitle}>
          <span class={styles.docCardIcon} aria-hidden="true">
            ❓
          </span>
          Frequently Asked Questions
        </h3>
        <div class={styles.faqList}>
          <details class={styles.faqDetails}>
            <summary class={styles.faqSummary}>Does cropping reduce image resolution?</summary>
            <p class={styles.faqAnswer}>
              Cropping extracts the exact pixel area you selected. The cropped section retains 100%
              of its native sensor fidelity without downscaling or blurring.
            </p>
          </details>
          <details class={styles.faqDetails}>
            <summary class={styles.faqSummary}>What format should I download in?</summary>
            <p class={styles.faqAnswer}>
              Choose "Same as input" to preserve source encoding, "JPG" for general photos, or
              "WebP" for 30–50% smaller file size with high visual quality.
            </p>
          </details>
        </div>
      </section>

      {/* CARD 5: RELATED TOOLS */}
      <section class={styles.docCard} aria-labelledby="crop-related-title">
        <h3 id="crop-related-title" class={styles.docCardTitle}>
          <span class={styles.docCardIcon} aria-hidden="true">
            🔗
          </span>
          Related Image Tools
        </h3>
        <div class={styles.relatedLinksGrid}>
          <a href="/image-compress" class={styles.relatedLink}>
            <span class={styles.relatedLinkIcon}>📉</span>
            <div>
              <div class={styles.relatedLinkName}>Image Compress</div>
              <div class={styles.relatedLinkDesc}>Reduce KB without losing quality</div>
            </div>
          </a>
          <a href="/passport-photo-resizer" class={styles.relatedLink}>
            <span class={styles.relatedLinkIcon}>🛂</span>
            <div>
              <div class={styles.relatedLinkName}>Passport Photo Resizer</div>
              <div class={styles.relatedLinkDesc}>Exact 35x45mm / 2x2in crop</div>
            </div>
          </a>
          <a href="/signature-resizer" class={styles.relatedLink}>
            <span class={styles.relatedLinkIcon}>✍️</span>
            <div>
              <div class={styles.relatedLinkName}>Signature Resizer</div>
              <div class={styles.relatedLinkDesc}>Government exam spec dimensions</div>
            </div>
          </a>
          <a href="/image-resize" class={styles.relatedLink}>
            <span class={styles.relatedLinkIcon}>📐</span>
            <div>
              <div class={styles.relatedLinkName}>Image Resize</div>
              <div class={styles.relatedLinkDesc}>Scale exact width and height in px</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
