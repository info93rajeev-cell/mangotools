import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { Base64AuxCards } from './Base64AuxCards.tsx';
import { Base64InputPanel } from './Base64InputPanel.tsx';
import { Base64OutputPanel } from './Base64OutputPanel.tsx';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import parts from './studioParts.module.css';
import { type Base64Studio, useBase64Studio } from './useBase64Studio.ts';
import { useReferenceScale } from './useReferenceScale.ts';

export interface Base64StudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function TopActions({ studio }: { studio: Base64Studio }) {
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div class={styles.topActionsBar}>
      <input
        ref={picker}
        type="file"
        class={styles.hiddenFileInput}
        tabIndex={-1}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            studio.setSource(file.type.startsWith('image/') ? 'image' : 'file');
            studio.loadFile(file, true);
          }
          target.value = '';
        }}
      />
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={studio.loadSample}
        data-try-sample=""
      >
        <Icon name="file-text" class={styles.ico} /> Sample Text
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

export function Base64StudioLayout({
  idPrefix,
  preset,
  snapshot,
  store,
  notify,
}: Base64StudioLayoutProps) {
  const containerRef = useReferenceScale();
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useBase64Studio(preset, snapshot, store, notify);
  const hideOn = (view: StudioMobileView) => (mobileView === view ? styles.hideOnMobile : '');
  const encoding = studio.options.direction === 'encode';

  return (
    <div ref={containerRef} class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher view={mobileView} onChange={setMobileView} />
      <TopActions studio={studio} />
      <main class={`${styles.workTwoPanel} ${parts.equalCols}`}>
        <div class={`${styles.panelSlot} ${hideOn('output')}`}>
          <Base64InputPanel idPrefix={idPrefix} studio={studio} />
        </div>
        <div class={`${styles.panelSlot} ${hideOn('input')}`}>
          <Base64OutputPanel idPrefix={idPrefix} studio={studio} />
        </div>
      </main>
      <Base64AuxCards studio={studio} />
      <DataStudioStatusBar
        primaryLabel={encoding ? 'Encode to Base64' : 'Decode from Base64'}
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
