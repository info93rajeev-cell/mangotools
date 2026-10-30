import styles from './dataStudio.module.css';

export type StudioMobileView = 'split' | 'input' | 'output';
export type MobileViewMode = StudioMobileView;

export interface MobileViewSwitcherProps {
  view?: StudioMobileView;
  activeView?: StudioMobileView;
  onChange?: (v: StudioMobileView) => void;
  onViewChange?: (v: StudioMobileView) => void;
  inputTitle?: string;
  outputTitle?: string;
}

export function MobileViewSwitcher({
  view,
  activeView,
  onChange,
  onViewChange,
  inputTitle = 'Input',
  outputTitle = 'Output',
}: MobileViewSwitcherProps) {
  const currentView = activeView ?? view ?? 'split';
  const handleChange = (v: StudioMobileView) => {
    onChange?.(v);
    onViewChange?.(v);
  };

  return (
    <div class={styles.mobileViewSwitcher} data-mobile-view-switcher="">
      <button
        type="button"
        class={`${styles.mobileViewTab} ${currentView === 'split' ? styles.mobileViewTabActive : ''}`}
        onClick={() => handleChange('split')}
        aria-label="View both input and output on screen"
      >
        <span class={styles.tabIcon}>⚡</span>
        <span>Split (Both)</span>
      </button>
      <button
        type="button"
        class={`${styles.mobileViewTab} ${currentView === 'input' ? styles.mobileViewTabActive : ''}`}
        onClick={() => handleChange('input')}
        aria-label="View input only"
      >
        <span class={styles.tabIcon}>📝</span>
        <span>{inputTitle}</span>
      </button>
      <button
        type="button"
        class={`${styles.mobileViewTab} ${currentView === 'output' ? styles.mobileViewTabActive : ''}`}
        onClick={() => handleChange('output')}
        aria-label="View output only"
      >
        <span class={styles.tabIcon}>📊</span>
        <span>{outputTitle}</span>
      </button>
    </div>
  );
}
