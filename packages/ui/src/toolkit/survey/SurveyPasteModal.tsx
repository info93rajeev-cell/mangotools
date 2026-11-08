import { useMemo, useRef, useState } from 'preact/hooks';
import { useDialogFocusTrap } from './surveyDialogFocus.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';
import pm from './surveyPasteModal.module.css';
import {
  type ParsedPasteRow,
  type PasteParseOutcome,
  parseSpreadsheetPaste,
} from './surveyPasteModel.ts';

export interface SurveyPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (rows: SurveyLevelingRow[]) => void;
}

function PasteModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div class={pm.modalHeader}>
      <div class={pm.titleArea}>
        <h3 id="paste-modal-title" class={pm.modalTitle}>
          📋 {surveyStrings.pasteModalTitle}
        </h3>
        <p class={pm.modalSubtitle}>{surveyStrings.pasteModalSubtitle}</p>
      </div>
      <button
        type="button"
        class={pm.closeBtn}
        onClick={onClose}
        aria-label={surveyStrings.pasteClose}
        data-paste-close-btn=""
      >
        ✕
      </button>
    </div>
  );
}

function PasteTagBadge({ tag }: { tag: ParsedPasteRow['tag'] }) {
  if (tag === 'BM') return <span class={`${pm.badge} ${pm.badgeBM}`}>BM</span>;
  if (tag === 'CP') return <span class={`${pm.badge} ${pm.badgeCP}`}>CP</span>;
  if (tag === 'IS') return <span class={`${pm.badge} ${pm.badgeIS}`}>IS</span>;
  if (tag === 'FS') return <span class={`${pm.badge} ${pm.badgeFS}`}>FS</span>;
  return <span class={`${pm.badge} ${pm.badgeErr}`}>ERR</span>;
}

interface InputSectionProps {
  rawText: string;
  setRawText: (text: string) => void;
  clipError: string | null;
  setClipError: (error: string | null) => void;
  textareaRef: { current: HTMLTextAreaElement | null };
  onClipboardPaste: () => void;
}

function PasteInputSection(p: InputSectionProps) {
  return (
    <div class={pm.inputSec}>
      <div class={pm.inputSecHeader}>
        <label for="survey-paste-textarea" class={pm.inputLabel}>
          {surveyStrings.pasteInputLabel}
        </label>
        <div class={pm.inputActions}>
          <button
            type="button"
            class={pm.miniActionBtn}
            onClick={p.onClipboardPaste}
            data-paste-clipboard=""
          >
            {surveyStrings.pasteFromClipboard}
          </button>
          <button
            type="button"
            class={pm.miniActionBtn}
            onClick={() => {
              p.setRawText('');
              p.setClipError(null);
            }}
            data-paste-clear=""
          >
            {surveyStrings.pasteClear}
          </button>
        </div>
      </div>
      {p.clipError ? (
        <div class={pm.bannerError} role="alert">
          {p.clipError}
        </div>
      ) : null}
      <textarea
        id="survey-paste-textarea"
        ref={p.textareaRef}
        class={pm.textarea}
        value={p.rawText}
        onInput={(e) => p.setRawText((e.target as HTMLTextAreaElement).value)}
        placeholder={surveyStrings.pasteInputPlaceholder}
        data-paste-textarea=""
      />
    </div>
  );
}

