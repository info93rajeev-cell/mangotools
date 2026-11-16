import { useState } from 'preact/hooks';
import { Button } from '../../primitives/Button.tsx';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import type { DrawingCategory, SheetMetadata } from './types.ts';

interface DrawingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSheet: (sheet: SheetMetadata) => void;
}

interface UploadFormProps {
  onClose: () => void;
  onAddSheet: (sheet: SheetMetadata) => void;
}

function UploadForm({ onClose, onAddSheet }: UploadFormProps) {
  const [category, setCategory] = useState<DrawingCategory>('structural');
  const [sheetNumber, setSheetNumber] = useState('S-05');
  const [name, setName] = useState('Column Detail Schedule');
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = (e: preact.JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddSheet({
      id: `sheet-${Date.now()}`,
      category,
      sheetNumber,
      name,
      revision: 'R1',
      sizeBytes: 1048576,
      uploadedAt: new Date().toISOString(),
      status: 'Uploaded',
    });
    onClose();
  };

  const handleFileChange = (e: preact.JSX.TargetedEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setFileName(file.name);
      if (file.name.toLowerCase().endsWith('.dwg')) {
        alert(t.dwgNotSupportedNotice);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} class={styles.modalForm}>
      <div class={styles.noticeAlertAmber}>
        <span class={styles.noticeIcon}>
          <Icon name="circle-alert" />
        </span>
        <p class={styles.noticeText}>{t.dwgNotSupportedNotice}</p>
      </div>

      <div class={styles.samplePdfDownloadBox}>
        <Icon name="file-text" />
        <span>Need a test file?</span>
        <a
          href="/sample-structural-drawing.pdf"
          download="Sample-Structural-Drawing-Package.pdf"
          class={styles.samplePdfLink}
        >
          Download sample 4-page drawing package (PDF)
        </a>
      </div>

      <div class={styles.formGroup}>
        <label class={styles.formLabel} for="modal-sheet-cat">
          Drawing Category
        </label>
        <div class={styles.selectWrap}>
          <select
            id="modal-sheet-cat"
            class={styles.formSelect}
            value={category}
            onChange={(e) => setCategory((e.target as HTMLSelectElement).value as DrawingCategory)}
          >
            <option value="architectural">{t.archPlanLabel}</option>
            <option value="structural">{t.structPlanLabel}</option>
            <option value="section-elevation">{t.secElevLabel}</option>
            <option value="member-details">{t.memberDetailsLabel}</option>
          </select>
          <span class={styles.selectArrow}>
            <Icon name="chevron-down" />
          </span>
        </div>
      </div>

      <div class={styles.formRowTwoCol}>
        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="modal-sheet-num">
            Sheet Number
          </label>
          <input
            id="modal-sheet-num"
            class={styles.formInput}
            type="text"
            value={sheetNumber}
            onInput={(e) => setSheetNumber((e.target as HTMLInputElement).value)}
            required
          />
        </div>
        <div class={styles.formGroup}>
          <label class={styles.formLabel} for="modal-sheet-name">
            Sheet Title
          </label>
          <input
            id="modal-sheet-name"
            class={styles.formInput}
            type="text"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            required
          />
        </div>
      </div>

      <div class={styles.formGroup}>
        <label class={styles.formLabel} for="modal-sheet-file">
          Select PDF or Image file
        </label>
        <input
          id="modal-sheet-file"
          class={styles.fileInput}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
        />
        {fileName && <span class={styles.fileSelectedText}>Selected: {fileName}</span>}
      </div>

      <div class={styles.modalActions}>
        <Button variant="ghost" onClick={onClose}>
          {t.btnCancel}
        </Button>
        <Button variant="primary" type="submit">
          Attach Sheet
        </Button>
      </div>
    </form>
  );
}

export function DrawingUploadModal({ isOpen, onClose, onAddSheet }: DrawingUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      class={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div class={styles.modalDialog}>
        <div class={styles.modalHeader}>
          <div class={styles.modalTitleRow}>
            <span class={styles.cardIconBlue}>
              <Icon name="file-plus" />
            </span>
            <h2 id="upload-modal-title" class={styles.modalTitle}>
              {t.uploadDrawingsBtn}
            </h2>
          </div>
          <button
            type="button"
            class={styles.modalCloseBtn}
            onClick={onClose}
            aria-label={t.btnClose}
          >
            <Icon name="x" />
          </button>
        </div>
        <UploadForm onClose={onClose} onAddSheet={onAddSheet} />
      </div>
    </div>
  );
}
