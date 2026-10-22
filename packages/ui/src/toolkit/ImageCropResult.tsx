import type { OpWarning } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { formatFileSize } from '../archetypes/FileQueue.tsx';
import { Button } from '../primitives/Button.tsx';
import styles from './imageCrop.module.css';
import { label, messageFor } from './presentation.ts';
export interface ImageCropResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFormat: string;
  outputFormat: string;
  outputFileSize: number;
  warnings: OpWarning[];
}

export interface ImageCropResultProps {
  preset: ResolvedPreset;
  result: ImageCropResultData;
  resultUrl: string;
  onDownload: () => void;
}

export function ImageCropResult({ preset, result, resultUrl, onDownload }: ImageCropResultProps) {
  const warnings = result.warnings ?? [];

  return (
    <section class={styles.resultCard} aria-labelledby="cropped-result-heading" data-crop-result="">
      <h3 id="cropped-result-heading" class="sr-only">
        Cropped result
      </h3>
      <div data-primary-result="" class="sr-only">
        <output>{result.fileName}</output>
      </div>
      <div class={styles.resultPreviewWrap}>
        <img
          src={resultUrl}
          alt={`Cropped result: ${result.outputWidth} by ${result.outputHeight} pixels`}
          class={styles.resultImage}
          data-crop-result-image=""
        />
      </div>

      <dl class={styles.resultDetails}>
        <div class={styles.resultRow} data-result-row="original-dimensions">
          <dt>Original dimensions</dt>
          <dd>
            {result.originalWidth} × {result.originalHeight} px
          </dd>
        </div>
        <div class={styles.resultRow} data-result-row="crop-coordinates">
          <dt>Crop coordinates</dt>
          <dd>
            X: {result.cropX}, Y: {result.cropY}
          </dd>
        </div>
        <div class={styles.resultRow} data-result-row="cropped-dimensions">
          <dt>Cropped dimensions</dt>
          <dd>
            {result.outputWidth} × {result.outputHeight} px
          </dd>
        </div>
        <div class={styles.resultRow} data-result-row="output-format" data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{result.outputFormat}</dd>
        </div>
        <div class={styles.resultRow} data-result-row="output-size">
          <dt>Output file size</dt>
          <dd>{formatFileSize(result.outputFileSize)}</dd>
        </div>
        <div class="sr-only" data-output="outputWidth">
          <dd>{result.outputWidth}</dd>
        </div>
        <div class="sr-only" data-output="outputHeight">
          <dd>{result.outputHeight}</dd>
        </div>
        <div class="sr-only" data-output="originalWidth">
          <dd>{result.originalWidth}</dd>
        </div>
        <div class="sr-only" data-output="originalHeight">
          <dd>{result.originalHeight}</dd>
        </div>
        <div class="sr-only" data-output="cropX">
          <dd>{result.cropX}</dd>
        </div>
        <div class="sr-only" data-output="cropY">
          <dd>{result.cropY}</dd>
        </div>
      </dl>

      {warnings.length > 0 && (
        <details class={styles.notesDisclosure} data-warnings-disclosure="">
          <summary class={styles.notesSummary}>
            Important notes / Warnings ({warnings.length})
          </summary>
          <ul class={styles.notesList}>
            {warnings.map((w) => (
              <li key={w.code}>{messageFor(preset, w)}</li>
            ))}
          </ul>
        </details>
      )}

      <div class={styles.actions}>
        <Button variant="primary" icon="download" onClick={onDownload} data-download-cropped="">
          {label(preset, 'fileTool.downloadCta')}
        </Button>
      </div>
    </section>
  );
}
