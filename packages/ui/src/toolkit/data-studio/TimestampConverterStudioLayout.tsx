import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { DataStudioStatusBar } from './DataStudioStatusBar.tsx';
import styles from './dataStudio.module.css';
import { MobileViewSwitcher, type StudioMobileView } from './MobileViewSwitcher.tsx';
import { TimestampAuxCards } from './TimestampAuxCards.tsx';
import { COMMON_TIMEZONES, DEFAULT_TIMESTAMP, useTimestampStudio } from './useTimestampStudio.ts';

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
  onPaste,
  onClear,
}: {
  idPrefix: string;
  input: string;
  unit: string;
  error: string | null;
  onUnit: (u: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds') => void;
  onCurrentTime: () => void;
  onInput: (v: string) => void;
  onPaste: () => void;
  onClear: () => void;
}) {
  return (
    <section class={`${styles.panel} ${styles.inputPanel}`}>
      <div class={styles.toolbar}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128337;</span>
          <strong>Unix Timestamp &rarr; Date</strong>
        </div>
        <div class={styles.toolactions}>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onCurrentTime}
            data-try-sample=""
            title="Use current timestamp"
          >
            ✨ Try sample
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onCurrentTime}
            title="Use current system time"
          >
            &#128337; Use current time
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onPaste}
            title="Paste from clipboard"
          >
            &#128203; Paste
          </button>
          <button
            type="button"
            class={styles.btnSecondary}
            onClick={onClear}
            title="Clear timestamp"
          >
            Clear
          </button>
        </div>
      </div>
      <div class={styles.rowchips}>
        <span class={`${styles.chip} ${styles.chipBlue}`}>Timestamp &rarr; Date</span>
        <span class={`${styles.chip} ${styles.chipPurple}`}>Date &rarr; Timestamp</span>
        <span class={`${styles.chip} ${styles.chipAmber}`}>Batch mode</span>
      </div>
      <label class={styles.optField} style={{ marginTop: 4 }}>
        <span class={styles.optLabel}>Unix timestamp integer</span>
        <input
          id={`${idPrefix}-input`}
          type="text"
          class={styles.optSelect}
          style={{ fontSize: 17, fontWeight: 750, color: '#176bfa', minHeight: 38 }}
          value={input}
          onInput={(e) => onInput((e.target as HTMLInputElement).value)}
          placeholder="e.g. 1704067200"
        />
      </label>
      <div class={styles.optField}>
        <span class={styles.optLabel}>Input unit</span>
        <div class={styles.unitSegment}>
          {(['seconds', 'milliseconds', 'microseconds', 'nanoseconds'] as const).map((u) => (
            <button
              key={u}
              type="button"
              class={`${styles.unitSegmentBtn} ${unit === u ? styles.unitSegmentBtnActive : ''}`}
              onClick={() => onUnit(u)}
            >
              {u === 'seconds'
                ? 'Seconds'
                : u === 'milliseconds'
                  ? 'Milliseconds'
                  : u === 'microseconds'
                    ? 'µs'
                    : 'ns'}
            </button>
          ))}
        </div>
      </div>
      <div class={styles.callout}>
        <span>&#9432;</span>
        <div>Unix epoch reference: 1970-01-01 00:00:00 UTC. No automatic unit guessing.</div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div class={error ? styles.badgeErr : styles.badgeOk}>
          <span>{error ? '⚠' : '✓'}</span>
          <strong>{error ? error : `Valid ${input.length}-digit Unix timestamp`}</strong>
        </div>
      </div>
    </section>
  );
}

