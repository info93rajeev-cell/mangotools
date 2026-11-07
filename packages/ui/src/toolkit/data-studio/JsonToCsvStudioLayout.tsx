import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { JsonToCsvAuxCards } from './JsonToCsvAuxCards.tsx';
import { JsonFilePicker, JsonToCsvInputPanel } from './JsonToCsvInputPanel.tsx';
import { JsonToCsvSidePanel, JsonToCsvTablePanel } from './JsonToCsvPreviewPanel.tsx';
import j2c from './jsonToCsv.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { type JsonToCsvStudio, useJsonToCsvStudio } from './useJsonToCsvStudio.ts';
import { useReferenceScale } from './useReferenceScale.ts';

export interface JsonToCsvStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function TopActions({ studio }: { studio: JsonToCsvStudio }) {
  return (
    <div class={`${styles.topActionsBar} ${j2c.topActions}`}>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={() => studio.loadSample()}
        data-try-sample=""
      >
        <Icon name="box" class={styles.ico} /> Load sample
      </button>
      <JsonFilePicker studio={studio} label="Open File" className={styles.topActionBtn} />
      <button type="button" class={styles.topActionBtn} onClick={studio.paste}>
        <Icon name="clipboard-paste" class={styles.ico} /> Paste
      </button>
      <button
        type="button"
        class={`${styles.topActionBtn} ${styles.btnDangerOutline}`}
        onClick={studio.clearAll}
      >
        <Icon name="trash-2" class={styles.ico} /> Clear
      </button>
    </div>
  );
}

export function JsonToCsvStudioLayout({
  idPrefix,
  preset,
  snapshot,
  store,
  notify,
}: JsonToCsvStudioLayoutProps) {
  const containerRef = useReferenceScale();
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useJsonToCsvStudio(preset, snapshot, store, notify);
  const hideOn = (view: StudioMobileView) => (mobileView === view ? styles.hideOnMobile : '');

  return (
    <div ref={containerRef} class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher view={mobileView} onChange={setMobileView} />
      <TopActions studio={studio} />
      <main class={`${styles.work} ${j2c.work}`}>
        <div class={`${styles.panelSlot} ${hideOn('output')}`}>
          <JsonToCsvInputPanel idPrefix={idPrefix} studio={studio} />
        </div>
        <div class={`${styles.panelSlot} ${hideOn('input')}`}>
          <JsonToCsvTablePanel studio={studio} />
        </div>
        <div class={`${styles.panelSlot} ${j2c.sideSlot} ${hideOn('input')}`}>
          <JsonToCsvSidePanel idPrefix={idPrefix} studio={studio} />
        </div>
      </main>
      <JsonToCsvAuxCards studio={studio} />
      <DataStudioStatusBar
        primaryLabel="Convert to CSV"
        onPrimary={studio.convert}
        onCopy={studio.copy}
        onDownload={studio.download}
        onReset={studio.resetAll}
        notify={notify}
        downloadLabel="Download .csv"
      />
    </div>
  );
}
