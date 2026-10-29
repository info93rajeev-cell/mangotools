import type { ToolSnapshot, ToolStore } from '@mangotools/runtime';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { copyText, downloadText } from '../actions.ts';

export const DEFAULT_TIMESTAMP = '1704067200';

export const COMMON_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+05:30)' },
  { id: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { id: 'America/New_York', label: 'America/New_York (EST/EDT, UTC-05:00)' },
  { id: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+00:00)' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+09:00)' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST, UTC+10:00)' },
];

export function formatRelativeTime(targetMs: number): string {
  const diffSec = Math.floor((Date.now() - targetMs) / 1000);
  if (Math.abs(diffSec) < 60) return diffSec >= 0 ? `${diffSec}s ago` : `in ${-diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (Math.abs(diffMin) < 60) return diffMin >= 0 ? `${diffMin}m ago` : `in ${-diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (Math.abs(diffHours) < 24) return diffHours >= 0 ? `${diffHours}h ago` : `in ${-diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (Math.abs(diffDays) < 30)
    return diffDays >= 0 ? `${diffDays} days ago` : `in ${-diffDays} days`;
  return `${(diffDays / 365).toFixed(1)} years ago`;
}

function parseUnitMs(num: number, unit: string): number {
  if (unit === 'seconds') return num * 1000;
  if (unit === 'milliseconds') return num;
  if (unit === 'microseconds') return Math.floor(num / 1000);
  return Math.floor(num / 1000000);
}

function formatTzDate(d: Date, timezone: string, ms: number) {
  const tzFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const localFmt = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const y = d.getUTCFullYear();
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  return {
    dateObj: d,
    error: null,
    utcString: d.toUTCString(),
    isoString: d.toISOString(),
    localTime: localFmt.format(d),
    selectedTzTime: tzFmt.format(d),
    relativeText: formatRelativeTime(ms),
    leapYear: isLeap,
    secondsVal: Math.floor(ms / 1000).toString(),
    millisVal: ms.toString(),
  };
}

export function computeTimestamp(raw: string, unit: string, timezone: string) {
  if (!raw.trim()) {
    return {
      dateObj: null,
      error: 'Please enter a Unix timestamp',
      utcString: '—',
      isoString: '—',
      localTime: '—',
      selectedTzTime: '—',
      relativeText: '—',
      leapYear: false,
      secondsVal: '0',
      millisVal: '0',
    };
  }
  try {
    const num = Number(raw.trim());
    if (Number.isNaN(num)) throw new Error('Invalid numeric timestamp');
    const ms = parseUnitMs(num, unit);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) throw new Error('Date value out of range');
    return formatTzDate(d, timezone, ms);
  } catch (err: unknown) {
    return {
      dateObj: null,
      error: err instanceof Error ? err.message : 'Invalid timestamp',
      utcString: '—',
      isoString: '—',
      localTime: '—',
      selectedTzTime: '—',
      relativeText: '—',
      leapYear: false,
      secondsVal: '0',
      millisVal: '0',
    };
  }
}

function createTimestampHandlers(
  computed: {
    isoString: string;
    secondsVal: string;
    millisVal: string;
    utcString: string;
    timezone: string;
    selectedTzTime: string;
    dateObj: Date | null;
  },
  input: string,
  handleInput: (v: string) => void,
  setUnit: (u: 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds') => void,
  setCustomDate: (d: string) => void,
  notify: (msg: string) => void,
) {
  const handleUseCurrentTime = () => {
    const nowSec = Math.floor(Date.now() / 1000).toString();
    handleInput(nowSec);
    setUnit('seconds');
    notify('Loaded current system timestamp');
  };

  const handleDateToTimestamp = (dateStr: string) => {
    setCustomDate(dateStr);
    const parsed = new Date(`${dateStr}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      const sec = Math.floor(parsed.getTime() / 1000).toString();
      handleInput(sec);
      setUnit('seconds');
      notify(`Converted ${dateStr} to timestamp ${sec}`);
    }
  };

  const handleCopy = async () => {
    const text = computed.isoString !== '—' ? computed.isoString : input;
    const ok = await copyText(text);
    notify(ok ? 'Copied to clipboard!' : 'Failed to copy');
  };

  const handleDownload = () => {
    if (!computed.dateObj) return;
    const payload = `Unix Seconds: ${computed.secondsVal}\nUnix Milliseconds: ${computed.millisVal}\nISO 8601: ${computed.isoString}\nUTC: ${computed.utcString}\nTimezone (${computed.timezone}): ${computed.selectedTzTime}`;
    downloadText(payload, 'timestamp-conversion.txt', 'text/plain');
    notify('Downloaded conversion details');
  };

  const handleReset = () => {
    handleInput(DEFAULT_TIMESTAMP);
    setUnit('seconds');
    notify('Reset to default timestamp');
  };

  return {
    handleUseCurrentTime,
    handleDateToTimestamp,
    handleCopy,
    handleDownload,
    handleReset,
  };
}

export function useTimestampStudio(
  snapshot: ToolSnapshot,
  store: ToolStore,
  notify: (msg: string) => void,
) {
  const initialText =
    typeof snapshot.values.text === 'string' && snapshot.values.text.trim().length > 0
      ? snapshot.values.text
      : DEFAULT_TIMESTAMP;
  const [input, setInput] = useState<string>(initialText);

  useEffect(() => {
    const val = snapshot.values.text;
    if (typeof val === 'string' && val.trim().length > 0 && val !== input) {
      setInput(val);
    }
  }, [snapshot.values.text]);

  const [unit, setUnit] = useState<'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds'>(
    'seconds',
  );
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [customDate, setCustomDate] = useState<string>('2024-01-01');

  const computed = useMemo(() => computeTimestamp(input, unit, timezone), [input, unit, timezone]);

  const handleInput = (v: string) => {
    setInput(v);
    store.set('text', v);
  };

  const handlers = createTimestampHandlers(
    {
      isoString: computed.isoString,
      secondsVal: computed.secondsVal,
      millisVal: computed.millisVal,
      utcString: computed.utcString,
      timezone,
      selectedTzTime: computed.selectedTzTime,
      dateObj: computed.dateObj,
    },
    input,
    handleInput,
    setUnit,
    setCustomDate,
    notify,
  );

  return {
    input,
    handleInput,
    unit,
    setUnit,
    timezone,
    setTimezone,
    customDate,
    dateObj: computed.dateObj,
    error: computed.error,
    utcString: computed.utcString,
    isoString: computed.isoString,
    localTime: computed.localTime,
    selectedTzTime: computed.selectedTzTime,
    relativeText: computed.relativeText,
    leapYear: computed.leapYear,
    secondsVal: computed.secondsVal,
    millisVal: computed.millisVal,
    ...handlers,
  };
}
