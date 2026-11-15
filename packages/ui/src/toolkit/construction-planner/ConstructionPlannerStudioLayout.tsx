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

interface TopBarProps {
  saveStatus: 'saved' | 'saving' | 'error' | 'unavailable';
  onLoadSample: () => void;
  onPrint: () => void;
  onOpenExport: () => void;
}

function PlannerTopBar({ saveStatus, onLoadSample, onPrint, onOpenExport }: TopBarProps) {
  return (
    <header class={`${styles.plannerTopBar} no-print`}>
      <div class={styles.topBarLeft}>
        <span class={styles.devicePrivacyBadge} title="Runs locally in your browser">
          <Icon name="lock" />
          <span>{t.runsOnDevice}</span>
        </span>
        {saveStatus === 'saved' && (
          <span class={styles.saveStatusSaved}>
            <Icon name="check" />
            <span>{t.autoSaveSaved}</span>
          </span>
        )}
        {saveStatus === 'saving' && (
          <span class={styles.saveStatusSaving}>
            <Icon name="refresh-cw" />
            <span>{t.autoSaveSaving}</span>
          </span>
        )}
        {saveStatus === 'unavailable' && (
          <span class={styles.saveStatusUnavailable}>
            <Icon name="triangle-alert" />
            <span>Storage unavailable</span>
          </span>
        )}
      </div>
      <div class={styles.topBarActions}>
        <Button variant="secondary" icon="folder-open" onClick={onLoadSample}>
          {t.sampleProject}
        </Button>
        <Button variant="secondary" icon="printer" onClick={onPrint}>
          {t.printSavePdf}
        </Button>
        <Button variant="primary" icon="share-2" onClick={onOpenExport}>
          {t.share}
        </Button>
      </div>
    </header>
  );
}

export function ConstructionPlannerStudioLayout({ notify }: ConstructionPlannerStudioLayoutProps) {
  const p = useConstructionPlanner(notify);

  return (
    <div class={styles.plannerContainer} data-planner-root="">
      <PlannerTopBar
        saveStatus={p.saveStatus}
        onLoadSample={p.loadSample}
        onPrint={p.handlePrint}
        onOpenExport={() => p.setIsExportModalOpen(true)}
      />
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
        <div class={`${styles.tabContentGrid} no-print`}>
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
        </div>
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
