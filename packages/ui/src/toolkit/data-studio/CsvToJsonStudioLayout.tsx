import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { CsvInputPanel } from './CsvInputPanel.tsx';
import { CsvOutputPanel } from './CsvOutputPanel.tsx';
import { CsvParsingOptionsCard } from './CsvParsingOptionsCard.tsx';
import { CsvToJsonAuxCards } from './CsvToJsonAuxCards.tsx';
import csv from './csvToJson.module.css';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { type CsvStudio, FIRST_SAMPLE_ID, useCsvToJsonStudio } from './useCsvToJsonStudio.ts';
import { useReferenceScale } from './useReferenceScale.ts';

export interface CsvToJsonStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function TopActions({ studio }: { studio: CsvStudio }) {
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div class={styles.topActionsBar}>
      <input
        ref={picker}
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
        class={styles.hiddenFileInput}
        tabIndex={-1}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) studio.loadFile(file);
          target.value = '';
        }}
      />
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={() => studio.loadSample(FIRST_SAMPLE_ID)}
        data-try-sample=""
      >
        <span class={`${csv.tileSm} ${csv.tonePurple}`}>
          <Icon name="file-text" class={csv.tileIcoSm} />
        </span>
        Sample CSV
      </button>
      <button type="button" class={styles.topActionBtn} onClick={() => picker.current?.click()}>
        <Icon name="folder-open" class={styles.ico} /> Open File
      </button>
      <button type="button" class={styles.topActionBtn} onClick={studio.paste}>
        <Icon name="clipboard-paste" class={styles.ico} /> Paste from Clipboard
      </button>
      <button
        type="button"
        class={`${styles.topActionBtn} ${styles.btnDangerOutline}`}
        onClick={studio.clearAll}
      >
        <Icon name="trash-2" class={styles.ico} /> Clear All
      </button>
    </div>
  );
}

export function CsvToJsonStudioLayout({
  idPrefix,
  preset,
  snapshot,
  store,
  notify,
}: CsvToJsonStudioLayoutProps) {
  const containerRef = useReferenceScale();
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useCsvToJsonStudio(preset, snapshot, store, notify);
  const hideOn = (view: StudioMobileView) => (mobileView === view ? styles.hideOnMobile : '');

  return (
    <div ref={containerRef} class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher view={mobileView} onChange={setMobileView} />
      <TopActions studio={studio} />
      <main class={styles.workTwoPanel}>
        <div class={`${styles.panelSlot} ${csv.leftStack} ${hideOn('output')}`}>
          <CsvInputPanel idPrefix={idPrefix} preset={preset} studio={studio} />
          <CsvParsingOptionsCard studio={studio} />
        </div>
        <div class={`${styles.panelSlot} ${hideOn('input')}`}>
          <CsvOutputPanel idPrefix={idPrefix} studio={studio} />
        </div>
      </main>
      <CsvToJsonAuxCards studio={studio} />
      <DataStudioStatusBar
        primaryLabel="Convert to JSON"
        onPrimary={studio.convert}
        onCopy={studio.copy}
        onDownload={studio.download}
        onReset={studio.resetAll}
        notify={notify}
        downloadLabel="Download .json"
      />
    </div>
  );
}
