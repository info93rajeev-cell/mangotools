import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useRef, useState } from 'preact/hooks';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { JsonAuxCards } from './JsonFormatterAuxCards.tsx';
import { JsonInputPanel } from './JsonInputPanel.tsx';
import { JsonOutputPanel } from './JsonOutputPanel.tsx';
import { JsonSearchContext } from './JsonSearchContext.tsx';
import { JsonTopActionBar } from './JsonTopActionBar.tsx';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { useJsonFormatterStudio } from './useJsonFormatterStudio.ts';

export interface JsonFormatterStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

export function JsonFormatterStudioLayout({
  idPrefix,
  preset: _preset,
  snapshot,
  store,
  notify,
}: JsonFormatterStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const containerRef = useReferenceScale();
  const studio = useJsonFormatterStudio(snapshot, store, notify);

  const handleFormatAndValidate = () => {
    studio.setAction('format');
    notify(
      studio.parsedResult.valid
        ? 'JSON formatted & validated successfully'
        : 'JSON has syntax errors',
    );
  };

  return (
    <JsonSearchContext.Provider value={studio.searchState}>
      <div ref={containerRef} class={styles.container} data-mobile-view={mobileView}>
        <MobileViewSwitcher view={mobileView} onChange={setMobileView} />
        <JsonTopActionBar
          onSample={() => studio.handleLoadSample('user')}
          onOpenFile={studio.handleOpenFile}
          onPaste={studio.handlePaste}
          onClearAll={studio.handleClearAll}
        />
        <JsonFormatterMainWork idPrefix={idPrefix} mobileView={mobileView} studio={studio} />
        <JsonAuxCards
          indent={studio.indent}
          onIndent={studio.setIndent}
          keySorting={studio.keySorting}
          onKeySorting={studio.setKeySorting}
          syntaxHighlight={studio.syntaxHighlight}
          onSyntaxHighlight={studio.setSyntaxHighlight}
          lineNumbers={studio.lineNumbers}
          onLineNumbers={studio.setLineNumbers}
          autoFormatOnPaste={studio.autoFormatOnPaste}
          onAutoFormatOnPaste={studio.setAutoFormatOnPaste}
          searchQuery={studio.searchQuery}
          onSearch={studio.setSearchQuery}
          searchMatches={studio.searchMatches}
          searchMatchCase={studio.searchMatchCase}
          onSearchMatchCase={studio.setSearchMatchCase}
          searchRegex={studio.searchRegex}
          onSearchRegex={studio.setSearchRegex}
          detectDuplicates={studio.detectDuplicates}
          onDetectDuplicates={studio.setDetectDuplicates}
          validateSchema={studio.validateSchema}
          onValidateSchema={studio.setValidateSchema}
          allowJson5={studio.allowJson5}
          onAllowJson5={studio.setAllowJson5}
          safeBigInt={studio.safeBigInt}
          onSafeBigInt={studio.setSafeBigInt}
          parsedResult={studio.parsedResult}
          onLoadExample={studio.handleLoadSample}
        />
        <DataStudioStatusBar
          primaryLabel="Format & Validate JSON"
          onPrimary={handleFormatAndValidate}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
          onReset={studio.handleReset}
        />
      </div>
    </JsonSearchContext.Provider>
  );
}

function JsonFormatterMainWork({
  idPrefix,
  mobileView,
  studio,
}: {
  idPrefix: string;
  mobileView: StudioMobileView;
  studio: ReturnType<typeof useJsonFormatterStudio>;
}) {
  return (
    <main class={styles.workTwoPanel}>
      <div class={`${styles.panelSlot} ${mobileView === 'output' ? styles.hideOnMobile : ''}`}>
        <JsonInputPanel
          idPrefix={idPrefix}
          input={studio.input}
          action={studio.action}
          onAction={studio.setAction}
          onInput={studio.handleInput}
          onClear={() => studio.handleInput('')}
          lineNumbers={studio.lineNumbers}
          syntaxHighlight={studio.syntaxHighlight}
        />
      </div>
      <div class={`${styles.panelSlot} ${mobileView === 'input' ? styles.hideOnMobile : ''}`}>
        <JsonOutputPanel
          idPrefix={idPrefix}
          outputFormatted={studio.outputFormatted}
          activeTab={studio.activeTab}
          onTab={studio.setActiveTab}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
          parsedResult={studio.parsedResult}
          tableData={studio.tableData}
        />
      </div>
    </main>
  );
}

/** The reference layout is drawn for ~1585px laptops. On larger screens scale the working area up
 *  in proportion (max 1.3x) so it fills the screen like the reference, but only as far as the
 *  whole studio still fits the screen height. It never scales below 1x. */
const REFERENCE_WIDTH = 1585;
function useReferenceScale() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const apply = () => {
      const el = ref.current;
      const work = el?.querySelector<HTMLElement>('main');
      const bar = el?.querySelector<HTMLElement>('[data-inline-info]');
      if (!el || !work || !bar) return;
      el.style.setProperty('--ds-scale', '1');
      const top = work.getBoundingClientRect().top + window.scrollY;
      const natural = bar.getBoundingClientRect().bottom - work.getBoundingClientRect().top;
      const fitHeight = (window.innerHeight - top - 12) / natural;
      const scale = Math.min(window.innerWidth / REFERENCE_WIDTH, fitHeight, 1.3);
      el.style.setProperty('--ds-scale', scale > 1.02 ? scale.toFixed(3) : '1');
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return ref;
}
