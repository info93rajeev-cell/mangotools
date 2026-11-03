import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import parts from './studioParts.module.css';
import { UrlEncoderAuxCards } from './UrlEncoderAuxCards.tsx';
import { UrlInputPanel } from './UrlInputPanel.tsx';
import { UrlOutputPanel } from './UrlOutputPanel.tsx';
import { useReferenceScale } from './useReferenceScale.ts';
import { type UrlStudio, useUrlEncoderStudio } from './useUrlEncoderStudio.ts';

export interface UrlEncoderStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function TopActions({ studio }: { studio: UrlStudio }) {
  return (
    <div class={styles.topActionsBar}>
      <button type="button" class={styles.topActionBtn} onClick={() => studio.setSource('query')}>
        <span class={`${parts.tileSm} ${parts.tonePurple}`}>
          <Icon name="search" class={parts.tileIcoSm} />
        </span>
        Query Builder
      </button>
      <button type="button" class={styles.topActionBtn} onClick={() => studio.setSource('form')}>
        <span class={`${parts.tileSm} ${parts.toneGreen}`}>
          <Icon name="file-braces" class={parts.tileIcoSm} />
        </span>
        Form Data
      </button>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={studio.loadSample}
        data-try-sample=""
      >
        <span class={`${parts.tileSm} ${parts.toneAmber}`}>
          <Icon name="sparkles" class={parts.tileIcoSm} />
        </span>
        Example URLs
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

export function UrlEncoderStudioLayout({
  idPrefix,
  preset,
  snapshot,
  store,
  notify,
}: UrlEncoderStudioLayoutProps) {
  const containerRef = useReferenceScale();
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useUrlEncoderStudio(preset, snapshot, store, notify);
  const hideOn = (view: StudioMobileView) => (mobileView === view ? styles.hideOnMobile : '');
  const encode = studio.options.direction === 'encode';

  return (
    <div ref={containerRef} class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher view={mobileView} onChange={setMobileView} />
      <TopActions studio={studio} />
      <main class={`${styles.workTwoPanel} ${parts.equalCols}`}>
        <div class={`${styles.panelSlot} ${hideOn('output')}`}>
          <UrlInputPanel idPrefix={idPrefix} studio={studio} />
        </div>
        <div class={`${styles.panelSlot} ${hideOn('input')}`}>
          <UrlOutputPanel idPrefix={idPrefix} studio={studio} />
        </div>
      </main>
      <UrlEncoderAuxCards studio={studio} />
      <DataStudioStatusBar
        primaryLabel={encode ? 'Encode URL' : 'Decode URL'}
        onPrimary={studio.convert}
        onCopy={studio.copy}
        onDownload={studio.download}
        onReset={studio.resetAll}
        notify={notify}
        downloadLabel="Download"
      />
    </div>
  );
}
