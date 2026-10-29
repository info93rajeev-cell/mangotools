import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import styles from './dataStudio.module.css';
import { type MobileViewMode, MobileViewSwitcher } from './MobileViewSwitcher.tsx';
import { TimestampAuxCards } from './TimestampAuxCards.tsx';
import { useTimestampStudio } from './useTimestampStudio.ts';

export interface TimestampConverterStudioLayoutProps {
  idPrefix: string;
  preset: ResolvedPreset;
  snapshot: ToolSnapshot;
  store: ToolStore;
  notify: (msg: string) => void;
}

function TimestampInputPanel({
  idPrefix,
  input,
  unit,
  error,
  onUnit,
  onCurrentTime,
  onInput,
}: {
  idPrefix: string;
  input: string;
  unit: string;
  error: string | null;
  onUnit: (u: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds') => void;
  onCurrentTime: () => void;
  onInput: (v: string) => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128337;</span>
          <strong>Unix Timestamp → Date</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.sampleMiniBtn}
            data-try-sample=""
            onClick={onCurrentTime}
            title="Use current timestamp"
          >
            ✨ Try sample
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onCurrentTime}>
            Current Time
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={`${styles.chip} ${styles.chipBlue}`}>Timestamp → Date</span>
        <span class={`${styles.chip} ${styles.chipPurple}`}>ISO 8601</span>
      </div>
      <label class={styles.optField} style={{ marginTop: 6 }}>
        <span class={styles.optLabel}>Unix timestamp integer</span>
        <input
          id={`${idPrefix}-input`}
          type="text"
          class={styles.optSelect}
          style={{ fontSize: 16, fontWeight: 700, color: '#176bfa', minHeight: 38 }}
          value={input}
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
          placeholder="e.g. 1704067200"
        />
      </label>
      <div class={styles.optField}>
        <span class={styles.optLabel}>Unit</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['seconds', 'milliseconds', 'microseconds', 'nanoseconds'] as const).map((u) => (
            <button
              key={u}
              type="button"
              class={`${styles.chip} ${unit === u ? styles.chipBlue : styles.chipAmber}`}
              onClick={() => onUnit(u)}
            >
              {u === 'seconds'
                ? 'Sec'
                : u === 'milliseconds'
                  ? 'ms'
                  : u === 'microseconds'
                    ? 'µs'
                    : 'ns'}
            </button>
          ))}
        </div>
      </div>
      <div class={styles.callout} style={{ marginTop: 'auto' }}>
        <span>&#9432;</span>
        <div>Unix epoch reference: 1970-01-01 00:00:00 UTC.</div>
      </div>
      <div class={styles.badgeOk}>
        <span>&#10004;</span>
        <strong>{error ? error : `Valid ${input.length}-digit Unix timestamp`}</strong>
      </div>
    </section>
  );
}