function TimestampDatePanel({
  utcString,
  isoString,
  dateObj,
  relativeText,
  selectedTzTime,
  timezone,
  onTimezoneChange,
  onCopy,
  onDownload,
}: {
  utcString: string;
  isoString: string;
  dateObj: Date | null;
  relativeText: string;
  selectedTzTime: string;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const dateFormatted = dateObj
    ? dateObj.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Invalid Date';
  const timeFormatted = dateObj ? `${utcString.split(' ').slice(4, 5)[0] || '00:00:00'} UTC` : '';

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

      <div class={styles.bigoutput} style={{ minHeight: 76, padding: '10px 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#12264e' }}>{dateFormatted}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1672e8', marginTop: 2 }}>
          {timeFormatted}
        </div>
      </div>

      <div class={styles.miniGrid} style={{ marginTop: 2 }}>
        <div class={`${styles.mini} ${styles.miniBlue}`}>
          <small>UTC</small>
          <b>{timeFormatted.replace(' UTC', '') || '00:00:00'}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniGreen}`}>
          <small>{timezone.split('/')[1] || timezone}</small>
          <b>{selectedTzTime.split(',')[1]?.trim() || selectedTzTime}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniPurple}`}>
          <small>ISO 8601</small>
          <b>{isoString.split('T')[0] || isoString}</b>
        </div>
        <div class={`${styles.mini} ${styles.miniAmber}`}>
          <small>Relative</small>
          <b>{relativeText}</b>
        </div>
      </div>

      <div class={styles.optField} style={{ marginTop: 'auto' }}>
        <span class={styles.optLabel}>Timezone</span>
        <select
          class={styles.optSelect}
          value={timezone}
          onChange={(e) => onTimezoneChange((e.target as HTMLSelectElement).value)}
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
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
          <span class={styles.toolIcon}>&#128337;</span>Timestamp Formats
        </div>
        <div class={styles.miniGrid}>
          <div class={`${styles.mini} ${styles.miniBlue}`}>
            <small>Seconds</small>
            <b>{secondsVal}</b>
          </div>
          <div class={`${styles.mini} ${styles.miniPurple}`}>
            <small>Milliseconds</small>
            <b>{millisVal}</b>
          </div>
        </div>
        <div class={styles.kv}>
          <span>ISO / RFC 3339</span>
          <b>{isoString}</b>
        </div>
        <div class={styles.kv}>
          <span>Unix era</span>
          <b>After epoch</b>
        </div>
      </section>

      <section class={`${styles.panel} ${styles.sideBottomCard}`}>
        <div class={styles.tooltitle}>
          <span class={styles.toolIcon}>&#128197;</span>Calendar Checks
        </div>
        <div class={styles.badgeOk}>
          <span>&#10004;</span>
          <strong>Valid UTC date</strong>
        </div>
        <div class={styles.kv}>
          <span>Leap year</span>
          <b>{leapYear ? 'Yes ✓' : 'No'}</b>
        </div>
        <div class={styles.kv}>
          <span>Timezone</span>
          <b>IANA supported</b>
        </div>
        <div class={styles.callout}>
          Ambiguous DST local times require an explicit offset or zone rule.
        </div>
      </section>
    </div>
  );
}

export function TimestampConverterStudioLayout({
  idPrefix,
  snapshot,
  store,
  notify,
}: TimestampConverterStudioLayoutProps) {
  const [mobileView, setMobileView] = useState<StudioMobileView>('split');
  const studio = useTimestampStudio(snapshot, store, notify);

  return (
    <div class={styles.container} data-mobile-view={mobileView}>
      <MobileViewSwitcher activeView={mobileView} onViewChange={setMobileView} />

      <main class={styles.work}>
        <TimestampInputPanel
          idPrefix={idPrefix}
          input={studio.input}
          unit={studio.unit}
          error={studio.error}
          onUnit={studio.setUnit}
          onCurrentTime={studio.handleUseCurrentTime}
          onInput={studio.handleInput}
          onPaste={studio.handlePaste}
          onClear={studio.handleClear}
        />

        <TimestampDatePanel
          utcString={studio.utcString}
          isoString={studio.isoString}
          dateObj={studio.dateObj}
          relativeText={studio.relativeText}
          selectedTzTime={studio.selectedTzTime}
          timezone={studio.timezone}
          onTimezoneChange={studio.setTimezone}
          onCopy={studio.handleCopy}
          onDownload={studio.handleDownload}
        />

        <TimestampSidePanel
          secondsVal={studio.secondsVal}
          millisVal={studio.millisVal}
          isoString={studio.isoString}
          leapYear={studio.leapYear}
        />
      </main>

      <TimestampAuxCards
        customDate={studio.customDate}
        onDateChange={studio.handleDateToTimestamp}
        timezone={studio.timezone}
        onTimezoneChange={studio.setTimezone}
        unit={studio.unit}
        onUnitChange={studio.setUnit}
      />

      <DataStudioStatusBar
        primaryLabel="Convert Timestamp"
        onPrimary={() => {
          notify('Timestamp Converted');
        }}
        onCopy={studio.handleCopy}
        onDownload={studio.handleDownload}
        onReset={() => {
          studio.handleInput(DEFAULT_TIMESTAMP);
          studio.setUnit('seconds');
          notify('Reset to default timestamp');
        }}
        notify={notify}
      />
    </div>
  );
}
