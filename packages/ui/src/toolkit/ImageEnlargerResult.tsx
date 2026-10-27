import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './imageEnlarger.module.css';
import type { UseImageEnlargerReturn } from './useImageEnlarger.ts';

export interface ImageEnlargerResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  enlarger: UseImageEnlargerReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageEnlargerResult({ preset: _preset, enlarger }: ImageEnlargerResultProps) {
  const res = enlarger.result;
  const hasResult = !!res;
  const outW = res ? res.outputWidth : enlarger.sourceDims.width * enlarger.settings.scale;
  const outH = res ? res.outputHeight : enlarger.sourceDims.height * enlarger.settings.scale;

  return (
    <aside class={styles.resultPanel} aria-label="Output Specifications">
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>5. Output Summary</span>
        <span
          style={{
            fontSize: '10px',
            color: hasResult ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: 'var(--weight-bold)',
          }}
        >
          {hasResult ? '✓ Enhanced' : 'Ready'}
        </span>
      </div>

      <table class={styles.specsTable} aria-label="Enhancement specifications">
        <tbody>
          <tr>
            <td class={styles.specKey}>Resolution</td>
            <td class={styles.specVal}>
              {outW} × {outH} px
            </td>
          </tr>
          <tr>
            <td class={styles.specKey}>Scale Multiplier</td>
            <td class={styles.specVal}>
              {enlarger.settings.scale}× ({enlarger.settings.scale * 100}% Zoom)
            </td>
          </tr>
          <tr>
            <td class={styles.specKey}>Sharpness & Clarity</td>
            <td class={styles.specVal}>+{enlarger.settings.sharpness}%</td>
          </tr>
          <tr>
            <td class={styles.specKey}>Contrast S-Curve</td>
            <td class={styles.specVal}>
              {enlarger.settings.contrast > 0 ? '+' : ''}
              {enlarger.settings.contrast}%
            </td>
          </tr>
          <tr>
            <td class={styles.specKey}>Format</td>
            <td class={styles.specVal}>{enlarger.outputFormat.toUpperCase()}</td>
          </tr>
          {hasResult && (
            <tr>
              <td class={styles.specKey}>Output Size</td>
              <td class={styles.specVal}>{formatBytes(res.outputFileSize)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div class={styles.downloadGroup}>
        <button
          type="button"
          class={styles.downloadCtaBtn}
          name="Download enlarged image"
          aria-label="Download enlarged image"
          onClick={() => {
            void enlarger.executeEnlarge();
          }}
          disabled={!enlarger.file || enlarger.phase === 'running'}
        >
          <span>📥</span>
          <span>
            {enlarger.phase === 'running' ? 'Enhancing & Enlarging...' : 'Download enlarged image'}
          </span>
        </button>

        {hasResult && (
          <button
            type="button"
            class={styles.downloadFastBtn}
            onClick={() => void enlarger.downloadResult('fast')}
            disabled={enlarger.phase === 'running'}
          >
            <span>⚡</span>
            <span>Download Fast Web Version</span>
          </button>
        )}
      </div>

      <div class={styles.trustPill}>
        <span>🔒</span>
        <span>100% In-Browser. No Files Uploaded.</span>
      </div>

      {/* Playwright E2E primary result locator */}
      <div data-primary-result="" class="visually-hidden">
        <output>{outW}</output>
      </div>

      <dl class="visually-hidden">
        <div data-output="outputWidth">
          <dt>New width</dt>
          <dd>{outW}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>New height</dt>
          <dd>{outH}</dd>
        </div>
        <div data-output="originalWidth">
          <dt>Original width</dt>
          <dd>{enlarger.sourceDims.width}</dd>
        </div>
        <div data-output="originalHeight">
          <dt>Original height</dt>
          <dd>{enlarger.sourceDims.height}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{enlarger.outputFormat}</dd>
        </div>
      </dl>
    </aside>
  );
}
