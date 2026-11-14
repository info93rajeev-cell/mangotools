import {
  type ConstructionProject,
  exportProject,
  type ImportProjectResult,
  importProject,
} from '@mangotools/runtime';
import { useState } from 'preact/hooks';
import { Button } from '../../primitives/Button.tsx';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ConstructionProject | null;
  onProjectImported: (project: ConstructionProject) => void;
  existingProjectIds: string[];
}

type ImportConflict = Extract<ImportProjectResult, { status: 'conflict' }>;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ConflictView({
  conflict,
  onResolve,
  onCancel,
}: {
  conflict: ImportConflict;
  onResolve: (res: 'replace' | 'copy') => void;
  onCancel: () => void;
}) {
  return (
    <div class={styles.conflictBox}>
      <div class={styles.conflictHeader}>
        <span class={styles.noticeIcon}>
          <Icon name="triangle-alert" />
        </span>
        <h3 class={styles.conflictTitle}>{t.importConflictTitle}</h3>
      </div>
      <p class={styles.conflictDesc}>
        Project <strong>{conflict.existingProjectName}</strong> (ID: {conflict.existingProjectId})
        already exists.
      </p>
      <div class={styles.conflictActions}>
        <Button variant="primary" onClick={() => onResolve('replace')}>
          {t.btnReplace}
        </Button>
        <Button variant="secondary" onClick={() => onResolve('copy')}>
          {t.btnCopy}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t.btnCancel}
        </Button>
      </div>
    </div>
  );
}

interface ExportImportSectionsProps {
  project: ConstructionProject | null;
  includeDrawings: boolean;
  onToggleDrawings: (val: boolean) => void;
  onExport: () => void;
  onFileSelected: (e: preact.JSX.TargetedEvent<HTMLInputElement>) => void;
}

function ExportImportSections({
  project,
  includeDrawings,
  onToggleDrawings,
  onExport,
  onFileSelected,
}: ExportImportSectionsProps) {
  return (
    <div class={styles.exportImportBody}>
      <section class={styles.modalSection}>
        <h3 class={styles.sectionSubtitle}>Export Project File</h3>
        <p class={styles.sectionHelp}>
          Download your project calculations, members, and revision snapshots as a local .json file.
        </p>
        <label class={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={includeDrawings}
            onChange={(e) => onToggleDrawings((e.target as HTMLInputElement).checked)}
          />
          <span>Include uploaded drawing sheets (max 25 MB)</span>
        </label>
        <Button variant="primary" icon="download" onClick={onExport} disabled={!project}>
          Export Project (.json)
        </Button>
      </section>

      <hr class={styles.modalDivider} />

      <section class={styles.modalSection}>
        <h3 class={styles.sectionSubtitle}>Import Project File</h3>
        <p class={styles.sectionHelp}>
          Load an exported project backup (.json). If a project with the same ID exists, you will be
          prompted to replace or copy.
        </p>
        <input type="file" accept=".json" class={styles.fileInput} onChange={onFileSelected} />
      </section>
    </div>
  );
}

function useExportImportState(
  project: ConstructionProject | null,
  existingProjectIds: string[],
  onProjectImported: (project: ConstructionProject) => void,
  onClose: () => void,
) {
  const [includeDrawings, setIncludeDrawings] = useState(true);
  const [conflict, setConflict] = useState<ImportConflict | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    if (!project) return;
    try {
      const jsonStr = exportProject(project, { includeDrawings });
      const blob = new Blob([jsonStr], { type: 'application/json' });
      triggerDownload(
        blob,
        `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.json`,
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const handleFile = async (e: preact.JSX.TargetedEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setPendingText(text);
      const res = importProject(text, { existingProjectIds });
      if (res.status === 'conflict') {
        setConflict(res);
      } else {
        onProjectImported(res.project);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid project JSON file.');
    }
  };

  const handleResolve = (resolution: 'replace' | 'copy') => {
    if (!pendingText) return;
    try {
      const res = importProject(pendingText, {
        existingProjectIds,
        onConflict: resolution,
      });
      if (res.status === 'success') {
        onProjectImported(res.project);
        setConflict(null);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import resolution failed.');
    }
  };

  return {
    includeDrawings,
    setIncludeDrawings,
    conflict,
    setConflict,
    errorMsg,
    handleExport,
    handleFile,
    handleResolve,
  };
}

export function ExportImportModal({
  isOpen,
  onClose,
  project,
  onProjectImported,
  existingProjectIds,
}: ExportImportModalProps) {
  if (!isOpen) return null;

  const state = useExportImportState(project, existingProjectIds, onProjectImported, onClose);

  return (
    <div
      class={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div class={styles.modalDialog}>
        <div class={styles.modalHeader}>
          <div class={styles.modalTitleRow}>
            <span class={styles.cardIconBlue}>
              <Icon name="share-2" />
            </span>
            <h2 id="share-modal-title" class={styles.modalTitle}>
              {t.exportImport}
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
        {state.errorMsg && (
          <div class={styles.noticeAlertRed}>
            <span class={styles.noticeIcon}>
              <Icon name="circle-alert" />
            </span>
            <p class={styles.noticeText}>{state.errorMsg}</p>
          </div>
        )}
        {state.conflict ? (
          <ConflictView
            conflict={state.conflict}
            onResolve={state.handleResolve}
            onCancel={() => state.setConflict(null)}
          />
        ) : (
          <ExportImportSections
            project={project}
            includeDrawings={state.includeDrawings}
            onToggleDrawings={state.setIncludeDrawings}
            onExport={state.handleExport}
            onFileSelected={state.handleFile}
          />
        )}
      </div>
    </div>
  );
}
