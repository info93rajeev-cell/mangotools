import { createPortal } from 'preact/compat';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Button } from '../../primitives/Button.tsx';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './constructionPlanner.module.css';
import { constructionPlannerStrings as t } from './constructionPlannerStrings.ts';
import { DrawingPackageCard } from './DrawingPackageCard.tsx';
import { DrawingUploadModal } from './DrawingUploadModal.tsx';
import { ExportImportModal } from './ExportImportModal.tsx';
import { GettingStartedCard } from './GettingStartedCard.tsx';
import { PrintSummaryView } from './PrintSummaryView.tsx';
import { ProjectOverviewCard } from './ProjectOverviewCard.tsx';
import { ProjectSummaryCard } from './ProjectSummaryCard.tsx';
import { RecentWorkCard } from './RecentWorkCard.tsx';
import { StageNoticeCard } from './StageNoticeCard.tsx';
import { TabNavigation } from './TabNavigation.tsx';
import { useConstructionPlanner } from './useConstructionPlanner.ts';
import { WorkflowRoadmap } from './WorkflowRoadmap.tsx';

export interface ConstructionPlannerStudioLayoutProps {
  notify?: (msg: string) => void;
}

interface HeaderActionsProps {
  saveStatus: 'saved' | 'saving' | 'error' | 'unavailable';
  onLoadSample: () => void;
  onPrint: () => void;
  onOpenExport: () => void;
}

function HeaderBadgesActions({
  saveStatus: _saveStatus,
  onLoadSample,
  onPrint,
  onOpenExport,
}: HeaderActionsProps) {
  return (
    <div class={styles.headerActionsCluster}>
      {/* 1. Runs on your device pill */}
      <span class={styles.devicePrivacyBadge} title="Runs locally in your browser">
        <Icon name="lock" />
        <span>{t.runsOnDevice}</span>
      </span>

      {/* 2. Sample Project button */}
      <button
        type="button"
        class={styles.headerBtnSample}
        onClick={onLoadSample}
        title="Load residential + office sample project"
      >
        <Icon name="folder-open" />
        <span>{t.sampleProject}</span>
      </button>

      {/* 3. Print / Save PDF (yellow primary) */}
      <button
        type="button"
        class={styles.headerBtnPrint}
        onClick={onPrint}
        title="Print or export PDF summary"
      >
        <Icon name="printer" />
        <span>{t.printSavePdf}</span>
      </button>

      {/* 4. Share (white outlined) */}
      <button
        type="button"
        class={styles.headerBtnShare}
        onClick={onOpenExport}
        title="Export or share project file"
      >
        <Icon name="share-2" />
        <span>{t.share}</span>
      </button>
    </div>
  );
}

function useHeaderBadgesSlot(): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const badges = document.querySelector('.tool-header .header-badges');
    if (!badges) return;
    const container = document.createElement('div');
    container.className = styles.headerSlotWrap;
    badges.append(container);
    setSlot(container);
    return () => {
      container.remove();
    };
  }, []);
  return slot;
}

export function ConstructionPlannerStudioLayout({ notify }: ConstructionPlannerStudioLayoutProps) {
  const p = useConstructionPlanner(notify);
  const headerSlot = useHeaderBadgesSlot();

  const actionsProps: HeaderActionsProps = {
    saveStatus: p.saveStatus,
    onLoadSample: p.loadSample,
    onPrint: p.handlePrint,
    onOpenExport: () => p.setIsExportModalOpen(true),
  };

  return (
    <div class={styles.plannerContainer} data-planner-root="">
      {/* Portal action buttons into the ToolHeader title row */}
      {headerSlot ? (
        createPortal(<HeaderBadgesActions {...actionsProps} />, headerSlot)
      ) : (
        <div class={styles.headerFallbackActions}>
          <HeaderBadgesActions {...actionsProps} />
        </div>
      )}

      {!p.isStorageAvailable && (
        <div class={`${styles.storageAlertBanner} no-print`} role="alert">
          <span class={styles.alertIcon}>
            <Icon name="triangle-alert" />
          </span>
          <p class={styles.alertText}>{t.storageUnavailableWarning}</p>
          <Button variant="secondary" icon="download" onClick={() => p.setIsExportModalOpen(true)}>
            Export Project Backup
          </Button>
        </div>
      )}

      <div class="no-print">
        <TabNavigation activeTab={p.activeTab} onSelectTab={p.setActiveTab} />
      </div>

      {p.activeTab === 'setup' ? (
        <main class={`${styles.tabContentGrid} no-print`}>
          <div class={styles.topCardsRow}>
            <ProjectOverviewCard overview={p.overview} onChangeField={p.setOverviewField} />
            <DrawingPackageCard
              sheets={p.sheets}
              onOpenUpload={() => p.setIsUploadModalOpen(true)}
              onViewCategory={() => p.setActiveTab('drawings')}
            />
            <ProjectSummaryCard
              metrics={p.metrics}
              sitePortion={p.overview.sitePortion}
              onChangePortion={(val) => p.setOverviewField('sitePortion', val)}
            />
          </div>

          <div class={styles.middleRow}>
            <WorkflowRoadmap onStepClick={p.setActiveTab} />
          </div>

          <div class={styles.bottomCardsRow}>
            <RecentWorkCard
              items={p.recentWork}
              onOpenItem={() => p.setActiveTab('concrete-rebar')}
            />
            <GettingStartedCard
              sitePortion={p.overview.sitePortion}
              onChangePortion={(val) => p.setOverviewField('sitePortion', val)}
              onAttachDrawings={() => p.setIsUploadModalOpen(true)}
              onSelectMemberType={() => p.setActiveTab('concrete-rebar')}
            />
          </div>
        </main>
      ) : (
        <div class="no-print">
          <StageNoticeCard
            activeTab={p.activeTab}
            onReturnToSetup={() => p.setActiveTab('setup')}
          />
        </div>
      )}

      <ExportImportModal
        isOpen={p.isExportModalOpen}
        onClose={() => p.setIsExportModalOpen(false)}
        project={p.project}
        onProjectImported={() => notify?.(t.importSuccessMsg)}
        existingProjectIds={p.project ? [p.project.id] : []}
      />
      <DrawingUploadModal
        isOpen={p.isUploadModalOpen}
        onClose={() => p.setIsUploadModalOpen(false)}
        onAddSheet={p.addSheet}
      />
      <PrintSummaryView
        overview={p.overview}
        metrics={p.metrics}
        sheets={p.sheets}
        recentWork={p.recentWork}
      />
    </div>
  );
}