function TimestampDatePanel({
  idPrefix,
  utcString,
  isoString,
  dateObj,
  localTime,
  relativeText,
  selectedTzTime,
  timezone,
  onCopy,
  onDownload,
}: {
  idPrefix: string;
  utcString: string;
  isoString: string;
  dateObj: Date | null;
  localTime: string;
  relativeText: string;
  selectedTzTime: string;
  timezone: string;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.outputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128197;</span>
          <strong>Converted Date &amp; Time</strong>
        </div>
        <div class={styles.toolactions}>
          <button type="button" class={styles.btnSecondary} onClick={onCopy}>
            Copy
          </button>
          <button type="button" class={styles.btnSecondary} onClick={onDownload}>
            Download
          </button>
        </div>
      </div>
      <div
        class={styles.bigoutput}
        style={{ fontSize: 18, color: '#112248', minHeight: 70, flex: 'none' }}
      >
        <div style={{ fontSize: 13, color: '#657b9b' }}>UTC Calendar Date</div>
        <strong style={{ color: '#1668f8', fontSize: 17 }}>{utcString}</strong>
      </div>
      <div class={styles.miniGrid}>
        <div class={`${styles.mini} ${styles.miniBlue}`}>
          <small>UTC Time</small>
          <b>{dateObj ? dateObj.toTimeString().slice(0, 8) : '—'}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniGreen}`}>
          <small>Local Time</small>
          <b>{localTime}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniPurple}`}>
          <small>ISO Date</small>
          <b style={{ fontSize: 13 }}>{isoString.slice(0, 10)}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniAmber}`}>
          <small>Relative</small>
          <b style={{ fontSize: 13 }}>{relativeText}</b>
        </div>
      </div>
      <div class={styles.optField} style={{ marginTop: 'auto' }}>
        <span class={styles.optLabel}>Zone Time ({timezone})</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#098650', padding: '4px 0' }}>
          {selectedTzTime}
        </div>
      </div>
      <input
        id={`${idPrefix}-output`}
        type="text"
        readOnly
        value={isoString}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
      />
    </section>
  );
}

function TimestampSidePanel({
  secondsVal,
  millisVal,
  isoString,
  leapYear,
}: {
  secondsVal: string;
  millisVal: string;
  isoString: string;
  leapYear: boolean;
}) {
  return (
    <div class={`${styles.side} ${styles.sidePanel}`}>
      <section class={`${styles.panel} ${styles.sideTopCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128338;</span>Formats
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Seconds</small>
            <b style={{ fontSize: 13 }}>{secondsVal}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple} ${styles.miniSmall}`}>
            <small>Milliseconds</small>
            <b>{millisVal}</b>
          </div>
        </div>
        <div class={styles.kv}>
          <span>ISO / RFC 3339</span>
          <b style={{ fontSize: 10 }}>{isoString}</b>
        </div>
        <div class={styles.kv}>
          <span>Unix Era</span>
          <b>{Number(secondsVal) >= 0 ? 'After epoch' : 'Before epoch'}</b>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#9745;</span>Calendar Checks
        </div>
        <div class={styles.badgeOk}>
          <span>&#10004;</span>
          <strong>Valid UTC Date</strong>
        </div>
        <div class={styles.kv}>
          <span>Leap Year</span>
          <b>{leapYear ? 'Yes (Leap ✓)' : 'No (Common)'}</b>
        </div>
        <div class={styles.kv}>
          <span>Timezone</span>
          <b>IANA Supported</b>
        </div>
      </section>
    </div>
  );
}

function TimestampStatusBar({
  onCurrentTime,
  onCopy,
  onDownload,
  onReset,
  notify,
}: {
  onCurrentTime: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
  notify: (msg: string) => void;
}) {
  return (
    <div class={styles.statusBar}>
      <button
        type="button"
        class={styles.btnSecondary}
        onClick={() => notify('Local browser-safe processing')}
      >
        &#9432; Runs on your device &middot; Browser-local
      </button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" class={styles.btnGold} onClick={onCurrentTime}>
          Convert Timestamp
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onCopy}>
          Copy result
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onDownload}>
          Download
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

interface TimestampWorkGridProps {
  idPrefix: string;
  state: ReturnType<typeof useTimestampStudio>;
  mobileView: MobileViewMode;
}

function TimestampWorkGrid({ idPrefix, state, mobileView }: TimestampWorkGridProps) {
  return (
    <div class={styles.work} data-mobile-view={mobileView}>
      <TimestampInputPanel
        idPrefix={idPrefix}
        input={state.input}
        unit={state.unit}
        error={state.error}
        onUnit={state.setUnit}
        onCurrentTime={state.handleUseCurrentTime}
        onInput={state.handleInput}
      />
      <TimestampDatePanel
        idPrefix={idPrefix}
        utcString={state.utcString}
        isoString={state.isoString}
        dateObj={state.dateObj}
        localTime={state.localTime}
        relativeText={state.relativeText}
        selectedTzTime={state.selectedTzTime}
        timezone={state.timezone}
        onCopy={state.handleCopy}
        onDownload={state.handleDownload}
      />
      <TimestampSidePanel
        secondsVal={state.secondsVal}
        millisVal={state.millisVal}
        isoString={state.isoString}
        leapYear={state.leapYear}
      />
    </div>
  );
}

export function TimestampConverterStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: TimestampConverterStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<MobileViewMode>('split');
  const state = useTimestampStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-timestamp-converter-studio-layout="">
      <MobileViewSwitcher activeView={mobileView} onChange={setMobileView} />
      <TimestampWorkGrid idPrefix={idPrefix} state={state} mobileView={mobileView} />
      <TimestampAuxCards
        customDate={state.customDate}
        onDateChange={state.handleDateToTimestamp}
        timezone={state.timezone}
        onTimezoneChange={state.setTimezone}
        unit={state.unit}
        onUnitChange={state.setUnit}
      />
      <TimestampStatusBar
        onCurrentTime={state.handleUseCurrentTime}
        onCopy={state.handleCopy}
        onDownload={state.handleDownload}
        onReset={state.handleReset}
        notify={notify}
      />
    </div>
  );
}