function PastePreviewTable({ rowDetails }: { rowDetails: ParsedPasteRow[] }) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: tabIndex satisfies axe scrollable-region-focusable on narrow screens
    <section class={pm.tableWrap} tabIndex={0} aria-label="Level book paste preview table">
      <table class={pm.previewTable} data-paste-preview-table="">
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Station</th>
            <th>BS</th>
            <th>IS</th>
            <th>FS</th>
            <th>Dist (m)</th>
            <th>Remarks</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rowDetails.map((item, idx) => (
            <tr key={`p-${item.row.id || idx}`} class={item.errors.length ? pm.rowErr : ''}>
              <td>{idx + 1}</td>
              <td>
                <PasteTagBadge tag={item.tag} />
              </td>
              <td>{item.row.station || '—'}</td>
              <td>{item.row.bs || '—'}</td>
              <td>{item.row.is || '—'}</td>
              <td>{item.row.fs || '—'}</td>
              <td>{item.row.dist || '—'}</td>
              <td>{item.row.remarks || '—'}</td>
              <td>
                {item.errors.length > 0 ? (
                  <span class={pm.errorText}>{item.errors.join('; ')}</span>
                ) : (
                  <span style={{ color: '#16a34a', fontSize: '11px' }}>✓ Valid</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PastePreviewSection({
  rawText,
  outcome,
}: {
  rawText: string;
  outcome: PasteParseOutcome;
}) {
  if (rawText.trim() === '') {
    return (
      <div class={pm.noDataBox} data-paste-empty-notice="">
        {surveyStrings.pasteNoData}
      </div>
    );
  }
  return (
    <div class={pm.previewSec}>
      {outcome.isValid ? (
        <div class={pm.bannerSuccess} data-paste-success-banner="">
          ✓ {surveyStrings.pasteValidBanner.replace('{count}', String(outcome.summary.total))} (
          {outcome.summary.bmCount} BM, {outcome.summary.cpCount} CP, {outcome.summary.isCount} IS,{' '}
          {outcome.summary.fsCount} FS)
        </div>
      ) : (
        <div class={pm.bannerError} role="alert" data-paste-error-banner="">
          ⚠️{' '}
          {outcome.globalError ??
            surveyStrings.pasteErrorBanner.replace('{count}', String(outcome.summary.errorCount))}
        </div>
      )}
      <div class={pm.headerInfoPill} data-paste-header-pill="">
        {outcome.hasHeader
          ? `✓ ${surveyStrings.pasteHeaderDetected}`
          : `ℹ ${surveyStrings.pasteNoHeaderDetected}`}
      </div>
      <PastePreviewTable rowDetails={outcome.rowDetails} />
    </div>
  );
}

function PasteModalFooter({
  isValid,
  onClose,
  onApply,
}: {
  isValid: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div class={pm.modalFooter}>
      <button type="button" class={pm.cancelBtn} onClick={onClose} data-paste-cancel-btn="">
        {surveyStrings.pasteCancelBtn}
      </button>
      <button
        type="button"
        class={pm.replaceBtn}
        disabled={!isValid}
        onClick={onApply}
        data-paste-replace-btn=""
      >
        {surveyStrings.pasteReplaceBtn}
      </button>
    </div>
  );
}

export function SurveyPasteModal({ isOpen, onClose, onApply }: SurveyPasteModalProps) {
  const [rawText, setRawText] = useState('');
  const [clipError, setClipError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { handleClose } = useDialogFocusTrap({
    isOpen,
    modalRef,
    initialFocusRef: textareaRef,
    onClose,
  });

  const outcome = useMemo(() => parseSpreadsheetPaste(rawText), [rawText]);

  const handleClipboard = async () => {
    setClipError(null);
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      setClipError(surveyStrings.pasteClipboardError);
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
    } catch {
      setClipError(surveyStrings.pasteClipboardError);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      class={pm.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-modal-title"
      data-paste-modal=""
    >
      <div class={pm.modalCard}>
        <PasteModalHeader onClose={handleClose} />
        <div class={pm.modalBody}>
          <PasteInputSection
            rawText={rawText}
            setRawText={setRawText}
            clipError={clipError}
            setClipError={setClipError}
            textareaRef={textareaRef}
            onClipboardPaste={handleClipboard}
          />
          <PastePreviewSection rawText={rawText} outcome={outcome} />
        </div>
        <PasteModalFooter
          isValid={outcome.isValid && outcome.rows.length > 0}
          onClose={handleClose}
          onApply={() => {
            onApply(outcome.rows);
            handleClose();
          }}
        />
      </div>
    </div>
  );
}
